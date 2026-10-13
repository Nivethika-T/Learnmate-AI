from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

class CitationModel(BaseModel):
    chunk_id: Optional[int] = None
    filename: str
    source_title: str
    page_or_slide: Optional[int] = None
    timestamp_mark: Optional[str] = None
    excerpt: str
    relevance_score: float

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    resource_id: Optional[int] = None  # Filter by specific resource or search all
    message: str
    mode: str = "study_tutor"  # "study_tutor", "exam_prep", "general_qa"
    request_hint_only: bool = False

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    citations: List[CitationModel] = []
    grounding_type: str = "grounded"  # "grounded", "partial", "insufficient_sources"
    tutor_mode: str = "study_tutor"
    hint_content: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    mode: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True
