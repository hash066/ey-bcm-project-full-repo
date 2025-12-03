"""
Simple FastAPI server for testing the graph transformation endpoint.
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import uvicorn
import json

# Import our transformer
from app.services.graph_transformer import GraphTransformer

# Create FastAPI app
app = FastAPI(
    title="Graph Transformer API",
    description="API for transforming LLM output to frontend graph format",
    version="0.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LLMRequest(BaseModel):
    """Request model for LLM output."""
    llm_output: Dict[str, Any]

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Graph Transformer API is running",
        "endpoints": {
            "POST /transform": "Transform LLM output to frontend graph format"
        }
    }

@app.post("/transform")
async def transform_llm_output(request: LLMRequest):
    """
    Transform LLM output to frontend graph format.
    
    This endpoint takes the raw LLM output and transforms it into a format
    that can be directly consumed by the frontend for visualization.
    
    Request body should be a JSON object with an 'llm_output' key containing
    the LLM output in the expected format.
    """
    try:
        # Transform the LLM output to frontend format
        graph_data = GraphTransformer.transform_to_frontend_format(request.llm_output)
        return graph_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": f"Error processing LLM output: {str(e)}"}
        )

if __name__ == "__main__":
    print("Starting Graph Transformer API server...")
    print("Visit http://localhost:8000/docs for API documentation")
    uvicorn.run(app, host="0.0.0.0", port=8000)
