from .groq_client import ask_groq
from .extractor import ISO_REQ
import time

SYSTEM_PROMPT = """
You are an ISO 22301:2019 expert.
You will receive:
A clause title (e.g. "Clause 5: Leadership")
The official requirement text from ISO 22301
The user's policy document text (may be empty or partial)
Task:
Decide whether the requirement is satisfied (present=yes/no)
Quote the evidence (max 40 words) or state "No evidence"
Grade severity: high / medium / low
Give a concise, actionable recommendation (bullet list, max 80 words)
Answer in JSON only do not add any explanations.
Format :
{"present":bool,"evidence":"...","gap_severity":"...","recommendation":"..."}
"""
async def analyse_clause(clause_title: str, requirement: str, user_text: str) -> dict:
    prompt = f"""
    Clause: {clause_title}
    Requirement: {requirement}
    User document: {user_text[:1000]}
    """
    raw = await ask_groq(SYSTEM_PROMPT + "\n" + prompt)
    time.sleep(1)  # rate limit
    print("Groq raw response:", raw)
# Basic JSON extraction (Groq usually respects it)
    import json, re
    json_snippet = re.search(r"\{[\s\S]*\}", raw)
    if json_snippet:
        try:
            cleaned = json_snippet.group(0)
            # Normalize yes/no to true/false
            cleaned = cleaned.replace(": yes", ": true").replace(": no", ": false")
            cleaned = cleaned.replace("```", "").strip()
            data = json.loads(cleaned)
            # Fix recommendation if it's a list
            if isinstance(data.get("recommendation"), list):
                data["recommendation"] = " ".join(data["recommendation"])
            return data
        except json.JSONDecodeError:
            return {
                "present": False,
                "evidence": "Parse error",
                "gap_severity": "high",
                "recommendation": "Re-check document formatting"
            }
    # fallback
    return {
        "present": False,
        "evidence": "Parse error",
        "gap_severity": "high",
        "recommendation": "Re-check document formatting"
    }