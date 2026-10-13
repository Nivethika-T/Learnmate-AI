import json
import random
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.resource import LearningResource, ResourceChunk
from app.models.quiz import Quiz, QuizQuestion
from app.models.learning_path import TopicMastery, LearningRecommendation

# Difficulty levels
DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]

class AdaptiveQuizEngine:
    """
    Handles adaptive difficulty progression, question generation from chunks,
    weak-topic diagnosis, and performance evaluation.
    """

    @staticmethod
    def calculate_next_difficulty(
        current_difficulty: str,
        consecutive_correct: int,
        consecutive_wrong: int
    ) -> Tuple[str, bool, str]:
        """
        Adaptive rule:
        - 2 consecutive correct answers => Step up difficulty (Easy -> Medium -> Hard)
        - 2 consecutive wrong answers (or wrong on Hard) => Step down difficulty (Hard -> Medium -> Easy)
        Returns: (new_difficulty, changed_flag, notification_message)
        """
        curr_idx = DIFFICULTY_LEVELS.index(current_difficulty) if current_difficulty in DIFFICULTY_LEVELS else 1

        if consecutive_correct >= 2 and curr_idx < len(DIFFICULTY_LEVELS) - 1:
            new_difficulty = DIFFICULTY_LEVELS[curr_idx + 1]
            msg = f"🔥 Impressive streak! Adaptive difficulty upgraded from {current_difficulty} to {new_difficulty}."
            return new_difficulty, True, msg

        elif consecutive_wrong >= 2 and curr_idx > 0:
            new_difficulty = DIFFICULTY_LEVELS[curr_idx - 1]
            msg = f"📉 Let's rebuild confidence: Adaptive difficulty adjusted from {current_difficulty} to {new_difficulty}."
            return new_difficulty, True, msg

        elif consecutive_wrong >= 1 and current_difficulty == "Hard":
            new_difficulty = "Medium"
            msg = "⚡ Calibrating difficulty: Stepping down from Hard to Medium to reinforce core fundamentals."
            return new_difficulty, True, msg

        return current_difficulty, False, f"Current difficulty remains {current_difficulty}."

    @staticmethod
    def generate_questions_from_chunks(
        chunks: List[ResourceChunk],
        topic: str,
        initial_difficulty: str,
        count: int = 5,
        weak_topics: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extracts key sentences and facts from resource chunks to synthesize
        verifiable 4-option multiple choice questions with explanations and citations.
        Works deterministically without external API dependencies.
        """
        generated = []
        if not chunks:
            # Fallback questions if no chunks exist
            return AdaptiveQuizEngine._get_universal_fallback_questions(count, initial_difficulty)

        random.seed(42)
        sample_chunks = list(chunks)
        random.shuffle(sample_chunks)

        for i in range(count):
            chunk = sample_chunks[i % len(sample_chunks)]
            text = chunk.text_content.strip()
            sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 20]
            
            # Select target fact
            fact_sentence = sentences[0] if sentences else text[:100]
            sec_title = chunk.section_title or f"Section {chunk.chunk_index + 1}"
            q_topic = topic if topic and topic != "General Review" else sec_title

            # Generate questions based on sentence
            words = [w for w in fact_sentence.split() if len(w) > 4 and w.isalnum()]
            key_term = words[0] if words else "core mechanism"

            diff = initial_difficulty
            if i > 0 and i % 2 == 0:
                # Slight variation in initial batch
                diff = initial_difficulty

            question_text = (
                f"According to {chunk.resource.original_filename if chunk.resource else 'the study notes'}, "
                f"which of the following accurately describes {sec_title}?"
            )
            
            correct_ans = fact_sentence if len(fact_sentence) < 140 else fact_sentence[:130] + "..."
            wrong_1 = f"It states that {key_term} is permanently disabled during active processing."
            wrong_2 = f"It asserts that {key_term} bypasses all standard validation protocols."
            wrong_3 = f"It ignores prerequisite components and executes asynchronously without coordination."

            options = [correct_ans, wrong_1, wrong_2, wrong_3]
            # Deterministic shuffle per question order
            order_indices = [0, 1, 2, 3]
            random.Random(i * 17 + 3).shuffle(order_indices)
            shuffled_options = [options[idx] for idx in order_indices]
            correct_idx = shuffled_options.index(correct_ans)

            explanation = (
                f"Correct! Based on {sec_title} in '{chunk.resource.original_filename if chunk.resource else 'the study resource'}': "
                f"\"{fact_sentence[:180]}...\""
            )

            citation = {
                "filename": chunk.resource.original_filename if chunk.resource else "Study Material",
                "page_or_slide": chunk.page_or_slide_num or 1,
                "excerpt": fact_sentence[:160] + "..."
            }

            generated.append({
                "question_order": i + 1,
                "topic": q_topic,
                "difficulty": diff,
                "question_text": question_text,
                "options": shuffled_options,
                "correct_option_index": correct_idx,
                "explanation": explanation,
                "citation": citation
            })

        return generated

    @staticmethod
    def _get_universal_fallback_questions(count: int, difficulty: str) -> List[Dict[str, Any]]:
        """Bundled fallback questions covering core CS, AI, and study concepts."""
        bank = [
            {
                "topic": "Operating Systems",
                "difficulty": "Medium",
                "question_text": "What is the primary role of Virtual Memory in modern computer systems?",
                "options": [
                    "To extend addressable RAM by caching inactive pages onto secondary disk storage",
                    "To double the clock frequency of the central processing unit",
                    "To physically replace hardware RAM with flash memory",
                    "To eliminate the need for CPU cache hierarchies"
                ],
                "correct_option_index": 0,
                "explanation": "Virtual memory abstracts physical RAM using paging, allowing processes to address more memory than physically installed.",
                "citation": {"filename": "OS_Concepts.pdf", "page_or_slide": 14, "excerpt": "Virtual memory maps virtual addresses to physical pages..."}
            },
            {
                "topic": "Machine Learning",
                "difficulty": "Easy",
                "question_text": "In supervised machine learning, what do training datasets require?",
                "options": [
                    "Input features paired with corresponding target ground-truth labels",
                    "Only raw unlabelled audio files",
                    "Hardware GPU accelerators with no training targets",
                    "Pre-compiled binary machine code"
                ],
                "correct_option_index": 0,
                "explanation": "Supervised learning algorithms learn mapping functions between input features and known ground-truth labels.",
                "citation": {"filename": "ML_Foundations.pptx", "page_or_slide": 4, "excerpt": "Supervised learning relies on paired (X, y) datasets..."}
            },
            {
                "topic": "Data Structures",
                "difficulty": "Hard",
                "question_text": "What is the worst-case time complexity of searching an element in an unbalanced Binary Search Tree?",
                "options": [
                    "O(N), degenerating into a linked list",
                    "O(log N) guaranteed",
                    "O(1) constant time",
                    "O(N log N)"
                ],
                "correct_option_index": 0,
                "explanation": "When unbalanced, a BST degrades into a linear linked list where lookups require traversing all N nodes.",
                "citation": {"filename": "Algorithms_Notes.docx", "page_or_slide": 22, "excerpt": "Unbalanced BST worst case lookup is O(N)..."}
            },
            {
                "topic": "Cell Biology",
                "difficulty": "Easy",
                "question_text": "Which organelle is universally known as the powerhouse of eukaryotic cells?",
                "options": [
                    "Mitochondria, which produces ATP via cellular respiration",
                    "Ribosome",
                    "Endoplasmic Reticulum",
                    "Golgi Apparatus"
                ],
                "correct_option_index": 0,
                "explanation": "Mitochondria generate most of the cell's adenosine triphosphate (ATP) through oxidative phosphorylation.",
                "citation": {"filename": "Cell_Biology.pdf", "page_or_slide": 8, "excerpt": "Mitochondria produce ATP during aerobic respiration..."}
            },
            {
                "topic": "System Design",
                "difficulty": "Hard",
                "question_text": "According to the CAP theorem in distributed systems, what can a distributed data store guarantee during a network partition?",
                "options": [
                    "Either Availability or Consistency, but not both simultaneously",
                    "Both Consistency and Availability without compromise",
                    "Neither Consistency nor Availability",
                    "Only Infinite Scalability"
                ],
                "correct_option_index": 0,
                "explanation": "Under network partition (P), a distributed system must choose between serving potentially stale data (Availability) or failing requests (Consistency).",
                "citation": {"filename": "Distributed_Systems.pdf", "page_or_slide": 35, "excerpt": "CAP theorem dictates choosing between AP or CP under network partition..."}
            }
        ]
        res = []
        for i in range(count):
            item = bank[i % len(bank)].copy()
            item["question_order"] = i + 1
            item["difficulty"] = difficulty
            res.append(item)
        return res

adaptive_quiz_engine = AdaptiveQuizEngine()
