from .groq_client import ask_groq
import json
import re

async def _groq_json(prompt: str) -> dict:
    """Groq tends to return valid JSON when asked politely."""
    raw = await ask_groq(prompt)
    m = re.search(r"{.*}", raw, re.S)
    return json.loads(m.group(0)) if m else {}

QUESTION_PROMPT = """
You are an ISO 22301:2019 expert helping a company renew its policy.
You receive:
Clause title (e.g. "Clause 5: Leadership")
Existing text the company wrote last year (may be empty)
Return JSON only:
{"questions":["question1","question2","question3"]}
Rules:
2-3 short, specific questions
focus on what changed internally/externally this year
invite measurable updates
"""

async def generate_questions(clause: str, existing: str) -> list[str]:
    prompt = f"{QUESTION_PROMPT}\nClause: {clause}\nExisting text: {existing[:1500]}"
    return (await _groq_json(prompt)).get("questions", [])

REFINE_PROMPT = """
You receive:
Old policy paragraph
User comment (what they dislike / want improved)
Task: rewrite the paragraph keeping the same intent but improved clarity, tone, completeness.
Reply with only the new paragraph (max 200 words).
"""

async def refine(old: str, comment: str) -> str:
    prompt = f"{REFINE_PROMPT}\nOld:\n{old}\nComment:\n{comment}"
    return (await ask_groq(prompt)).strip()

REGENERATE_PROMPT = """
You receive:
Old policy paragraph (for context)
User comment (new angle, new info, or “start from scratch”)
Task: write a completely fresh paragraph for the same clause that incorporates the comment.
Reply with only the new paragraph (max 200 words).
"""
async def regenerate(old: str, comment: str) -> str:
    prompt = f"{REGENERATE_PROMPT}\nOld:\n{old}\nComment:\n{comment}"
    return (await ask_groq(prompt)).strip()