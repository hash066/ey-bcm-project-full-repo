---
title: Enhanced Procedures LLM Endpoints
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# Enhanced Procedures LLM Endpoints

This Hugging Face Space provides comprehensive LLM endpoints for Business Continuity Management (BCM) procedures and related business resilience activities.

## Features

### Core Endpoints
- **Process Descriptions**: Generate detailed descriptions for various BCM processes
- **Peak Period Analysis**: Predict operational peak periods by department and sector
- **Impact Scale Matrices**: Generate comprehensive impact assessment matrices
- **BCM Policy Generation**: Create standards-aligned BCM policies
- **BCM Questions**: Generate comprehensive planning questions

### Enhanced Endpoints
- **Recovery Strategies**: Generate recovery strategy recommendations based on RTO requirements
- **Risk Scenarios**: Generate sector-specific risk scenarios for planning

## API Usage

Base URL: `https://inchara20-procedures-llm-endpoints.hf.space`

### Authentication
Include your Hugging Face token in the Authorization header:
```
Authorization: Bearer YOUR_HF_TOKEN
```

### Example Requests

#### Get Process Description
```bash
curl -X POST "https://inchara20-procedures-llm-endpoints.hf.space/get-description" \
  -H "Content-Type: application/json" \
  -d '{"query_type": "process", "query_name": "BCM Plan Development"}'
```

#### Get Impact Scale Matrix
```bash
curl -X POST "https://inchara20-procedures-llm-endpoints.hf.space/get-impact-scale-matrix" \
  -H "Content-Type: application/json" \
  -d '{"process_name": "Critical Process", "impact_name": "Financial"}'
```

#### Generate BCM Policy
```bash
curl -X POST "https://inchara20-procedures-llm-endpoints.hf.space/generate-bcm-policy" \
  -H "Content-Type: application/json" \
  -d '{"organization_name": "Your Org", "standards": ["ISO 22301:2019"], "custom_notes": ""}'
```

## Integration

This space is designed to integrate with business continuity management systems and provides structured responses for:

- Business Impact Analysis (BIA) procedures
- Risk Assessment procedures  
- BCM Plan Development procedures
- Recovery Strategy procedures
- Crisis Communication procedures
- Performance Monitoring procedures

## Standards Compliance

The endpoints support various standards including:
- ISO 22301:2019 (Business Continuity Management)
- NIST Cybersecurity Framework
- Industry best practices

## Response Format

All endpoints return structured JSON responses with comprehensive data suitable for business continuity planning and documentation.