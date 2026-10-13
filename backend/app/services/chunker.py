import re
from typing import List, Dict, Any

def create_chunks_from_sections(
    sections: List[Dict[str, Any]], 
    chunk_size: int = 500, 
    chunk_overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Takes extracted document sections/pages and splits them into overlapping chunks
    while preserving page/slide number, section title, and timestamp markers.
    """
    final_chunks = []
    chunk_counter = 0

    for sec in sections:
        text = sec.get("text", "").strip()
        page_or_slide = sec.get("page_or_slide_num", 1)
        section_title = sec.get("section_title", "General")
        timestamp_mark = sec.get("timestamp_mark", None)

        if not text:
            continue

        # If text is smaller than chunk_size, keep as a single chunk
        if len(text) <= chunk_size:
            final_chunks.append({
                "chunk_index": chunk_counter,
                "text_content": text,
                "page_or_slide_num": page_or_slide,
                "section_title": section_title,
                "timestamp_mark": timestamp_mark
            })
            chunk_counter += 1
            continue

        # Split by sentences or paragraph breaks
        sentences = re.split(r'(?<=[.!?\n])\s+', text)
        current_chunk_sentences = []
        current_length = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            current_chunk_sentences.append(sentence)
            current_length += len(sentence) + 1

            if current_length >= chunk_size:
                chunk_str = " ".join(current_chunk_sentences)
                final_chunks.append({
                    "chunk_index": chunk_counter,
                    "text_content": chunk_str,
                    "page_or_slide_num": page_or_slide,
                    "section_title": section_title,
                    "timestamp_mark": timestamp_mark
                })
                chunk_counter += 1

                # Retain overlap sentences
                overlap_chars = 0
                overlap_sentences = []
                for s in reversed(current_chunk_sentences):
                    overlap_sentences.insert(0, s)
                    overlap_chars += len(s) + 1
                    if overlap_chars >= chunk_overlap:
                        break

                current_chunk_sentences = overlap_sentences
                current_length = sum(len(s) + 1 for s in current_chunk_sentences)

        # Remaining buffer
        if current_chunk_sentences and current_length > 30:
            chunk_str = " ".join(current_chunk_sentences)
            final_chunks.append({
                "chunk_index": chunk_counter,
                "text_content": chunk_str,
                "page_or_slide_num": page_or_slide,
                "section_title": section_title,
                "timestamp_mark": timestamp_mark
            })
            chunk_counter += 1

    return final_chunks
