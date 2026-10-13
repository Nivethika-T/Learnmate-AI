import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.learning_path import TopicMastery, LearningRecommendation
from app.models.quiz import Quiz, QuizQuestion

class MasteryEngine:
    """
    Transparent, rule-based mastery tracker and recommendation generator.
    Works reliably without external AI API dependencies.
    """

    @staticmethod
    def update_mastery_from_answer(
        db: Session,
        user_id: int,
        topic_name: str,
        is_correct: bool,
        subject: str = "General"
    ) -> TopicMastery:
        """Updates topic mastery stats whenever a student answers a question."""
        mastery = db.query(TopicMastery).filter(
            TopicMastery.user_id == user_id,
            TopicMastery.topic_name == topic_name
        ).first()

        if not mastery:
            mastery = TopicMastery(
                user_id=user_id,
                subject=subject,
                topic_name=topic_name,
                total_attempts=0,
                correct_attempts=0,
                mastery_score=0.0,
                mastery_level="Not Started"
            )
            db.add(mastery)

        mastery.total_attempts += 1
        if is_correct:
            mastery.correct_attempts += 1

        # Calculate accuracy percentage
        acc = (mastery.correct_attempts / mastery.total_attempts) * 100.0
        mastery.mastery_score = round(acc, 1)

        # Transparent rule-based state machine
        if mastery.total_attempts >= 3 and acc >= 80.0:
            mastery.mastery_level = "Mastered"
        elif acc >= 50.0 or mastery.total_attempts < 3:
            mastery.mastery_level = "In Progress"
        else:
            mastery.mastery_level = "In Progress"  # Needs revision

        mastery.last_practiced_at = datetime.utcnow()
        db.commit()
        db.refresh(mastery)

        # Re-evaluate recommendations
        MasteryEngine.refresh_recommendations(db, user_id)
        return mastery

    @staticmethod
    def refresh_recommendations(db: Session, user_id: int):
        """
        Generates transparent, prioritized recommendations:
        - High Priority: Weak topics (< 60% accuracy or wrong answers)
        - Medium Priority: In Progress topics (60% - 79% accuracy)
        - Low Priority: Not Started or Mastered topics for maintenance review
        """
        masteries = db.query(TopicMastery).filter(TopicMastery.user_id == user_id).all()
        if not masteries:
            return

        # Clear older completed recommendations or keep fresh
        db.query(LearningRecommendation).filter(
            LearningRecommendation.user_id == user_id,
            LearningRecommendation.is_completed == 0
        ).delete()

        for m in masteries:
            if m.mastery_score < 60.0 and m.total_attempts > 0:
                rec = LearningRecommendation(
                    user_id=user_id,
                    topic_name=m.topic_name,
                    title=f"Reinforce Weak Concept: {m.topic_name}",
                    description=f"Your accuracy on {m.topic_name} is currently {m.mastery_score}%. Practice an adaptive quiz to target gaps.",
                    priority="high",
                    action_type="quiz"
                )
                db.add(rec)
            elif m.mastery_level == "In Progress":
                rec = LearningRecommendation(
                    user_id=user_id,
                    topic_name=m.topic_name,
                    title=f"Advance Toward Mastery: {m.topic_name}",
                    description=f"You have answered {m.correct_attempts}/{m.total_attempts} correctly ({m.mastery_score}%). A few more correct answers will unlock 'Mastered'.",
                    priority="medium",
                    action_type="quiz"
                )
                db.add(rec)
            elif m.mastery_level == "Mastered":
                rec = LearningRecommendation(
                    user_id=user_id,
                    topic_name=m.topic_name,
                    title=f"Spaced Repetition: {m.topic_name}",
                    description=f"Great job mastering this topic! Review periodically to maintain long-term retention.",
                    priority="low",
                    action_type="revision"
                )
                db.add(rec)

        db.commit()

mastery_engine = MasteryEngine()
