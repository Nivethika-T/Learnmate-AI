import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resource import LearningResource, ResourceChunk
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import (
    QuizGenerateRequest, QuizSubmitAnswerRequest, QuizSubmitResponse,
    QuizResponse, QuizQuestionResponse, CitationRef
)
from app.api.deps import get_current_user
from app.services.adaptive_quiz import adaptive_quiz_engine
from app.services.mastery_engine import mastery_engine

router = APIRouter(prefix="/quizzes", tags=["Adaptive Quiz Engine"])

@router.post("/generate", response_model=QuizResponse)
def generate_quiz(
    payload: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized quiz dynamically grounded in the student's materials:
    - Adapts to chosen starting difficulty
    - Targets weak topics if requested
    - Cites source passages for each question
    """
    # Find chunks
    chunks_query = db.query(ResourceChunk).join(LearningResource).filter(
        LearningResource.user_id == current_user.id
    )
    selected_resource = None
    if payload.resource_id:
        selected_resource = db.query(LearningResource).filter(
            LearningResource.id == payload.resource_id,
            LearningResource.user_id == current_user.id
        ).first()
        if selected_resource:
            chunks_query = chunks_query.filter(ResourceChunk.resource_id == payload.resource_id)

    chunks = chunks_query.all()

    # Determine topic name
    topic_name = payload.topic or (selected_resource.title if selected_resource else "Comprehensive Review")
    
    # Generate question blueprints
    raw_questions = adaptive_quiz_engine.generate_questions_from_chunks(
        chunks=chunks,
        topic=topic_name,
        initial_difficulty=payload.difficulty,
        count=payload.question_count
    )

    quiz = Quiz(
        user_id=current_user.id,
        resource_id=payload.resource_id,
        title=f"{topic_name} Assessment",
        topic=topic_name,
        initial_difficulty=payload.difficulty,
        current_difficulty=payload.difficulty,
        status="in_progress",
        score=0.0,
        total_questions=len(raw_questions),
        correct_count=0,
        time_spent_seconds=0,
        consecutive_correct=0,
        consecutive_wrong=0,
        weak_topics_json="[]"
    )
    db.add(quiz)
    db.flush()

    question_models = []
    for q_data in raw_questions:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_order=q_data["question_order"],
            topic=q_data["topic"],
            difficulty=q_data["difficulty"],
            question_text=q_data["question_text"],
            options_json=json.dumps(q_data["options"]),
            correct_option_index=q_data["correct_option_index"],
            explanation=q_data["explanation"],
            citation_json=json.dumps(q_data.get("citation", {})),
            time_taken_seconds=0
        )
        db.add(qq)
        question_models.append(qq)

    db.commit()
    db.refresh(quiz)

    # Format response (do not expose correct_option_index in active quiz questions)
    q_responses = []
    for q in question_models:
        q_responses.append(
            QuizQuestionResponse(
                id=q.id,
                quiz_id=quiz.id,
                question_order=q.question_order,
                topic=q.topic,
                difficulty=q.difficulty,
                question_text=q.question_text,
                options=json.loads(q.options_json),
                correct_option_index=None,
                explanation=None,
                citation=None,
                user_selected_index=None,
                is_correct=None
            )
        )

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        topic=quiz.topic,
        initial_difficulty=quiz.initial_difficulty,
        current_difficulty=quiz.current_difficulty,
        status=quiz.status,
        score=quiz.score,
        total_questions=quiz.total_questions,
        correct_count=quiz.correct_count,
        time_spent_seconds=quiz.time_spent_seconds,
        weak_topics=[],
        created_at=quiz.created_at,
        completed_at=quiz.completed_at,
        questions=q_responses
    )

@router.get("/history", response_model=List[QuizResponse])
def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns history of past quizzes taken by student."""
    quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id
    ).order_by(Quiz.created_at.desc()).all()

    resp_list = []
    for q in quizzes:
        weak_list = []
        try:
            weak_list = json.loads(q.weak_topics_json)
        except Exception:
            pass
        resp_list.append(
            QuizResponse(
                id=q.id,
                title=q.title,
                topic=q.topic,
                initial_difficulty=q.initial_difficulty,
                current_difficulty=q.current_difficulty,
                status=q.status,
                score=q.score,
                total_questions=q.total_questions,
                correct_count=q.correct_count,
                time_spent_seconds=q.time_spent_seconds,
                weak_topics=weak_list,
                created_at=q.created_at,
                completed_at=q.completed_at,
                questions=[]
            )
        )
    return resp_list

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    is_completed = (quiz.status == "completed")
    q_responses = []
    for q in quiz.questions:
        cit_data = None
        try:
            cit_data = json.loads(q.citation_json) if q.citation_json else None
        except Exception:
            pass

        q_responses.append(
            QuizQuestionResponse(
                id=q.id,
                quiz_id=quiz.id,
                question_order=q.question_order,
                topic=q.topic,
                difficulty=q.difficulty,
                question_text=q.question_text,
                options=json.loads(q.options_json),
                correct_option_index=q.correct_option_index if (is_completed or q.user_selected_index is not None) else None,
                explanation=q.explanation if (is_completed or q.user_selected_index is not None) else None,
                citation=CitationRef(**cit_data) if (cit_data and (is_completed or q.user_selected_index is not None)) else None,
                user_selected_index=q.user_selected_index,
                is_correct=q.is_correct
            )
        )

    weak_list = []
    try:
        weak_list = json.loads(quiz.weak_topics_json)
    except Exception:
        pass

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        topic=quiz.topic,
        initial_difficulty=quiz.initial_difficulty,
        current_difficulty=quiz.current_difficulty,
        status=quiz.status,
        score=quiz.score,
        total_questions=quiz.total_questions,
        correct_count=quiz.correct_count,
        time_spent_seconds=quiz.time_spent_seconds,
        weak_topics=weak_list,
        created_at=quiz.created_at,
        completed_at=quiz.completed_at,
        questions=q_responses
    )

@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_answer(
    quiz_id: int,
    payload: QuizSubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits student answer for a specific question:
    1. Evaluates correctness.
    2. Dynamically calibrates difficulty based on real performance streak.
    3. Updates Topic Mastery for student roadmap.
    4. Tracks weak topics.
    5. Returns grounded explanation and citation.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == payload.question_id,
        QuizQuestion.quiz_id == quiz.id
    ).first()

    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this quiz.")

    is_correct = (payload.selected_option_index == question.correct_option_index)
    question.user_selected_index = payload.selected_option_index
    question.is_correct = is_correct
    question.time_taken_seconds = payload.time_taken_seconds or 10

    # Update quiz timer
    quiz.time_spent_seconds += question.time_taken_seconds

    # Adaptive streak tracking
    weak_topics = []
    try:
        weak_topics = json.loads(quiz.weak_topics_json)
    except Exception:
        pass

    if is_correct:
        quiz.consecutive_correct += 1
        quiz.consecutive_wrong = 0
        quiz.correct_count += 1
    else:
        quiz.consecutive_wrong += 1
        quiz.consecutive_correct = 0
        if question.topic not in weak_topics:
            weak_topics.append(question.topic)
        quiz.weak_topics_json = json.dumps(weak_topics)

    # Adaptive difficulty step
    next_diff, diff_changed, diff_msg = adaptive_quiz_engine.calculate_next_difficulty(
        current_difficulty=quiz.current_difficulty,
        consecutive_correct=quiz.consecutive_correct,
        consecutive_wrong=quiz.consecutive_wrong
    )
    quiz.current_difficulty = next_diff

    # Update Topic Mastery Engine
    mastery_engine.update_mastery_from_answer(
        db=db,
        user_id=current_user.id,
        topic_name=question.topic,
        is_correct=is_correct
    )

    # Check if all questions answered
    answered_count = db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz.id,
        QuizQuestion.user_selected_index != None
    ).count()

    is_completed = (answered_count >= quiz.total_questions)
    if is_completed:
        quiz.status = "completed"
        quiz.completed_at = datetime.utcnow()
        quiz.score = round((quiz.correct_count / max(1, quiz.total_questions)) * 100.0, 1)

    db.commit()

    cit_data = None
    try:
        cit_data = json.loads(question.citation_json) if question.citation_json else None
    except Exception:
        pass

    return QuizSubmitResponse(
        question_id=question.id,
        is_correct=is_correct,
        correct_option_index=question.correct_option_index,
        explanation=question.explanation,
        citation=CitationRef(**cit_data) if cit_data else None,
        next_difficulty=quiz.current_difficulty,
        difficulty_changed=diff_changed,
        difficulty_message=diff_msg,
        current_score=round((quiz.correct_count / max(1, quiz.total_questions)) * 100.0, 1),
        is_quiz_completed=is_completed
    )

