$tokenResponse = Invoke-WebRequest -Uri "http://localhost:8000/auth/test-token" -Method GET -UseBasicParsing
$tokenData = $tokenResponse.Content | ConvertFrom-Json
$accessToken = $tokenData.access_token

Write-Host "Access Token obtained: $($accessToken.Substring(0,50))..."

Write-Host "Testing BCM procedure generation..."
Write-Host "URL: http://localhost:8000/bia/process/48771310-c2e7-4fdb-9b69-981e428c6416/generate-bcm-procedure"

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/bia/process/48771310-c2e7-4fdb-9b69-981e428c6416/generate-bcm-procedure" -Method POST -Headers $headers -UseBasicParsing
    Write-Host "Success! Response:"
    Write-Host $response.Content
} catch {
    Write-Host "Error Response:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Response Body:"
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorContent = $streamReader.ReadToEnd()
    Write-Host $errorContent
}
