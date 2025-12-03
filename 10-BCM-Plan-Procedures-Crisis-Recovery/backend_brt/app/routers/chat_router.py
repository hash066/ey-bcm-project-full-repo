from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.middleware.auth import get_current_user
from app.services.groq_llm_service import GroqLLMService

router = APIRouter(
    prefix="/bcm/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    options: Dict[str, Any] = {}

llm_service = GroqLLMService()

@router.post("/")
async def chat_message(request: ChatRequest, current_user = Depends(get_current_user)):
    """
    Process a chat message using Groq LLM and return AI response
    """
    try:
        # Extract the last user message
        user_message = None
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        
        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Create a simple prompt for the LLM
        prompt = f"""
        You are a helpful AI assistant for Business Continuity Management (BCM) and Business Impact Analysis (BIA).
        The user asked: {user_message}
        
        Provide a helpful, professional response related to BCM, BIA, procedures, recovery strategies, or general business resilience topics.
        Keep responses concise and actionable.
        """
        
        # Use the Groq service to generate response
        messages_for_llm = [
            {"role": "system", "content": "You are a business continuity expert providing helpful guidance on BCM and BIA topics."},
            {"role": "user", "content": prompt}
        ]
        
        max_tokens = request.options.get("max_tokens", 300)
        temperature = request.options.get("temperature", 0.7)
        
        response_data = await llm_service._make_request(
            messages_for_llm,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        ai_response = response_data.get("content", "I'm sorry, I couldn't generate a response at this time.")
        
        return {
            "response": ai_response,
            "messages": request.messages + [{"role": "assistant", "content": ai_response}]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")