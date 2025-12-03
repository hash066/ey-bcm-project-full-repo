"""
LLM utility functions.
"""
import json
from typing import Dict, Any, List

def extract_json_from_llm_output(text: str) -> Dict[str, Any]:
    """
    Extract JSON from LLM output text.
    
    Args:
        text: LLM output text that may contain JSON within markdown code blocks
        
    Returns:
        Dict: Extracted JSON data or empty dict if no valid JSON found
    """
    # Look for JSON in markdown code blocks
    if "```" in text:
        # Extract content between code blocks
        parts = text.split("```")
        for i in range(1, len(parts), 2):
            # Skip the language identifier if present
            content = parts[i]
            if content.startswith("json\n"):
                content = content[5:]
            elif content.startswith("json"):
                content = content[4:]
            
            # Try to parse as JSON
            try:
                return json.loads(content.strip())
            except json.JSONDecodeError:
                continue
    
    # If no code blocks or no valid JSON in code blocks,
    # try to parse the entire text as JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    
    # Return empty dict if no valid JSON found
    return {}
