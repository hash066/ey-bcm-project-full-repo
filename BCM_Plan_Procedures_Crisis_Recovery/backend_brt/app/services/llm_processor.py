"""
Utility functions for processing LLM output and mapping to MongoDB schemas.
"""
import json
import re
from typing import Dict, Any, Optional, List
from app.schemas.process_mapping import (
    ProcessMappingModule,
    BasicInfo,
    DepartmentHeadContact,
    BCMCoordinatorContact,
    ProcessMapping,
    ProcessOwnerDetails,
    ThirdPartyDependencies
)
from app.schemas.llm_process_mapping import LLMProcessMapping, LLMProcessMappingRequest

def extract_json_from_text(text: str) -> Dict[str, Any]:
    """
    Extract JSON from text that might contain markdown code blocks.
    
    Args:
        text: Text containing JSON, possibly within markdown code blocks
        
    Returns:
        Dict containing the parsed JSON
    """
    # Try to extract JSON from markdown code blocks
    json_pattern = r"```(?:json)?\s*([\s\S]*?)```"
    match = re.search(json_pattern, text)
    
    if match:
        json_str = match.group(1).strip()
    else:
        # If no code blocks, assume the entire text might be JSON
        json_str = text.strip()
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from text: {e}")

def process_llm_chunks(request: LLMProcessMappingRequest) -> Dict[str, Any]:
    """
    Process LLM chunks and combine their JSON outputs.
    
    Args:
        request: LLM chunks containing process mapping data
        
    Returns:
        Combined JSON data from all chunks
    """
    combined_data = {}
    
    # Process each chunk if it exists
    chunks = [
        request.chunk_1,
        request.chunk_2,
        request.chunk_3,
        request.chunk_4,
        request.chunk_5
    ]
    
    for chunk in chunks:
        if not chunk:
            continue
            
        # Extract JSON from the text
        try:
            chunk_data = extract_json_from_text(chunk.text)
            
            # Merge with combined data
            # For lists, we extend rather than replace
            for key, value in chunk_data.items():
                if key in combined_data and isinstance(value, list) and isinstance(combined_data[key], list):
                    # For lists like steps, inputs, outputs, etc., combine them
                    # Use a set to avoid duplicates for simple lists
                    if key in ["inputs", "outputs", "associated_teams"]:
                        combined_data[key] = list(set(combined_data[key] + value))
                    else:
                        # For complex objects like steps, we need to check for duplicates manually
                        if key == "steps":
                            existing_actions = {step.get("action") for step in combined_data[key] if step.get("action")}
                            for step in value:
                                if step.get("action") not in existing_actions:
                                    combined_data[key].append(step)
                                    if step.get("action"):
                                        existing_actions.add(step.get("action"))
                        else:
                            combined_data[key].extend(value)
                else:
                    # For scalar values, prefer non-null values
                    if key not in combined_data or combined_data[key] is None:
                        combined_data[key] = value
        except Exception as e:
            print(f"Error processing chunk: {e}")
            continue
    
    return combined_data

def map_llm_to_process_mapping(llm_data: Dict[str, Any], slno: str = "1") -> ProcessMappingModule:
    """
    Map LLM process mapping data to our ProcessMappingModule schema.
    
    Args:
        llm_data: Processed LLM data
        slno: Serial number for the process
        
    Returns:
        ProcessMappingModule instance
    """
    # Extract department name from associated teams or use a default
    department_name = "Unknown Department"
    if llm_data.get("associated_teams") and len(llm_data["associated_teams"]) > 0:
        department_name = llm_data["associated_teams"][0]
    
    # Extract sub-department if there are multiple teams
    sub_dept_name = None
    if llm_data.get("associated_teams") and len(llm_data["associated_teams"]) > 1:
        sub_dept_name = llm_data["associated_teams"][1]
    
    # Find process owner from steps if available
    process_owner_name = "Unknown"
    process_owner_contact = "N/A"
    process_owner_email = "unknown@example.com"
    
    if llm_data.get("steps"):
        # Look for steps with manager or owner in the role
        for step in llm_data["steps"]:
            role = step.get("responsible_role", "").lower()
            if "manager" in role or "owner" in role or "head" in role:
                process_owner_name = step.get("responsible_role", process_owner_name)
                break
    
    # Create the ProcessMappingModule instance
    return ProcessMappingModule(
        basic_info=BasicInfo(
            slno=slno,
            department_name=department_name,
            sub_dept_name=sub_dept_name
        ),
        department_head_contact=DepartmentHeadContact(
            dept_head_name=process_owner_name,
            dept_head_phone=process_owner_contact,
            dept_head_email=process_owner_email
        ),
        bcm_coordinator_contact=BCMCoordinatorContact(
            bcm_cord_name="BCM Coordinator",
            bcm_cord_phone="N/A",
            bcm_cord_email="bcm@example.com"
        ),
        process_mapping=ProcessMapping(
            process_name=llm_data.get("process_name", "Unknown Process"),
            process_description=llm_data.get("description", "No description provided"),
            sub_process_name=None
        ),
        process_owner_details=ProcessOwnerDetails(
            process_owner_name=process_owner_name,
            process_owner_contact=process_owner_contact,
            process_owner_email=process_owner_email
        ),
        third_party_dependencies=ThirdPartyDependencies(
            vendor_info=", ".join(llm_data.get("associated_teams", [])) if llm_data.get("associated_teams") else None,
            sop_name=llm_data.get("process_name", "Unknown Process") + " SOP",
            service_name=llm_data.get("process_name", "Unknown Process") + " Service"
        )
    )
