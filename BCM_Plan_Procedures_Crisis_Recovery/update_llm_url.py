#!/usr/bin/env python3
"""
Script to update LLM URL in your project files
Run this after creating your HF Space
"""

import os
import re

def update_llm_url(file_path, new_url):
    """Update LLM URL in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the old URL
        old_url = "https://Prithivi-nanda-EY-catalyst.hf.space"
        updated_content = content.replace(old_url, new_url)
        
        if content != updated_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated: {file_path}")
            return True
        else:
            print(f"⏭️  No changes needed: {file_path}")
            return False
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def main():
    # Replace with your actual HF Space URL
    new_url = input("Enter your HF Space URL (e.g., https://username-procedures-llm-endpoints.hf.space): ").strip()
    
    if not new_url.startswith("https://"):
        print("❌ Please enter a valid HTTPS URL")
        return
    
    # Files to update
    files_to_update = [
        "EY-Catalyst-front-end/src/modules/procedures/services/llmService.js",
        "backend_brt/app/services/llm_integration_service.py"
    ]
    
    updated_count = 0
    for file_path in files_to_update:
        full_path = os.path.join(os.getcwd(), file_path)
        if os.path.exists(full_path):
            if update_llm_url(full_path, new_url):
                updated_count += 1
        else:
            print(f"⚠️  File not found: {full_path}")
    
    print(f"\n🎉 Updated {updated_count} files with new LLM URL: {new_url}")
    print("\nNext steps:")
    print("1. Test your endpoints")
    print("2. Restart your backend server")
    print("3. Test the procedures module")

if __name__ == "__main__":
    main()