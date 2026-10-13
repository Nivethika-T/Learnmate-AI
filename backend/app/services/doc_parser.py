import os
import re
from typing import List, Dict, Any, Optional

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text page by page from PDF using PyMuPDF with pypdf fallback."""
    pages_data = []
    # Try PyMuPDF (fitz)
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text()
            if text and text.strip():
                pages_data.append({
                    "text": text.strip(),
                    "page_or_slide_num": page_idx + 1,
                    "section_title": f"Page {page_idx + 1}",
                    "timestamp_mark": None
                })
        doc.close()
        if pages_data:
            return pages_data
    except Exception as e:
        print(f"PyMuPDF failed or not available ({e}), trying pypdf fallback...")

    # Fallback: pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages_data.append({
                    "text": text.strip(),
                    "page_or_slide_num": idx + 1,
                    "section_title": f"Page {idx + 1}",
                    "timestamp_mark": None
                })
        return pages_data
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_pptx(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text slide by slide from PPT/PPTX using python-pptx."""
    try:
        from pptx import Presentation
        prs = Presentation(file_path)
        slides_data = []
        for slide_idx, slide in enumerate(prs.slides):
            slide_texts = []
            title_text = f"Slide {slide_idx + 1}"
            
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text_val = paragraph.text.strip()
                        if text_val:
                            slide_texts.append(text_val)
                            # Check if title
                            if hasattr(shape, "is_placeholder") and shape.is_placeholder:
                                if "TITLE" in str(shape.placeholder_format.type):
                                    title_text = text_val

            # Also check speaker notes
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_texts.append(f"[Speaker Notes: {notes}]")

            combined_text = "\n".join(slide_texts).strip()
            if combined_text:
                slides_data.append({
                    "text": combined_text,
                    "page_or_slide_num": slide_idx + 1,
                    "section_title": title_text,
                    "timestamp_mark": None
                })
        return slides_data
    except Exception as e:
        raise ValueError(f"Failed to extract text from PowerPoint slides: {str(e)}")


def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text from DOCX documents section by section."""
    try:
        import docx
        doc = docx.Document(file_path)
        sections = []
        current_section = "Document Overview"
        current_paragraphs = []
        page_approx = 1

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            if p.style and ("Heading" in p.style.name or "Title" in p.style.name):
                if current_paragraphs:
                    sections.append({
                        "text": "\n".join(current_paragraphs),
                        "page_or_slide_num": page_approx,
                        "section_title": current_section,
                        "timestamp_mark": None
                    })
                    current_paragraphs = []
                    page_approx += 1
                current_section = text
            else:
                current_paragraphs.append(text)

        # Also extract table text
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                row_vals = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_vals:
                    table_rows.append(" | ".join(row_vals))
            if table_rows:
                current_paragraphs.append("\n[Table Data:\n" + "\n".join(table_rows) + "]")

        if current_paragraphs:
            sections.append({
                "text": "\n".join(current_paragraphs),
                "page_or_slide_num": page_approx,
                "section_title": current_section,
                "timestamp_mark": None
            })

        return sections if sections else [{
            "text": "Empty document",
            "page_or_slide_num": 1,
            "section_title": "Overview",
            "timestamp_mark": None
        }]
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def extract_text_from_srt_or_vtt(file_path: str) -> List[Dict[str, Any]]:
    """Extracts timestamped text blocks from SRT or VTT subtitle transcript files."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Regular expressions for subtitle cues
        # Format SRT: 00:01:20,000 --> 00:01:23,000
        # Format VTT: 00:01:20.000 --> 00:01:23.000
        blocks = re.split(r'\n\s*\n', content)
        sub_items = []
        segment_index = 1
        buffer_text = []
        start_time_current = None
        end_time_current = None

        for b in blocks:
            lines = [l.strip() for l in b.strip().splitlines() if l.strip()]
            if not lines:
                continue
            
            # Find timestamp line
            time_line = None
            text_lines = []
            for line in lines:
                if "-->" in line:
                    time_line = line
                elif not line.isdigit() and "WEBVTT" not in line:
                    text_lines.append(line)

            if time_line and text_lines:
                match = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?).*?-->\s*(\d{1,2}:\d{2}(?::\d{2})?)', time_line)
                if match:
                    st, et = match.group(1), match.group(2)
                    if start_time_current is None:
                        start_time_current = st
                    end_time_current = et
                    buffer_text.append(" ".join(text_lines))

                    # Group into ~45 second/sentence chunks
                    if len(buffer_text) >= 5:
                        sub_items.append({
                            "text": " ".join(buffer_text),
                            "page_or_slide_num": segment_index,
                            "section_title": f"Video Segment {segment_index}",
                            "timestamp_mark": f"{start_time_current} - {end_time_current}"
                        })
                        segment_index += 1
                        buffer_text = []
                        start_time_current = None

        if buffer_text:
            sub_items.append({
                "text": " ".join(buffer_text),
                "page_or_slide_num": segment_index,
                "section_title": f"Video Segment {segment_index}",
                "timestamp_mark": f"{start_time_current or '00:00'} - {end_time_current or 'End'}"
            })

        return sub_items if sub_items else [{
            "text": content[:1000],
            "page_or_slide_num": 1,
            "section_title": "Transcript Overview",
            "timestamp_mark": "00:00 - 05:00"
        }]
    except Exception as e:
        raise ValueError(f"Failed to parse subtitle transcript: {str(e)}")


def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """Extracts text from plain text or markdown files."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if not paragraphs:
            return [{"text": content.strip() or "Empty", "page_or_slide_num": 1, "section_title": "Section 1", "timestamp_mark": None}]

        chunks = []
        curr = []
        page = 1
        for p in paragraphs:
            curr.append(p)
            if len("\n\n".join(curr)) > 800:
                chunks.append({
                    "text": "\n\n".join(curr),
                    "page_or_slide_num": page,
                    "section_title": f"Section {page}",
                    "timestamp_mark": None
                })
                curr = []
                page += 1
        if curr:
            chunks.append({
                "text": "\n\n".join(curr),
                "page_or_slide_num": page,
                "section_title": f"Section {page}",
                "timestamp_mark": None
            })
        return chunks
    except Exception as e:
        raise ValueError(f"Failed to read text file: {str(e)}")


def parse_document(file_path: str, file_type: str) -> List[Dict[str, Any]]:
    """Routes file to appropriate extractor based on extension/file_type."""
    ext = file_type.lower().replace(".", "")
    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    elif ext in ["ppt", "pptx"]:
        return extract_text_from_pptx(file_path)
    elif ext in ["doc", "docx"]:
        return extract_text_from_docx(file_path)
    elif ext in ["srt", "vtt"]:
        return extract_text_from_srt_or_vtt(file_path)
    elif ext in ["txt", "md"]:
        return extract_text_from_txt(file_path)
    else:
        # Generic text attempt
        return extract_text_from_txt(file_path)
