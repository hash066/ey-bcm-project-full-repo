---
title: Ey Catalyst
emoji: 📊
colorFrom: yellow
colorTo: purple
sdk: docker
pinned: false
license: mit
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

# EY Catalyst - Business Impact Assessment & Risk Management API

An advanced AI-powered FastAPI application for Business Impact Assessment (BIA), threat identification, and risk mitigation analysis. This tool helps organizations identify, assess, and mitigate risks across their business processes using sophisticated AI models with evidence-based justifications.

## 🚀 Features

- **Process Risk Assessment**: Generate comprehensive threat analyses for business processes
- **Risk Mitigation Planning**: Create actionable mitigation strategies with revised risk ratings
- **Geographic Threat Assessment**: Analyze location-specific threats and risks
- **Enterprise Risk Assessment**: Generate comprehensive risk and threat analyses for enterprise scenarios
- **Dashboard Analytics**: Create KPIs and assessment summaries for executive reporting
- **Evidence-Based Justifications**: All risk assessments include detailed justifications backed by industry data
- **AI-Powered Analysis**: Uses advanced language models (Groq/Llama) for intelligent risk assessment
- **RESTful API**: Easy integration with existing systems and frontends
- **Interactive Documentation**: Built-in Swagger UI for API exploration

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Enhanced Justification Features](#enhanced-justification-features)
- [Input/Output Changes](#inputoutput-changes)
- [Use Cases](#use-cases)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

## 🔍 Enhanced Justification Features

### Overview
All risk analysis endpoints now include comprehensive justifications backed by industry data, regulatory frameworks, and established risk management methodologies. This enhancement provides credible, evidence-based reasoning for all risk assessments.

### Justification Types

#### 1. **Likelihood Justification**
- **Purpose**: Explains why the risk has the assigned likelihood rating
- **Sources**: Industry statistics, historical data, framework assessments
- **Example**: "High likelihood based on Verizon DBIR 2024 showing 68% of breaches take months to discover"

#### 2. **Impact Justification**  
- **Purpose**: Details the reasoning behind impact severity ratings
- **Sources**: Financial impact studies, regulatory compliance costs, business disruption analysis
- **Example**: "Severe impact due to potential regulatory fines (average $4.88M per IBM Security)"

#### 3. **Risk Value Justification**
- **Purpose**: Explains the mathematical calculation of risk scores
- **Sources**: Risk assessment methodologies (ISO 31000, NIST, COSO)
- **Example**: "Risk value of 8 calculated using NIST Cybersecurity Framework methodology"

#### 4. **Timeline Justification**
- **Purpose**: Supports the urgency and timeline for risk treatment
- **Sources**: Regulatory requirements, industry best practices, threat evolution rates
- **Example**: "Immediate timeline required due to increasing cyber threat velocity"

#### 5. **Summary Justification**
- **Purpose**: Provides overall assessment rationale and strategic context
- **Sources**: Enterprise risk management frameworks, business impact analysis
- **Example**: "Critical classification based on high likelihood and severe business impact"

#### 6. **Trend Justification**
- **Purpose**: Contextualizes risks within current industry trends and threat landscape
- **Sources**: Annual security reports, industry surveys, threat intelligence
- **Example**: "Cybercrime incidents increased 38% in 2024 per FBI IC3 report"

### Industry Data Sources
- **NIST Cybersecurity Framework**: Risk assessment methodologies
- **ISO 31000**: International risk management standards
- **COSO ERM**: Enterprise risk management framework
- **Verizon DBIR**: Annual data breach investigation reports
- **IBM Security Reports**: Cost of data breach studies
- **FBI IC3**: Internet crime complaint center reports
- **SANS Surveys**: Security awareness and training effectiveness
- **Ponemon Institute**: Privacy and data protection research
- **NFPA Standards**: Fire protection and safety guidelines
- **FM Global**: Property risk engineering data

## 📝 Input/Output Changes

### What's New in API Responses

#### Enhanced Risk Analysis Model
All risk analysis responses now include these additional fields:

```json
{
  "risk_analysis": {
    // ... existing fields ...
    "likelihood_justification": "Evidence-based explanation for likelihood rating",
    "impact_justification": "Evidence-based explanation for impact severity", 
    "risk_value_justification": "Calculation methodology and framework reference",
    "timeline_justification": "Reasoning for urgency and timeline requirements",
    "summary": {
      // ... existing fields ...
      "summary_justification": "Overall assessment rationale and strategic context",
      "risk_trends": {
        // ... existing fields ...
        "trend_justification": "Industry trend analysis and risk landscape context"
      }
    }
  }
}
```

#### Enhanced Mitigation Suggestions
Mitigation recommendations now include:
- **Specific industry standards** (NIST SP 800-61, NFPA 2001)
- **Implementation frameworks** (SOAR integration, automated systems)
- **Quantified benefits** (percentage improvements, cost reductions)

#### Enhanced Observations
Risk trend observations now include:
- **Statistical data** from industry reports
- **Quantified metrics** (percentages, timeframes)
- **Research citations** from established institutions

### Backward Compatibility
- **Fully Compatible**: All existing API integrations will continue to work
- **Additive Changes**: New justification fields are additions only
- **No Breaking Changes**: No existing fields have been modified or removed

### Migration Guide
For existing integrations:
1. **No immediate action required** - APIs remain fully functional
2. **Optional enhancement** - Update client applications to display new justification fields
3. **Recommended** - Utilize justifications for improved user experience and credibility

## 🛠️ Installation

### Prerequisites

- Python 3.8+
- GROQ API Key (for AI model access)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ey-catalyst
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the application**
   ```bash
   uvicorn app:app --reload --port 8000
   ```

5. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Base URL: http://localhost:8000

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key for Groq language model service | Yes |

### Supported Models

- **llama3-8b-8192**: Primary model for risk analysis and threat assessment

## 🔗 API Endpoints

### 1. Process Threat Generation

**Endpoint**: `POST /api/generate-threats`

Generates comprehensive threat assessments for business processes.

**Use Cases**:
- Business continuity planning
- Risk register development
- Process vulnerability assessment
- Compliance risk analysis

**Request Body**:
```json
{
  "processName": "Financial Transaction Processing",
  "department": "Finance",
  "description": "Handles all daily banking transactions",
  "owner": "John Doe",
  "businessContext": "Supports daily liquidity tracking",
  "rto": "1hour",
  "mtpd": "24hours",
  "minTolerableDowntime": "15minutes"
}
```

**Response**:
```json
{
  "threats": [
    {
      "id": 1,
      "name": "Cyber Attack",
      "description": "Malicious attack disrupting core operations",
      "likelihood": 3,
      "impact": 4,
      "category": "Security",
      "mitigation": "Use firewalls and real-time monitoring"
    }
  ]
}
```

### 2. Risk Mitigation Analysis

**Endpoint**: `POST /api/risk-mitigation`

Provides mitigation strategies and revised risk assessments for identified threats.

**Use Cases**:
- Risk treatment planning
- Control effectiveness assessment
- Residual risk calculation
- Mitigation cost-benefit analysis

**Request Body**:
```json
{
  "responses": [
    {
      "category": "Fire",
      "question": "Is the data centre equipped with an appropriate fire suppression system?",
      "user_answer": "We only have a few handheld fire extinguishers, and there's no automated system."
    },
    {
      "category": "Cybercrime",
      "question": "Is there a well-documented and tested incident response plan?",
      "user_answer": "There is a response plan but it hasn't been tested in the last 2 years."
    }
  ]
}
```

**Response**:
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

### 3. Geographic Threat Assessment

**Endpoint**: `POST /bia/threat-assessment`

Analyzes location-specific threats and geopolitical risks.

**Use Cases**:
- International expansion risk assessment
- Supply chain geographical risk analysis
- Office location security evaluation
- Political stability assessment

**Request Body**:
```json
{
  "message": "Our company is planning to establish operations in Southeast Asia, specifically in Singapore and Bangkok."
}
```

**Response**:
```json
{
  "place": "Southeast Asia (Singapore, Bangkok)",
  "threats": [
    {
      "name": "Political Instability",
      "likelihood": 2,
      "severity": 4,
      "impact": "Potential disruption to business operations",
      "threat_rating": 8
    }
  ]
}
```

### 4. Impact Analysis (Placeholder)

**Endpoint**: `POST /bia/impact-analysis`

Reserved for future Business Impact Analysis functionality.

## 🎯 Use Cases

### 1. Enterprise Risk Management

**Scenario**: Large corporation conducting annual risk assessment

**Process**:
1. Use `/api/generate-threats` for each critical business process
2. Consolidate identified threats into risk register
3. Use `/api/risk-mitigation` to develop treatment plans
4. Monitor and update mitigation strategies quarterly

**Benefits**:
- Comprehensive threat identification
- Consistent risk assessment methodology
- Actionable mitigation strategies
- Regulatory compliance support

### 2. Business Continuity Planning

**Scenario**: Financial services firm developing BCP

**Process**:
1. Map critical processes and dependencies
2. Generate threat assessments using AI analysis
3. Determine recovery objectives (RTO/MTPD)
4. Develop mitigation and recovery strategies

**Benefits**:
- Reduced business disruption
- Faster recovery times
- Improved stakeholder confidence
- Regulatory compliance

### 3. Vendor Risk Assessment

**Scenario**: Evaluating third-party service providers

**Process**:
1. Assess vendor-specific threats and controls
2. Generate mitigation recommendations
3. Calculate residual risk post-mitigation
4. Develop ongoing monitoring strategies

**Benefits**:
- Informed vendor selection
- Reduced supply chain risks
- Clear accountability frameworks
- Continuous risk monitoring

### 4. Geographic Expansion Planning

**Scenario**: Multinational expanding to new markets

**Process**:
1. Use geographic threat assessment for target locations
2. Evaluate political, economic, and security risks
3. Develop location-specific risk mitigation plans
4. Establish local risk monitoring capabilities

**Benefits**:
- Informed market entry decisions
- Reduced operational risks
- Better resource allocation
- Enhanced stakeholder confidence

## 📊 Request/Response Examples

### Complete Process Risk Assessment

**Request**:
```bash
curl -X POST "http://localhost:8000/api/generate-threats" \
  -H "Content-Type: application/json" \
  -d '{
    "processName": "Customer Data Processing",
    "department": "IT Operations",
    "description": "Manages customer personal and financial data",
    "owner": "Data Protection Officer",
    "businessContext": "Critical for customer service and compliance",
    "rto": "2hours",
    "mtpd": "8hours",
    "minTolerableDowntime": "30minutes"
  }'
```

**Response**:
```json
{
  "threats": [
    {
      "id": 1,
      "name": "Data Breach",
      "description": "Unauthorized access to customer personal and financial data could result in regulatory fines, legal action, and reputational damage",
      "likelihood": 3,
      "impact": 5,
      "category": "Security",
      "mitigation": "Implement encryption, access controls, and regular security audits"
    },
    {
      "id": 2,
      "name": "System Outage",
      "description": "Hardware or software failure could disrupt customer service operations beyond acceptable RTO",
      "likelihood": 4,
      "impact": 4,
      "category": "Operational",
      "mitigation": "Deploy redundant systems and automated failover mechanisms"
    }
  ]
}
```

### Risk Mitigation Planning

**Request**:
```bash
curl -X POST "http://localhost:8000/api/risk-mitigation" \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {
        "category": "Cybercrime",
        "question": "Is there a well-documented and tested incident response plan?",
        "user_answer": "There is a response plan but it hasn't been tested in the last 2 years."
      }
    ]
  }'
```

**Response**:
```json
{
  "risk_analysis": {
    "risk_id": "RISK-002",
    "category": "Cybercrime",
    "question": "Is there a well-documented and tested incident response plan?",
    "user_answer": "There is a response plan but it hasn't been tested in the last 2 years.",
    "risk_name": "Outdated incident response planning",
    "identified_threat": "Delayed or ineffective response to cyber incidents due to outdated procedures",
    "likelihood": "High",
    "impact": "Severe",
    "risk_value": 8,
    "residual_risk": "High",
    "current_control_description": "Outdated incident response plan without recent testing",
    "current_control_rating": "Poor",
    "business_unit": "Information Technology",
    "risk_owner": "CISO",
    "timeline": "Immediate",
    "mitigation_plan": "Update incident response plan, conduct regular testing, and implement automated threat detection",
    "summary": {
      "risk_classification_summary": "High-risk cybersecurity vulnerability requiring prompt remediation",
      "mitigation_suggestions": [
        "Update and test incident response plan quarterly",
        "Implement automated threat detection systems",
        "Conduct regular cybersecurity training"
      ],
      "risk_trends": {
        "top_category": "Cybercrime",
        "risk_severity": "High",
        "observations": [
          "Incident response plans are outdated across organization",
          "Limited testing reduces effectiveness of responses",
          "Regular plan updates and testing are essential"
        ]
      }
    }
  }
}
```

## 📮 Postman Setup Guide

### Prerequisites
- Postman installed (download from [postman.com](https://www.postman.com/downloads/))
- API server running locally on `http://localhost:8000`

### 1. Process Threat Generation Endpoint

**Create New Request:**
- **Method**: `POST`
- **URL**: `http://localhost:8000/api/generate-threats`
- **Name**: "Generate Process Threats"

**Headers:**
- **Key**: `Content-Type`
- **Value**: `application/json`

**Request Body (raw JSON):**
```json
{
  "processName": "Financial Transaction Processing",
  "department": "Finance",
  "description": "Handles all daily banking transactions and payment processing",
  "owner": "John Smith",
  "businessContext": "Critical for daily operations and customer payments",
  "rto": "1hour",
  "mtpd": "24hours",
  "minTolerableDowntime": "15minutes"
}
```

**Alternative Test Cases:**

*IT Infrastructure Process:*
```json
{
  "processName": "Email Server Management",
  "department": "IT Operations",
  "description": "Manages corporate email infrastructure and communications",
  "owner": "IT Manager",
  "businessContext": "Essential for internal and external communications",
  "rto": "4hours",
  "mtpd": "48hours",
  "minTolerableDowntime": "1hour"
}
```

*HR Process:*
```json
{
  "processName": "Payroll Processing",
  "department": "Human Resources",
  "description": "Monthly salary and benefits processing for all employees",
  "owner": "Payroll Manager",
  "businessContext": "Critical for employee satisfaction and legal compliance",
  "rto": "8hours",
  "mtpd": "72hours",
  "minTolerableDowntime": "24hours"
}
```

### 2. Risk Mitigation Analysis Endpoint

**Create New Request:**
- **Method**: `POST`
- **URL**: `http://localhost:8000/api/risk-mitigation`
- **Name**: "Risk Mitigation Analysis"

**Headers:**
- **Key**: `Content-Type`
- **Value**: `application/json`

**Request Body (raw JSON):**
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

**Multiple Risk Questions Example:**
```json
{
  "responses": [
    {
      "category": "Fire",
      "question": "Is the data centre equipped with an appropriate fire suppression system?",
      "user_answer": "We only have a few handheld fire extinguishers, and there's no automated system."
    },
    {
      "category": "Cybercrime", 
      "question": "Is there a well-documented and tested incident response plan?",
      "user_answer": "There is a response plan but it hasn't been tested in the last 2 years."
    }
  ]
}
```

**Additional Risk Categories Examples:**
```json
{
  "responses": [
    {
      "category": "Physical Security",
      "question": "Are there adequate access controls for all critical facilities?",
      "user_answer": "We have basic card access but no multifactor authentication or visitor management."
    }
  ]
}
```

```json
{
  "responses": [
    {
      "category": "Business Continuity",
      "question": "Do you have tested backup systems for critical operations?",
      "user_answer": "We have backups but testing is irregular and there's no formal recovery procedure documented."
    }
  ]
}
```

### 3. Geographic Threat Assessment Endpoint

**Create New Request:**
- **Method**: `POST`
- **URL**: `http://localhost:8000/bia/threat-assessment`
- **Name**: "Geographic Threat Assessment"

**Headers:**
- **Key**: `Content-Type`
- **Value**: `application/json`

**Request Body (raw JSON):**
```json
{
  "message": "Our company is planning to establish operations in Southeast Asia, specifically in Singapore and Bangkok."
}
```

**Alternative Geographic Scenarios:**

*European Expansion:*
```json
{
  "message": "We are considering opening offices in Eastern Europe, particularly in Poland, Czech Republic, and Hungary for our manufacturing operations."
}
```

*Middle East Assessment:*
```json
{
  "message": "Risk assessment needed for expanding our financial services into the Middle East, focusing on UAE, Saudi Arabia, and Qatar."
}
```

*Latin America Supply Chain:*
```json
{
  "message": "Evaluating supply chain risks across Latin America including Mexico, Brazil, Argentina, and Colombia for our automotive parts business."
}
```

*African Market Entry:*
```json
{
  "message": "Planning to enter African markets for telecommunications infrastructure, targeting South Africa, Nigeria, and Kenya."
}
```

### 4. Postman Collection Setup

**Create a Collection:**
1. Click "New" → "Collection"
2. Name: "EY Catalyst Risk Management API"
3. Add all three requests to this collection

**Environment Variables:**
1. Create environment: "EY Catalyst Local"
2. Add variable:
   - **Variable**: `base_url`
   - **Initial Value**: `http://localhost:8000`
   - **Current Value**: `http://localhost:8000`

**Update URLs to use environment:**
- Change URLs to: `{{base_url}}/api/generate-threats`
- Change URLs to: `{{base_url}}/api/risk-mitigation`
- Change URLs to: `{{base_url}}/bia/threat-assessment`

### 5. Testing Workflow

**Recommended Testing Sequence:**

1. **Start with Threat Generation:**
   - Test with different business processes
   - Verify threat categories and severity levels
   - Note generated threat IDs for follow-up

2. **Follow with Risk Mitigation:**
   - Use threats from step 1 or create new risk scenarios
   - Test single and multiple risk items
   - Verify mitigation plans are actionable

3. **Conclude with Geographic Assessment:**
   - Test various global regions
   - Compare risk profiles across locations
   - Validate threat ratings and categories

### 6. Expected Response Validation

**Threat Generation Response Structure:**
```json
{
  "threats": [
    {
      "id": 1,
      "name": "string",
      "description": "string",
      "likelihood": 1-5,
      "impact": 1-5,
      "category": "string",
      "mitigation": "string"
    }
  ]
}
```

**Risk Mitigation Response Structure:**
```json
{
  "risk_analysis": {
    "risk_id": "RISK-XXX",
    "category": "string",
    "question": "string",
    "user_answer": "string",
    "risk_name": "string",
    "identified_threat": "string",
    "likelihood": "string",
    "impact": "string",
    "risk_value": 1-10,
    "residual_risk": "string",
    "current_control_description": "string",
    "current_control_rating": "string",
    "business_unit": "string",
    "risk_owner": "string",
    "timeline": "string",
    "mitigation_plan": "string",
    "summary": {
      "risk_classification_summary": "string",
      "mitigation_suggestions": ["string", "string", "string"],
      "risk_trends": {
        "top_category": "string",
        "risk_severity": "string",
        "observations": ["string", "string", "string"]
      }
    }
  }
}
```

**Geographic Assessment Response Structure:**
```json
{
  "place": "string",
  "threats": [
    {
      "name": "string",
      "likelihood": 1-5,
      "severity": 1-5,
      "impact": "string",
      "threat_rating": 1-25
    }
  ]
}
```

### 7. Troubleshooting

**Common Issues:**
- **Server not running**: Ensure `uvicorn app:app --reload` is active
- **Port conflicts**: Check if port 8000 is available
- **JSON validation errors**: Verify request body format
- **Missing headers**: Confirm `Content-Type: application/json`

**Success Indicators:**
- Status Code: `200 OK`
- Response contains expected JSON structure
- AI-generated content in responses
- Fallback responses when AI is unavailable

## 🚨 Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "detail": "Invalid request format or missing required fields"
}
```

**422 Validation Error**:
```json
{
  "detail": [
    {
      "loc": ["body", "processName"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error**:
```json
{
  "detail": "AI service temporarily unavailable. Fallback response provided."
}
```

### Fallback Mechanisms

The API includes intelligent fallback responses when AI services are unavailable:

- **Threat Generation**: Returns common business process threats
- **Risk Mitigation**: Provides category-based mitigation strategies
- **Geographic Assessment**: Returns general location risk factors

## 🔧 Deployment Troubleshooting

### Hugging Face Spaces Deployment Issues

#### **Problem**: "Connection error" or "Error generating risks: Connection error."
**Symptoms**:
- 500 Internal Server Error responses
- API endpoints failing with connection errors
- "GROQ API connection failed" messages

**Solutions**:

1. **Check GROQ API Key Configuration**:
   - Go to your Hugging Face Space settings
   - Navigate to "Variables and secrets" 
   - Ensure `GROQ_API_KEY` is set as a **Secret** (not a variable)
   - Verify the API key is valid and has sufficient credits
   - Restart the Space after adding/updating the key

2. **Verify Environment Variable Format**:
   ```bash
   # Correct format in HF Spaces:
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```

3. **Test API Key Validity**:
   ```bash
   curl -X GET "https://api.groq.com/openai/v1/models" \
     -H "Authorization: Bearer gsk_your_api_key_here"
   ```

4. **Check Space Logs**:
   - Go to your Space's "Logs" tab
   - Look for startup errors or API connection failures
   - Restart the Space if environment variables were updated

#### **Problem**: 404 Not Found on API endpoints
**Symptoms**:
- Endpoints returning 404 errors
- API documentation not showing expected routes

**Solutions**:

1. **Verify Endpoint URLs**:
   ```bash
   # Correct URLs for HF Spaces:
   https://your-space-name.hf.space/enterprise/api/enterprise-ra/generate-risks
   https://your-space-name.hf.space/threat/api/threat-ra/generate-threat-risks
   https://your-space-name.hf.space/dashboard/api/dashboard/generate-kpis
   ```

2. **Check API Documentation**:
   ```bash
   # Access Swagger UI:
   https://your-space-name.hf.space/docs
   ```

#### **Problem**: Space not starting or constant restarts
**Symptoms**:
- Space shows "Building" status indefinitely
- Frequent application restarts
- Import errors in logs

**Solutions**:

1. **Check Dependencies**:
   - Ensure all packages in `requirements.txt` are compatible
   - Verify Python version compatibility (use Python 3.10)

2. **Review Dockerfile**:
   ```dockerfile
   FROM python:3.10-slim
   RUN mkdir -p /data/huggingface && chmod -R 777 /data/huggingface
   ENV HF_HOME=/data/huggingface
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
   ```

3. **Port Configuration**:
   - Hugging Face Spaces require port 7860
   - Ensure Dockerfile uses the correct port

### Local Development Issues

#### **Problem**: Import errors or module not found
**Solutions**:
```bash
# Ensure all dependencies are installed:
pip install -r requirements.txt

# Verify Python path:
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### **Problem**: GROQ API rate limits
**Solutions**:
- Implement exponential backoff
- Consider upgrading GROQ plan for higher rate limits
- Use fallback responses during high traffic

### Testing Deployment

#### **Test Endpoints Programmatically**:
```python
import requests
import json

# Test HF Space endpoint
base_url = "https://your-space-name.hf.space"
test_data = {
    "category": "Financial",
    "department": "Finance",
    "business_context": "Test deployment",
    "specific_concerns": "API connectivity test",
    "number_of_risks": 1
}

response = requests.post(
    f"{base_url}/enterprise/api/enterprise-ra/generate-risks",
    json=test_data,
    timeout=30
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

#### **Quick Health Check**:
```bash
# Check if the Space is responding:
curl -X GET "https://your-space-name.hf.space/docs"

# Test a simple endpoint:
curl -X POST "https://your-space-name.hf.space/enterprise/api/enterprise-ra/generate-risks" \
  -H "Content-Type: application/json" \
  -d '{"category":"Test","department":"Test","business_context":"Health check","specific_concerns":"Deployment test","number_of_risks":1}'
```

### Performance Optimization

1. **Cold Start Mitigation**:
   - HF Spaces may have cold starts after inactivity
   - First request after idle period may be slower
   - Consider implementing a keepalive mechanism

2. **Timeout Settings**:
   - Set appropriate timeouts for API calls (30+ seconds)
   - Handle timeout gracefully with fallback responses

3. **Resource Monitoring**:
   - Monitor Space resource usage in HF interface
   - Consider upgrading to faster hardware tiers for production

## 🔧 Technical Architecture

### Components

1. **FastAPI Framework**: RESTful API with automatic documentation
2. **Pydantic Models**: Request/response validation and serialization
3. **Groq Integration**: AI-powered analysis using Llama models
4. **Fallback Logic**: Intelligent responses when AI is unavailable
5. **JSON Processing**: Robust parsing of AI-generated responses

### Security Considerations

- **API Key Management**: Secure handling of external service credentials
- **Input Validation**: Comprehensive request validation using Pydantic
- **Error Handling**: Graceful degradation with meaningful error messages
- **Rate Limiting**: Consider implementing for production deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs`

---

**Built with ❤️ for enterprise risk management and business continuity**

---

## Site Risk Assessment Endpoint

### Overview
The Site Risk Assessment endpoint provides comprehensive risk analysis for physical locations based on detailed site characteristics, building information, and compliance status. This endpoint is specifically designed for facilities management and safety assessment.

### Endpoint Details
- **Method**: `POST`
- **URL**: `/api/site-risk-assessment`
- **Purpose**: Generate detailed site-specific risk assessments based on physical location characteristics

### Use Cases
- **Facilities Risk Management**: Comprehensive assessment of physical site risks
- **Fire Safety Compliance**: Detailed fire risk analysis for commercial buildings
- **Insurance Risk Assessment**: Site-specific risk evaluation for insurance purposes
- **Regulatory Compliance**: Assessment against building codes and safety standards
- **Emergency Planning**: Risk analysis for emergency response planning
- **Property Management**: Ongoing risk monitoring for managed properties

### Request Body
```json
{
  "riskCategory": "Fire Safety",
  "controlQuestion": "Are fire extinguishers available and regularly inspected?",
  "complianceStatus": "Yes, fire extinguishers are available on each floor and inspected monthly.",
  "address_of_location": "123 Corporate Park, Mumbai",
  "nature_of_occupancy": "Office space with attached cafeteria",
  "building_construction_details": "RCC framed structure with glass facade",
  "nature_of_other_occupancies": "Shared with retail stores on ground floor, clear separation exists",
  "total_floors_and_communication": "10 floors with 2 staircases and 3 elevators",
  "total_floor_area": "25,000 sq. ft.",
  "maximum_undivided_area": "3,000 sq. ft.",
  "floors_occupied": "3",
  "building_age": "12 years",
  "stability_certificate": "Yes",
  "fire_noc_availability": "Yes, renewed annually",
  "people_working_floor_wise": "Ground: 10, 1st: 50, 2nd: 45",
  "max_visitors_peak_day": "Around 80",
  "business_hours": "Mon–Fri, 9:00 AM to 6:00 PM",
  "power_backup_details": "100 kVA DG installed with 8-hour backup",
  "store_room_stacking": "Properly labeled, no obstruction to exits",
  "floor_covering_nature": "Antistatic carpet in work areas",
  "false_ceiling_details": "Gypsum tiles with concealed lighting",
  "hvac_system_details": "Centralized HVAC with AHUs on each floor",
  "area_passage_around_building": "2-meter fire vehicle access on all sides"
}
```

### Response Format
```json
{
  "risk_id": "RISK-001",
  "category": "Fire Safety",
  "business_unit": "Facilities",
  "risk_owner": "Fire Safety Officer",
  "timeline": "Immediate",
  "risk_name": "Inadequate fire suppression coverage for office complex",
  "question": "Are fire extinguishers available and regularly inspected?",
  "compliance_status": "Yes, fire extinguishers are available on each floor and inspected monthly.",
  "identified_threat": "Fire spread risk due to limited suppression systems in high-occupancy areas",
  "likelihood": 6,
  "impact": 8,
  "risk_value": 48,
  "residual_risk": "High",
  "current_control_description": "Manual fire extinguishers with monthly inspections, no automated suppression",
  "current_control_rating": "Fair",
  "mitigation_plan": "Install automated fire suppression systems in high-risk areas, upgrade emergency evacuation systems, and enhance fire detection coverage",
  "site_details": {
    "site_name": "Corporate Office Complex - Mumbai",
    "address": "123 Corporate Park, Mumbai",
    "building_type": "Commercial Office",
    "floor_area_sq_ft": 25000,
    "occupancy_type": "Office space with attached cafeteria",
    "year_of_construction": 2012,
    "no_of_floors": 10
  },
  "risk_classification_summary": "High-priority fire safety risk due to building age, occupancy density, and limited automated suppression systems. Requires immediate attention per NFPA guidelines.",
  "mitigation_suggestions": [
    "Install automatic sprinkler systems per NFPA 13 standards",
    "Upgrade fire alarm systems with voice evacuation capabilities",
    "Implement quarterly fire drills and emergency response training",
    "Establish fire safety committee and regular risk assessments"
  ],
  "risk_trends": {
    "top_category": "Fire Safety",
    "risk_severity": "High",
    "observations": [
      "Buildings over 10 years require enhanced fire safety measures",
      "High-density office occupancy increases evacuation complexity",
      "Mixed-use buildings require comprehensive fire separation strategies"
    ]
  }
}
```

### Key Features

#### **Comprehensive Site Analysis**
- **Building Characteristics**: Construction type, age, and structural details
- **Occupancy Patterns**: Personnel distribution, visitor capacity, and usage patterns
- **Safety Systems**: Fire protection, HVAC, electrical, and emergency systems
- **Compliance Status**: Regulatory certifications and inspection records

#### **Evidence-Based Assessment**
- **Building Code References**: NFPA standards, International Building Code (IBC)
- **Occupancy Load Analysis**: Egress capacity and evacuation requirements
- **Historical Risk Data**: Industry-specific incident patterns and trends
- **Regulatory Compliance**: Local fire codes and safety regulations

#### **Actionable Recommendations**
- **Specific Mitigation Plans**: Targeted improvements based on site characteristics
- **Timeline Prioritization**: Risk-based scheduling for remediation activities
- **Cost-Effectiveness**: Practical solutions considering budget constraints
- **Compliance Alignment**: Recommendations aligned with regulatory requirements

### Integration Examples

#### **cURL Example**
```bash
curl -X POST "http://localhost:8000/api/site-risk-assessment" \
  -H "Content-Type: application/json" \
  -d '{
    "riskCategory": "Fire Safety",
    "controlQuestion": "Are fire extinguishers available and regularly inspected?",
    "complianceStatus": "Yes, fire extinguishers are available on each floor and inspected monthly.",
    "address_of_location": "123 Corporate Park, Mumbai",
    "nature_of_occupancy": "Office space with attached cafeteria",
    "building_construction_details": "RCC framed structure with glass facade",
    "nature_of_other_occupancies": "Shared with retail stores on ground floor, clear separation exists",
    "total_floors_and_communication": "10 floors with 2 staircases and 3 elevators",
    "total_floor_area": "25,000 sq. ft.",
    "maximum_undivided_area": "3,000 sq. ft.",
    "floors_occupied": "3",
    "building_age": "12 years",
    "stability_certificate": "Yes",
    "fire_noc_availability": "Yes, renewed annually",
    "people_working_floor_wise": "Ground: 10, 1st: 50, 2nd: 45",
    "max_visitors_peak_day": "Around 80",
    "business_hours": "Mon–Fri, 9:00 AM to 6:00 PM",
    "power_backup_details": "100 kVA DG installed with 8-hour backup",
    "store_room_stacking": "Properly labeled, no obstruction to exits",
    "floor_covering_nature": "Antistatic carpet in work areas",
    "false_ceiling_details": "Gypsum tiles with concealed lighting",
    "hvac_system_details": "Centralized HVAC with AHUs on each floor",
    "area_passage_around_building": "2-meter fire vehicle access on all sides"
  }'
```

#### **Python Integration**
```python
import requests

# Site risk assessment request
site_data = {
    "riskCategory": "Fire Safety",
    "controlQuestion": "Are fire extinguishers available and regularly inspected?",
    "complianceStatus": "Yes, fire extinguishers are available on each floor and inspected monthly.",
    "address_of_location": "123 Corporate Park, Mumbai",
    "nature_of_occupancy": "Office space with attached cafeteria",
    # ... other site details
}

response = requests.post(
    "http://localhost:8000/api/site-risk-assessment",
    json=site_data
)

if response.status_code == 200:
    assessment = response.json()
    print(f"Risk Level: {assessment['residual_risk']}")
    print(f"Risk Score: {assessment['risk_value']}")
    print(f"Mitigation Plan: {assessment['mitigation_plan']}")
else:
    print(f"Error: {response.text}")
```

#### **JavaScript Integration**
```javascript
const siteAssessment = async (siteData) => {
  try {
    const response = await fetch('/api/site-risk-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(siteData)
    });
    
    if (response.ok) {
      const assessment = await response.json();
      return {
        riskId: assessment.risk_id,
        riskLevel: assessment.residual_risk,
        mitigationPlan: assessment.mitigation_plan,
        siteDetails: assessment.site_details
      };
    } else {
      throw new Error('Assessment failed');
    }
  } catch (error) {
    console.error('Site assessment error:', error);
    return null;
  }
};
```

### Error Handling

The endpoint provides comprehensive error handling with specific error codes:

- **400 Bad Request**: Invalid input data or missing required fields
- **422 Validation Error**: Data validation failures
- **500 Internal Server Error**: AI processing errors with fallback responses

### Fallback Mechanism

If AI processing fails, the endpoint provides intelligent fallback responses based on:
- **Building Age Analysis**: Risk assessment based on construction year
- **Occupancy Density**: Risk factors related to personnel count
- **Floor Area Considerations**: Space-based risk calculations
- **Compliance Status**: Assessment based on current safety measures
