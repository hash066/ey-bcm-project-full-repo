# Procedures LLM Endpoints

This Hugging Face Space provides LLM endpoints for the Business Resilience Tool procedures module.

## Deployment Steps:

1. **Create New HF Space:**
   - Go to https://huggingface.co/spaces
   - Click "Create new Space"
   - Choose "Gradio" or "Streamlit" SDK (we'll use custom)
   - Make it public or private

2. **Upload Files:**
   - Upload `simple_llm_endpoints.py` as `app.py`
   - Upload `requirements_hf.txt` as `requirements.txt`

3. **Configure Space:**
   - In Space settings, set SDK to "Docker" or "Python"
   - The space will auto-deploy

4. **Update Your Code:**
   - Replace the LLM_API_URL in your frontend and backend
   - Change from: `https://Prithivi-nanda-EY-catalyst.hf.space`
   - To: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space`

## Endpoints Provided:

- `POST /get-description` - Generate process descriptions
- `POST /get-peak-period/` - Get department peak periods  
- `POST /get-impact-scale-matrix` - Generate impact matrices
- `POST /generate-bcm-policy` - Create BCM policies
- `GET /generate-bcm-questions` - Generate BCM questions

## Testing:

Once deployed, test with:
```bash
curl -X POST "https://YOUR_SPACE_URL/get-description" \
  -H "Content-Type: application/json" \
  -d '{"query_type": "process", "query_name": "BIA Procedure"}'
```

## Benefits:

✅ All endpoints working  
✅ No external dependencies  
✅ Fast response times  
✅ Customizable content  
✅ Free hosting on HF  