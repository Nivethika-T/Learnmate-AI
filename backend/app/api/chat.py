import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resource import LearningResource, ResourceChunk
from app.models.chat import Conversation, Message
from app.schemas.chat import ChatRequest, MessageResponse, ConversationResponse, CitationModel
from app.api.deps import get_current_user
from app.services.retriever import search_chunks
from app.services.llm_service import llm_service

router = APIRouter(prefix="/chat", tags=["AI Study Assistant"])

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all study chat sessions for the current student."""
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for c in convs:
        # Load messages
        msgs = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.id.asc()).all()
        msg_responses = []
        for m in msgs:
            citations_data = []
            try:
                citations_data = json.loads(m.citations_json)
            except Exception:
                pass
            msg_responses.append(
                MessageResponse(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    sender=m.sender,
                    content=m.content,
                    citations=[CitationModel(**cit) for cit in citations_data],
                    grounding_type=m.grounding_type,
                    tutor_mode=m.tutor_mode,
                    hint_content=m.hint_content,
                    created_at=m.created_at
                )
            )
        result.append(
            ConversationResponse(
                id=c.id,
                title=c.title,
                mode=c.mode,
                created_at=c.created_at,
                updated_at=c.updated_at,
                messages=msg_responses
            )
        )
    return result

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_by_id(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found."
        )

    msgs = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.id.asc()).all()
    msg_responses = []
    for m in msgs:
        citations_data = []
        try:
            citations_data = json.loads(m.citations_json)
        except Exception:
            pass
        msg_responses.append(
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender=m.sender,
                content=m.content,
                citations=[CitationModel(**cit) for cit in citations_data],
                grounding_type=m.grounding_type,
                tutor_mode=m.tutor_mode,
                hint_content=m.hint_content,
                created_at=m.created_at
            )
        )

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=msg_responses
    )

@router.post("", response_model=MessageResponse)
async def ask_question(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RAG Study Chat Endpoint:
    1. Retrieves relevant text chunks from the student's materials.
    2. Sends context to AI Tutor or deterministic fallback.
    3. Returns answer strictly cited to verified source passages.
    """
    query_str = payload.message.strip()
    if not query_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question message cannot be empty."
        )

    # Find or create conversation
    conv = None
    if payload.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == payload.conversation_id,
            Conversation.user_id == current_user.id
        ).first()

    if not conv:
        # Title summary from first 5-6 words of question
        title_summary = " ".join(query_str.split()[:5]).capitalize()
        if len(title_summary) > 40:
            title_summary = title_summary[:40] + "..."
        conv = Conversation(
            user_id=current_user.id,
            title=title_summary or "Study Session",
            mode=payload.mode
        )
        db.add(conv)
        db.flush()

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=query_str,
        citations_json="[]",
        grounding_type="user_query",
        tutor_mode=payload.mode
    )
    db.add(user_msg)
    db.flush()

    # Fetch candidate chunks from student resources
    chunk_query = db.query(ResourceChunk).join(LearningResource).filter(
        LearningResource.user_id == current_user.id
    )
    if payload.resource_id:
        chunk_query = chunk_query.filter(ResourceChunk.resource_id == payload.resource_id)

    raw_chunks = chunk_query.all()
    
    # Format chunks for retrieval
    corpus = []
    for c in raw_chunks:
        corpus.append({
            "id": c.id,
            "resource_id": c.resource_id,
            "original_filename": c.resource.original_filename if c.resource else "Resource",
            "section_title": c.section_title or f"Page {c.page_or_slide_num or 1}",
            "page_or_slide_num": c.page_or_slide_num or 1,
            "timestamp_mark": c.timestamp_mark,
            "text_content": c.text_content
        })

    # Search top relevant chunks using BM25 & keyword retrieval
    relevant_chunks = search_chunks(corpus, query_str, top_k=4)

    # Generate answer with AI Service
    ai_result = await llm_service.generate_response(
        query=query_str,
        retrieved_chunks=relevant_chunks,
        mode=payload.mode,
        request_hint_only=payload.request_hint_only
    )

    # Save Assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=ai_result["answer"],
        citations_json=json.dumps(ai_result.get("citations", [])),
        grounding_type=ai_result.get("grounding_type", "grounded"),
        tutor_mode=payload.mode,
        hint_content=ai_result.get("hint")
    )
    db.add(assistant_msg)

    # Update conversation updated_at
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)

    citations_list = [CitationModel(**c) for c in ai_result.get("citations", [])]

    return MessageResponse(
        id=assistant_msg.id,
        conversation_id=conv.id,
        sender="assistant",
        content=assistant_msg.content,
        citations=citations_list,
        grounding_type=assistant_msg.grounding_type,
        tutor_mode=assistant_msg.tutor_mode,
        hint_content=assistant_msg.hint_content,
        created_at=assistant_msg.created_at
    )

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    db.delete(conv)
    db.commit()
    return {"message": "Conversation session deleted", "id": conversation_id}
