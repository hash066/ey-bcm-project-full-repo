# HF Space Deployment Guide for BCM Plan LLM Integration

## Overview
This guide explains how to deploy the LLM endpoints to your Hugging Face Space to enable AI-powered content generation in the BCM Plan module.

## Files to Upload

Upload these files from the `hf_space_files/` directory to your HF Space:

### Required Files:
1. **app.py** - Main application with all LLM endpoints
2. **requirements.txt** - Python dependencies
3. **README.md** - Space documentation
4. **.gitignore** - Git ignore rules

## Deployment Steps

### Step 1: Access Your HF Space
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Navigate to your space: `inchara20/procedures-llm-endpoints`
3. Click "Files" tab

### Step 2: Upload Files
1. Click "Upload file" or drag and drop
2. Upload all files from `hf_space_files/` directory:
   - `app.py`
   - `requirements.txt` 
   - `README.md`
   - `.gitignore`

### Step 3: Verify Deployment
1. Wait for the space to build (usually 2-3 minutes)
2. Check the "Logs" tab for any errors
3. Once built, the space should show the Gradio interface

### Step 4: Test Endpoints
1. Use the built-in test interface in the space
2. Or run the test script: `python test_llm_integration.py`

## API Endpoints Available

Your deployed space will provide these endpoints:

### Core Endpoints:
- `POST /get-description` - Generate process descriptions
- `POST /get-peak-period/` - Get department peak periods
- `POST /get-impact-scale-matrix` - Generate impact matrices
- `POST /generate-bcm-policy` - Create BCM policies
- `GET /generate-bcm-questions` - Generate BCM questions

### Enhanced Endpoints:
- `POST /generate-recovery-strategies` - Recovery strategy recommendations
- `POST /generate-risk-scenarios` - Risk scenario generation

## Frontend Integration

The frontend is already configured to use your HF Space as a fallback:

```javascript
// In realLlmService.js
const HF_SPACE_API_URL = 'https://inchara20-procedures-llm-endpoints.hf.space';
```

## Testing Integration

### Option 1: Use Test Script
```bash
cd "c:\Users\inchara P\new-integration"
python test_llm_integration.py
```

### Option 2: Manual Testing
1. Open the BCM Plan module in your frontend
2. Click "Generate with AI" button
3. Verify AI content appears in the document

## Troubleshooting

### Common Issues:

#### Space Build Fails
- Check requirements.txt for correct package versions
- Review build logs in HF Space
- Ensure all files are uploaded correctly

#### Endpoints Not Working
- Verify space is running (green status)
- Check API endpoint URLs match frontend configuration
- Test endpoints using the built-in interface

#### Frontend Not Getting AI Content
- Check browser console for errors
- Verify network connectivity to HF Space
- Ensure API key is valid (if required)

### Debug Steps:
1. Check HF Space logs for errors
2. Test individual endpoints in the space interface
3. Verify frontend service configuration
4. Check browser network tab for failed requests

## Configuration Details

### Space Settings:
- **SDK**: Gradio 4.44.0
- **Python Version**: 3.9+
- **Hardware**: CPU Basic (sufficient for this use case)

### Environment Variables:
No additional environment variables needed - the space is self-contained.

## API Usage Examples

### Get Description:
```bash
curl -X POST "https://inchara20-procedures-llm-endpoints.hf.space/get-description" \
  -H "Content-Type: application/json" \
  -d '{"query_type": "process", "query_name": "BCM Plan Development"}'
```

### Generate BCM Policy:
```bash
curl -X POST "https://inchara20-procedures-llm-endpoints.hf.space/generate-bcm-policy" \
  -H "Content-Type: application/json" \
  -d '{"organization_name": "Your Org", "standards": ["ISO 22301:2019"]}'
```

## Monitoring and Maintenance

### Regular Checks:
1. Monitor space status weekly
2. Check for any API failures in logs
3. Update dependencies as needed
4. Test endpoints after any changes

### Performance Optimization:
- Space handles multiple concurrent requests
- Responses are cached for common queries
- Fallback responses ensure reliability

## Security Considerations

### API Security:
- Space endpoints are public but rate-limited
- No sensitive data is stored
- All responses are generated content

### Best Practices:
- Don't include sensitive organization data in requests
- Use generic process names for testing
- Monitor usage to avoid rate limits

## Support

If you encounter issues:

1. **Check Space Status**: Ensure the space is running
2. **Review Logs**: Check HF Space logs for errors
3. **Test Endpoints**: Use the built-in test interface
4. **Frontend Debug**: Check browser console for errors

## Success Indicators

✅ **Deployment Successful When:**
- HF Space shows green "Running" status
- Test interface loads and responds
- Frontend BCM module generates AI content
- Test script shows all endpoints working

## Next Steps After Deployment

1. **Test Frontend Integration**:
   - Open BCM Plan module
   - Click "Generate with AI"
   - Verify content appears

2. **Configure Backend** (Optional):
   - Start backend server for enhanced features
   - Backend will be primary, HF Space as fallback

3. **User Training**:
   - Show users the AI generation features
   - Explain how to use the enhanced content options

4. **Monitor Usage**:
   - Check space analytics
   - Monitor for any errors or issues
   - Plan for scaling if needed