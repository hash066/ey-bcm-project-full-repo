# dashboard_analytics.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
# import openai
from groq import Groq  # ✅ Add this
import json
from datetime import datetime, timedelta
import random

# Environment Variables  
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if GROQ_API_KEY:
    GROQ_API_KEY = GROQ_API_KEY.strip()# Model Setup
def generate_response(system_prompt: str, user_message: str):
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY environment variable is not set")
    
    client = Groq(api_key=GROQ_API_KEY)
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4
        )
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"GROQ API connection failed: {str(e)}")

# Request Models
class DashboardAnalyticsRequest(BaseModel):
    organization_name: Optional[str] = "Organization"
    industry: Optional[str] = "Technology"
    departments: Optional[List[str]] = ["IT", "HR", "Finance", "Operations"]
    time_period: Optional[str] = "last_30_days"

class AssessmentSummaryRequest(BaseModel):
    assessment_types: List[str]
    organization_context: Optional[str] = ""

# Response Models
class KPIMetrics(BaseModel):
    totalRisks: int
    totalThreats: int
    criticalRisks: int
    departments: int
    kpi_justification: str

class AssessmentSummary(BaseModel):
    assessmentType: str
    completed: int
    inProgress: int
    pending: int
    keyFindings: List[str]
    progress_justification: str

class RecentActivity(BaseModel):
    action: str
    user: str
    timestamp: str
    meta: str

class DashboardKPIResponse(BaseModel):
    success: bool
    kpis: KPIMetrics
    message: str

class AssessmentSummariesResponse(BaseModel):
    success: bool
    summaries: List[AssessmentSummary]
    message: str

class RecentActivitiesResponse(BaseModel):
    success: bool
    activities: List[RecentActivity]
    message: str

# Dashboard Analytics Router
dashboard_router = APIRouter()

@dashboard_router.post("/api/dashboard/generate-kpis", response_model=DashboardKPIResponse)
def generate_dashboard_kpis(request: DashboardAnalyticsRequest):
    """
    Generate realistic KPI metrics for the main dashboard based on organization context
    """
    system_prompt = """
You are an expert risk analytics specialist. Your task is to generate realistic KPI metrics for an organization's risk management dashboard.

Based on the organization context, generate appropriate metrics that reflect:
1. Total number of identified risks with industry benchmarking justification
2. Total number of distinct threats with threat landscape analysis
3. Number of critical risks (high likelihood and high impact) with risk profile justification
4. Number of departments involved in risk management with organizational structure analysis

Consider:
- Organization size and industry standards
- Typical risk profiles for different industries
- Realistic proportions between total risks and critical risks
- Department involvement based on organization structure
- Industry benchmarks and statistical data
- Regulatory requirements and compliance factors
- Technology adoption and digital transformation impacts
- Geographic and market-specific risk factors

Provide specific justifications that reference:
- Industry risk statistics and benchmarks
- Regulatory requirements for the sector
- Common risk patterns in similar organizations
- Technology and operational risk factors
- Market conditions and business environment
- Organizational maturity and risk management capabilities

Respond strictly in this JSON format:
{
  "kpis": {
    "totalRisks": 125,
    "totalThreats": 45,
    "criticalRisks": 12,
    "departments": 6,
    "kpi_justification": "Detailed explanation of why these metrics are appropriate for this organization, including industry benchmarks, risk factors, and organizational characteristics"
  },
  "rationale": "Brief explanation of the metrics provided"
}
"""

    user_message = f"""
Generate KPI metrics for the following organization:

Organization: {request.organization_name}
Industry: {request.industry}
Departments: {', '.join(request.departments)}
Time Period: {request.time_period}

Please provide realistic metrics that align with this organization's profile and industry standards.
"""

    try:
        result = generate_response(system_prompt, user_message)
        
        # Extract JSON from the response
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = result[json_start:json_end]
            kpi_data = json.loads(json_str)
            
            kpis = KPIMetrics(**kpi_data.get("kpis", {}))
            
            return DashboardKPIResponse(
                success=True,
                kpis=kpis,
                message="Successfully generated dashboard KPI metrics"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response with industry-appropriate metrics
        base_multiplier = len(request.departments) * 10
        
        if request.industry.lower() in ["technology", "financial services", "healthcare"]:
            risk_multiplier = 1.5
        elif request.industry.lower() in ["manufacturing", "retail"]:
            risk_multiplier = 1.2
        else:
            risk_multiplier = 1.0
        
        total_risks = int(base_multiplier * risk_multiplier)
        total_threats = int(total_risks * 0.3)
        critical_risks = int(total_risks * 0.08)
        departments = len(request.departments)
        
        fallback_kpis = KPIMetrics(
            totalRisks=total_risks,
            totalThreats=total_threats,
            criticalRisks=critical_risks,
            departments=departments,
            kpi_justification=f"Generated for {request.industry} industry with {departments} departments. Risk counts based on industry standards where organizations typically identify 10-15 risks per department. Critical risk ratio of {critical_risks/total_risks:.1%} aligns with industry benchmarks."
        )
        
        return DashboardKPIResponse(
            success=True,
            kpis=fallback_kpis,
            message="Generated fallback KPI metrics"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating KPIs: {str(e)}")

@dashboard_router.post("/api/dashboard/generate-assessment-summaries", response_model=AssessmentSummariesResponse)
def generate_assessment_summaries(request: AssessmentSummaryRequest):
    """
    Generate assessment summaries with realistic progress and key findings
    """
    system_prompt = """
You are an expert risk assessment analyst. Your task is to generate realistic assessment summaries for different types of risk assessments.

For each assessment type, provide:
1. Number of completed assessments with completion rate justification
2. Number of assessments in progress with resource allocation reasoning
3. Number of pending assessments with prioritization justification
4. Key findings relevant to that assessment type with industry context

Consider:
- Realistic distribution of assessment states based on organizational capacity
- Assessment-specific findings and insights with industry relevance
- Current risk landscape and common issues with statistical backing
- Actionable and meaningful key findings with regulatory context
- Resource constraints and assessment complexity factors
- Industry benchmarks for assessment completion rates
- Regulatory requirements and compliance timelines
- Organizational maturity and risk management capabilities

Provide specific justifications that reference:
- Industry standards for assessment completion rates
- Common findings patterns in similar organizations
- Regulatory requirements and compliance deadlines
- Resource allocation best practices
- Risk assessment methodologies and frameworks
- Technology and operational assessment challenges

Respond strictly in this JSON format:
{
  "summaries": [
    {
      "assessmentType": "Assessment Type Name",
      "completed": 12,
      "inProgress": 3,
      "pending": 2,
      "keyFindings": [
        "Finding 1 with industry context",
        "Finding 2 with regulatory reference"
      ],
      "progress_justification": "Explanation of why this progress distribution is realistic for this assessment type, including resource constraints, complexity factors, and industry benchmarks"
    }
  ]
}
"""

    user_message = f"""
Generate assessment summaries for the following assessment types:

Assessment Types: {', '.join(request.assessment_types)}
Organization Context: {request.organization_context}

Please provide realistic progress numbers and meaningful key findings for each assessment type.
"""

    try:
        result = generate_response(system_prompt, user_message)
        
        # Extract JSON from the response
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = result[json_start:json_end]
            summary_data = json.loads(json_str)
            
            summaries = [AssessmentSummary(**summary) for summary in summary_data.get("summaries", [])]
            
            return AssessmentSummariesResponse(
                success=True,
                summaries=summaries,
                message="Successfully generated assessment summaries"
            )
        else:
            raise ValueError("No valid JSON found in response")
            
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback response with default summaries
        fallback_summaries = []
        
        for assessment_type in request.assessment_types:
            # Generate realistic numbers
            total_assessments = random.randint(15, 25)
            completed = random.randint(int(total_assessments * 0.6), int(total_assessments * 0.8))
            in_progress = random.randint(2, 5)
            pending = total_assessments - completed - in_progress
            
            # Generate assessment-specific findings
            if "critical process" in assessment_type.lower():
                key_findings = [
                    "85% of critical processes meet documentation standards per ISO 22301",
                    "2-3 processes require immediate review due to regulatory changes",
                    "Backup procedures need enhancement based on RTO/RPO analysis"
                ]
                progress_justification = f"Critical process assessments typically take 2-3 weeks each. Current progress reflects standard organizational capacity and regulatory compliance timelines."
            elif "threat" in assessment_type.lower():
                key_findings = [
                    "Phishing remains top threat (42% of incidents per SANS report)",
                    "Insider threat controls need strengthening per NIST framework",
                    "Third-party risks increased 35% due to digital transformation"
                ]
                progress_justification = f"Threat assessments require specialized expertise and threat intelligence analysis. Progress aligns with industry standards for comprehensive threat evaluation."
            elif "site" in assessment_type.lower():
                key_findings = [
                    "Physical security controls meet 90% of ASIS guidelines",
                    "Some locations need access control upgrades per corporate policy",
                    "Emergency procedures comply with local regulatory requirements"
                ]
                progress_justification = f"Site assessments depend on geographic distribution and local compliance requirements. Current progress reflects travel constraints and coordination complexity."
            else:
                key_findings = [
                    f"{assessment_type} controls are generally effective per industry standards",
                    "Some areas need improvement based on regulatory updates",
                    "Regular monitoring recommended per risk management framework"
                ]
                progress_justification = f"Assessment progress reflects standard organizational capacity and complexity of {assessment_type} evaluation requirements."
            
            summary = AssessmentSummary(
                assessmentType=assessment_type,
                completed=completed,
                inProgress=in_progress,
                pending=pending,
                keyFindings=key_findings[:2],  # Limit to 2 findings
                progress_justification=progress_justification
            )
            fallback_summaries.append(summary)
        
        return AssessmentSummariesResponse(
            success=True,
            summaries=fallback_summaries,
            message="Generated fallback assessment summaries"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating assessment summaries: {str(e)}")

@dashboard_router.get("/api/dashboard/generate-recent-activities", response_model=RecentActivitiesResponse)
def generate_recent_activities(days: int = 7, limit: int = 10):
    """
    Generate realistic recent activities for the dashboard activity feed
    """
    try:
        # Generate sample activities with realistic timestamps
        activity_types = [
            ("Risk escalated", "Risk: Data Breach"),
            ("Threat added", "Threat: Ransomware"),
            ("Assessment completed", "Critical Process RA"),
            ("Risk mitigated", "Risk: System Failure"),
            ("Threat updated", "Threat: Phishing Attack"),
            ("Assessment started", "Site Assessment"),
            ("Risk reviewed", "Risk: Supply Chain"),
            ("Control implemented", "Multi-factor Authentication"),
            ("Vulnerability identified", "Network Security Gap"),
            ("Training completed", "Security Awareness")
        ]
        
        users = ["Jane Doe", "John Smith", "Alice Johnson", "Bob Wilson", "Carol Brown", "David Lee"]
        
        activities = []
        
        for i in range(min(limit, len(activity_types))):
            # Generate timestamp within the last 'days' days
            days_ago = random.randint(0, days)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            timestamp = datetime.now() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            action, meta = activity_types[i]
            user = random.choice(users)
            
            activity = RecentActivity(
                action=action,
                user=user,
                timestamp=timestamp.isoformat() + "Z",
                meta=meta
            )
            activities.append(activity)
        
        # Sort by timestamp (most recent first)
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        return RecentActivitiesResponse(
            success=True,
            activities=activities,
            message=f"Successfully generated {len(activities)} recent activities"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recent activities: {str(e)}")

@dashboard_router.post("/api/dashboard/generate-risk-insights")
def generate_risk_insights(organization_context: str = "", focus_areas: List[str] = []):
    """
    Generate strategic risk insights and recommendations for executive dashboard
    """
    system_prompt = """
You are a senior risk management consultant. Your task is to generate strategic risk insights and recommendations for executive leadership.

Provide:
1. Top 3-5 strategic risk insights
2. Trend analysis and predictions
3. Actionable recommendations for senior management
4. Key performance indicators to monitor

Consider:
- Current business environment and market conditions
- Emerging risks and threat landscapes
- Regulatory and compliance considerations
- Business continuity and operational resilience

Respond strictly in this JSON format:
{
  "insights": [
    {
      "title": "Insight Title",
      "description": "Detailed insight description",
      "priority": "High/Medium/Low",
      "recommendation": "Specific recommendation"
    }
  ],
  "trends": [
    "Trend observation 1",
    "Trend observation 2"
  ],
  "kpis_to_monitor": [
    "KPI 1",
    "KPI 2"
  ]
}
"""

    user_message = f"""
Generate strategic risk insights for the following context:

Organization Context: {organization_context}
Focus Areas: {', '.join(focus_areas) if focus_areas else 'General risk management'}

Please provide executive-level insights and recommendations.
"""

    try:
        result = generate_response(system_prompt, user_message)
        
        # Extract JSON from the response
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = result[json_start:json_end]
            insights_data = json.loads(json_str)
            
            return {
                "success": True,
                "insights": insights_data.get("insights", []),
                "trends": insights_data.get("trends", []),
                "kpis_to_monitor": insights_data.get("kpis_to_monitor", []),
                "message": "Successfully generated risk insights"
            }
        else:
            raise ValueError("No valid JSON found in response")
            
    except Exception as e:
        # Fallback response
        fallback_insights = [
            {
                "title": "Cybersecurity Threat Evolution",
                "description": "Increasing sophistication of cyber attacks requires enhanced security measures",
                "priority": "High",
                "recommendation": "Implement zero-trust architecture and advanced threat detection"
            },
            {
                "title": "Supply Chain Resilience",
                "description": "Global supply chain disruptions pose ongoing operational risks",
                "priority": "Medium",
                "recommendation": "Diversify supplier base and establish contingency plans"
            }
        ]
        
        return {
            "success": True,
            "insights": fallback_insights,
            "trends": ["Increased remote work security challenges", "Regulatory compliance complexity"],
            "kpis_to_monitor": ["Mean time to detect threats", "Risk mitigation completion rate"],
            "message": "Generated fallback risk insights"
        }
