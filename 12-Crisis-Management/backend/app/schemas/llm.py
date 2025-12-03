from typing import Dict, List, Optional, Any
from pydantic import BaseModel

class LLMProcessStep(BaseModel):
    step_number: Optional[int]
    action: str
    responsible_role: str

class LLMProcessChunk(BaseModel):
    process_name: str
    description: Optional[str]
    trigger_condition: Optional[str]
    steps: List[LLMProcessStep]
    inputs: List[str]
    outputs: List[str]
    frequency: Optional[str]
    associated_teams: List[str]

class LLMResponse(BaseModel):
    """Schema for the LLM response"""
    chunks: Dict[str, Dict[str, Any]]
    
class FrontendNode(BaseModel):
    """Schema for frontend nodes"""
    id: str
    type: str = "custom"
    position: Dict[str, int]
    data: Dict[str, str]
    sourcePosition: Optional[str] = None
    targetPosition: Optional[str] = None

class FrontendEdge(BaseModel):
    """Schema for frontend edges"""
    id: str
    source: str
    target: str
    animated: Optional[bool] = False
    style: Optional[Dict[str, str]] = None

class FrontendGraph(BaseModel):
    """Schema for the complete frontend graph"""
    nodes: List[FrontendNode]
    edges: List[FrontendEdge]
