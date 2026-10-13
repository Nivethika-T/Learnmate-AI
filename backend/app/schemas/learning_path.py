from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TopicMasteryResponse(BaseModel):
    id: int
    subject: str
    topic_name: str
    mastery_level: str  # "Not Started", "In Progress", "Mastered"
    mastery_score: float  # percentage 0-100
    total_attempts: int
    correct_attempts: int
    last_practiced_at: datetime
    prerequisites: List[str] = []

    class Config:
        from_attributes = True

class LearningRecommendationResponse(BaseModel):
    id: int
    topic_name: str
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    action_type: str  # "quiz", "revision", "read"
    resource_id: Optional[int] = None
    is_completed: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class LearningPathOverview(BaseModel):
    overall_mastery_percentage: float
    total_topics: int
    mastered_count: int
    in_progress_count: int
    not_started_count: int
    topics: List[TopicMasteryResponse]
    recommendations: List[LearningRecommendationResponse]
    suggested_next_topic: Optional[str] = None
