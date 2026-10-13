from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class TopicMastery(Base):
    __tablename__ = "topic_masteries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(100), default="General")
    topic_name = Column(String(100), nullable=False, index=True)
    mastery_level = Column(String(30), default="Not Started")  # "Not Started", "In Progress", "Mastered"
    mastery_score = Column(Float, default=0.0)  # 0.0 to 100.0%
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    last_practiced_at = Column(DateTime, default=datetime.utcnow)
    prerequisites_json = Column(Text, default="[]")  # List of prerequisite topic strings

    user = relationship("User", back_populates="topic_masteries")


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_name = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")  # high, medium, low
    action_type = Column(String(50), default="quiz")  # quiz, revision, read, concept_drill
    resource_id = Column(Integer, ForeignKey("learning_resources.id"), nullable=True)
    is_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")
