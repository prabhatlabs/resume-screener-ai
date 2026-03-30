"""Quick test to verify Gemini API key works. Run: python test_gemini.py"""

import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {bool(api_key)}")
print(f"Key prefix: {api_key[:10]}..." if api_key else "NO KEY FOUND")

if not api_key:
    print("\nERROR: GEMINI_API_KEY not set in .env file")
    exit(1)

try:
    import google.generativeai as genai

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemma-3-1b-it")
    response = model.generate_content("Say hello in one word.")
    print(f"\nSUCCESS: {response.text}")
except Exception as e:
    print(f"\nERROR: {e}")
    print("\nTip: Get a valid key from https://aistudio.google.com/apikey")
