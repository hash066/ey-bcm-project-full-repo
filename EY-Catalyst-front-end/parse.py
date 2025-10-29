import fitz  # PyMuPDF
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load GROQ API key from .env file
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize OpenAI client for Groq
client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# Function to extract all text from a PDF file
def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

# Function to ask Groq to extract processes and services
def ask_groq_for_processes(pdf_text):
    prompt = f"""
You are an AI assistant helping extract business documentation insights.

Given the following document text, extract a list of all important **processes** and **services** mentioned. 
For each, provide a JSON object with:
- name
- description
- RTO (if available)
- RPO (if available)

Return output in this format:
{{
  "processes": [{{"name": "...", "description": "...", "RTO": "...", "RPO": "..."}}],
  "services": [{{"name": "...", "description": "...", "RTO": "...", "RPO": "..."}}]
}}

Document text:
\"\"\"
{pdf_text}
\"\"\"
"""

    chat_completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000
    )

    return chat_completion.choices[0].message.content

# Main function
if __name__ == "__main__":
    pdf_path = "CloudNova_BCP_SOP.pdf"  # Replace with your actual PDF file path
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        exit(1)

    print("📄 Extracting text from PDF...")
    pdf_text = extract_text_from_pdf(pdf_path)

    print("🤖 Calling Groq API...")
    result = ask_groq_for_processes(pdf_text)

    print("\n✅ Extracted Processes and Services:")
    print(result)
