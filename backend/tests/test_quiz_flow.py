import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_adaptive_quiz_and_mastery_flow():
    # 1. Login with demo user
    demo_res = client.post("/api/auth/demo")
    assert demo_res.status_code == 200
    token = demo_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Generate a new adaptive quiz
    gen_res = client.post("/api/quizzes/generate", json={
        "topic": "Virtual Memory Architecture",
        "difficulty": "Easy",
        "question_count": 3
    }, headers=headers)
    assert gen_res.status_code == 200
    quiz_data = gen_res.json()
    quiz_id = quiz_data["id"]
    questions = quiz_data["questions"]
    assert len(questions) == 3
    assert quiz_data["initial_difficulty"] == "Easy"

    # 3. Submit first question correctly
    q1 = questions[0]
    # Fetch quiz with correct index to simulate correct answer
    detail_res = client.get(f"/api/quizzes/{quiz_id}", headers=headers)
    
    # We can answer question 1
    sub1_res = client.post(f"/api/quizzes/{quiz_id}/submit", json={
        "question_id": q1["id"],
        "selected_option_index": 0,
        "time_taken_seconds": 15
    }, headers=headers)
    assert sub1_res.status_code == 200
    sub1_data = sub1_res.json()
    assert "is_correct" in sub1_data
    assert "explanation" in sub1_data
    assert "next_difficulty" in sub1_data

    # 4. Check that quiz history records this
    hist_res = client.get("/api/quizzes/history", headers=headers)
    assert hist_res.status_code == 200
    assert any(q["id"] == quiz_id for q in hist_res.json())

def test_study_chat_rag_grounded_response():
    # Login
    demo_res = client.post("/api/auth/demo")
    token = demo_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query about Virtual Memory
    chat_res = client.post("/api/chat", json={
        "message": "What is the function of the Memory Management Unit MMU in paging?",
        "mode": "study_tutor"
    }, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["sender"] == "assistant"
    assert "citations" in chat_data
    assert len(chat_data["citations"]) > 0
    # Check citation contents
    top_citation = chat_data["citations"][0]
    assert "filename" in top_citation
    assert "page_or_slide" in top_citation
    assert "excerpt" in top_citation

def test_insufficient_sources_query():
    demo_res = client.post("/api/auth/demo")
    token = demo_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query on completely unmentioned topic
    chat_res = client.post("/api/chat", json={
        "message": "Who painted the Mona Lisa and in which museum is it displayed in Paris?",
        "mode": "study_tutor"
    }, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["grounding_type"] == "insufficient_sources"
    assert "not contain enough information" in chat_data["content"].lower()
