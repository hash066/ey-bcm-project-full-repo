# ADDS Domain Administrator Password Fix Script
# Run this on your ADDS server (Windows Server with ADDS role)

Write-Host "=== ADDS Domain Administrator Password Fix ===" -ForegroundColor Green

# Stop these services temporarily
Write-Host "1. Stopping ADDS services..." -ForegroundColor Yellow
Stop-Service NTDS -Force
Stop-Service DNS -Force
Stop-Service Netlogon -Force
Start-Sleep 10

# Reset the domain administrator password
Write-Host "2. Resetting domain Administrator password..." -ForegroundColor Yellow
$adminPassword = ConvertTo-SecureString -String "Ganesha123" -AsPlainText -Force

try {
    # Try to reset the password using different methods
    Write-Host "Attempting password reset..." -ForegroundColor Cyan

    # Method 1: Direct password set
    Set-ADAccountPassword -Identity "CN=Administrator,CN=Users,DC=ey,DC=local" -NewPassword $adminPassword -Reset -ErrorAction Stop

    Write-Host "SUCCESS: Domain Administrator password reset to 'Ganesha123'" -ForegroundColor Green

    # Force immediate password replication
    Write-Host "3. Forcing password replication..." -ForegroundColor Yellow
    repadmin /syncall /P > $null 2>&1
    Start-Sleep 5

} catch {
    Write-Host "ERROR resetting password: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow

    try {
        # Method 2: Use ADSI
        $user = [ADSI]"LDAP://CN=Administrator,CN=Users,DC=ey,DC=local"
        $user.psbase.invoke("SetPassword", "Ganesha123")
        $user.psbase.CommitChanges()
        Write-Host "SUCCESS: Domain Administrator password reset via ADSI" -ForegroundColor Green

    } catch {
        Write-Host "ERROR with ADSI method: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Trying manual method..." -ForegroundColor Yellow

        # Manual fallback instructions
        Write-Host "MANUAL STEPS REQUIRED:" -ForegroundColor Red
        Write-Host "1. Press Win+R, type 'dsa.msc', press Enter" -ForegroundColor Yellow
        Write-Host "2. Navigate to: ey.local > Users folder" -ForegroundColor Yellow
        Write-Host "3. Right-click 'Administrator' > Reset Password..." -ForegroundColor Yellow
        Write-Host "4. Set new password to: Ganeshal23" -ForegroundColor Yellow
        Write-Host "5. Uncheck 'User must change password at next logon'" -ForegroundColor Yellow
        Write-Host "6. Click OK" -ForegroundColor Yellow
    }
}

# Restart the services
Write-Host "4. Restarting ADDS services..." -ForegroundColor Yellow
Start-Service Netlogon
Start-Service DNS
Start-Service NTDS

Start-Sleep 10

Write-Host "5. Verifying services are running..." -ForegroundColor Yellow
$services = Get-Service NTDS, DNS, Netlogon
foreach ($service in $services) {
    if ($service.Status -eq 'Running') {
        Write-Host "✓ $($service.Name): $($service.Status)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($service.Name): $($service.Status)" -ForegroundColor Red
    }
}

# Force group policy update
Write-Host "6. Forcing Group Policy Update..." -ForegroundColor Yellow
gpupdate /force > $null 2>&1

# Test connectivity
Write-Host "7. Testing connectivity..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName localhost -Count 1 -Quiet
if ($pingResult) {
    Write-Host "✓ Local connectivity: OK" -ForegroundColor Green
} else {
    Write-Host "✗ Local connectivity: FAILED" -ForegroundColor Red
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "ADDS Domain Administrator Password Fix Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for replication" -ForegroundColor White
Write-Host "2. Run LDAP test: python test_simple_ldap.py" -ForegroundColor White
Write-Host "3. Should see: 'SUCCESS! ADDS authentication working!'" -ForegroundColor White
Write-Host ""
Write-Host "If it still fails, try restarting your developer machine and ADDS server." -ForegroundColor Cyan
Write-Host ""
pause
