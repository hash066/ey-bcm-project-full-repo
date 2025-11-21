from fastapi import APIRouter
from typing import List
import base64, io, PyPDF2, docx
from ..models.renewal_schemas import RefineRequest, RefineResponse, RenewalStartRequest, RenewalStartResponse, ClauseWithQuestions, RegenerateRequest, RegenerateResponse
from ..services.renewal_ai import generate_questions, refine, regenerate
from ..services.extractor import ISO_REQ   # clause list
router = APIRouter(prefix="/renewal", tags=["Policy Renewal"])

def _extract_text(file_b64: str, filename: str) -> str:
    binary = base64.b64decode(file_b64)
    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(binary))
        return "".join(p.extract_text() or "" for p in reader.pages)
    elif filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(binary))
        return "\n".join(p.text for p in doc.paragraphs)
    else:  # txt
        return binary.decode("utf-8")

@router.post("/startPolicyRenewal", response_model=RenewalStartResponse)
async def start_renewal(body: RenewalStartRequest):
    if body.policy_text:
        full_text = body.policy_text
    elif body.policy_file:
        # expect base64 string "data:application/pdf;base64,xxxx"
        head, data = body.policy_file.split(",", 1)
        fname = head.split(";")[0].split("/")[-1]
        full_text = _extract_text(data, fname)
    else:
        full_text = ""

    clauses_out: List[ClauseWithQuestions] = []
    for clause, req_text in ISO_REQ.items():
        # naive: grab first chunk that mentions the clause number
        import re
        pattern = rf"{clause.lower()}[:\s]*(.*?)(?=clause\s*\d|$)"
        m = re.search(pattern, full_text.lower())
        existing = m.group(1).strip() if m else ""
        questions = await generate_questions(clause, existing)
        clauses_out.append(
            ClauseWithQuestions(
                clause=clause,
                existing_text=existing,
                questions=questions
            )
        )
    return RenewalStartResponse(clauses=clauses_out)

@router.post("/refine", response_model=RefineResponse)
async def refine_section(body: RefineRequest):
    new_text = await refine(body.old_text, body.user_comment)
    return RefineResponse(new_text=new_text)

@router.post("/regenerate", response_model=RegenerateResponse)
async def regenerate_section(body: RegenerateRequest):
    new_text = await regenerate(body.old_text, body.user_comment)
    return RegenerateResponse(new_text=new_text)