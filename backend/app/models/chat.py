from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), default="Study Session")
    mode = Column(String(50), default="study_tutor")  # study_tutor, exam_prep, general_qa
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.id")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    # JSON list of citations: [{"chunk_id": int, "filename": str, "source_title": str, "page_or_slide": int, "timestamp_mark": str, "excerpt": str, "relevance_score": float}]
    citations_json = Column(Text, default="[]")
    grounding_type = Column(String(50), default="grounded")  # "grounded", "partial", "insufficient_sources"
    tutor_mode = Column(String(50), default="beginner")  # beginner, exam_prep
    hint_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
