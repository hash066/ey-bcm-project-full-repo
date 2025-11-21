"""
Export routes for downloading gap analysis data.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
from io import StringIO

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import pandas as pd

from app.utils.gap_calculator import GapAnalysisResult

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

def load_processed_data(job_id: str) -> Dict[str, Any]:
    """
    Load processed data from JSON file.

    Args:
        job_id: Job identifier

    Returns:
        Processed data dictionary

    Raises:
        HTTPException: If job data not found or invalid
    """
    file_path = Path("data/processed") / f"{job_id}.json"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Processed data not found for job {job_id}. Make sure the job has completed processing."
        )

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate that this is a completed job
        if data.get('gap_analysis', {}).get('results') is None:
            raise HTTPException(
                status_code=404,
                detail=f"Gap analysis results not found for job {job_id}"
            )

        return data

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON data for job {job_id}"
        )
    except Exception as e:
        logger.error(f"Error loading processed data for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading processed data: {str(e)}"
        )

def filter_results(
    results: List[Dict[str, Any]],
    framework: Optional[str] = None,
    domain: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Filter gap analysis results based on query parameters.

    Args:
        results: List of gap analysis results
        framework: Framework filter
        domain: Domain filter
        priority: Priority filter

    Returns:
        Filtered list of results
    """
    filtered_results = results

    if framework:
        filtered_results = [r for r in filtered_results if r.get('framework') == framework]

    if domain:
        filtered_results = [r for r in filtered_results if r.get('domain') == domain]

    if priority:
        filtered_results = [r for r in filtered_results if r.get('priority') == priority]

    return filtered_results

def prepare_csv_data(results: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Prepare gap analysis results for CSV export.

    Args:
        results: List of gap analysis results

    Returns:
        Pandas DataFrame ready for CSV export
    """
    # Flatten the data for CSV export
    csv_data = []

    for result in results:
        # Handle assessment comments
        comments = result.get('assessment_comments', [])
        comments_text = "; ".join([
            f"{comment.get('reviewer', 'Unknown')}: {comment.get('comment', '')}"
            for comment in comments
        ]) if comments else ""

        row = {
            "Control ID": result.get('id', ''),
            "Framework": result.get('framework', ''),
            "Domain": result.get('domain', ''),
            "Control Name": result.get('control_name', ''),
            "Control Description": result.get('control_description', ''),
            "Current Score": result.get('current_score', 0),
            "Target Score": result.get('target_score', 4),
            "Gap Percentage": result.get('gap_percentage', 0),
            "Compliance Status": result.get('compliance_status', ''),
            "Priority": result.get('priority', ''),
            "Missing Items": "; ".join(result.get('missing_items', [])),
            "Required Actions": "; ".join(result.get('required_actions', [])),
            "Evidence Required": "; ".join(result.get('evidence_required', [])),
            "Assessment Comments": comments_text,
            "Analysis Timestamp": datetime.utcnow().isoformat()
        }

        csv_data.append(row)

    return pd.DataFrame(csv_data)

@router.get("/export/csv")
async def export_csv(
    job_id: str = Query(..., alias="jobId", description="Job ID to export data from"),
    framework: Optional[str] = Query(None, description="Filter by framework name"),
    domain: Optional[str] = Query(None, description="Filter by domain name"),
    priority: Optional[str] = Query(None, description="Filter by priority level")
):
    """
    Export gap analysis results as CSV file.

    - **job_id**: Job identifier returned from upload endpoint
    - **framework**: Filter by framework name (optional)
    - **domain**: Filter by domain name (optional)
    - **priority**: Filter by priority level (optional)

    Returns downloadable CSV file with filtered results.
    """
    logger.info(f"Exporting CSV for job {job_id} with filters: framework={framework}, domain={domain}, priority={priority}")

    # Load processed data
    data = load_processed_data(job_id)

    # Extract and filter gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])
    filtered_results = filter_results(gap_results, framework, domain, priority)

    if not filtered_results:
        raise HTTPException(
            status_code=404,
            detail=f"No results found for job {job_id} with specified filters"
        )

    # Prepare CSV data
    df = prepare_csv_data(filtered_results)

    # Create CSV content
    output = StringIO()
    df.to_csv(output, index=False, encoding='utf-8')
    csv_content = output.getvalue()
    output.close()

    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filters_str = []
    if framework:
        filters_str.append(f"framework_{framework}")
    if domain:
        filters_str.append(f"domain_{domain}")
    if priority:
        filters_str.append(f"priority_{priority}")

    filters_suffix = f"_{'_'.join(filters_str)}" if filters_str else ""
    filename = f"gap_analysis_{job_id}_{timestamp}{filters_suffix}.csv"

    # Return as downloadable file
    def iter_csv():
        yield csv_content

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(len(csv_content))
        }
    )

@router.get("/export/json")
async def export_json(
    job_id: str = Query(..., alias="jobId", description="Job ID to export data from")
):
    """
    Export complete job data as JSON file.

    - **job_id**: Job identifier returned from upload endpoint

    Returns downloadable JSON file with all processed data.
    """
    logger.info(f"Exporting JSON for job {job_id}")

    # Load processed data
    data = load_processed_data(job_id)

    # Convert to JSON string
    json_content = json.dumps(data, indent=2, ensure_ascii=False, default=str)

    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"gap_analysis_{job_id}_{timestamp}.json"

    # Return as downloadable file
    def iter_json():
        yield json_content

    return StreamingResponse(
        iter_json(),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(len(json_content))
        }
    )
