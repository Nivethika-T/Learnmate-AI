from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ResourceChunkResponse(BaseModel):
    id: int
    resource_id: int
    chunk_index: int
    text_content: str
    page_or_slide_num: Optional[int] = None
    section_title: Optional[str] = None
    timestamp_mark: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceResponse(BaseModel):
    id: int
    user_id: int
    title: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    total_chunks: int
    page_or_slide_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    sample_preview: Optional[str] = None

    class Config:
        from_attributes = True

class YouTubeUploadRequest(BaseModel):
    url: str
    title: Optional[str] = None
    manual_transcript: Optional[str] = None
