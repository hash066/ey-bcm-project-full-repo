import os, groq
from typer import prompt
from dotenv import load_dotenv
load_dotenv()
client = groq.Groq(api_key="your-api-key-here")

async def ask_groq(prompt: str) -> str:
    resp = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.15,
    max_tokens=1200
    )
    return resp.choices[0].message.content