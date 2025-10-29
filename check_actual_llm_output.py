#!/usr/bin/env python3
"""
Check what the LLM is actually generating vs hardcoded content.
"""

import asyncio
import aiohttp
import json

async def test_llm_endpoints():
    llm_api_url = "https://inchara20-procedures-llm-endpoints.hf.space"
    hf_api_key = "your_huggingface_api_key_here"
    timeout = aiohttp.ClientTimeout(total=30)
    
    print("Testing what LLM actually generates...")
    print("=" * 50)
    
    # Test get-description
    print("\n1. Testing get-description:")
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{llm_api_url}/get-description",
            headers={"Authorization": f"Bearer {hf_api_key}", "Content-Type": "application/json"},
            json={"query_type": "process", "query_name": "BIA Procedure"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                description = data.get("description", "")
                print(f"Generated description: '{description}'")
                print(f"Length: {len(description)} characters")
            else:
                print(f"Failed: {response.status}")
    
    # Test get-peak-period
    print("\n2. Testing get-peak-period:")
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{llm_api_url}/get-peak-period/",
            headers={"Authorization": f"Bearer {hf_api_key}", "Content-Type": "application/json"},
            json={"department": "Human Resources", "process_name": "Employee Onboarding", "sector": "Technology"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                peak_period = data.get("peak_period", "")
                print(f"Generated peak period: '{peak_period}'")
                print(f"Length: {len(peak_period)} characters")
            else:
                print(f"Failed: {response.status}")
    
    # Test get-impact-scale-matrix
    print("\n3. Testing get-impact-scale-matrix:")
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{llm_api_url}/get-impact-scale-matrix",
            headers={"Authorization": f"Bearer {hf_api_key}", "Content-Type": "application/json"},
            json={"process_name": "Business Process", "impact_name": "Financial"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                matrix = data.get("impact_scale_matrix", {})
                print(f"Generated matrix: {json.dumps(matrix, indent=2)}")
                print(f"Matrix keys: {list(matrix.keys())}")
            else:
                print(f"Failed: {response.status}")
    
    # Test generate-bcm-policy
    print("\n4. Testing generate-bcm-policy:")
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{llm_api_url}/generate-bcm-policy",
            headers={"Authorization": f"Bearer {hf_api_key}", "Content-Type": "application/json"},
            json={"organization_name": "Test Organization", "standards": ["ISO 22301:2019"], "custom_notes": "BCM Plan Development"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                policy = data.get("policy", "")
                print(f"Generated policy: '{policy}'")
                print(f"Length: {len(policy)} characters")
            else:
                print(f"Failed: {response.status}")
    
    # Test generate-bcm-questions
    print("\n5. Testing generate-bcm-questions:")
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(
            f"{llm_api_url}/generate-bcm-questions",
            headers={"Authorization": f"Bearer {hf_api_key}", "Content-Type": "application/json"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                questions = data.get("questions", [])
                print(f"Generated questions: {json.dumps(questions, indent=2)}")
                print(f"Number of questions: {len(questions)}")
            else:
                print(f"Failed: {response.status}")

if __name__ == "__main__":
    asyncio.run(test_llm_endpoints())