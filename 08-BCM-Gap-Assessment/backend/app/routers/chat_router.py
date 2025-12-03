"""
Chat Router - Handles chat functionality using external AI APIs.
Migrated to Supabase: No database operations required (uses external Gemini API only).
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
# import google.generativeai as genai  # Disabled - not installed
import os
import json
from typing import Optional
from app.core.config import settings

router = APIRouter()

# Pydantic models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    type: str  # "route" or "gemini"
    response: str
    link: Optional[str] = None
    description: Optional[str] = None

# Configure Gemini
try:
    import google.generativeai as genai
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
    else:
        model = None
except ImportError:
    print("google.generativeai not installed, Gemini features disabled")
    model = None

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint that handles user queries.
    First tries to match routes, then falls back to Gemini API.
    """
    try:
        user_message = request.message.lower().strip()

        # For now, return a simple response structure
        # In the frontend, we'll handle route matching with Fuse.js
        # So this endpoint primarily handles Gemini API calls

        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        if not model:
            return ChatResponse(
                type="gemini",
                response="Gemini API key is not configured. Please set GEMINI_API_KEY in the environment variables."
            )

        # Call Gemini API for general responses
        response = model.generate_content(
            f"You are a helpful assistant for a Business Impact Analysis (BIA) web application. "
            f"Answer the following question concisely and professionally: {user_message}"
        )

        gemini_response = response.text if response.text else "I'm sorry, I couldn't generate a response."

        return ChatResponse(
            type="gemini",
            response=gemini_response
        )

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
