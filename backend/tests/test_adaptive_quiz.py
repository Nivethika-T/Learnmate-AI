import pytest
from app.services.adaptive_quiz import adaptive_quiz_engine

def test_adaptive_difficulty_increase():
    # 2 consecutive correct answers should increase difficulty from Easy to Medium
    new_diff, changed, msg = adaptive_quiz_engine.calculate_next_difficulty(
        current_difficulty="Easy",
        consecutive_correct=2,
        consecutive_wrong=0
    )
    assert new_diff == "Medium"
    assert changed is True

    # 2 consecutive correct answers should increase Medium to Hard
    new_diff, changed, msg = adaptive_quiz_engine.calculate_next_difficulty(
        current_difficulty="Medium",
        consecutive_correct=2,
        consecutive_wrong=0
    )
    assert new_diff == "Hard"
    assert changed is True

def test_adaptive_difficulty_decrease():
    # Wrong answer on Hard should step down to Medium
    new_diff, changed, msg = adaptive_quiz_engine.calculate_next_difficulty(
        current_difficulty="Hard",
        consecutive_correct=0,
        consecutive_wrong=1
    )
    assert new_diff == "Medium"
    assert changed is True

    # 2 consecutive wrong answers should step down Medium to Easy
    new_diff, changed, msg = adaptive_quiz_engine.calculate_next_difficulty(
        current_difficulty="Medium",
        consecutive_correct=0,
        consecutive_wrong=2
    )
    assert new_diff == "Easy"
    assert changed is True

def test_fallback_questions_structure():
    questions = adaptive_quiz_engine._get_universal_fallback_questions(count=3, difficulty="Medium")
    assert len(questions) == 3
    for q in questions:
        assert len(q["options"]) == 4
        assert 0 <= q["correct_option_index"] < 4
        assert q["explanation"] is not None
        assert q["citation"] is not None
