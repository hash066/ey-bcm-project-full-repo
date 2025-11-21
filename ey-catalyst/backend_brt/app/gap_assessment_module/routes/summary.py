"""
Summary routes for gap analysis statistics.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..utils.gap_calculator import GapAnalysisResult

logger = logging.getLogger(__name__)

# Pydantic Models
class SummaryStats(BaseModel):
    """Model for summary statistics."""
    total_controls: int = Field(..., description="Total number of controls analyzed")
    critical_gaps: int = Field(..., description="Number of critical priority gaps")
    high_priority_gaps: int = Field(..., description="Number of high priority gaps")
    medium_priority_gaps: int = Field(..., description="Number of medium priority gaps")
    low_priority_gaps: int = Field(..., description="Number of low priority gaps")
    avg_compliance_percentage: float = Field(..., description="Average compliance percentage")
    compliance_distribution: Dict[str, int] = Field(..., description="Distribution by compliance status")

class FrameworkBreakdown(BaseModel):
    """Model for framework breakdown statistics."""
    framework: str = Field(..., description="Framework name")
    total_controls: int = Field(..., description="Total controls in this framework")
    avg_compliance: float = Field(..., description="Average compliance percentage")
    critical_gaps: int = Field(..., description="Number of critical gaps")
    high_gaps: int = Field(..., description="Number of high priority gaps")

class DomainBreakdown(BaseModel):
    """Model for domain breakdown statistics."""
    domain: str = Field(..., description="Domain name")
    framework: str = Field(..., description="Framework name")
    total_controls: int = Field(..., description="Total controls in this domain")
    avg_compliance: float = Field(..., description="Average compliance percentage")
    critical_gaps: int = Field(..., description="Number of critical gaps")

class SummaryResponse(BaseModel):
    """Response model for summary endpoint."""
    job_id: str = Field(..., description="Job identifier")
    summary_stats: SummaryStats = Field(..., description="Overall statistics")
    framework_breakdown: List[FrameworkBreakdown] = Field(..., description="Breakdown by framework")
    domain_breakdown: List[DomainBreakdown] = Field(..., description="Breakdown by domain")
    generated_at: str = Field(..., description="Timestamp when summary was generated")

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

def calculate_summary_stats(results: List[Dict[str, Any]]) -> SummaryStats:
    """
    Calculate overall summary statistics from gap analysis results.

    Args:
        results: List of gap analysis results

    Returns:
        SummaryStats object
    """
    if not results:
        return SummaryStats(
            total_controls=0,
            critical_gaps=0,
            high_priority_gaps=0,
            medium_priority_gaps=0,
            low_priority_gaps=0,
            avg_compliance_percentage=0.0,
            compliance_distribution={}
        )

    # Count by priority
    priority_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    compliance_distribution = defaultdict(int)
    total_compliance_scores = []

    for result in results:
        # Count priorities
        priority = result.get('priority', 'Low')
        if priority in priority_counts:
            priority_counts[priority] += 1

        # Count compliance status
        compliance_status = result.get('compliance_status', 'Unknown')
        compliance_distribution[compliance_status] += 1

        # Calculate compliance percentage for averaging
        current_score = result.get('current_score', 0)
        target_score = result.get('target_score', 4)
        if target_score > 0:
            compliance_pct = (current_score / target_score) * 100
            total_compliance_scores.append(compliance_pct)

    # Calculate average compliance
    avg_compliance = sum(total_compliance_scores) / len(total_compliance_scores) if total_compliance_scores else 0.0

    return SummaryStats(
        total_controls=len(results),
        critical_gaps=priority_counts["Critical"],
        high_priority_gaps=priority_counts["High"],
        medium_priority_gaps=priority_counts["Medium"],
        low_priority_gaps=priority_counts["Low"],
        avg_compliance_percentage=round(avg_compliance, 2),
        compliance_distribution=dict(compliance_distribution)
    )

def calculate_framework_breakdown(results: List[Dict[str, Any]]) -> List[FrameworkBreakdown]:
    """
    Calculate breakdown statistics by framework.

    Args:
        results: List of gap analysis results

    Returns:
        List of FrameworkBreakdown objects
    """
    framework_stats = defaultdict(lambda: {
        'total_controls': 0,
        'compliance_scores': [],
        'critical_gaps': 0,
        'high_gaps': 0
    })

    for result in results:
        framework = result.get('framework', 'Unknown')
        stats = framework_stats[framework]

        stats['total_controls'] += 1

        # Calculate compliance percentage
        current_score = result.get('current_score', 0)
        target_score = result.get('target_score', 4)
        if target_score > 0:
            compliance_pct = (current_score / target_score) * 100
            stats['compliance_scores'].append(compliance_pct)

        # Count high priority gaps
        priority = result.get('priority', 'Low')
        if priority == 'Critical':
            stats['critical_gaps'] += 1
        elif priority == 'High':
            stats['high_gaps'] += 1

    # Convert to FrameworkBreakdown objects
    breakdown = []
    for framework, stats in framework_stats.items():
        avg_compliance = (
            sum(stats['compliance_scores']) / len(stats['compliance_scores'])
            if stats['compliance_scores'] else 0.0
        )

        breakdown.append(FrameworkBreakdown(
            framework=framework,
            total_controls=stats['total_controls'],
            avg_compliance=round(avg_compliance, 2),
            critical_gaps=stats['critical_gaps'],
            high_gaps=stats['high_gaps']
        ))

    return sorted(breakdown, key=lambda x: x.framework)

def calculate_domain_breakdown(results: List[Dict[str, Any]]) -> List[DomainBreakdown]:
    """
    Calculate breakdown statistics by domain.

    Args:
        results: List of gap analysis results

    Returns:
        List of DomainBreakdown objects
    """
    domain_stats = defaultdict(lambda: {
        'framework': '',
        'total_controls': 0,
        'compliance_scores': [],
        'critical_gaps': 0
    })

    for result in results:
        framework = result.get('framework', 'Unknown')
        domain = result.get('domain', 'Unknown')
        key = f"{framework}::{domain}"

        stats = domain_stats[key]
        stats['framework'] = framework
        stats['total_controls'] += 1

        # Calculate compliance percentage
        current_score = result.get('current_score', 0)
        target_score = result.get('target_score', 4)
        if target_score > 0:
            compliance_pct = (current_score / target_score) * 100
            stats['compliance_scores'].append(compliance_pct)

        # Count critical gaps
        priority = result.get('priority', 'Low')
        if priority == 'Critical':
            stats['critical_gaps'] += 1

    # Convert to DomainBreakdown objects
    breakdown = []
    for key, stats in domain_stats.items():
        avg_compliance = (
            sum(stats['compliance_scores']) / len(stats['compliance_scores'])
            if stats['compliance_scores'] else 0.0
        )

        breakdown.append(DomainBreakdown(
            domain=key.split('::')[1],  # Extract domain part
            framework=stats['framework'],
            total_controls=stats['total_controls'],
            avg_compliance=round(avg_compliance, 2),
            critical_gaps=stats['critical_gaps']
        ))

    return sorted(breakdown, key=lambda x: (x.framework, x.domain))

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(job_id: str = Query(..., alias="jobId", description="Job ID to get summary for")):
    """
    Get summary statistics for a completed gap analysis job.

    - **job_id**: Job identifier returned from upload endpoint

    Returns comprehensive statistics including:
    - Overall compliance metrics
    - Framework breakdown
    - Domain breakdown
    - Priority distribution
    """
    logger.info(f"Generating summary for job {job_id}")

    # Load processed data
    data = load_processed_data(job_id)

    # Extract gap analysis results
    gap_results = data.get('gap_analysis', {}).get('results', [])

    if not gap_results:
        raise HTTPException(
            status_code=404,
            detail=f"No gap analysis results found for job {job_id}"
        )

    # Convert to GapAnalysisResult objects for easier processing
    results = []
    for result_data in gap_results:
        try:
            # Handle both dict and GapAnalysisResult formats
            if isinstance(result_data, dict):
                result = GapAnalysisResult(**result_data)
            else:
                result = result_data
            results.append(result)
        except Exception as e:
            logger.warning(f"Error parsing result data: {str(e)}")
            continue

    # Calculate statistics
    summary_stats = calculate_summary_stats([r.dict() for r in results])
    framework_breakdown = calculate_framework_breakdown([r.dict() for r in results])
    domain_breakdown = calculate_domain_breakdown([r.dict() for r in results])

    return SummaryResponse(
        job_id=job_id,
        summary_stats=summary_stats,
        framework_breakdown=framework_breakdown,
        domain_breakdown=domain_breakdown,
        generated_at=datetime.utcnow().isoformat()
    )

