from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CitationRef(BaseModel):
    filename: Optional[str] = "Study Resource"
    page_or_slide: Optional[int] = 1
    excerpt: Optional[str] = ""

class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_order: int
    topic: str
    difficulty: str
    question_text: str
    options: List[str]
    # In active quiz, correct_option_index is hidden until submitted or completed
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None
    citation: Optional[CitationRef] = None
    user_selected_index: Optional[int] = None
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True

class QuizGenerateRequest(BaseModel):
    resource_id: Optional[int] = None
    topic: Optional[str] = "Comprehensive Review"
    difficulty: str = "Medium"  # Easy, Medium, Hard
    question_count: int = 5
    focus_weak_areas: bool = False

class QuizSubmitAnswerRequest(BaseModel):
    question_id: int
    selected_option_index: int
    time_taken_seconds: Optional[int] = 10

class QuizSubmitResponse(BaseModel):
    question_id: int
    is_correct: bool
    correct_option_index: int
    explanation: str
    citation: Optional[CitationRef] = None
    next_difficulty: str
    difficulty_changed: bool
    difficulty_message: str
    current_score: float
    is_quiz_completed: bool

class QuizResponse(BaseModel):
    id: int
    title: str
    topic: str
    initial_difficulty: str
    current_difficulty: str
    status: str
    score: float
    total_questions: int
    correct_count: int
    time_spent_seconds: int
    weak_topics: List[str] = []
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True
