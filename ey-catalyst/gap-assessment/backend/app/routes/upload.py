"""
Upload routes for file processing and gap analysis.
"""

import uuid
import logging
import asyncio
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime
import json

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config_settings import settings
from app.utils.document_processor import DocumentProcessor
from app.utils.gap_calculator import GapCalculator

logger = logging.getLogger(__name__)

# Global job status tracking
job_status: Dict[str, Dict] = {}

# Pydantic Models
class UploadResponse(BaseModel):
    """Response model for file upload."""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Current status")
    files_uploaded: int = Field(..., description="Number of files uploaded")
    message: str = Field(..., description="Status message")

class StatusResponse(BaseModel):
    """Response model for job status."""
    job_id: str = Field(..., description="Job identifier")
    status: str = Field(..., description="Current status (processing|complete|failed)")
    progress: int = Field(..., description="Progress percentage (0-100)")
    message: str = Field(..., description="Status message")
    result: Optional[Dict] = Field(None, description="Analysis result if complete")

# Create router
router = APIRouter()

def validate_file_type(filename: str) -> str:
    """
    Validate file type based on extension and return type name for processing.

    Args:
        filename: Name of the uploaded file

    Returns:
        File type name for DocumentProcessor

    Raises:
        HTTPException: If file type is not supported
    """
    extension_to_type = {
        '.docx': 'word',
        '.doc': 'word',
        '.pdf': 'pdf',
        '.xlsx': 'excel',
        '.xls': 'excel'
    }

    file_extension = Path(filename).suffix.lower()
    logger.info(f"DEBUG: File {filename}, extension: {file_extension}")

    if file_extension not in extension_to_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_extension}. Supported types: {', '.join(extension_to_type.keys())}"
        )

    result = extension_to_type[file_extension]
    logger.info(f"DEBUG: Returning file type: {result}")
    return result

def check_file_size(file: UploadFile) -> None:
    """
    Check if file size is within limits.

    Args:
        file: Uploaded file

    Raises:
        HTTPException: If file is too large
    """
    # Get file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to beginning

    if file_size > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {file_size} bytes. Maximum allowed: {settings.max_upload_size} bytes"
        )

async def save_uploaded_file(file: UploadFile, job_id: str, filename: str) -> str:
    """
    Save uploaded file to disk.

    Args:
        file: Uploaded file
        job_id: Job identifier
        filename: Original filename

    Returns:
        Path where file was saved
    """
    try:
        # Create job directory
        job_dir = Path("uploads") / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename to avoid conflicts
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = job_dir / unique_filename

        # Save file
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        logger.info(f"Saved file {filename} to {file_path}")
        return str(file_path)

    except Exception as e:
        logger.error(f"Error saving file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

async def process_files_background(job_id: str, file_paths: List[str], original_filenames: List[str]):
    """
    Background task to process uploaded files.

    Args:
        job_id: Job identifier
        file_paths: List of saved file paths
        original_filenames: List of original filenames
    """
    try:
        logger.info(f"Starting background processing for job {job_id}")

        # Update status to processing
        job_status[job_id] = {
            "status": "processing",
            "progress": 0,
            "message": "Starting file processing...",
            "start_time": datetime.utcnow().isoformat()
        }

        # Initialize processors
        document_processor = DocumentProcessor()
        gap_calculator = GapCalculator()

        # Debug frameworks loading
        gap_calculator.debug_frameworks_loading()

        processed_files = []
        total_files = len(file_paths)

        # Process each file
        for i, (file_path, original_filename) in enumerate(zip(file_paths, original_filenames)):
            try:
                logger.info(f"Processing file {i+1}/{total_files}: {original_filename}")

                # Update progress
                progress = int((i / total_files) * 50)  # First 50% for file processing
                job_status[job_id].update({
                    "progress": progress,
                    "message": f"Processing {original_filename}..."
                })

                # Process document
                file_type = validate_file_type(original_filename)
                extracted_data = document_processor.process_file(file_path, file_type)

                processed_files.append({
                    "filename": original_filename,
                    "file_path": file_path,
                    "file_type": file_type,
                    "extracted_data": extracted_data
                })

                logger.info(f"Successfully processed {original_filename}")

            except Exception as e:
                logger.error(f"Error processing file {original_filename}: {str(e)}")
                processed_files.append({
                    "filename": original_filename,
                    "file_path": file_path,
                    "file_type": "unknown",
                    "error": str(e)
                })

        # Calculate gaps
        logger.info("Calculating compliance gaps...")
        job_status[job_id].update({
            "progress": 60,
            "message": "Calculating compliance gaps..."
        })

        all_gap_results = []
        for processed_file in processed_files:
            if "error" not in processed_file:
                try:
                    gaps = gap_calculator.calculate_gaps(processed_file["extracted_data"])
                    all_gap_results.extend(gaps)
                except Exception as e:
                    logger.error(f"Error calculating gaps for {processed_file['filename']}: {str(e)}")

        # Prepare final result
        final_result = {
            "job_id": job_id,
            "processed_at": datetime.utcnow().isoformat(),
            "files_processed": len([f for f in processed_files if "error" not in f]),
            "total_files": total_files,
            "gap_analysis": {
                "total_controls_checked": len(all_gap_results),
                "results": [result.dict() for result in all_gap_results]
            },
            "processed_files": processed_files
        }

        # Save result to processed data directory
        result_file = Path("data/processed") / f"{job_id}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(final_result, f, indent=2, ensure_ascii=False)

        # Update job status to complete
        job_status[job_id].update({
            "status": "complete",
            "progress": 100,
            "message": f"Successfully processed {len(processed_files)} files and found {len(all_gap_results)} gap analysis results",
            "result": final_result,
            "completed_at": datetime.utcnow().isoformat()
        })

        logger.info(f"Completed processing job {job_id}")

    except Exception as e:
        logger.error(f"Background processing failed for job {job_id}: {str(e)}")

        # Update job status to failed
        job_status[job_id].update({
            "status": "failed",
            "progress": 0,
            "message": f"Processing failed: {str(e)}",
            "error": str(e),
            "failed_at": datetime.utcnow().isoformat()
        })

@router.post("/upload")
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to upload")
):
    """
    Upload files for gap analysis processing.

    - **files**: List of files to upload (max size defined by MAX_UPLOAD_SIZE)

    Returns job_id for tracking progress.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(files) > 10:  # Reasonable limit
        raise HTTPException(status_code=400, detail="Too many files. Maximum 10 files allowed.")

    # Generate unique job ID
    job_id = str(uuid.uuid4())

    logger.info(f"Starting upload job {job_id} with {len(files)} files")

    # Validate and save files
    saved_files = []
    original_filenames = []

    for file in files:
        try:
            # Validate file type
            validate_file_type(file.filename)

            # Check file size
            check_file_size(file)

            # Save file
            saved_path = await save_uploaded_file(file, job_id, file.filename)
            saved_files.append(saved_path)
            original_filenames.append(file.filename)

        except HTTPException:
            # Close any remaining files
            for f in files:
                if not f.file.closed:
                    f.file.close()
            raise
        except Exception as e:
            logger.error(f"Error handling file {file.filename}: {str(e)}")
            # Close any remaining files
            for f in files:
                if not f.file.closed:
                    f.file.close()
            raise HTTPException(status_code=500, detail=f"Error processing file {file.filename}: {str(e)}")

    # Initialize job status
    job_status[job_id] = {
        "status": "processing",
        "progress": 0,
        "message": f"Uploaded {len(files)} files, starting processing...",
        "files_count": len(files),
        "start_time": datetime.utcnow().isoformat()
    }

    # Start background processing
    background_tasks.add_task(process_files_background, job_id, saved_files, original_filenames)

    response = UploadResponse(
        job_id=job_id,
        status="processing",
        files_uploaded=len(files),
        message=f"Successfully uploaded {len(files)} files. Processing started."
    )

    # Return as dict with camelCase keys for JavaScript compatibility
    return {
        "jobId": response.job_id,
        "status": response.status,
        "filesUploaded": response.files_uploaded,
        "message": response.message
    }

@router.get("/upload/status")
async def get_upload_status(jobId: str = Query(..., alias="jobId", description="Job ID to check status for")):
    """
    Get the status of a file processing job.

    - **jobId**: Job identifier returned from upload endpoint
    """
    if jobId not in job_status:
        raise HTTPException(status_code=404, detail=f"Job {jobId} not found")

    job_id = jobId  # Use the camelCase parameter

    job_info = job_status[job_id]

    response = StatusResponse(
        job_id=job_id,
        status=job_info["status"],
        progress=job_info["progress"],
        message=job_info["message"],
        result=job_info.get("result")
    )

    # Return as dict with camelCase keys for JavaScript compatibility
    return {
        "jobId": response.job_id,
        "status": response.status,
        "progress": response.progress,
        "message": response.message,
        "result": response.result
    }

@router.get("/upload/status/{jobId}")
async def get_upload_status_path(jobId: str):
    """
    Alternative endpoint to get upload status using path parameter.

    - **jobId**: Job identifier returned from upload endpoint
    """
    if jobId not in job_status:
        raise HTTPException(status_code=404, detail=f"Job {jobId} not found")

    job_id = jobId  # Use the camelCase parameter

    job_info = job_status[job_id]

    response = StatusResponse(
        job_id=job_id,
        status=job_info["status"],
        progress=job_info["progress"],
        message=job_info["message"],
        result=job_info.get("result")
    )

    # Return as dict with camelCase keys for JavaScript compatibility
    return {
        "jobId": response.job_id,
        "status": response.status,
        "progress": response.progress,
        "message": response.message,
        "result": response.result
    }

# Optional: Cleanup old jobs (could be run periodically)
async def cleanup_old_jobs(max_age_hours: int = 24):
    """
    Clean up old job statuses to prevent memory leaks.

    Args:
        max_age_hours: Maximum age of jobs to keep (in hours)
    """
    current_time = datetime.utcnow()
    jobs_to_remove = []

    for job_id, job_info in job_status.items():
        if "start_time" in job_info:
            try:
                start_time = datetime.fromisoformat(job_info["start_time"])
                age_hours = (current_time - start_time).total_seconds() / 3600

                if age_hours > max_age_hours:
                    jobs_to_remove.append(job_id)
            except ValueError:
                # Invalid timestamp, remove job
                jobs_to_remove.append(job_id)

    for job_id in jobs_to_remove:
        del job_status[job_id]
        logger.info(f"Cleaned up old job: {job_id}")

    if jobs_to_remove:
        logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")
