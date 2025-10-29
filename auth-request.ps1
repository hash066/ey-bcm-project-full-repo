$body = @{
    username = "EY\Administrator"
    password = "Catsarecute7!"
    grant_type = "password"
}

$response = Invoke-WebRequest -Uri "http://localhost:8000/auth/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"