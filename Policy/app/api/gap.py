from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import aiofiles, os, uuid
from ..services.comparator import analyse_clause
from ..services.extractor import ISO_REQ
from ..models.schemas import GapReport, ClauseGap

router = APIRouter(prefix="/gap", tags=["Gap Analysis"])

@router.post("/analyse", response_model=GapReport)
async def analyse_policy(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"):
        raise HTTPException(400, "Unsupported file type")
    ext = file.filename.split(".")[-1]
    tmp_name = f"{uuid.uuid4()}.{ext}"
    tmp_path = f"uploads/{tmp_name}"
    os.makedirs("uploads", exist_ok=True)
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(await file.read())

    # Extract raw text
    if ext == "pdf":
        import PyPDF2, io
        text = ""
        with open(tmp_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for p in reader.pages:
                text += p.extract_text() or ""
    elif ext == "docx":
        import docx
        doc = docx.Document(tmp_path)
        text = "\n".join(p.text for p in doc.paragraphs)
    else:  # txt
        async with aiofiles.open(tmp_path, "r") as f:
            text = await f.read()

    # Run clause-by-clause
    details: List[ClauseGap] = []
    for clause, req in ISO_REQ.items():
        result = await analyse_clause(clause, req, text)
        details.append(
            ClauseGap(
                clause=clause,
                requirement=req,
                present=result["present"],
                evidence=result["evidence"],
                gap_severity=result["gap_severity"],
                recommendation=result["recommendation"]
            )
        )

    gaps = [g for g in details if not g.present]
    summary = f"Document covers {len(details)-len(gaps)}/{len(details)} ISO 22301 clauses. " \
              f"Critical gaps identified in {len([g for g in gaps if g.gap_severity=='high'])} clauses."
    os.remove(tmp_path)  # cleanup
    return GapReport(
        filename=file.filename,
        total_clauses=len(details),
        gaps_found=len(gaps),
        summary=summary,
        details=details
    )