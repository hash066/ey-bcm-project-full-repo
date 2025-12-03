import os
import pdfplumber
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from groq import Groq
import json
import re
import demjson3
import shutil
from typing import Dict, Any, List

from app.core.config import settings

# Create router instead of app
router = APIRouter(
    prefix="/process-service-mapping",
    tags=["Process Service Mapping"],
    responses={404: {"description": "Not found"}},
)

# Check if GROQ_API_KEY is available
if not settings.GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not set in environment or .env file")
    groq_client = None
else:
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Groq client: {e}")
        groq_client = None

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

def extract_text_from_pdf(file_path: str) -> str:
    with pdfplumber.open(file_path) as pdf:
        return "\n\n".join(page.extract_text() or "" for page in pdf.pages)

def call_groq_llm(prompt: str, temperature: float = 0.1) -> str:
    if groq_client is None:
        raise HTTPException(status_code=500, detail="Groq API key not configured or client failed to initialize")

    chat = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=8000
    )
    return chat.choices[0].message.content.strip()

def extract_json_from_response(response: str):
    import re, json
    
    # Try to extract JSON from markdown or plain text, handling both objects and arrays
    match = re.search(r'```(?:json)?\s*(\[.*\]|\{.*\})\s*```', response, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # Fallback for non-markdown responses - find the largest JSON-like structure
        matches = list(re.finditer(r'(\[.*\]|\{.*\})', response, re.DOTALL))
        if matches:
            # Find the longest match as it's likely the complete JSON
            json_str = max(matches, key=lambda m: len(m.group(1))).group(1)
        else:
            json_str = response

    json_str = json_str.strip()
    
    # Enhanced JSON string cleanup
    # Remove trailing commas before closing braces/brackets (JSON syntax error)
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # Remove comments that might be included in the LLM response
    json_str = re.sub(r'//.*?\n|/\*.*?\*/', '', json_str, flags=re.DOTALL)
    
    # Fix common issues with escaped quotes
    json_str = json_str.replace('\\"', '"').replace("\\'", "'")
    
    # Ensure we extract the complete JSON object/array
    first_char = next((c for c in json_str if c in '[{'), None)
    if first_char == '[':
        last_char = ']'
    elif first_char == '{':
        last_char = '}'
    else:
        last_char = None

    if first_char and last_char:
        start = json_str.find(first_char)
        end = json_str.rfind(last_char)
        if start != -1 and end != -1 and end > start:
            json_str = json_str[start:end+1]
    
    print("LLM FULL RESPONSE:\n", response)
    print("LLM JSON string to parse:\n", json_str)

    if not json_str or first_char is None:
        raise ValueError("No valid JSON found in LLM response. Raw response: " + repr(response))

    # Progressive parsing approach with better error handling
    try:
        # First try standard JSON parsing
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Standard JSONDecodeError at position {e.pos}: {e.msg}")
        try:
            # Try fixing unquoted keys (a common LLM error)
            fixed_json = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
            return json.loads(fixed_json)
        except Exception:
            # If that didn't work, try demjson3 which is more forgiving
            print("Trying demjson3 for more lenient parsing...")
            try:
                return demjson3.decode(json_str)
            except Exception as e2:
                print("demjson3 also failed:", e2)
                print("Problematic JSON string:\n", json_str)
                
                # Last resort: try to fix the most common JSON issues
                try:
                    # Replace single quotes with double quotes (another common LLM error)
                    fixed_json = json_str.replace("'", '"')
                    # Fix missing quotes around property names
                    fixed_json = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', fixed_json)
                    return json.loads(fixed_json)
                except Exception:
                    raise ValueError(f"Failed to parse JSON after multiple attempts. Original error: {e2}")

def normalize_structure_json(data):
    """Normalize and enhance structure JSON for better visualization"""
    # Ensure top-level keys
    if "nodes" not in data:
        data["nodes"] = []
    if "edges" not in data:
        data["edges"] = []

    # Create node map for edge enhancement
    node_map = {node.get('id'): node for node in data["nodes"] if 'id' in node}

    # Normalize and enhance nodes
    for node in data["nodes"]:
        # Ensure required properties exist
        node.setdefault("type", "custom")
        node.setdefault("position", {"x": 0, "y": 0})
        node.setdefault("role_level", "")
        node.setdefault("data", {})
        node.setdefault("sourcePosition", "bottom")
        node.setdefault("targetPosition", "top")
        
        # Fill in missing data fields
        node["data"].setdefault("label", "")
        node["data"].setdefault("role", "")
        node["data"].setdefault("notes", "")
        node["data"].setdefault("head", {"name": "", "email": "", "contact": ""})
        
        # Add consistent styling based on node type if not already defined
        if "style" not in node:
            # Determine node type from role_level or data.role
            node_type = node.get("role_level", "").upper()
            if not node_type and "role" in node["data"]:
                node_type = node["data"]["role"].upper()
                
            # Apply styling based on node type
            if "CEO" in node_type or "CHIEF" in node_type or "SERVICE" in node_type:
                # Top-level nodes
                node["style"] = {
                    "background": "#3498db",
                    "color": "#ffffff",
                    "border": "2px solid #2980b9",
                    "width": 200,
                    "borderRadius": "5px",
                    "padding": "10px",
                    "fontWeight": "bold"
                }
            elif "MANAGER" in node_type or "HEAD" in node_type or "DIRECTOR" in node_type or "PROCESS" in node_type:
                # Mid-level nodes
                node["style"] = {
                    "background": "#2ecc71",
                    "color": "#ffffff",
                    "border": "2px solid #27ae60",
                    "width": 200,
                    "borderRadius": "5px",
                    "padding": "8px"
                }
            else:
                # Lower-level nodes
                node["style"] = {
                    "background": "#f1c40f",
                    "color": "#000000",
                    "border": "2px solid #f39c12",
                    "width": 180,
                    "borderRadius": "5px",
                    "padding": "6px"
                }

    # Normalize and enhance edges for better visualization
    for i, edge in enumerate(data["edges"]):
        # Ensure the edge has both a source and a target before adding it
        if edge.get('source') and edge.get('target'):
            # Determine edge style based on node types
            source_id = edge.get('source')
            target_id = edge.get('target')
            edge_style = {
                "stroke": "#3498db",  # Default blue color
                "strokeWidth": 2
            }
            
            # If we have source and target info, enhance edge styling based on node relationship
            if source_id in node_map and target_id in node_map:
                source_level = node_map[source_id].get("role_level", "").upper()
                target_level = node_map[target_id].get("role_level", "").upper()
                
                # Detect if this is a service map or org chart
                is_service_map = "SERVICE" in source_level or "SERVICE" in target_level or \
                                "PROCESS" in source_level or "PROCESS" in target_level or \
                                "SUB_PROCESS" in source_level or "SUB_PROCESS" in target_level
                
                if is_service_map:
                    # For service maps
                    if "SERVICE" in source_level and "PROCESS" in target_level:
                        # Service to Process connection
                        edge_style = {
                            "stroke": "#3498db",
                            "strokeWidth": 3,
                            "animated": True
                        }
                    elif "PROCESS" in source_level and "SUB_PROCESS" in target_level:
                        # Process to Sub-process connection
                        edge_style = {
                            "stroke": "#2ecc71", 
                            "strokeWidth": 2.5,
                            "animated": True
                        }
                    else:
                        # Other service map connections
                        edge_style = {
                            "stroke": "#9b59b6",
                            "strokeWidth": 2,
                            "strokeDasharray": "5,5",
                            "animated": True
                        }
                else:
                    # For organization charts
                    if ("CEO" in source_level or "CHIEF" in source_level) and \
                       ("MANAGER" in target_level or "HEAD" in target_level or "DIRECTOR" in target_level):
                        # C-level to Director/Head connection
                        edge_style = {
                            "stroke": "#3498db",
                            "strokeWidth": 3
                        }
                    elif ("DIRECTOR" in source_level or "HEAD" in source_level) and \
                         ("MANAGER" in target_level or not target_level):
                        # Director to Manager connection
                        edge_style = {
                            "stroke": "#2ecc71",
                            "strokeWidth": 2
                        }
                    else:
                        # Default org chart connection
                        edge_style = {
                            "stroke": "#95a5a6",
                            "strokeWidth": 1.5
                        }
        
        edge["style"] = edge_style

    return data

def consolidate_service_map_data(nodes_in, managers_in, edges_in):
    final_nodes = []
    # Create a mapping from service ID to manager name for quick lookup
    manager_map = {m.get('serviceId'): m.get('managerName') for m in managers_in if m.get('serviceId') and m.get('managerName')}
    
    # First, categorize nodes by type for better organization
    services = []
    processes = []
    sub_processes = []
    
    for node in nodes_in:
        node_id = node.get('id')
        if not node_id:
            continue  # Skip nodes that don't have an ID from the extraction step

        node_type = node.get('type', 'Unknown')
        if "Service" in node_type:
            services.append(node)
        elif "Process" in node_type:
            processes.append(node)
        else:
            sub_processes.append(node)
    
    # Process all nodes with improved styling and labeling
    for node in nodes_in:
        node_id = node.get('id')
        if not node_id:
            continue  # Skip nodes that don't have an ID from the extraction step

        node_type = node.get('type', 'Unknown')
        node_name = node.get('name', '')
        manager_name = manager_map.get(node_id, "")  # Use .get with default

        # Create clearer, more descriptive labels
        label = f"{node_type}: {node_name}"

        # Apply improved styling based on the node type for better visual hierarchy
        style = {}
        if "Service" in node_type:
            # Services are top-level entities - make them stand out
            style = {
                "background": "#3498db",  # Blue for services
                "color": "#ffffff",
                "border": "2px solid #2980b9",
                "width": 200,
                "borderRadius": "5px",
                "padding": "10px",
                "fontWeight": "bold"
            }
        elif "Process" in node_type:
            # Processes are mid-level entities
            style = {
                "background": "#2ecc71",  # Green for processes
                "color": "#ffffff",
                "border": "2px solid #27ae60",
                "width": 200,
                "borderRadius": "5px",
                "padding": "8px"
            }
        else:  # Sub-Process or other types
            # Sub-processes are lower level
            style = {
                "background": "#f1c40f",  # Yellow for sub-processes
                "color": "#000000",
                "border": "2px solid #f39c12",
                "width": 180,
                "borderRadius": "5px",
                "padding": "6px"
            }

        # Add node category to role_level for better hierarchy visualization
        role_level = ""
        if "Service" in node_type:
            role_level = "SERVICE"
        elif "Process" in node_type:
            role_level = "PROCESS"
        else:
            role_level = "SUB_PROCESS"

        # Create the final node with all improvements
        final_nodes.append({
            "id": node_id,
            "type": "custom",
            "position": {"x": 0, "y": 0},  # Placeholder, will be set by layout_nodes_manually
            "data": {
                "label": label,
                "role": node_type,  # Store the node type in the role field
                "notes": node.get("notes", ""),
                "head": {
                    "name": manager_name,
                    "email": "",
                    "contact": ""
                }
            },
            "sourcePosition": "bottom",
            "targetPosition": "top",
            "style": style,
            "role_level": role_level
        })

    # Improve edge styling to better show relationships in the hierarchy
    final_edges = []
    for i, edge in enumerate(edges_in):
        # Ensure the edge has both a source and a target before adding it
        if edge.get('source') and edge.get('target'):
            # Determine edge style based on node types
            source_id = edge.get('source')
            target_id = edge.get('target')
            
            # Enhanced edge styling for better visibility and hierarchy indication
            edge_style = {
                "stroke": "#3498db",  # Default blue color
                "strokeWidth": 2.5,   # Slightly thicker for better visibility
                "strokeDasharray": "5, 5",  # Dashed line style for clarity
                "animated": True
            }
            
            # For services to processes, use solid lines with different styling
            source_type = next((n.get('role_level', '') for n in nodes_in if n.get('id') == source_id), '')
            target_type = next((n.get('role_level', '') for n in nodes_in if n.get('id') == target_id), '')
            
            if source_type == "Service" and target_type == "Process":
                edge_style = {
                    "stroke": "#2980b9",
                    "strokeWidth": 3,
                    "animated": True
                }
            elif (source_type == "Process" and target_type == "Sub-Process") or \
                 (source_type == "Sub-Process" and target_type == "Process"):
                edge_style = {
                    "stroke": "#27ae60",
                    "strokeWidth": 2,
                    "animated": True
                }
            
            # Create the edge with improved styling
            final_edges.append({
                "id": f"e-{i+1}",
                "source": edge['source'],
                "target": edge['target'],
                "animated": True,
                "style": edge_style
            })

    return {"nodes": final_nodes, "edges": final_edges}


def layout_nodes_manually(nodes, edges):
    if not nodes:
        return

    node_map = {node['id']: node for node in nodes}
    children_of = {node['id']: [] for node in nodes}
    parents_of = {node['id']: [] for node in nodes}

    # Build the hierarchy relationships from edges
    for edge in edges:
        source_id = edge.get('source')
        target_id = edge.get('target')
        if source_id in node_map and target_id in node_map:
            # For both graphs, the 'target' is the parent of the 'source'.
            # Org chart: 'source' reports to 'target'.
            # Service map: 'source' depends on 'target'.
            children_of[target_id].append(source_id)
            parents_of[source_id].append(target_id)

    # Find root nodes (those with no parents)
    root_nodes = [node_id for node_id, parent_list in parents_of.items() if not parent_list]
    
    # Fallback if no clear root is found (e.g., cyclical graph or all nodes have parents)
    if not root_nodes:
        # Try to identify nodes that act as parents but not children (typical root behavior)
        all_children = set(c for child_list in children_of.values() for c in child_list)
        potential_roots = set(node_map.keys()) - all_children
        
        # If we found potential roots, use them
        if potential_roots:
            root_nodes = list(potential_roots)
        else:
            # Fallback: Use nodes with the most children as roots
            most_children = max([(node_id, len(children)) for node_id, children in children_of.items()], 
                              key=lambda x: x[1], default=(nodes[0]['id'] if nodes else None, 0))
            root_nodes = [most_children[0]] if most_children[0] else ([nodes[0]['id']] if nodes else [])

    # Use BFS to determine levels for hierarchical layout
    visited = set()
    queue = [(root_id, 0) for root_id in root_nodes]
    levels = {}
    max_level = 0

    # BFS to determine levels and ensure proper parent-child hierarchy
    while queue:
        node_id, level = queue.pop(0)
        if node_id in visited:
            continue
        visited.add(node_id)
        max_level = max(max_level, level)

        if level not in levels:
            levels[level] = []
        levels[level].append(node_id)

        # Process children in order to maintain hierarchical tree structure
        for child_id in children_of.get(node_id, []):
            if child_id not in visited:
                queue.append((child_id, level + 1))
    
    # Handle any disconnected nodes or subgraphs by adding them at the bottom
    unvisited_nodes = set(node_map.keys()) - visited
    if unvisited_nodes:
        level = max_level + 1
        if level not in levels:
            levels[level] = []
        levels[level].extend(list(unvisited_nodes))

    # Calculate optimal spacing based on the number of nodes
    # Adjust spacing for better visualization
    y_spacing = 180  # Increased vertical spacing between levels for better readability
    x_spacing = 300  # Increased horizontal spacing between sibling nodes
    canvas_center_x = 800
    
    # Check if this is a service map by looking at role_level of nodes
    # Service maps typically have SERVICE, PROCESS, SUB_PROCESS role levels
    is_service_map = False
    for node in nodes:
        role_level = node.get('role_level', '').upper()
        if role_level in ['SERVICE', 'PROCESS', 'SUB_PROCESS']:
            is_service_map = True
            break
    
    # Sort nodes within each level based on their connections to create a more organized tree
    for level in range(1, max_level + 1):
        if level in levels and level - 1 in levels:
            # Sort the current level's nodes based on their parents' positions
            sorted_nodes = []
            for parent_id in levels[level - 1]:
                for child_id in children_of.get(parent_id, []):
                    if child_id in levels[level] and child_id not in sorted_nodes:
                        sorted_nodes.append(child_id)
            
            # Add any remaining nodes that weren't matched to parents
            for node_id in levels[level]:
                if node_id not in sorted_nodes:
                    sorted_nodes.append(node_id)
            
            # Update the level with sorted nodes
            levels[level] = sorted_nodes

    # For service maps, we need to invert the tree structure (parent at bottom, children at top)
    if is_service_map:
        # Reverse the level numbers - highest level becomes level 0, etc.
        reversed_levels = {}
        for level, nodes_in_level in levels.items():
            reversed_levels[max_level - level] = nodes_in_level
        levels = reversed_levels

    # Assign positions based on levels with optimized spacing
    for level, nodes_in_level in levels.items():
        y_pos = 50 + level * y_spacing
        num_nodes = len(nodes_in_level)
        
        # Calculate width needed for this level
        level_width = (num_nodes - 1) * x_spacing
        start_x = canvas_center_x - (level_width / 2)

        # Position nodes in this level
        for i, node_id in enumerate(nodes_in_level):
            if node_id in node_map:
                node_map[node_id]['position'] = {'x': start_x + (i * x_spacing), 'y': y_pos}
                
                # For service maps, flip the source and target positions since we're inverting the tree
                if is_service_map:
                    node_map[node_id]['sourcePosition'] = 'top'
                    node_map[node_id]['targetPosition'] = 'bottom'


@router.post("/parse-pdf/")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    temp_path = None
    try:
        temp_path = os.path.join(UPLOADS_DIR, file.filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)  # Ensure directory exists
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        text = extract_text_from_pdf(temp_path)

        # --- Part 1: Generate Organizational Hierarchy Chart ---
        print("--- STARTING ORGANIZATIONAL HIERARCHY PARSING ---")
        org_node_prompt = f"""
        You are an expert at identifying organizational roles from a document.
        Analyze the following text and extract every person and their role.
        For each person, create a JSON object with:
        - "id": A unique identifier in camelCase (e.g., "johnSmith").
        - "role": The person's job title (e.g., "Chief Executive Officer").
        - "name": The person's full name (e.g., "John Smith").
        - "notes": Any additional details about their responsibilities.
        Output ONLY a JSON array of these objects.
        TEXT:
        {text}
        """
        print("--- PROMPT 1.1: EXTRACTING ROLE NODES ---")
        org_node_response = call_groq_llm(org_node_prompt, temperature=0.0)
        extracted_org_nodes = extract_json_from_response(org_node_response)
        print(f"--- STEP 1.1 COMPLETE: Found {len(extracted_org_nodes)} potential role nodes ---")

        org_edge_prompt = f"""
        You are an expert at understanding reporting structures.
        Based on the text and the list of roles below, identify all reporting relationships.
        For each relationship, create a JSON object with "source" and "target", where the 'source' reports to the 'target'.
        Use the exact 'id' from the provided JSON list.
        Output ONLY a JSON array of these edge objects.
        TEXT:
        {text}
        ROLES:
        {json.dumps(extracted_org_nodes, indent=2)}
        """
        print("--- PROMPT 1.2: EXTRACTING ROLE EDGES ---")
        org_edge_response = call_groq_llm(org_edge_prompt, temperature=0.0)
        extracted_org_edges = extract_json_from_response(org_edge_response)
        print(f"--- STEP 1.2 COMPLETE: Found {len(extracted_org_edges)} potential edges ---")

        final_org_prompt = f"""
        You are an expert at creating data for visualizations.
        Your task is to combine the provided nodes and edges into a single, clean JSON object suitable for a flowchart library.
        - Create a 'nodes' array and an 'edges' array.
        - For each node from the input, add the required fields: "type": "custom", "position", "role_level", "data", "sourcePosition", "targetPosition".
        - Assign x/y positions to create a clear, top-down tree structure.
        - The root node (e.g., CEO) should be at the top center (e.g., x: 600, y: 50).
        - Each subsequent level of the hierarchy should be placed further down (increase y by at least 150 for each level).
        - Spread out nodes on the same level horizontally to avoid overlap (adjust x position).
        - Populate the 'data' object correctly, creating a 'label' like "Role: Name".
        - For each edge, ensure it has an "id", "animated": true, and a "style" object.
        Use this exact output structure:
        {{
          "nodes": [
            {{
              "id": "ceo", "type": "custom", "position": {{ "x": 400, "y": 50 }}, "role_level": "CEO",
              "data": {{ "label": "CEO: John Smith", "role": "Chief Executive Officer", "notes": "...", "head": {{ "name": "John Smith", "email": "...", "contact": "..." }} }},
              "sourcePosition": "bottom", "targetPosition": "top"
            }}
          ],
          "edges": [
            {{ "id": "e-ceo-reportee", "source": "reporteeId", "target": "ceoId", "animated": true, "style": {{ "stroke": "#3498db", "strokeWidth": 2 }} }}
          ]
        }}
        INPUT NODES:
        {json.dumps(extracted_org_nodes, indent=2)}
        INPUT EDGES:
        {json.dumps(extracted_org_edges, indent=2)}
        Generate the complete, final JSON object. Output only the JSON.
        """
        print("--- PROMPT 1.3: GENERATING FINAL ORG STRUCTURE ---")
        final_org_response = call_groq_llm(final_org_prompt, temperature=0.2)
        final_org_data = extract_json_from_response(final_org_response)
        
        print("--- STEP 1.4: Applying manual layout to Org Chart ---")
        layout_nodes_manually(final_org_data.get('nodes', []), final_org_data.get('edges', []))
        final_org_data = normalize_structure_json(final_org_data)
        
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
        os.makedirs(output_dir, exist_ok=True)  # Ensure directory exists
        output_org_path = os.path.join(output_dir, 'structure.json')
        with open(output_org_path, 'w', encoding='utf-8') as f:
            json.dump(final_org_data, f, indent=2, ensure_ascii=False)
        print(f"--- ORGANIZATIONAL HIERARCHY COMPLETE --- Saved to {output_org_path}")


        # --- Part 2: Generate Service Mapping Chart ---
        print("\n--- STARTING SERVICE MAPPING PARSING ---")
        service_node_prompt = f"""
        You are an expert at identifying business services, processes, and applications from a document.
        Analyze the text and extract every distinct service, process, or application, focusing on creating a clear hierarchical structure.
        
        Categorize each item precisely as one of these types:
        - "Service" - High-level business services (e.g., "Financial Services", "Customer Support")
        - "Process" - Mid-level processes that support services (e.g., "Invoice Processing", "Customer Onboarding")
        - "Sub-Process" - Lower-level processes that are part of larger processes (e.g., "Data Validation", "Document Scanning")
        - "Application" - Software applications supporting processes/services
        - "Department" - Organizational units responsible for services/processes
        
        For each item, create a JSON object with:
        - "id": A unique identifier in camelCase (e.g., "customerRelationshipManagement").
        - "name": The full name (e.g., "Customer Relationship Management").
        - "type": The precise type from the categories above.
        - "notes": A brief description of its function and where it fits in the hierarchy.
        - "level": A number indicating its hierarchical level (1 for top-level, 2 for mid-level, 3 for low-level).
        
        Ensure that Services contain Processes, which contain Sub-Processes, creating a natural tree structure.
        
        Output ONLY a JSON array of these objects, with no additional text.
        
        TEXT:
        {text}
        """
        print("--- PROMPT 2.1 (SERVICE MAP): EXTRACTING NODES ---")
        service_node_response = call_groq_llm(service_node_prompt, temperature=0.0)
        extracted_service_nodes = extract_json_from_response(service_node_response)
        print(f"--- STEP 2.1 COMPLETE: Found {len(extracted_service_nodes)} potential service nodes ---")

        service_manager_prompt = f"""
        You are an expert at identifying ownership of business services and processes.
        Based on the text, the list of people, and the list of services below, identify the manager for each service.
        For each service, create a JSON object with "serviceId" and "managerName".
        Use the exact 'id' for services and the 'name' for managers from the provided JSON lists.
        If a manager is not explicitly mentioned for a service, you can infer it based on roles or omit it.
        Output ONLY a JSON array of these mapping objects.

        TEXT:
        {text}

        PEOPLE:
        {json.dumps(extracted_org_nodes, indent=2)}

        SERVICES:
        {json.dumps(extracted_service_nodes, indent=2)}
        """
        print("--- PROMPT 2.2 (SERVICE MAP): LINKING MANAGERS TO SERVICES ---")
        service_manager_response = call_groq_llm(service_manager_prompt, temperature=0.0)
        extracted_service_managers = extract_json_from_response(service_manager_response)
        print(f"--- STEP 2.2 COMPLETE: Found {len(extracted_service_managers)} manager links ---")

        service_edge_prompt = f"""
        You are an expert at understanding dependencies and hierarchies between business components.
        Based on the text and the list of components below, identify all relationships to create a clear, hierarchical tree structure.
        
        Focus on identifying these key relationships:
        1. Services that contain or manage Processes
        2. Processes that contain or include Sub-Processes
        3. Dependencies where one component requires another to function
        4. Parent-child relationships in organizational hierarchies
        
        For each relationship, create a JSON object with "source" and "target", where:
        - The 'source' is the child/dependent component
        - The 'target' is the parent/supporting component
        - Every edge should clearly reflect a hierarchical relationship
        
        IMPORTANT:
        - Ensure every component is connected to form a coherent tree structure
        - Avoid cycles in the graph (A → B → C → A)
        - Each component should ideally have only one parent
        - Use the exact 'id' fields from the provided JSON list
        
        Output ONLY a JSON array of these edge objects, with no additional text.
        
        TEXT:
        {text}
        
        COMPONENTS:
        {json.dumps(extracted_service_nodes, indent=2)}
        """
        print("--- PROMPT 2.3 (SERVICE MAP): EXTRACTING EDGES ---")
        service_edge_response = call_groq_llm(service_edge_prompt, temperature=0.0)
        extracted_service_edges = extract_json_from_response(service_edge_response)
        print(f"--- STEP 2.3 COMPLETE: Found {len(extracted_service_edges)} potential edges ---")

        # Step 2.4: Consolidate service map data using Python function
        print("--- STEP 2.4 (SERVICE MAP): CONSOLIDATING DATA ---")
        final_service_data = consolidate_service_map_data(
            extracted_service_nodes,
            extracted_service_managers,
            extracted_service_edges
        )

        print("--- STEP 2.5 (SERVICE MAP): Applying manual layout ---")
        layout_nodes_manually(final_service_data.get('nodes', []), final_service_data.get('edges', []))
        
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
        os.makedirs(output_dir, exist_ok=True)  # Ensure directory exists
        output_service_path = os.path.join(output_dir, 'serviceMappingData.json')
        with open(output_service_path, 'w', encoding='utf-8') as f:
            json.dump(final_service_data, f, indent=2, ensure_ascii=False)
        print(f"--- SERVICE MAPPING COMPLETE --- Saved final service map data to {output_service_path}")

        return JSONResponse(content=final_org_data)

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during PDF processing: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@router.delete("/uploaded-files/{filename}")
def delete_uploaded_file(filename: str):
    fpath = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(fpath)
    return {"detail": "File deleted"}
