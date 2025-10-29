$tokenResponse = Invoke-WebRequest -Uri "http://localhost:8000/auth/test-token" -Method GET -UseBasicParsing
$tokenData = $tokenResponse.Content | ConvertFrom-Json
$accessToken = $tokenData.access_token

Write-Host "=========================================="
Write-Host "Demonstrating LLM Service Errors"
Write-Host "=========================================="
Write-Host ""
Write-Host "1. Access Token obtained: $($accessToken.Substring(0,50))..."
Write-Host ""

Write-Host "2. Testing BCM procedure generation (will show LLM errors)..."
Write-Host "URL: http://localhost:8000/bia/process/550e8400-e29b-41d4-a716-446655440003/generate-bcm-procedure"
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/bia/process/550e8400-e29b-41d4-a716-446655440003/generate-bcm-procedure" -Method POST -Headers $headers -UseBasicParsing
    Write-Host "Response:"
    Write-Host $response.Content
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Response Body:"
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorContent = $streamReader.ReadToEnd()
    Write-Host $errorContent
}

Write-Host ""
Write-Host "=========================================="
Write-Host "This demonstrates that the LLM service has bugs:"
Write-Host "- 'ScoredVector has no attribute metadata'"
Write-Host "- 'Pinecone API key configuration issues'"
Write-Host "=========================================="
