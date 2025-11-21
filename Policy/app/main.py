from fastapi import FastAPI
from .api.gap import router as gap_router
from .api.renewal import router as renewal_router
from .api.clauses import router as clauses_router

app = FastAPI(title="ISO 22301 Gap-Analyser", version="1.0.0")

app.include_router(gap_router)
app.include_router(renewal_router)
app.include_router(clauses_router)


@app.get("/")
def root():
    return {"message": "POST /gap/analyse with a policy PDF/DOCX/TXT file"}