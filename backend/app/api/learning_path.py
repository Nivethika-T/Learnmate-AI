from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.learning_path import TopicMastery, LearningRecommendation
from app.schemas.learning_path import (
    LearningPathOverview, TopicMasteryResponse, LearningRecommendationResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/learning-path", tags=["Personalized Learning Path"])

@router.get("", response_model=LearningPathOverview)
def get_learning_path(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full personalized roadmap, mastery breakdown,
    and rule-based prioritized recommendations.
    """
    topics = db.query(TopicMastery).filter(
        TopicMastery.user_id == current_user.id
    ).order_by(TopicMastery.mastery_score.asc()).all()

    recommendations = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == current_user.id,
        LearningRecommendation.is_completed == 0
    ).order_by(
        # High priority first
        LearningRecommendation.priority.desc()
    ).all()

    total_topics = len(topics)
    mastered_count = sum(1 for t in topics if t.mastery_level == "Mastered")
    in_progress_count = sum(1 for t in topics if t.mastery_level == "In Progress")
    not_started_count = sum(1 for t in topics if t.mastery_level == "Not Started")

    overall_mastery = 0.0
    if total_topics > 0:
        overall_mastery = round(sum(t.mastery_score for t in topics) / total_topics, 1)

    # Next suggested topic: prioritize high priority recommendation or lowest score in-progress
    suggested_next = None
    if recommendations:
        suggested_next = recommendations[0].topic_name
    elif topics:
        lowest = min(topics, key=lambda x: x.mastery_score)
        suggested_next = lowest.topic_name

    topic_responses = []
    for t in topics:
        topic_responses.append(
            TopicMasteryResponse(
                id=t.id,
                subject=t.subject,
                topic_name=t.topic_name,
                mastery_level=t.mastery_level,
                mastery_score=t.mastery_score,
                total_attempts=t.total_attempts,
                correct_attempts=t.correct_attempts,
                last_practiced_at=t.last_practiced_at,
                prerequisites=[]
            )
        )

    rec_responses = [LearningRecommendationResponse.from_orm(r) for r in recommendations]

    return LearningPathOverview(
        overall_mastery_percentage=overall_mastery,
        total_topics=total_topics,
        mastered_count=mastered_count,
        in_progress_count=in_progress_count,
        not_started_count=not_started_count,
        topics=topic_responses,
        recommendations=rec_responses,
        suggested_next_topic=suggested_next
    )

@router.post("/recommendations/{recommendation_id}/complete")
def complete_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LearningRecommendation).filter(
        LearningRecommendation.id == recommendation_id,
        LearningRecommendation.user_id == current_user.id
    ).first()

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found."
        )

    rec.is_completed = 1
    db.commit()
    return {"message": "Recommendation marked as completed", "id": recommendation_id}
