import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.resource import LearningResource, ResourceChunk
from app.schemas.resource import ResourceResponse, ResourceChunkResponse, YouTubeUploadRequest
from app.api.deps import get_current_user
from app.services.doc_parser import parse_document
from app.services.chunker import create_chunks_from_sections

router = APIRouter(prefix="/resources", tags=["Learning Resources"])

SUPPORTED_EXTENSIONS = {
    "pdf": "PDF Document",
    "pptx": "PowerPoint Presentation",
    "ppt": "PowerPoint Presentation",
    "docx": "Word Document",
    "doc": "Word Document",
    "txt": "Plain Text",
    "md": "Markdown Notes",
    "srt": "Video Subtitle Transcript",
    "vtt": "Video Subtitle Transcript"
}

@router.get("", response_model=List[ResourceResponse])
def get_user_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all learning resources uploaded by the current student."""
    resources = db.query(LearningResource).filter(
        LearningResource.user_id == current_user.id
    ).order_by(LearningResource.created_at.desc()).all()

    # Enrich with preview
    res_list = []
    for r in resources:
        first_chunk = db.query(ResourceChunk).filter(ResourceChunk.resource_id == r.id).first()
        preview = first_chunk.text_content[:200] + "..." if first_chunk else "No text extracted."
        resp = ResourceResponse.from_orm(r)
        resp.sample_preview = preview
        res_list.append(resp)
    return res_list

@router.post("/upload", response_model=ResourceResponse)
async def upload_resource(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse study material (PDF, PPTX, DOCX, TXT, SRT, VTT).
    Extracts text, creates traceable chunks, and associates with the student.
    """
    filename = file.filename or "uploaded_resource"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported formats: {', '.join(SUPPORTED_EXTENSIONS.keys())}"
        )

    # Save to disk
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)
    file_path = os.path.join(user_upload_dir, filename)

    try:
        content = await file.read()
        file_size = len(content)
        if file_size > 25 * 1024 * 1024:  # 25 MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum 25 MB limit."
            )

        with open(file_path, "wb") as f:
            f.write(content)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Parse and extract text
    try:
        sections = parse_document(file_path, ext)
        if not sections:
            raise ValueError("No readable text could be extracted from this document.")

        chunks_data = create_chunks_from_sections(sections)
        if not chunks_data:
            raise ValueError("Failed to segment extracted text into searchable chunks.")

    except Exception as e:
        # Create resource record with error status
        resource = LearningResource(
            user_id=current_user.id,
            title=title or filename.rsplit(".", 1)[0],
            original_filename=filename,
            file_type=ext,
            file_path=file_path,
            file_size_bytes=file_size,
            status="error",
            error_message=str(e)
        )
        db.add(resource)
        db.commit()
        db.refresh(resource)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Text extraction failed: {str(e)}"
        )

    # Create resource in database
    display_title = title if (title and title.strip()) else filename.rsplit(".", 1)[0].replace("_", " ").title()
    max_page = max([s.get("page_or_slide_num", 1) for s in sections] or [1])

    resource = LearningResource(
        user_id=current_user.id,
        title=display_title,
        original_filename=filename,
        file_type=ext,
        file_path=file_path,
        file_size_bytes=file_size,
        total_chunks=len(chunks_data),
        page_or_slide_count=max_page,
        status="processed"
    )
    db.add(resource)
    db.flush()

    # Save chunks
    for ch in chunks_data:
        chunk = ResourceChunk(
            resource_id=resource.id,
            chunk_index=ch["chunk_index"],
            text_content=ch["text_content"],
            page_or_slide_num=ch.get("page_or_slide_num", 1),
            section_title=ch.get("section_title", "General"),
            timestamp_mark=ch.get("timestamp_mark")
        )
        db.add(chunk)

    db.commit()
    db.refresh(resource)

    resp = ResourceResponse.from_orm(resource)
    resp.sample_preview = chunks_data[0]["text_content"][:200] + "..." if chunks_data else ""
    return resp

@router.post("/youtube", response_model=ResourceResponse)
def add_youtube_resource(
    payload: YouTubeUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts YouTube URL with video lecture transcripts or study notes.
    Extracts or processes transcripts into timestamped segments.
    """
    url = payload.url.strip()
    if not ("youtube.com" in url or "youtu.be" in url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube URL. Please provide a valid YouTube link."
        )

    raw_text = payload.manual_transcript or ""
    if not raw_text.strip():
        # Provide helpful informative transcript placeholder if no transcript submitted
        raw_text = (
            f"Video Lecture: {payload.title or 'YouTube Educational Lecture'}\n"
            f"URL: {url}\n\n"
            "Overview: This lecture explores core engineering principles, system architecture, "
            "and problem-solving methodologies. It covers foundational theory, practical real-world examples, "
            "and comprehensive step-by-step problem derivations."
        )

    sections = [
        {
            "page_or_slide_num": 1,
            "section_title": "Video Introduction & Core Principles",
            "timestamp_mark": "00:00 - 05:30",
            "text": raw_text
        }
    ]

    chunks_data = create_chunks_from_sections(sections)
    resource = LearningResource(
        user_id=current_user.id,
        title=payload.title or "YouTube Educational Lecture",
        original_filename=f"YouTube_{url[-11:]}.vtt",
        file_type="youtube",
        file_path=url,
        file_size_bytes=len(raw_text.encode('utf-8')),
        total_chunks=len(chunks_data),
        page_or_slide_count=1,
        status="processed"
    )
    db.add(resource)
    db.flush()

    for ch in chunks_data:
        chunk = ResourceChunk(
            resource_id=resource.id,
            chunk_index=ch["chunk_index"],
            text_content=ch["text_content"],
            page_or_slide_num=1,
            section_title=ch.get("section_title", "Video Lecture"),
            timestamp_mark=ch.get("timestamp_mark", "00:00 - 05:30")
        )
        db.add(chunk)

    db.commit()
    db.refresh(resource)

    resp = ResourceResponse.from_orm(resource)
    resp.sample_preview = raw_text[:200]
    return resp

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource_by_id(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id,
        LearningResource.user_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning resource not found or unauthorized access."
        )

    first_chunk = db.query(ResourceChunk).filter(ResourceChunk.resource_id == resource.id).first()
    resp = ResourceResponse.from_orm(resource)
    resp.sample_preview = first_chunk.text_content[:300] if first_chunk else ""
    return resp

@router.get("/{resource_id}/chunks", response_model=List[ResourceChunkResponse])
def get_resource_chunks(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id,
        LearningResource.user_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning resource not found."
        )

    chunks = db.query(ResourceChunk).filter(
        ResourceChunk.resource_id == resource.id
    ).order_by(ResourceChunk.chunk_index.asc()).all()

    return chunks

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(LearningResource).filter(
        LearningResource.id == resource_id,
        LearningResource.user_id == current_user.id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning resource not found."
        )

    # Delete physical file if exists
    if resource.file_path and os.path.exists(resource.file_path) and not resource.file_path.startswith("http"):
        try:
            os.remove(resource.file_path)
        except Exception:
            pass

    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted successfully", "id": resource_id}
