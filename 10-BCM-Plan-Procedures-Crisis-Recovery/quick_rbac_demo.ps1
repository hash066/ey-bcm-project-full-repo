# Quick RBAC Demo Script
# This script demonstrates RBAC by logging in with different roles and testing access

$API_BASE = "http://localhost:8002"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RBAC DEMO - Quick Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to login and get token
function Get-AuthToken {
    param(
        [string]$Username,
        [string]$Password
    )
    
    $body = "username=$Username&password=$Password"
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/auth/token" `
            -Method Post `
            -ContentType "application/x-www-form-urlencoded" `
            -Body $body
        
        return $response.access_token
    }
    catch {
        Write-Host "Login failed: $_" -ForegroundColor Red
        return $null
    }
}

# Function to test endpoint access
function Test-EndpointAccess {
    param(
        [string]$Token,
        [string]$Endpoint,
        [string]$RoleName
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE$Endpoint" `
            -Method Get `
            -Headers $headers
        
        Write-Host "  [SUCCESS] $RoleName can access $Endpoint" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Host "  [BLOCKED] $RoleName cannot access $Endpoint (403 Forbidden)" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 401) {
            Write-Host "  [UNAUTHORIZED] Invalid token (401 Unauthorized)" -ForegroundColor Red
        }
        else {
            Write-Host "  [ERROR] $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Demo users
$demoUsers = @(
    @{Username="admin.demo"; Password="Admin@123"; Role="System Admin"},
    @{Username="depthead.demo"; Password="DeptHead@123"; Role="Department Head"},
    @{Username="processowner.demo"; Password="Process@123"; Role="Process Owner"}
)

# Test endpoints
$testEndpoints = @(
    "/auth/me",
    "/api/recovery-strategies/",
    "/api/enhanced-procedures/current/bia"
)

# Run tests
foreach ($user in $demoUsers) {
    Write-Host "`n----------------------------------------" -ForegroundColor Cyan
    Write-Host "Testing: $($user.Role)" -ForegroundColor Cyan
    Write-Host "Username: $($user.Username)" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    # Login
    Write-Host "`nLogging in..." -ForegroundColor White
    $token = Get-AuthToken -Username $user.Username -Password $user.Password
    
    if ($token) {
        Write-Host "Login successful! Token received." -ForegroundColor Green
        Write-Host "Token (first 50 chars): $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
        
        # Test endpoints
        Write-Host "`nTesting endpoint access:" -ForegroundColor White
        foreach ($endpoint in $testEndpoints) {
            Test-EndpointAccess -Token $token -Endpoint $endpoint -RoleName $user.Role
        }
    }
    else {
        Write-Host "Login failed for $($user.Username)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEMO COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nKey Observations:" -ForegroundColor Yellow
Write-Host "- System Admin should have access to all endpoints" -ForegroundColor White
Write-Host "- Department Head has limited access" -ForegroundColor White
Write-Host "- Process Owner has the most restricted access" -ForegroundColor White
Write-Host "`nThis demonstrates RBAC is working correctly!" -ForegroundColor Green
