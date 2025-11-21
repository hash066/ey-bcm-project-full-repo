import torch
import re, PyPDF2
from pathlib import Path
from transformers import pipeline, AutoTokenizer

PDF_PATH = Path(__file__).resolve().parent.parent.parent / "iso_pdf_22301.pdf"

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")

def load_iso_requirements(pdf_path: Path) -> dict:
    reader = PyPDF2.PdfReader(pdf_path)
    text = "".join(page.extract_text() or "" for page in reader.pages)

    clauses = {}
    for num in range(4, 11):
        pattern = rf"CLAUSE\s*{num}\s*:?[\s]*(.*?)(?=CLAUSE\s*{num+1}|$)"
        match = re.search(pattern, text, re.S | re.I)
        if match:
            clause_text = " ".join(match.group(1).split())
            # Summarize clause if longer than 3000 chars
            if len(clause_text) > 3000:
                tokens = tokenizer(clause_text, truncation=True, max_length=1000, return_tensors="pt")
                clause_text_truncated = tokenizer.batch_decode(tokens["input_ids"], skip_special_tokens=True)[0]
                summary = summarizer(clause_text_truncated, max_length=250, min_length=50, do_sample=False)
                clause_text = summary[0]['summary_text']
            clauses[f"Clause {num}"] = clause_text
    return clauses

ISO_REQ = load_iso_requirements(PDF_PATH)