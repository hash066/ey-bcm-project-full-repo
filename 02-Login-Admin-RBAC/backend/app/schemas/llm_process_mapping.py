"""
Schema definitions for LLM Process Mapping output.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProcessStep(BaseModel):
    """Schema for a single process step from LLM output"""
    step_number: Optional[int] = None
    action: str
    responsible_role: str

class LLMProcessMapping(BaseModel):
    """Schema for the LLM process mapping output"""
    process_name: str
    description: Optional[str] = None
    trigger_condition: Optional[str] = None
    steps: List[ProcessStep]
    inputs: List[str] = []
    outputs: List[str] = []
    frequency: Optional[str] = None
    associated_teams: List[str] = []

class LLMChunkOutput(BaseModel):
    """Schema for a single chunk of LLM output"""
    input_text: str
    text: str

class LLMProcessMappingRequest(BaseModel):
    """Schema for the LLM process mapping request containing multiple chunks"""
    chunk_1: Optional[LLMChunkOutput] = None
    chunk_2: Optional[LLMChunkOutput] = None
    chunk_3: Optional[LLMChunkOutput] = None
    chunk_4: Optional[LLMChunkOutput] = None
    chunk_5: Optional[LLMChunkOutput] = None
