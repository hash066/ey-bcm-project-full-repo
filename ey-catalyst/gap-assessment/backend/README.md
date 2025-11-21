# Gap Assessment Backend API

A FastAPI backend service for the Gap Assessment application.

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual values:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `FRONTEND_URL`: Frontend application URL (default: http://localhost:3000)
   - `PORT`: Server port (default: 8000)
   - `ENVIRONMENT`: Environment mode (development/production)
   - `MAX_UPLOAD_SIZE`: Maximum upload size in bytes (default: 10485760)

### 5. Run the Application

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 6. API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### 7. API Endpoints

#### Upload and Processing
- **POST /api/upload**: Upload files for gap analysis
  - Accepts multiple files (.docx, .pdf, .xlsx)
  - Returns job_id for tracking progress
  - Files are processed in the background

- **GET /api/upload/status**: Check processing status
  - Query parameter: `jobId`
  - Returns processing status and results when complete

#### Summary Statistics
- **GET /api/summary**: Get comprehensive gap analysis summary
  - Query parameter: `jobId` (required)
  - Returns overall statistics, framework breakdown, and domain breakdown

#### Controls Management
- **GET /api/controls**: Get list of controls with optional filtering
  - Query parameters: `jobId` (required), `framework`, `domain`, `priority` (optional)
  - Returns filtered list of controls

- **GET /api/controls/{control_id}**: Get specific control details
  - Path parameter: `control_id`
  - Query parameter: `jobId`
  - Returns detailed control information

- **POST /api/controls/{control_id}/comments**: Add comment to control
  - Path parameter: `control_id`
  - Query parameter: `jobId`
  - Body: `{"comment": "text", "reviewer": "name"}`
  - Adds assessment comment to control

#### AI-Powered Assistance
- **POST /api/ai/generate-plan**: Generate remediation plan using GPT-4
  - Body: `{"jobId": "uuid", "controlId": "control-id"}`
  - Returns step-by-step remediation plan

- **POST /api/ai/explain-risk**: Explain business risks in simple language
  - Body: `{"jobId": "uuid", "controlId": "control-id"}`
  - Returns business-friendly risk explanation

- **POST /api/ai/suggest-evidence**: Suggest required evidence documents
  - Body: `{"jobId": "uuid", "controlId": "control-id"}`
  - Returns comprehensive evidence checklist

#### Export and Download
- **GET /api/export/csv**: Export gap analysis results as CSV
  - Query parameters: `jobId` (required), `framework`, `domain`, `priority` (optional)
  - Returns downloadable CSV file with filtered results

- **GET /api/export/json**: Export complete job data as JSON
  - Query parameter: `jobId` (required)
  - Returns downloadable JSON file with all processed data

#### Health Check
- **GET /health**: Application health status
- **GET /**: Basic API information

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application entry point
│   ├── config.py        # Application configuration
│   ├── routes/          # API route definitions
│   ├── utils/           # Utility functions
│   └── middleware/      # Custom middleware
├── data/
│   └── processed/       # Processed data storage
├── uploads/             # File upload directory
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore patterns
└── README.md           # This file
```

## Development

- The application uses FastAPI for the web framework
- Pydantic for data validation
- CORS middleware configured for frontend communication
- Environment-based configuration management
