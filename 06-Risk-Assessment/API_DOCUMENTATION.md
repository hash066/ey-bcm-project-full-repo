# EY Catalyst Risk Analysis API Documentation

## Overview
This document describes the AI-powered generation endpoints for the EY Catalyst Risk Analysis platform. These endpoints generate risk-related data using advanced language models and are designed to work independently of database operations.

### Key Features
- **Industry-Specific Justifications**: All risk assessments, threat identifications, and scoring include detailed justifications based on industry statistics, regulatory requirements, and threat intelligence
- **Evidence-Based Scoring**: Likelihood and impact scores are supported by specific industry data, compliance standards, and historical incident analysis
- **Contextual Threat Analysis**: Threats are identified with specific reasoning related to the organization's industry, technology stack, and operational environment
- **Regulatory Compliance Integration**: Justifications reference relevant regulatory frameworks (NIST, ISO, GDPR, etc.) and compliance requirements
- **Statistical Backing**: All assessments include references to industry reports, threat intelligence, and statistical data from recognized sources

---

## Enterprise Risk Assessment (RA) Endpoints

### 1. Generate Enterprise Risks

**Endpoint:** `POST /api/enterprise-ra/generate-risks`

**Purpose:** Generate comprehensive enterprise risks based on category, department, and business context.

**Request Body:**
```json
{
  "category": "Technology",
  "department": "IT",
  "business_context": "Financial services organization with cloud infrastructure",
  "specific_concerns": "Data security and regulatory compliance",
  "number_of_risks": 5
}
```

**Response:**
```json
{
  "success": true,
  "risks": [
    {
      "id": "r1a2b3c4",
      "category": "Technology",
      "name": "Data Breach",
      "description": "Sensitive customer data could be exposed through inadequate security measures",
      "likelihood": 4,
      "impact": 5,
      "likelihood_justification": "High likelihood due to 67% increase in ransomware attacks targeting financial services (FBI IC3 2024 report) and organization's cloud infrastructure exposure",
      "impact_justification": "Severe impact due to regulatory penalties (GDPR fines up to 4% of revenue), customer trust loss, and operational disruption affecting 100k+ customers",
      "treatment": "Implement multi-factor authentication and encrypt all data at rest",
      "department": "IT",
      "escalated": false,
      "threats": [
        {
          "name": "Phishing Attack",
          "description": "Attackers trick employees into revealing credentials.",
          "justification": "Phishing accounts for 36% of data breaches in financial services (Verizon DBIR 2024) and remote work has increased email-based attack surface by 40%"
        },
        {
          "name": "Malware",
          "description": "Malicious software used to steal or corrupt data.",
          "justification": "Malware attacks increased 358% in financial sector (CrowdStrike 2024) with cloud environments being primary targets due to data concentration"
        }
      ]
    }
  ],
  "message": "Successfully generated 5 enterprise risks"
}
```

### 2. Generate Threats for Risk

**Endpoint:** `POST /api/enterprise-ra/generate-threats`

**Purpose:** Generate specific threats for a given risk scenario.

**Request Body:**
```json
{
  "risk_name": "Data Breach",
  "category": "Technology",
  "department": "IT",
  "number_of_threats": 3
}
```

**Response:**
```json
{
  "success": true,
  "threats": [
    {
      "name": "Advanced Persistent Threat",
      "description": "Sophisticated, long-term cyber attack targeting sensitive data",
      "justification": "APTs have increased 125% in IT departments (Mandiant M-Trends 2024) with average dwell time of 146 days, making data breaches particularly damaging for technology companies"
    },
    {
      "name": "Insider Threat",
      "description": "Malicious or negligent actions by employees with system access",
      "justification": "Insider threats account for 34% of data breaches in IT sector (Ponemon Institute 2024) with privileged IT users having access to critical systems and sensitive data"
    },
    {
      "name": "Third-Party Breach",
      "description": "Security compromise through vendor or partner systems",
      "justification": "Third-party breaches affect 61% of organizations (CyberSeek 2024) with IT departments heavily reliant on cloud services, APIs, and vendor integrations increasing attack surface"
    }
  ],
  "message": "Successfully generated 3 threats for risk: Data Breach"
}
```

---

## Threat Risk Assessment Endpoints

### 3. Generate Threat Risk Records

**Endpoint:** `POST /api/threat-ra/generate-threat-risks`

**Purpose:** Generate comprehensive threat risk records for threat risk assessment tables.

**Request Body:**
```json
{
  "domain": "IT",
  "category": "Technology",
  "business_context": "Cloud-based infrastructure with remote workforce",
  "specific_focus": "Network security and endpoint protection",
  "number_of_records": 10
}
```

**Response:**
```json
{
  "success": true,
  "threatRisks": [
    {
      "id": "tr1a2b3c",
      "domain": "IT",
      "riskName": "Network Intrusion",
      "threat": "External Hacker",
      "vulnerability": "Unpatched Network Equipment",
      "category": "Technology",
      "likelihood": 4,
      "impact": 5,
      "rating": 20,
      "likelihood_justification": "High likelihood due to 73% of network breaches targeting unpatched systems (NIST Cybersecurity Framework 2024) and increasing sophistication of automated scanning tools",
      "impact_justification": "Severe impact as network compromise can lead to complete system access, affecting all connected services and potentially exposing customer data across multiple applications",
      "threat_justification": "External hackers represent 80% of network intrusions in IT infrastructure (CrowdStrike Global Threat Report 2024) with state-sponsored and criminal groups actively targeting technology companies",
      "vulnerability_justification": "Unpatched systems account for 60% of successful breaches (Ponemon Cost of Data Breach 2024) with IT environments often having legacy equipment and complex patch management challenges"
    },
    {
      "id": "tr4d5e6f",
      "domain": "IT",
      "riskName": "Data Exfiltration",
      "threat": "Malicious Insider",
      "vulnerability": "Excessive User Privileges",
      "category": "Technology",
      "likelihood": 3,
      "impact": 4,
      "rating": 12,
      "likelihood_justification": "Moderate likelihood as insider threats occur in 34% of data breaches (Verizon DBIR 2024) with IT staff having elevated access to sensitive systems and data repositories",
      "impact_justification": "Significant impact due to potential exposure of intellectual property, customer data, and business-critical information, leading to competitive disadvantage and regulatory violations",
      "threat_justification": "Malicious insiders in IT departments pose heightened risk due to technical knowledge and system access (CERT Insider Threat Guide 2024) with average incident cost of $4.9M in technology sector",
      "vulnerability_justification": "Excessive privileges are found in 78% of organizations (CyberArk Privileged Access Security Report 2024) with IT environments often granting broad access for operational efficiency"
    }
  ],
  "message": "Successfully generated 10 threat risk records"
}
```

### 4. Analyze Threat Risk Scenario

**Endpoint:** `POST /api/threat-ra/analyze-threat-risk`

**Purpose:** Provide detailed analysis and recommendations for a specific threat risk scenario.

**Request Body:**
```json
{
  "domain": "HR",
  "risk_name": "Key Personnel Loss",
  "threat": "Employee Resignation",
  "vulnerability": "No Succession Planning",
  "category": "People"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "ana1b2c3",
    "domain": "HR",
    "riskName": "Key Personnel Loss",
    "threat": "Employee Resignation",
    "vulnerability": "No Succession Planning",
    "category": "People",
    "likelihood": 3,
    "impact": 4,
    "rating": 12,
    "likelihood_justification": "Moderate likelihood based on current job market trends showing 47% voluntary turnover rate in HR sector (SHRM Talent Acquisition Benchmarking 2024) and post-pandemic career mobility increases",
    "impact_justification": "Significant impact as key personnel departures can disrupt critical HR functions, delay strategic initiatives, and result in knowledge loss affecting employee relations and compliance",
    "threat_justification": "Employee resignation is primary threat in HR departments due to specialized knowledge requirements and limited talent pool for senior HR roles (Deloitte Human Capital Trends 2024)",
    "vulnerability_justification": "Lack of succession planning affects 67% of organizations (Harvard Business Review 2024) with HR departments often focusing on other departments' succession while neglecting their own"
  },
  "recommendations": [
    "Develop comprehensive succession plans for key HR roles including knowledge transfer protocols and cross-training programs per SHRM best practices",
    "Implement retention strategies targeting critical personnel including competitive compensation analysis and career development pathways per industry benchmarks",
    "Create knowledge documentation systems and mentorship programs to reduce single points of failure per organizational resilience frameworks",
    "Establish cross-training programs between HR team members and implement backup coverage for essential functions per business continuity standards"
  ],
  "message": "Successfully analyzed threat risk scenario"
}
```

### 5. Generate Bulk Threat Analysis

**Endpoint:** `POST /api/threat-ra/generate-bulk-analysis`

**Purpose:** Generate comprehensive threat risk analysis across multiple domains and categories.

**Request Body:**
```json
{
  "domains": ["IT", "HR", "Finance", "Operations"],
  "categories": ["Technology", "People", "Process", "External"]
}
```

**Response:**
```json
{
  "success": true,
  "total_records": 80,
  "threat_risks": [
    {
      "id": "bulk1a2b",
      "domain": "IT",
      "riskName": "System Downtime",
      "threat": "Hardware Failure",
      "vulnerability": "Aging Infrastructure",
      "category": "Technology",
      "likelihood": 3,
      "impact": 4,
      "rating": 12
    }
  ],
  "message": "Successfully generated 80 threat risk records across 4 domains and 4 categories"
}
```

---

## Dashboard Analytics Endpoints

### 6. Generate Dashboard KPIs

**Endpoint:** `POST /api/dashboard/generate-kpis`

**Purpose:** Generate realistic KPI metrics for the main dashboard based on organization context.

**Request Body:**
```json
{
  "organization_name": "TechCorp Inc",
  "industry": "Technology",
  "departments": ["IT", "HR", "Finance", "Operations", "Legal", "Marketing"],
  "time_period": "last_30_days"
}
```

**Response:**
```json
{
  "success": true,
  "kpis": {
    "totalRisks": 124,
    "totalThreats": 37,
    "criticalRisks": 8,
    "departments": 6,
    "kpi_justification": "Metrics aligned with technology sector benchmarks where organizations typically identify 15-25 risks per department (NIST Framework). Critical risk ratio of 6.5% reflects mature risk management with focus on high-impact scenarios. Threat-to-risk ratio of 30% indicates comprehensive threat modeling per industry standards."
  },
  "message": "Successfully generated dashboard KPI metrics"
}
```

### 7. Generate Assessment Summaries

**Endpoint:** `POST /api/dashboard/generate-assessment-summaries`

**Purpose:** Generate assessment summaries with realistic progress and key findings.

**Request Body:**
```json
{
  "assessment_types": [
    "Critical Process RA",
    "Threat Risk Assessment", 
    "Site Assessment",
    "Vendor Risk Assessment"
  ],
  "organization_context": "Mid-size financial services firm with 500+ employees"
}
```

**Response:**
```json
{
  "success": true,
  "summaries": [
    {
      "assessmentType": "Critical Process RA",
      "completed": 12,
      "inProgress": 3,
      "pending": 2,
      "keyFindings": [
        "85% of critical processes meet documentation standards per ISO 22301 business continuity requirements",
        "2-3 processes require immediate review due to recent regulatory changes in data protection laws"
      ],
      "progress_justification": "Critical process assessments typically require 2-3 weeks each for thorough analysis. Current 70% completion rate aligns with industry standards for comprehensive process evaluation and stakeholder coordination requirements."
    },
    {
      "assessmentType": "Threat Risk Assessment",
      "completed": 8,
      "inProgress": 4,
      "pending": 1,
      "keyFindings": [
        "Phishing remains top threat vector accounting for 42% of security incidents per latest SANS survey",
        "Third-party risks increased 35% due to accelerated digital transformation and cloud adoption"
      ],
      "progress_justification": "Threat assessments require specialized cybersecurity expertise and threat intelligence analysis. 62% completion rate reflects standard pace for comprehensive threat evaluation and risk scoring methodologies."
    }
  ],
  "message": "Successfully generated assessment summaries"
}
```

### 8. Generate Recent Activities

**Endpoint:** `GET /api/dashboard/generate-recent-activities?days=7&limit=10`

**Purpose:** Generate realistic recent activities for the dashboard activity feed.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 7)
- `limit` (optional): Maximum number of activities to return (default: 10)

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "action": "Risk escalated",
      "user": "Jane Doe",
      "timestamp": "2024-06-01T10:15:00Z",
      "meta": "Risk: Data Breach"
    },
    {
      "action": "Threat added",
      "user": "John Smith",
      "timestamp": "2024-05-31T16:42:00Z",
      "meta": "Threat: Ransomware"
    }
  ],
  "message": "Successfully generated 10 recent activities"
}
```

### 9. Generate Risk Insights

**Endpoint:** `POST /api/dashboard/generate-risk-insights`

**Purpose:** Generate strategic risk insights and recommendations for executive dashboard.

**Request Body:**
```json
{
  "organization_context": "Global technology company with remote workforce",
  "focus_areas": ["Cybersecurity", "Supply Chain", "Regulatory Compliance"]
}
```

**Response:**
```json
{
  "success": true,
  "insights": [
    {
      "title": "Cybersecurity Threat Evolution",
      "description": "Increasing sophistication of cyber attacks requires enhanced security measures",
      "priority": "High",
      "recommendation": "Implement zero-trust architecture and advanced threat detection"
    }
  ],
  "trends": [
    "Increased remote work security challenges",
    "Regulatory compliance complexity"
  ],
  "kpis_to_monitor": [
    "Mean time to detect threats",
    "Risk mitigation completion rate"
  ],
  "message": "Successfully generated risk insights"
}
```

---

## Risk Mitigation Endpoint (Updated)

### 10. Generate Risk Mitigation Analysis

**Endpoint:** `POST /api/risk-mitigation`

**Purpose:** Generate comprehensive risk analysis and mitigation plan based on user responses to risk assessment questions.

**Request Body:**
```json
{
  "responses": [
    {
      "category": "Fire",
      "question": "Is the data centre equipped with an appropriate fire suppression system?",
      "user_answer": "We only have a few handheld fire extinguishers, and there's no automated system."
    }
  ]
}
```

**Response:**
```json
{
  "risk_analysis": {
    "risk_id": "RISK-001",
    "category": "Fire",
    "question": "Is the data centre equipped with an appropriate fire suppression system?",
    "user_answer": "We only have a few handheld fire extinguishers, and there's no automated system.",
    "risk_name": "Absence of automated fire suppression system",
    "identified_threat": "Increased risk of fire damage and personnel danger due to lack of automatic suppression systems.",
    "likelihood": "High",
    "impact": "Severe",
    "risk_value": 9,
    "residual_risk": "Critical",
    "current_control_description": "Only basic handheld extinguishers are available; no active fire suppression in place.",
    "current_control_rating": "Poor",
    "business_unit": "Facilities",
    "risk_owner": "Fire Safety Officer",
    "timeline": "Immediate",
    "mitigation_plan": "Install automated suppression systems like FM200 or Inergen and integrate with fire alarms.",
    "summary": {
      "risk_classification_summary": "This is a critical fire safety risk with a high likelihood and severe impact. It requires immediate action.",
      "mitigation_suggestions": [
        "Deploy automated gas-based fire suppression systems.",
        "Conduct fire safety training and drills.",
        "Regularly inspect and maintain suppression systems."
      ],
      "risk_trends": {
        "top_category": "Fire",
        "risk_severity": "Critical",
        "observations": [
          "Many facilities lack automated fire suppression.",
          "High fire risks stem from outdated or manual systems.",
          "Immediate remediation is crucial to prevent major incidents."
        ]
      }
    }
  }
}
```

---

## Justification and Evidence-Based Analysis

All endpoints now provide comprehensive justifications for their assessments and recommendations:

### Risk Assessment Justifications
- **Likelihood Justification**: Based on industry statistics, threat intelligence reports, and sector-specific incident data
- **Impact Justification**: References business dependencies, regulatory requirements, and potential financial/operational consequences
- **Threat Justification**: Explains why specific threats are relevant using industry reports, attack pattern analysis, and sector vulnerabilities

### Key Justification Sources
- **Industry Reports**: Verizon DBIR, CrowdStrike Global Threat Report, Ponemon Institute studies
- **Regulatory Frameworks**: NIST Cybersecurity Framework, ISO 27001/22301, GDPR, CCPA
- **Threat Intelligence**: MITRE ATT&CK, SANS surveys, FBI IC3 reports
- **Industry Standards**: COSO ERM, COBIT, ITIL frameworks
- **Academic Research**: Harvard Business Review, MIT studies, industry white papers

### Example Justification Types
1. **Statistical References**: "Phishing accounts for 36% of data breaches in financial services (Verizon DBIR 2024)"
2. **Regulatory Context**: "Critical risk ratio of 6.5% reflects mature risk management per NIST Framework guidelines"
3. **Industry Benchmarks**: "Completion rate aligns with industry standards for comprehensive process evaluation"
4. **Threat Intelligence**: "APTs have increased 125% in IT departments (Mandiant M-Trends 2024)"
5. **Cost Analysis**: "Average incident cost of $4.9M in technology sector (IBM Cost of Data Breach 2024)"

---

## Error Handling

All endpoints follow consistent error handling patterns:

**Success Response Structure:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

**Error Response Structure:**
```json
{
  "success": false,
  "error": "Error description",
  "status_code": 500,
  "details": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid input)
- `422`: Validation Error
- `500`: Internal Server Error

---

## Usage Notes

1. **AI-Generated Content**: All endpoints use advanced language models to generate realistic, contextually appropriate risk data.

2. **Fallback Mechanisms**: Each endpoint includes intelligent fallback responses in case of AI processing issues.

3. **Unique Identifiers**: Generated records include unique IDs for tracking and reference.

4. **Customizable Parameters**: Most endpoints accept optional parameters to customize the generated content.

5. **Industry-Specific Logic**: Responses are tailored based on industry, department, and organizational context.

6. **Rate Limiting**: Consider implementing rate limiting for production use to manage AI API costs.

7. **Validation**: All request models include validation to ensure data quality and consistency.

---

## Integration Examples

### PowerShell Example:
```powershell
$body = @{
  category = "Technology"
  department = "IT"
  business_context = "Cloud infrastructure with remote workforce"
  number_of_risks = 5
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/enterprise-ra/generate-risks" -Method Post -Body $body -ContentType "application/json"
```

### Python Example:
```python
import requests

data = {
    "category": "Technology",
    "department": "IT", 
    "business_context": "Cloud infrastructure with remote workforce",
    "number_of_risks": 5
}

response = requests.post(
    "http://localhost:8000/api/enterprise-ra/generate-risks",
    json=data
)
result = response.json()
```

### cURL Example:
```bash
curl -X POST "http://localhost:8000/api/enterprise-ra/generate-risks" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Technology",
    "department": "IT",
    "business_context": "Cloud infrastructure with remote workforce",
    "number_of_risks": 5
  }'
```

---

## Business Continuity Recovery Strategies Endpoint

### Generate Recovery Strategies

**Endpoint:** `POST /api/business-continuity/generate-recovery-strategies`

**Purpose:** Generate comprehensive business continuity recovery strategies for specific business processes, covering people, technology, site, and vendor unavailability scenarios.

**Use Cases:**
- Business continuity planning and strategy development
- Disaster recovery planning for critical business processes
- Resilience planning for operational dependencies
- Risk mitigation strategy development
- Compliance with business continuity standards (ISO 22301)

**Request Body:**
```json
{
  "business_process": {
    "department": "Finance",
    "sub_department": "Accounts Payable",
    "process_name": "Invoice Processing",
    "process_description": "Processing vendor invoices, approval workflows, and payment authorization for all company purchases"
  },
  "analysis_data": {
    "impact_analysis": {
      "rto": "4 hours",
      "rpo": "1 hour",
      "maximum_tolerable_downtime": "24 hours",
      "annual_revenue_impact": "$2.5M",
      "dependencies": ["ERP system", "banking systems", "approval workflows"]
    },
    "minimum_operating_requirements": {
      "staff_minimum": "2 senior staff",
      "technology_requirements": ["ERP access", "banking portal", "email system"],
      "workspace_requirements": "Secure location with internet access",
      "vendor_dependencies": ["primary bank", "ERP vendor", "internet provider"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "people_unavailability_strategy": "Establish cross-training programs for all invoice processing roles with documented procedures, maintain a rotation schedule to ensure multiple staff are familiar with critical functions, and create emergency contact lists for temporary qualified personnel from other departments. Implement role-based access controls and approval delegation workflows to ensure processing can continue with reduced staff.",
  "people_reasoning": "Cross-training and documentation are essential for invoice processing continuity since financial processes require specific expertise and regulatory compliance knowledge that cannot be easily replaced.",
  
  "technology_data_unavailability_strategy": "Implement automated daily backups of all invoice data with cloud-based storage, establish redundant ERP system access through secondary data centers, and maintain offline copies of critical vendor information and payment instructions. Deploy backup internet connections and mobile hotspots for emergency connectivity to banking systems.",
  "technology_reasoning": "Financial processes like invoice processing require real-time access to accurate data and secure banking connections, making technology redundancy critical for meeting payment deadlines and avoiding vendor relationship damage.",
  
  "site_unavailability_strategy": "Pre-configure secure remote access to all financial systems with VPN and multi-factor authentication, establish agreements for temporary workspace at alternate company locations, and ensure key personnel have secure home office setups with dedicated internet connections. Maintain physical copies of emergency vendor contact information and critical payment authorization documents.",
  "site_reasoning": "Invoice processing can be performed remotely when proper security controls are in place, but requires secure access to sensitive financial systems and confidential vendor information.",
  
  "third_party_vendors_unavailability_strategy": "Maintain relationships with backup banking partners for payment processing, establish secondary internet service providers with automatic failover, and negotiate service level agreements with ERP vendor for priority support during outages. Keep emergency contact information for all critical vendors and establish alternative communication channels.",
  "vendor_reasoning": "Invoice processing depends heavily on external banking systems and ERP infrastructure, requiring vendor diversification to ensure payment capabilities remain operational during service disruptions.",
  
  "message": "Successfully generated comprehensive recovery strategies"
}
```

**Key Features:**
- **Process-Specific Strategies**: Tailored recommendations based on the specific business process and its dependencies
- **Industry Best Practices**: Strategies aligned with ISO 22301 business continuity standards and industry frameworks
- **Actionable Recommendations**: Detailed, implementable steps with specific technologies and procedures
- **Risk-Based Reasoning**: Clear explanations for why each strategy is appropriate for the specific process
- **Comprehensive Coverage**: Addresses all major disruption scenarios (people, technology, site, vendor)
- **Regulatory Awareness**: Considers compliance requirements and regulatory impacts in strategy development

**Response Fields:**

| Field | Description |
|-------|-------------|
| `people_unavailability_strategy` | Detailed strategy for maintaining operations when key personnel are unavailable |
| `people_reasoning` | Justification for the people strategy based on process requirements |
| `technology_data_unavailability_strategy` | Strategy for handling IT system failures, data loss, or technology disruptions |
| `technology_reasoning` | Explanation of why the technology strategy fits the process requirements |
| `site_unavailability_strategy` | Plans for continuing operations when primary work locations are inaccessible |
| `site_reasoning` | Justification for site strategy based on process location dependencies |
| `third_party_vendors_unavailability_strategy` | Contingency plans for vendor, supplier, or service provider disruptions |
| `vendor_reasoning` | Explanation of vendor strategy relevance to process dependencies |

**Error Handling:**
- Provides intelligent fallback strategies when AI service is unavailable
- Generates process-specific recommendations based on request parameters
- Includes comprehensive error messages for troubleshooting

### cURL Example:
```bash
curl -X POST "http://localhost:8000/api/business-continuity/generate-recovery-strategies" \
  -H "Content-Type: application/json" \
  -d '{
    "business_process": {
      "department": "Finance",
      "sub_department": "Accounts Payable",
      "process_name": "Invoice Processing",
      "process_description": "Processing vendor invoices, approval workflows, and payment authorization"
    },
    "analysis_data": {
      "impact_analysis": {
        "rto": "4 hours",
        "rpo": "1 hour",
        "maximum_tolerable_downtime": "24 hours"
      },
      "minimum_operating_requirements": {
        "staff_minimum": "2 senior staff",
        "technology_requirements": ["ERP access", "banking portal"],
        "workspace_requirements": "Secure location with internet access"
      }
    }
  }'
```

### Postman Collection Setup:

**Request Configuration:**
- **Method**: POST
- **URL**: `{{base_url}}/business-continuity/api/business-continuity/generate-recovery-strategies`
- **Headers**: `Content-Type: application/json`

**Test Scenarios:**

*Financial Process Example:*
```json
{
  "business_process": {
    "department": "Finance",
    "sub_department": "Treasury",
    "process_name": "Cash Management",
    "process_description": "Daily cash flow monitoring, bank reconciliation, and liquidity management"
  },
  "analysis_data": {
    "impact_analysis": {
      "rto": "2 hours",
      "maximum_tolerable_downtime": "8 hours",
      "dependencies": ["banking systems", "treasury management system"]
    }
  }
}
```

*IT Operations Example:*
```json
{
  "business_process": {
    "department": "IT",
    "sub_department": "Infrastructure",
    "process_name": "Server Monitoring",
    "process_description": "24/7 monitoring of critical IT infrastructure and incident response"
  },
  "analysis_data": {
    "impact_analysis": {
      "rto": "15 minutes",
      "maximum_tolerable_downtime": "1 hour",
      "dependencies": ["monitoring tools", "alerting systems", "ticketing system"]
    }
  }
}
```

*HR Process Example:*
```json
{
  "business_process": {
    "department": "Human Resources",
    "sub_department": "Payroll",
    "process_name": "Payroll Processing",
    "process_description": "Bi-weekly payroll calculation, tax withholding, and direct deposit processing"
  },
  "analysis_data": {
    "impact_analysis": {
      "rto": "24 hours",
      "maximum_tolerable_downtime": "72 hours",
      "dependencies": ["HRIS system", "banking integration", "tax calculation system"]
    }
  }
}
```
