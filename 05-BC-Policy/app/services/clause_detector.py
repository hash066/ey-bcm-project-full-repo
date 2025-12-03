from .groq_client import ask_groq
import json, re
from ..models.renewal_schemas import DetectedClause, ClauseExtract

# SYSTEM = """
# You are an ISO 22301:2019 expert.
# Read the user-supplied policy document and return only the clauses that are explicitly or implicitly present.
# Reply in JSON:
# {"clauses":[{"clause":"Clause 4","title":"Context of the Organization"}, ...]}
# If a clause is missing, omit it.
# Be concise; titles must be exact from the standard.
# """
# async def detect_clauses(policy_text: str) -> list[DetectedClause]:
#     prompt = f"{SYSTEM}\n\nPolicy document:\n{policy_text[:6000]}"
#     raw = await ask_groq(prompt)
#     # Groq usually returns clean JSON
#     m = re.search(r'{.*}', raw, re.S)
#     data = json.loads(m.group(0)) if m else {"clauses": []}
#     return [DetectedClause(**c) for c in data["clauses"]]


EXTRACT_PROMPT = """
You are an ISO 22301:2019 expert.
You receive:
The full text of every page (each line starts with "PAGE {n}:").
The list of clauses to look for.
For each clause return the exact continuous excerpt that proves the clause is addressed (max 600 words).
If a clause appears on multiple pages, concatenate the excerpts and list all page numbers.
Reply JSON only:
{
"clauses":[
{"clause":"Clause 4","title":"Context of the Organization","text":"...","pages":[1,2]},
...
]
}
Omit clause if completely absent.
"""
async def extract_clauses_with_text(pages: dict[int, str]) -> list[ClauseExtract]:
    # pages = {1: "text of page 1", 2: "text of page 2", ...}
    page_lines = [f"PAGE {n}:\n{t}" for n, t in pages.items()]
    payload = "\n".join(page_lines)
    prompt = f"{EXTRACT_PROMPT}\n\n{payload}"
    raw = await ask_groq(prompt)
    import json, re
    m = re.search(r'{.*}', raw, re.S)
    data = json.loads(m.group(0)) if m else {"clauses": []}
    return [ClauseExtract(**c) for c in data["clauses"]]