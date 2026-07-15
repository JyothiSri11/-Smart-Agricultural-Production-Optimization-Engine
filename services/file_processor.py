"""Extracts plain text from uploaded PDF, DOCX, or TXT files."""
import io
from pypdf import PdfReader
from docx import Document


class UnsupportedFileType(Exception):
    pass


def extract_text(file_storage):
    """file_storage: a werkzeug FileStorage object from request.files"""
    filename = (file_storage.filename or "").lower()
    raw = file_storage.read()

    if filename.endswith(".pdf"):
        return _extract_pdf(raw)
    if filename.endswith(".docx"):
        return _extract_docx(raw)
    if filename.endswith(".txt"):
        return raw.decode("utf-8", errors="ignore")

    raise UnsupportedFileType(f"Unsupported file type: {filename}")


def _extract_pdf(raw_bytes):
    reader = PdfReader(io.BytesIO(raw_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    return "\n".join(pages).strip()


def _extract_docx(raw_bytes):
    doc = Document(io.BytesIO(raw_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()
