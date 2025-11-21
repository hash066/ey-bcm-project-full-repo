#!/usr/bin/env python3
"""
Minimal auth test server
"""
from fastapi import FastAPI, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
import uvicorn

app = FastAPI()

@app.post("/auth/token")
async def test_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Test token endpoint"""
    
    print(f"Received username: {form_data.username}")
    print(f"Received password: {'*' * len(form_data.password)}")
    print(f"Grant type: {form_data.grant_type}")
    
    if form_data.username in ["Administrator", "EY\\Administrator"] and form_data.password == "Catsarecute7!":
        return {
            "access_token": "test_token_123",
            "token_type": "bearer",
            "username": form_data.username,
            "role": "admin"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/")
async def root():
    return {"message": "Minimal auth test server"}

if __name__ == "__main__":
    print("Starting minimal auth test server on port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)