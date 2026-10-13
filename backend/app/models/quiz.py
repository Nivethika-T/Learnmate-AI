from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("learning_resources.id"), nullable=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(100), default="General Review")
    initial_difficulty = Column(String(20), default="Medium")  # Easy, Medium, Hard
    current_difficulty = Column(String(20), default="Medium")
    status = Column(String(30), default="in_progress")  # in_progress, completed
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=5)
    correct_count = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    consecutive_correct = Column(Integer, default=0)
    consecutive_wrong = Column(Integer, default=0)
    weak_topics_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="quizzes")
    resource = relationship("LearningResource", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.question_order")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    question_order = Column(Integer, default=1)
    topic = Column(String(100), default="General")
    difficulty = Column(String(20), default="Medium")  # Easy, Medium, Hard
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON list of 4 string options
    correct_option_index = Column(Integer, nullable=False)  # 0, 1, 2, 3
    explanation = Column(Text, nullable=False)
    citation_json = Column(Text, default="{}")  # {filename, page_num, excerpt}
    user_selected_index = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="questions")
