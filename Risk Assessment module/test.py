import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Get API key
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

print("="*50)
print("🔍 Groq API Connection Test")
print("="*50)

# Check if API key exists
if not GROQ_API_KEY:
    print("❌ GROQ_API_KEY not found in environment variables")
    print("💡 Make sure you have a .env file with:")
    print("   GROQ_API_KEY=gsk_your_key_here")
    exit(1)

print(f"✅ API Key found: {GROQ_API_KEY[:10]}...{GROQ_API_KEY[-4:]}")
print(f"✅ API Key starts with 'gsk_': {GROQ_API_KEY.startswith('gsk_')}")

# Initialize Groq client
try:
    client = Groq(api_key=GROQ_API_KEY.strip())
    print("✅ Groq client initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")
    exit(1)

# Test the connection
print("\n🚀 Testing API connection...")
try:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello, Groq API is working!' in one sentence."}
        ],
        temperature=0.4,
        max_tokens=100
    )
    
    print("✅ API call successful!")
    print("\n📝 Response:")
    print("-"*50)
    print(response.choices[0].message.content)
    print("-"*50)
    print(f"\n📊 Model used: {response.model}")
    print(f"📊 Tokens used: {response.usage.total_tokens if hasattr(response, 'usage') else 'N/A'}")
    print("\n✅ Everything is working correctly!")
    
except Exception as e:
    print(f"❌ API call failed: {e}")
    print("\n💡 Troubleshooting tips:")
    print("   1. Verify your API key at: https://console.groq.com/keys")
    print("   2. Check if you have internet connection")
    print("   3. Make sure your API key has no extra spaces")
    exit(1)

print("\n" + "="*50)
print("🎉 Test completed successfully!")
print("="*50)