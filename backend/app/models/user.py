from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    streak_count = Column(Integer, default=1)
    last_active_date = Column(DateTime, default=datetime.utcnow)
    settings_json = Column(Text, default="{}")

    # Relationships
    resources = relationship("LearningResource", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    topic_masteries = relationship("TopicMastery", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("LearningRecommendation", back_populates="user", cascade="all, delete-orphan")
