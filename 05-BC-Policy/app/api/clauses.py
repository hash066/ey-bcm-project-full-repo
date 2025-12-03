from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import aiofiles, uuid, base64, io
from pydantic import BaseModel
from ..models.renewal_schemas import PolicyClausesResponse, DetectedClause, PolicyExtractResponse, ISORequiredField, ISORequiredList
from ..services.clause_detector import extract_clauses_with_text
import PyPDF2, docx

router = APIRouter(prefix="/clauses", tags=["Policy"])

def _extract_text(file_b64: str, filename: str) -> str:
    binary = base64.b64decode(file_b64)
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(binary))
        return "".join(p.extract_text() or "" for p in reader.pages)
    if filename.endswith(".docx"):
        return "\n".join(p.text for p in docx.Document(io.BytesIO(binary)).paragraphs)
    return binary.decode("utf-8")

class ClauseDetectRequest(BaseModel):
    policy_file: str          # base64 data-uri
    filename : str

@router.post("/extract", response_model=PolicyExtractResponse)
async def extract_policy_clauses(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"):
        raise HTTPException(400, "Unsupported type")

    content = await file.read()
    pages = _extract_pages(content, file.filename)   # returns dict[int,str]
    extracted = await extract_clauses_with_text(pages)
    return PolicyExtractResponse(clauses=extracted)

def _extract_pages(content: bytes, filename: str) -> dict[int, str]:
    pages = {}
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        for idx, p in enumerate(reader.pages, 1):
            pages[idx] = p.extract_text() or ""
    elif filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        # docx has no pages; fake one page
        pages[1] = "\n".join(par.text for par in doc.paragraphs)
    else:  # txt
        pages[1] = content.decode("utf-8")
    return pages

@router.get("/required", response_model=ISORequiredList)
def get_required_fields():
    """Return every ISO 22301 clause with a short sample text."""
    from ..services.iso_samples import SAMPLES
    return ISORequiredList(
    fields=[
    ISORequiredField(required_clause=k, sample_text=v)
    for k, v in SAMPLES.items()
    ]
    )