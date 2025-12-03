"""
Service for transforming LLM output into frontend graph format.
"""
import json
import math
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

class GraphTransformer:
    """Transforms LLM output into frontend graph format."""
    
    @staticmethod
    def _generate_id(prefix: str = "") -> str:
        """Generate a unique ID with optional prefix."""
        return f"{prefix}_{uuid.uuid4().hex[:8]}" if prefix else uuid.uuid4().hex[:8]
    
    @staticmethod
    def _extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON object from text that might contain markdown code blocks."""
        # Try to find JSON in markdown code blocks first
        code_blocks = re.findall(r'```(?:json\n)?(.*?)```', text, re.DOTALL)
        if code_blocks:
            try:
                return json.loads(code_blocks[0].strip())
            except json.JSONDecodeError:
                pass
        
        # If no code blocks found or failed to parse, try to find JSON directly
        try:
            # Look for JSON-like structures in the text
            json_str = re.search(r'\{[\s\S]*\}', text)
            if json_str:
                return json.loads(json_str.group(0))
        except json.JSONDecodeError:
            pass
            
        return None
    
    @classmethod
    def _process_llm_response(cls, llm_response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process LLM response and extract processes."""
        processes = []
        
        # If the response is already in the expected format, return it
        if isinstance(llm_response, dict) and 'process_name' in llm_response:
            return [llm_response]
            
        # Handle the case where the response is a dictionary with chunk keys
        if isinstance(llm_response, dict):
            for chunk_key, chunk_data in llm_response.items():
                try:
                    # If the chunk data is already a process, add it directly
                    if isinstance(chunk_data, dict) and 'process_name' in chunk_data:
                        processes.append(chunk_data)
                        continue
                        
                    # If there's a 'text' field, try to extract JSON from it
                    if isinstance(chunk_data, dict) and 'text' in chunk_data:
                        process_data = cls._extract_json_from_text(chunk_data['text'])
                        if process_data and 'process_name' in process_data:
                            processes.append(process_data)
                except Exception as e:
                    print(f"Error processing chunk {chunk_key}: {e}")
                    continue
                    
        return processes
    
    @classmethod
    def _extract_organization_info(cls, processes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extract organization information from processes.
        
        Args:
            processes: List of process dictionaries
            
        Returns:
            Dictionary with organization information including name, departments, and teams
        """
        # Default values
        org_info = {
            "name": "Organization",  # Will be updated if found in processes
            "departments": set(),
            "teams": set(),
            "process_count": 0,
            "step_count": 0
        }
        
        # Extract information from each process
        for process in processes:
            if not isinstance(process, dict):
                continue
                
            org_info['process_count'] += 1
            
            # Update organization name if found
            if 'organization' in process:
                org_info['name'] = process['organization']
            
            # Extract department/team from process
            if 'department' in process and process['department']:
                if isinstance(process['department'], str):
                    org_info['departments'].add(process['department'])
                elif isinstance(process['department'], (list, tuple)):
                    org_info['departments'].update(d for d in process['department'] if isinstance(d, str))
            
            # Extract associated teams
            if 'associated_teams' in process and isinstance(process['associated_teams'], (list, tuple)):
                org_info['teams'].update(t for t in process['associated_teams'] if isinstance(t, str))
            
            # Extract from steps if available
            steps = process.get('steps', [])
            if isinstance(steps, (list, tuple)):
                for step in steps:
                    if not isinstance(step, dict):
                        continue
                        
                    org_info['step_count'] += 1
                    
                    # Extract responsible role as a team
                    if 'responsible_role' in step and step['responsible_role']:
                        org_info['teams'].add(step['responsible_role'])
                    
                    # Extract department from step if available
                    if 'department' in step and step['department']:
                        if isinstance(step['department'], str):
                            org_info['departments'].add(step['department'])
                        elif isinstance(step['department'], (list, tuple)):
                            org_info['departments'].update(d for d in step['department'] if isinstance(d, str))
        
        # Convert sets to lists for JSON serialization
        org_info['departments'] = list(org_info['departments'])
        org_info['teams'] = list(org_info['teams'])
        
        # If no departments found but we have teams, use teams as departments
        if not org_info['departments'] and org_info['teams']:
            org_info['departments'] = org_info['teams'].copy()
        
        # If still no departments, use a default
        if not org_info['departments']:
            org_info['departments'] = ["Operations"]
        
        return org_info

    @classmethod
    def _categorize_process(cls, process: Dict[str, Any]) -> str:
        """
        Categorize a process into a department/team based on its content.
        
        Args:
            process: Process dictionary
            
        Returns:
            Category name (e.g., 'HR', 'IT', 'Finance')
        """
        if not isinstance(process, dict):
            return "Other"
            
        # Check for explicit department/team
        if 'department' in process:
            return process['department']
            
        if 'associated_teams' in process and isinstance(process['associated_teams'], list):
            return process['associated_teams'][0]
            
        # Infer from process name and description
        process_str = str(process).lower()
        
        # Define category patterns
        categories = {
            'HR': ['hr', 'human resource', 'hiring', 'onboarding', 'recruitment', 'employee', 'staff'],
            'IT': ['it', 'technical', 'software', 'system', 'network', 'infrastructure', 'tech'],
            'Finance': ['finance', 'accounting', 'billing', 'invoice', 'payment', 'tax', 'revenue'],
            'Operations': ['operation', 'logistics', 'supply chain', 'manufacturing', 'production'],
            'Customer Service': ['customer', 'support', 'service', 'client', 'helpdesk'],
            'Sales': ['sale', 'business development', 'bd', 'account manager'],
            'Marketing': ['marketing', 'advertis', 'campaign', 'brand', 'social media']
        }
        
        # Find matching category
        for category, keywords in categories.items():
            if any(keyword in process_str for keyword in keywords):
                return category
                
        return "Other"

    @classmethod
    def _create_process_nodes(cls, processes: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Create nodes and edges for processes dynamically based on LLM output.
        
        Args:
            processes: List of process dictionaries from the LLM output
            
        Returns:
            Tuple of (nodes, edges) for the frontend graph
        """
        if not processes:
            return [], []
            
        nodes = []
        edges = []
        
        # Extract organization information
        org_info = cls._extract_organization_info(processes)
        org_name = org_info['name']
        
        # Create organization node
        org_node = {
            "id": "org",
            "type": "custom",
            "position": {"x": 400, "y": 20},
            "data": {"label": org_name, "bgColor": "#34495e"},
            "sourcePosition": "bottom"
        }
        nodes.append(org_node)
        
        # Categorize processes
        categories = {}
        for process in processes:
            if not isinstance(process, dict):
                continue
                
            category = cls._categorize_process(process)
            if category not in categories:
                categories[category] = []
            categories[category].append(process)
        
        # Create service/department nodes
        service_nodes = []
        num_services = max(1, len(categories))  # At least 1 service
        angle_step = 360 / num_services
        radius = 200
        center_x, center_y = 400, 150  # Center position for services
        
        for i, (category, cat_processes) in enumerate(categories.items()):
            # Calculate position in a circle
            angle = math.radians(i * angle_step)
            x = center_x + radius * math.cos(angle)
            y = center_y + radius * math.sin(angle)
            
            service_id = f"service_{category.lower().replace(' ', '_')}"
            service_node = {
                "id": service_id,
                "type": "custom",
                "position": {"x": x, "y": y},
                "data": {"label": f"{category} Department", "bgColor": "#2980b9"},
                "sourcePosition": "bottom",
                "targetPosition": "top"
            }
            nodes.append(service_node)
            service_nodes.append({"id": service_id, "category": category, "processes": cat_processes})
            
            # Connect service to organization
            edges.append({
                "id": f"e-org-{service_id}",
                "source": "org",
                "target": service_id,
                "animated": True,
                "style": {"stroke": "#2980b9"}
            })
        
        # Create process nodes under each service
        process_y = 300  # Starting Y position for processes
        process_x_step = 250  # Horizontal spacing between processes
        step_y_offset = 100  # Vertical offset for steps under processes
        
        for service in service_nodes:
            service_id = service['id']
            processes = service['processes']
            
            # Calculate starting x position to center processes under service
            start_x = 400 - ((len(processes) - 1) * process_x_step) / 2
            
            for i, process in enumerate(processes):
                if not isinstance(process, dict):
                    continue
                    
                process_id = f"process_{i}_{service_id}"
                process_name = process.get('process_name', f"Process {i+1}")
                process_desc = process.get('description', '')
                
                # Create process node
                process_node = {
                    "id": process_id,
                    "type": "custom",
                    "position": {"x": start_x + i * process_x_step, "y": process_y},
                    "data": {
                        "label": process_name,
                        "description": process_desc,
                        "bgColor": "#16a085"
                    },
                    "targetPosition": "top"
                }
                nodes.append(process_node)
                
                # Connect process to service
                edges.append({
                    "id": f"e-{service_id}-{process_id}",
                    "source": service_id,
                    "target": process_id,
                    "style": {"stroke": "#16a085"}
                })
                
                # Add steps as sub-processes
                steps = process.get('steps', [])
                if isinstance(steps, list):
                    for j, step in enumerate(steps, 1):
                        if not isinstance(step, dict):
                            continue
                            
                        step_id = f"step_{i}_{j}_{process_id}"
                        step_action = step.get('action', f'Step {j}')
                        step_role = step.get('responsible_role', '')
                        
                        # Create step node
                        step_node = {
                            "id": step_id,
                            "type": "custom",
                            "position": {
                                "x": start_x + i * process_x_step + ((j-1) * 50) - 50,  # Offset steps slightly
                                "y": process_y + step_y_offset
                            },
                            "data": {
                                "label": f"{j}. {step_action}",
                                "role": step_role,
                                "bgColor": "#8e44ad"
                            },
                            "targetPosition": "top"
                        }
                        nodes.append(step_node)
                        
                        # Connect step to process
                        edges.append({
                            "id": f"e-{process_id}-{step_id}",
                            "source": process_id,
                            "target": step_id,
                            "style": {"stroke": "#8e44ad"}
                        })
        
        return nodes, edges
            
    @classmethod
    def transform_to_frontend_format(cls, llm_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform LLM response to frontend graph format.
        
        Args:
            llm_response: Raw LLM response in the provided format
            
        Returns:
            Dictionary with 'nodes' and 'edges' for the frontend
        """
        try:
            # Process the LLM response to extract structured data
            processes = cls._process_llm_response(llm_response)
            
            if not processes:
                return {
                    "nodes": [
                        {
                            "id": "no-data",
                            "type": "custom",
                            "position": {"x": 100, "y": 100},
                            "data": {"label": "No process data found in the document", "bgColor": "#e74c3c"}
                        }
                    ],
                    "edges": []
                }
            
            # Create graph nodes and edges
            nodes, edges = cls._create_process_nodes(processes)
            
            # Return the graph structure
            return {
                "nodes": nodes,
                "edges": edges
            }
            
        except json.JSONDecodeError:
            return {
                "nodes": [
                    {
                        "id": "json-error",
                        "type": "custom",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Failed to parse LLM response as JSON", "bgColor": "#e74c3c"}
                    }
                ],
                "edges": []
            }
            
        except Exception as e:
            import traceback
            print(f"Error in transform_to_frontend_format: {str(e)}")
            print(traceback.format_exc())
            
            return {
                "nodes": [
                    {
                        "id": "error",
                        "type": "custom",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Error processing document. Please check the logs.", "bgColor": "#e74c3c"}
                    }
                ],
                "edges": []
            }
