"""
Unified FastAPI server that combines the functionality of:
1. no_db_pdf_server.py - PDF generation and processing
2. simple_server.py - Graph transformation

This server provides all functionality at different endpoints.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
from app.schemas.process_mapping import ProcessMappingModule
from app.schemas.llm_process_mapping import LLMProcessMappingRequest
from app.services.llm_processor import process_llm_chunks, map_llm_to_process_mapping
import tempfile
import os
from pathlib import Path
import json
from datetime import datetime
import io
import uuid
import uvicorn
from app.routers.rbac_router import router as rbac_router
# PDF generation imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors

# Import our transformer and database modules
from app.services.graph_transformer import GraphTransformer
from app.core.config import settings
from app.db.mongodb import (
    get_organization_db,
    get_module_collection,
    list_organizations
)

# For PDF embedding
try:
    from PyPDF2 import PdfMerger
    PYPDF2_AVAILABLE = True
except ImportError:
    print("PyPDF2 not installed. PDF embedding will not be available.")
    print("Install with: pip install PyPDF2")
    PYPDF2_AVAILABLE = False

# Create FastAPI app

app = FastAPI(
    title="Business Resilience Tool API",
    description="Unified API for PDF processing and graph transformation",
    version="0.2.0"
)
app.include_router(rbac_router)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (instead of DB)
# This will be lost when the server restarts
PDF_STORAGE = {}

# In-memory storage for organizations and modules (fallback if MongoDB fails)
ORG_STORAGE = {}

# Define request models
class LLMRequest(BaseModel):
    llm_output: str
    
class OrganizationCreate(BaseModel):
    name: str
    description: str = ""
    
class ModuleDataUpdate(BaseModel):
    data: Dict[str, Any]

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Business Resilience Tool API is running",
        "endpoints": {
            "GET /": "This information",
            "POST /transform": "Transform LLM output to frontend graph format",
            "POST /process-pdf": "Process uploaded files into a single PDF",
            "GET /retrieve-pdf/{batch_token}": "Retrieve a processed PDF",
            "POST /send-to-llm/{batch_token}": "Send PDF to LLM for analysis"
        }
    }

# Graph Transformer Endpoints
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

# PDF Processing Endpoints
@app.post("/process-pdf")
async def process_pdf(
    files: list[UploadFile] = File(...),
    metadata: str = Form(...),
):
    """
    Process uploaded files into a single PDF without any database storage.
    Returns the PDF directly in the response or provides a token to retrieve it.
    """
    try:
        # Parse metadata
        metadata_dict = json.loads(metadata)
        
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Process each uploaded file
            processed_files = []
            for file in files:
                # Save the file to the temporary directory
                file_path = temp_dir_path / file.filename
                with open(file_path, "wb") as f:
                    f.write(await file.read())
                
                # Extract file information
                file_info = {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "path": str(file_path),
                    "size": os.path.getsize(file_path)
                }
                
                # Add file info to processed files list
                processed_files.append(file_info)
            
            # Generate PDF from the uploaded files
            pdf_data = await generate_pdf_from_uploads(processed_files, metadata_dict)
            
            # Generate a unique token for this batch
            batch_token = str(uuid.uuid4())
            
            # Store the PDF in memory
            PDF_STORAGE[batch_token] = {
                "pdf_data": pdf_data,
                "metadata": metadata_dict,
                "files": [{"filename": f["filename"], "size": f["size"]} for f in processed_files],
                "created_at": datetime.now().isoformat()
            }
            
            # Return information about the PDF
            return {
                "batch_token": batch_token,
                "file_count": len(processed_files),
                "total_size": sum(file["size"] for file in processed_files),
                "files": [f["filename"] for f in processed_files],
                "message": "Files processed successfully. Use the retrieve-pdf endpoint to get the PDF."
            }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata format. Expected valid JSON.")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.get("/retrieve-pdf/{batch_token}")
async def retrieve_pdf(batch_token: str):
    """
    Retrieve a PDF that was previously processed.
    """
    if batch_token not in PDF_STORAGE:
        raise HTTPException(status_code=404, detail="PDF not found. It may have expired or been removed.")
    
    pdf_data = PDF_STORAGE[batch_token]["pdf_data"]
    
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=combined_document_{batch_token}.pdf"
        }
    )

@app.post("/send-to-llm/{batch_token}")
async def send_to_llm(batch_token: str):
    """
    Simulate sending the PDF to an LLM endpoint.
    In a real implementation, this would call your actual LLM service.
    """
    if batch_token not in PDF_STORAGE:
        raise HTTPException(status_code=404, detail="PDF not found. It may have expired or been removed.")
    
    pdf_data = PDF_STORAGE[batch_token]["pdf_data"]
    metadata = PDF_STORAGE[batch_token]["metadata"]
    
    # This is a placeholder for the actual LLM call
    llm_response = {
        "batch_token": batch_token,
        "analysis": {
            "summary": "This is a placeholder summary that would be generated by the LLM.",
            "key_points": [
                "Key point 1 from the combined document",
                "Key point 2 from the combined document"
            ],
            "recommendations": [
                "Recommendation 1 based on document analysis",
                "Recommendation 2 based on document analysis"
            ]
        },
        "metadata": metadata,
        "pdf_size": len(pdf_data),
        "message": "PDF successfully processed by LLM."
    }
    
    return JSONResponse(content=llm_response)

async def generate_pdf_from_uploads(files, metadata):
    """
    Generate a PDF from the uploaded files and metadata.
    Uses PyPDF2 to properly embed PDF files.
    """
    temp_pdf_path = None
    merged_pdf_path = None
    pdf_data = None
    
    try:
        # Separate PDF and non-PDF files
        pdf_files = [f for f in files if f["content_type"] == "application/pdf" or f["filename"].endswith(".pdf")]
        other_files = [f for f in files if f["content_type"] != "application/pdf" and not f["filename"].endswith(".pdf")]
        
        # Create a temporary file for the non-PDF content
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            temp_pdf_path = tmp_file.name
        
        # Create a PDF document for non-PDF content
        doc = SimpleDocTemplate(temp_pdf_path, pagesize=letter,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=72)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        heading_style = styles['Heading1']
        normal_style = styles['Normal']
        
        # Create PDF elements
        elements = []
        
        # Add title and metadata
        elements.append(Paragraph(f"Document Bundle: {metadata.get('title', 'Untitled')}", title_style))
        elements.append(Spacer(1, 12))
        
        # Add metadata information
        elements.append(Paragraph("Document Information", heading_style))
        elements.append(Spacer(1, 6))
        
        # Create a table for metadata
        data = []
        data.append(["Field", "Value"])
        
        for key, value in metadata.items():
            if key != "title" and isinstance(value, (str, int, float, bool)):
                data.append([key.capitalize(), str(value)])
        
        if len(data) > 1:  # Only create table if we have metadata
            table = Table(data, colWidths=[2*inch, 4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        
        elements.append(Spacer(1, 12))
        
        # Add information about non-PDF files
        if other_files:
            elements.append(Paragraph("Text Content", heading_style))
            elements.append(Spacer(1, 6))
            
            for file_info in other_files:
                elements.append(Paragraph(f"File: {file_info['filename']}", styles['Heading2']))
                
                # Read the file content
                with open(file_info['path'], 'r', errors='replace') as f:
                    content = f.read()
                
                # Add content to PDF
                for line in content.split('\n'):
                    if line.strip():
                        elements.append(Paragraph(line, normal_style))
                        elements.append(Spacer(1, 6))
                
                elements.append(PageBreak())
        
        # Build the PDF for non-PDF content
        doc.build(elements)
        
        # If we have PDF files to embed, merge them with our generated PDF
        if pdf_files and PYPDF2_AVAILABLE:
            # Create a PDF merger
            merger = PdfMerger()
            
            # Add our generated PDF first
            merger.append(temp_pdf_path)
            
            # Add each uploaded PDF
            for pdf_file in pdf_files:
                merger.append(pdf_file['path'])
            
            # Write to a new temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as merged_file:
                merged_pdf_path = merged_file.name
            
            # Write and close the merger
            with open(merged_pdf_path, 'wb') as output_file:
                merger.write(output_file)
            merger.close()
            
            # Read the merged PDF
            with open(merged_pdf_path, 'rb') as f:
                pdf_data = f.read()
        else:
            # Just use the generated PDF if no PDFs to merge or PyPDF2 not available
            with open(temp_pdf_path, 'rb') as f:
                pdf_data = f.read()
        
        return pdf_data
        
    except Exception as e:
        raise Exception(f"Error generating PDF: {str(e)}")
        
    finally:
        # Clean up temporary files in the finally block to ensure they're always deleted
        try:
            if temp_pdf_path and os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
        except Exception as e:
            print(f"Warning: Could not delete temporary file {temp_pdf_path}: {str(e)}")
            
        try:
            if merged_pdf_path and os.path.exists(merged_pdf_path):
                os.unlink(merged_pdf_path)
        except Exception as e:
            print(f"Warning: Could not delete temporary file {merged_pdf_path}: {str(e)}")

# Organization and Module Endpoints
@app.get("/organizations")
async def list_all_organizations():
    """
    List all organizations in the system.
    
    Returns a list of organization IDs that have databases in MongoDB or from in-memory storage.
    """
    try:
        # Try to get organizations from MongoDB
        orgs = list_organizations()
        return {"organizations": orgs}
    except Exception as e:
        # Fallback to in-memory storage
        print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        return {"organizations": list(ORG_STORAGE.keys())}

@app.post("/organizations", status_code=status.HTTP_201_CREATED)
async def create_organization(org: OrganizationCreate):
    """
    Create a new organization with empty module collections.
    
    This will create a new database for the organization and initialize
    collections for each module. Falls back to in-memory storage if MongoDB fails.
    """
    # Generate a unique ID for the organization
    org_id = f"{org.name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:8]}"
    
    try:
        # Try to create organization in MongoDB
        # Create the organization database and initialize all module collections
        db = get_organization_db(org_id)
        
        # Store organization metadata in a special collection
        metadata_collection = db["metadata"]
        metadata_collection.insert_one({
            "name": org.name,
            "description": org.description,
            "created_at": datetime.now().isoformat(),
            "modules": settings.BRT_MODULES
        })
        
        # Initialize each module collection with an empty document
        for module in settings.BRT_MODULES:
            module_collection = db[module]
            module_collection.insert_one({
                "name": module,
                "data": {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            })
    except Exception as e:
        # Fallback to in-memory storage
        print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        
        # Create organization in memory
        ORG_STORAGE[org_id] = {
            "metadata": {
                "name": org.name,
                "description": org.description,
                "created_at": datetime.now().isoformat(),
                "modules": settings.BRT_MODULES
            },
            "modules": {}
        }
        
        # Initialize modules
        for module in settings.BRT_MODULES:
            ORG_STORAGE[org_id]["modules"][module] = {
                "name": module,
                "data": {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
    
    return {"organization_id": org_id, "name": org.name, "status": "created"}

@app.get("/organizations/{org_id}")
async def get_organization(org_id: str):
    """
    Get organization details including metadata and available modules.
    Falls back to in-memory storage if MongoDB fails.
    """
    try:
        # Try to get from MongoDB first
        try:
            db = get_organization_db(org_id)
            metadata_collection = db["metadata"]
            metadata = metadata_collection.find_one()
            
            if metadata:
                # Convert ObjectId to string for JSON serialization
                metadata["_id"] = str(metadata["_id"])
                return metadata
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
            
        # Fallback to in-memory storage or if not found in MongoDB
        if org_id in ORG_STORAGE:
            return ORG_STORAGE[org_id]["metadata"]
            
        # Not found in either storage
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {org_id} not found"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organization: {str(e)}"
        )

@app.get("/organizations/{org_id}/modules/{module_name}")
async def get_module_data(org_id: str, module_name: str):
    """
    Get data for a specific module within an organization.
    Falls back to in-memory storage if MongoDB fails.
    """
    try:
        # Try MongoDB first
        try:
            collection = get_module_collection(org_id, module_name)
            module_data = collection.find_one()
            
            if module_data:
                # Convert ObjectId to string for JSON serialization
                module_data["_id"] = str(module_data["_id"])
                return module_data
            else:
                # Initialize with empty data if not found in MongoDB
                module_data = {
                    "name": module_name,
                    "data": {},
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                collection.insert_one(module_data)
                module_data["_id"] = str(module_data["_id"])
                return module_data
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        
        # Fallback to in-memory storage
        if org_id in ORG_STORAGE and module_name in ORG_STORAGE[org_id]["modules"]:
            return ORG_STORAGE[org_id]["modules"][module_name]
        
        # If organization exists but module doesn't, create it
        if org_id in ORG_STORAGE:
            # Initialize with empty data
            module_data = {
                "name": module_name,
                "data": {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            ORG_STORAGE[org_id]["modules"][module_name] = module_data
            return module_data
        
        # Organization not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {org_id} not found"
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving module data: {str(e)}"
        )

@app.put("/organizations/{org_id}/modules/{module_name}")
async def update_module_data(org_id: str, module_name: str, update: ModuleDataUpdate):
    """
    Update data for a specific module within an organization.
    Falls back to in-memory storage if MongoDB fails.
    """
    try:
        # Try MongoDB first
        try:
            collection = get_module_collection(org_id, module_name)
            module_data = collection.find_one()
            
            if not module_data:
                # Initialize with provided data if not found
                # For process_mapping module, use the specialized schema
                if module_name == "process_mapping":
                    # Validate data against ProcessMappingModule schema
                    try:
                        # Convert the data to ProcessMappingModule
                        process_data = ProcessMappingModule(**update.data)
                        # Convert back to dict for MongoDB storage
                        module_data = {
                            "name": module_name,
                            "data": process_data.dict(),
                            "created_at": datetime.now().isoformat(),
                            "updated_at": datetime.now().isoformat()
                        }
                    except Exception as e:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid Process Mapping data: {str(e)}"
                        )
                else:
                    # For other modules, use the generic schema
                    module_data = {
                        "name": module_name,
                        "data": update.data,
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                result = collection.insert_one(module_data)
                return {"status": "created", "id": str(result.inserted_id)}
            else:
                # Update existing data
                # For process_mapping module, use the specialized schema
                if module_name == "process_mapping":
                    # Validate data against ProcessMappingModule schema
                    try:
                        # Convert the data to ProcessMappingModule
                        process_data = ProcessMappingModule(**update.data)
                        # Update with validated data
                        result = collection.update_one(
                            {"_id": module_data["_id"]},
                            {
                                "$set": {
                                    "data": process_data.dict(),
                                    "updated_at": datetime.now().isoformat()
                                }
                            }
                        )
                    except Exception as e:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid Process Mapping data: {str(e)}"
                        )
                else:
                    # For other modules, use the generic schema
                    result = collection.update_one(
                        {"_id": module_data["_id"]},
                        {
                            "$set": {
                                "data": update.data,
                                "updated_at": datetime.now().isoformat()
                            }
                        }
                    )
                return {"status": "updated", "matched_count": result.matched_count}
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
            
        # Fallback to in-memory storage
        # Check if organization exists
        if org_id not in ORG_STORAGE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {org_id} not found"
            )
            
        # Check if module exists
        if module_name in ORG_STORAGE[org_id]["modules"]:
            # Update existing module
            ORG_STORAGE[org_id]["modules"][module_name]["data"] = update.data
            ORG_STORAGE[org_id]["modules"][module_name]["updated_at"] = datetime.now().isoformat()
            return {"status": "updated", "matched_count": 1}
        else:
            # Create new module
            # For process_mapping module, use the specialized schema
            if module_name == "process_mapping":
                # Validate data against ProcessMappingModule schema
                try:
                    # Convert the data to ProcessMappingModule
                    process_data = ProcessMappingModule(**update.data)
                    # Convert back to dict for in-memory storage
                    module_data = {
                        "name": module_name,
                        "data": process_data.dict(),
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid Process Mapping data: {str(e)}"
                    )
            else:
                # For other modules, use the generic schema
                module_data = {
                    "name": module_name,
                    "data": update.data,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            ORG_STORAGE[org_id]["modules"][module_name] = module_data
            return {"status": "created", "id": f"in_memory_{uuid.uuid4().hex[:8]}"}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating module data: {str(e)}"
        )

# Process Mapping specific endpoints
@app.get("/organizations/{org_id}/process-mapping")
async def get_process_mapping(org_id: str):
    """
    Get Process Mapping data for an organization.
    This is a specialized endpoint for the Process Mapping module.
    """
    try:
        # Try MongoDB first
        try:
            collection = get_module_collection(org_id, "process_mapping")
            module_data = collection.find_one()
            
            if not module_data:
                return {
                    "status": "not_found",
                    "message": "Process Mapping data not found for this organization"
                }
            
            # Return the process mapping data
            return {
                "status": "success",
                "data": module_data["data"]
            }
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        
        # Fallback to in-memory storage
        if org_id not in ORG_STORAGE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {org_id} not found"
            )
        
        if "process_mapping" not in ORG_STORAGE[org_id]["modules"]:
            return {
                "status": "not_found",
                "message": "Process Mapping data not found for this organization"
            }
        
        return {
            "status": "success",
            "data": ORG_STORAGE[org_id]["modules"]["process_mapping"]["data"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving Process Mapping data: {str(e)}"
        )

@app.put("/organizations/{org_id}/process-mapping")
async def update_process_mapping(org_id: str, process_data: ProcessMappingModule):
    """
    Update Process Mapping data for an organization.
    This is a specialized endpoint for the Process Mapping module that uses the
    strongly-typed ProcessMappingModule schema.
    """
    try:
        # Try MongoDB first
        try:
            collection = get_module_collection(org_id, "process_mapping")
            module_data = collection.find_one()
            
            # Convert ProcessMappingModule to dict for storage
            process_dict = process_data.dict()
            
            if not module_data:
                # Initialize with provided data if not found
                module_data = {
                    "name": "process_mapping",
                    "data": process_dict,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                result = collection.insert_one(module_data)
                return {
                    "status": "created", 
                    "id": str(result.inserted_id),
                    "message": "Process Mapping data created successfully"
                }
            else:
                # Update existing data
                result = collection.update_one(
                    {"_id": module_data["_id"]},
                    {
                        "$set": {
                            "data": process_dict,
                            "updated_at": datetime.now().isoformat()
                        }
                    }
                )
                return {
                    "status": "updated", 
                    "matched_count": result.matched_count,
                    "message": "Process Mapping data updated successfully"
                }
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        
        # Fallback to in-memory storage
        # Check if organization exists
        if org_id not in ORG_STORAGE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {org_id} not found"
            )
        
        # Convert ProcessMappingModule to dict for storage
        process_dict = process_data.dict()
        
        # Check if module exists
        if "process_mapping" in ORG_STORAGE[org_id]["modules"]:
            # Update existing module
            ORG_STORAGE[org_id]["modules"]["process_mapping"]["data"] = process_dict
            ORG_STORAGE[org_id]["modules"]["process_mapping"]["updated_at"] = datetime.now().isoformat()
            return {
                "status": "updated", 
                "matched_count": 1,
                "message": "Process Mapping data updated successfully"
            }
        else:
            # Create new module
            module_data = {
                "name": "process_mapping",
                "data": process_dict,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            ORG_STORAGE[org_id]["modules"]["process_mapping"] = module_data
            return {
                "status": "created", 
                "id": f"in_memory_{uuid.uuid4().hex[:8]}",
                "message": "Process Mapping data created successfully"
            }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating Process Mapping data: {str(e)}"
        )

# LLM Process Mapping Endpoint
@app.post("/organizations/{org_id}/process-mapping/from-llm")
async def process_mapping_from_llm(org_id: str, llm_request: LLMProcessMappingRequest):
    """
    Process LLM output and populate the MongoDB with process mapping data.
    
    This endpoint takes the LLM output in chunks and maps it to our Process Mapping schema.
    It then stores the data in MongoDB for the specified organization.
    """
    try:
        # Process the LLM chunks to extract the combined data
        combined_data = process_llm_chunks(llm_request)
        
        # Map the LLM data to our Process Mapping schema
        process_mapping = map_llm_to_process_mapping(combined_data)
        
        # Try MongoDB first
        try:
            collection = get_module_collection(org_id, "process_mapping")
            module_data = collection.find_one()
            
            # Convert ProcessMappingModule to dict for storage
            process_dict = process_mapping.dict()
            
            if not module_data:
                # Initialize with provided data if not found
                module_data = {
                    "name": "process_mapping",
                    "data": process_dict,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "llm_source": combined_data  # Store the original LLM data for reference
                }
                result = collection.insert_one(module_data)
                return {
                    "status": "created", 
                    "id": str(result.inserted_id),
                    "message": "Process Mapping data created successfully from LLM output",
                    "process_mapping": process_dict
                }
            else:
                # Update existing data
                result = collection.update_one(
                    {"_id": module_data["_id"]},
                    {
                        "$set": {
                            "data": process_dict,
                            "updated_at": datetime.now().isoformat(),
                            "llm_source": combined_data  # Store the original LLM data for reference
                        }
                    }
                )
                return {
                    "status": "updated", 
                    "matched_count": result.matched_count,
                    "message": "Process Mapping data updated successfully from LLM output",
                    "process_mapping": process_dict
                }
        except Exception as e:
            print(f"MongoDB error: {str(e)}. Using in-memory storage fallback.")
        
        # Fallback to in-memory storage
        # Check if organization exists
        if org_id not in ORG_STORAGE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {org_id} not found"
            )
        
        # Convert ProcessMappingModule to dict for storage
        process_dict = process_mapping.dict()
        
        # Check if module exists
        if "process_mapping" in ORG_STORAGE[org_id]["modules"]:
            # Update existing module
            ORG_STORAGE[org_id]["modules"]["process_mapping"]["data"] = process_dict
            ORG_STORAGE[org_id]["modules"]["process_mapping"]["updated_at"] = datetime.now().isoformat()
            ORG_STORAGE[org_id]["modules"]["process_mapping"]["llm_source"] = combined_data
            return {
                "status": "updated", 
                "matched_count": 1,
                "message": "Process Mapping data updated successfully from LLM output",
                "process_mapping": process_dict
            }
        else:
            # Create new module
            module_data = {
                "name": "process_mapping",
                "data": process_dict,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "llm_source": combined_data
            }
            ORG_STORAGE[org_id]["modules"]["process_mapping"] = module_data
            return {
                "status": "created", 
                "id": f"in_memory_{uuid.uuid4().hex[:8]}",
                "message": "Process Mapping data created successfully from LLM output",
                "process_mapping": process_dict
            }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LLM data: {str(ve)}"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing LLM data: {str(e)}"
        )

if __name__ == "__main__":
    print("Starting Unified Business Resilience Tool API server...")
    print(f"PyPDF2 available: {PYPDF2_AVAILABLE}")
    print("Visit http://localhost:8000/docs for API documentation")
    uvicorn.run(app, host="0.0.0.0", port=8000)
