from pydantic import BaseModel
from typing import List, Optional

class ClauseWithQuestions(BaseModel):
    clause: str
    existing_text: str
    questions: List[str]

class RenewalStartRequest(BaseModel):
    policy_file: Optional[str] = None          # base64 or leave empty
    policy_text: Optional[str] = None  # plain text if already extracted

class RenewalStartResponse(BaseModel):
    clauses: List[ClauseWithQuestions]

class RefineRequest(BaseModel):
    clause: str
    old_text: str
    user_comment: str

class RefineResponse(BaseModel):
    new_text: str
    
RegenerateRequest = RefineRequest
RegenerateResponse = RefineResponse

class ClauseItem(BaseModel):
    clause: str
    requirement: str
class ClausesResponse(BaseModel):
    clauses: List[ClauseItem]

class DetectedClause(BaseModel):
    clause: str          # e.g. "Clause 5"
    title : str          # e.g. "Leadership"
class PolicyClausesResponse(BaseModel):
    detected: List[DetectedClause]


class ClauseExtract(BaseModel):
    clause: str          # "Clause 5"
    title: str           # "Leadership"
    text: str            # exact text from PDF
    pages: List[int]     # 1-based page numbers

class PolicyExtractResponse(BaseModel):
    clauses: List[ClauseExtract]

class ISORequiredField(BaseModel):
    required_clause: str   # "Clause 5"
    sample_text: str       # short, generic example you can copy into your policy
class ISORequiredList(BaseModel):
    fields: List[ISORequiredField]