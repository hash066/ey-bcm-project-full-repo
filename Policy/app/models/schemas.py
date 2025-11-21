from pydantic import BaseModel
from typing import List,Union


class ClauseGap(BaseModel):
    clause: str
    requirement: str
    present: bool
    evidence: str
    gap_severity: str   # low | medium | high
    recommendation: Union[str, List[str]]

class GapReport(BaseModel):
    filename: str
    total_clauses: int
    gaps_found: int
    summary: str
    details: List[ClauseGap]