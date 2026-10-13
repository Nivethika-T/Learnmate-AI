import pytest
from app.services.retriever import search_chunks, BM25Retriever

def test_bm25_retrieval_ranking():
    chunks = [
        {
            "id": 1,
            "text_content": "Cellular respiration occurs inside eukaryotic mitochondria to produce adenosine triphosphate ATP.",
            "section_title": "Mitochondria Bioenergetics",
            "page_or_slide_num": 1,
            "original_filename": "Biology_Notes.pdf"
        },
        {
            "id": 2,
            "text_content": "Virtual memory utilizes demand paging and translation lookaside buffers TLB.",
            "section_title": "Memory Architecture",
            "page_or_slide_num": 2,
            "original_filename": "OS_Concepts.pdf"
        },
        {
            "id": 3,
            "text_content": "Stochastic gradient descent optimizes loss function weights in deep neural networks.",
            "section_title": "Gradient Descent",
            "page_or_slide_num": 3,
            "original_filename": "ML_Intro.pdf"
        }
    ]

    results = search_chunks(chunks, "What organelle produces ATP through cellular respiration?", top_k=2)
    assert len(results) > 0
    top_match = results[0]
    assert top_match["id"] == 1
    assert "mitochondria" in top_match["text_content"].lower()
    assert top_match["relevance_score"] > 0.3

def test_retrieval_with_no_match():
    chunks = [
        {"id": 1, "text_content": "Paging divides memory into fixed frames.", "page_or_slide_num": 1}
    ]
    results = search_chunks(chunks, "Shakespeare Hamlet soliloquy act 3", top_k=2)
    # Shouldn't error
    assert isinstance(results, list)
