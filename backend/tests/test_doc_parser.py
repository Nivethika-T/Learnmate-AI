import os
import tempfile
import pytest
from app.services.doc_parser import extract_text_from_txt, extract_text_from_srt_or_vtt, parse_document
from app.services.chunker import create_chunks_from_sections

def test_txt_extraction_and_chunking():
    with tempfile.NamedTemporaryFile("w+", suffix=".txt", delete=False) as f:
        f.write("Chapter 1: Operating Systems.\n\nVirtual memory uses paging to divide RAM into 4KB pages.\n\nPage tables translate virtual addresses to physical frame addresses.")
        tmp_path = f.name

    try:
        sections = extract_text_from_txt(tmp_path)
        assert len(sections) > 0
        assert "Virtual memory" in sections[0]["text"]

        chunks = create_chunks_from_sections(sections, chunk_size=200, chunk_overlap=30)
        assert len(chunks) >= 1
        assert "Virtual memory" in chunks[0]["text_content"]
        assert chunks[0]["page_or_slide_num"] == 1
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_srt_subtitle_extraction():
    sample_srt = """1
00:00:01,000 --> 00:00:04,500
Welcome to Lecture 5 on Concurrency.

2
00:00:05,000 --> 00:00:09,200
Today we discuss Deadlocks and the four Coffman conditions.
"""
    with tempfile.NamedTemporaryFile("w+", suffix=".srt", delete=False) as f:
        f.write(sample_srt)
        tmp_path = f.name

    try:
        sections = extract_text_from_srt_or_vtt(tmp_path)
        assert len(sections) > 0
        assert "Deadlocks" in sections[0]["text"]
        assert sections[0]["timestamp_mark"] is not None
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
