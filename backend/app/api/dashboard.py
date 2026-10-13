import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resource import LearningResource
from app.models.quiz import Quiz, QuizQuestion
from app.models.learning_path import TopicMastery, LearningRecommendation
from app.schemas.dashboard import (
    DashboardStatsResponse, PerformanceDataPoint, TopicDistribution, RecentActivityItem
)
from app.schemas.learning_path import LearningRecommendationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Student Dashboard"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns unified student dashboard metrics:
    - Resource counts, quiz counts, avg score, streak
    - Strongest and weakest topics
    - Chart data series for Recharts
    - Priority next study task
    """
    total_resources = db.query(LearningResource).filter(
        LearningResource.user_id == current_user.id
    ).count()

    completed_quizzes = db.query(Quiz).filter(
        Quiz.user_id == current_user.id,
        Quiz.status == "completed"
    ).order_by(Quiz.created_at.asc()).all()

    quizzes_count = len(completed_quizzes)
    avg_score = 0.0
    if quizzes_count > 0:
        avg_score = round(sum(q.score for q in completed_quizzes) / quizzes_count, 1)

    topics = db.query(TopicMastery).filter(
        TopicMastery.user_id == current_user.id
    ).all()

    overall_mastery = 0.0
    if topics:
        overall_mastery = round(sum(t.mastery_score for t in topics) / len(topics), 1)

    # Strongest topics (score >= 70%)
    sorted_topics = sorted(topics, key=lambda x: x.mastery_score, reverse=True)
    strongest = [t.topic_name for t in sorted_topics if t.mastery_score >= 70.0][:3]
    if not strongest and sorted_topics:
        strongest = [sorted_topics[0].topic_name]

    # Weak topics (< 60% with attempts)
    weak_sorted = sorted([t for t in topics if t.total_attempts > 0], key=lambda x: x.mastery_score)
    weakest = [t.topic_name for t in weak_sorted if t.mastery_score < 60.0][:3]
    if not weakest and weak_sorted:
        weakest = [weak_sorted[0].topic_name]

    # Next recommended task
    next_rec = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == current_user.id,
        LearningRecommendation.is_completed == 0
    ).order_by(LearningRecommendation.priority.desc()).first()

    # Recharts data: Quiz trend
    trend_data = []
    for idx, q in enumerate(completed_quizzes[-7:]):  # Last 7 quizzes
        trend_data.append(
            PerformanceDataPoint(
                name=f"Q{idx + 1} ({q.topic[:10]})",
                score=q.score,
                accuracy=round((q.correct_count / max(1, q.total_questions)) * 100, 1),
                questions=q.total_questions
            )
        )
    if not trend_data:
        # Initial empty point for clean chart render
        trend_data.append(PerformanceDataPoint(name="Initial Baseline", score=avg_score or 75.0, accuracy=avg_score or 75.0, questions=5))

    # Recharts data: Topic distribution
    dist_data = []
    level_counts = {"Mastered": 0, "In Progress": 0, "Not Started": 0}
    for t in topics:
        lvl = t.mastery_level if t.mastery_level in level_counts else "In Progress"
        level_counts[lvl] += 1

    for lvl, count in level_counts.items():
        dist_data.append(TopicDistribution(name=lvl, value=count, level=lvl))

    # Recent activity items
    recent_activities = []
    # Recent quizzes
    for q in completed_quizzes[-3:]:
        recent_activities.append(
            RecentActivityItem(
                id=f"quiz_{q.id}",
                activity_type="quiz",
                title=f"Completed {q.title}",
                description=f"Scored {q.score}% with {q.correct_count}/{q.total_questions} correct answers ({q.current_difficulty} level).",
                timestamp=q.completed_at or q.created_at,
                badge=f"{q.score}%"
            )
        )
    # Recent resources
    recent_resources = db.query(LearningResource).filter(
        LearningResource.user_id == current_user.id
    ).order_by(LearningResource.created_at.desc()).limit(2).all()
    for r in recent_resources:
        recent_activities.append(
            RecentActivityItem(
                id=f"res_{r.id}",
                activity_type="resource_upload",
                title=f"Added Resource: {r.title}",
                description=f"Processed into {r.total_chunks} traceable knowledge chunks.",
                timestamp=r.created_at,
                badge=r.file_type.upper()
            )
        )

    # Sort activities by timestamp desc
    recent_activities.sort(key=lambda x: x.timestamp, reverse=True)

    return DashboardStatsResponse(
        total_resources=total_resources,
        quizzes_completed=quizzes_count,
        average_quiz_score=avg_score,
        overall_topic_mastery=overall_mastery,
        streak_count=current_user.streak_count or 1,
        strongest_topics=strongest,
        weak_topics=weakest,
        recent_activity=recent_activities,
        next_recommended_task=LearningRecommendationResponse.from_orm(next_rec) if next_rec else None,
        quiz_trend=trend_data,
        topic_distribution=dist_data
    )
