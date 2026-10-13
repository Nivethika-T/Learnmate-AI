from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.learning_path import LearningRecommendationResponse

class PerformanceDataPoint(BaseModel):
    name: str
    score: float
    accuracy: float
    questions: int

class TopicDistribution(BaseModel):
    name: str
    value: int
    level: str

class RecentActivityItem(BaseModel):
    id: str
    activity_type: str  # "quiz", "resource_upload", "chat", "mastery_update"
    title: str
    description: str
    timestamp: datetime
    badge: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    total_resources: int
    quizzes_completed: int
    average_quiz_score: float
    overall_topic_mastery: float
    streak_count: int
    strongest_topics: List[str]
    weak_topics: List[str]
    recent_activity: List[RecentActivityItem]
    next_recommended_task: Optional[LearningRecommendationResponse] = None
    quiz_trend: List[PerformanceDataPoint]
    topic_distribution: List[TopicDistribution]
