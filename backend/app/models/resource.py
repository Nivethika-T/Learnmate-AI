from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, pptx, docx, txt, srt, vtt, youtube
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    page_or_slide_count = Column(Integer, default=1)
    status = Column(String(50), default="processed")  # processing, processed, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="resources")
    chunks = relationship("ResourceChunk", back_populates="resource", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="resource")


class ResourceChunk(Base):
    __tablename__ = "resource_chunks"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("learning_resources.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)
    page_or_slide_num = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    timestamp_mark = Column(String(50), nullable=True)  # e.g. "01:23 - 02:15" for video/srt
    embedding_json = Column(Text, nullable=True)  # JSON serialized vector representation if available

    resource = relationship("LearningResource", back_populates="chunks")
