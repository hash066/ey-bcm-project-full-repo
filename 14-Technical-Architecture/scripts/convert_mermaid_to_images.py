#!/usr/bin/env python3
"""
Extract mermaid code blocks from markdown and convert to images
"""

import re
import os
from pathlib import Path

def extract_mermaid_blocks(md_file):
    """Extract all mermaid code blocks from markdown file"""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match mermaid code blocks
    pattern = r'```mermaid\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    
    return matches

def extract_mermaid_blocks_with_context(md_file):
    """Extract mermaid blocks with their context for replacement"""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match mermaid code blocks with full context
    pattern = r'(```mermaid\n.*?```)'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    blocks = []
    for match in matches:
        full_block = match.group(0)
        mermaid_code = match.group(0).replace('```mermaid\n', '').replace('```', '').strip()
        blocks.append({
            'full_block': full_block,
            'code': mermaid_code,
            'start': match.start(),
            'end': match.end()
        })
    
    return blocks

def convert_mermaid_to_image(mermaid_code, output_path, format='png'):
    """Convert mermaid code to image using mmdc"""
    import subprocess
    import tempfile
    
    # Create temporary mermaid file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as f:
        f.write(mermaid_code)
        temp_file = f.name
    
    try:
        # Convert using mmdc - format is determined by output extension or -e flag
        cmd = ['mmdc', '-i', temp_file, '-o', str(output_path), '-e', format, '-b', 'transparent', '-w', '1600', '-H', '1200']
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error converting {output_path}: {result.stderr}")
            return False
        return True
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.unlink(temp_file)

def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    md_file = project_root / "docs" / "TECHNICAL_ARCHITECTURE.md"
    diagrams_dir = project_root / "docs" / "diagrams" / "images"
    diagrams_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Extracting mermaid blocks from {md_file}...")
    blocks = extract_mermaid_blocks_with_context(md_file)
    print(f"Found {len(blocks)} mermaid blocks")
    
    # Read the markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process each block
    replacements = []
    for i, block in enumerate(blocks):
        mermaid_code = block['code']
        
        # Generate a unique name for the diagram
        # Try to extract a meaningful name from surrounding context
        context_before = content[max(0, block['start']-200):block['start']]
        title_match = re.search(r'###?\s+(.+?)\n', context_before)
        if title_match:
            diagram_name = re.sub(r'[^\w\s-]', '', title_match.group(1).strip().lower())
            diagram_name = re.sub(r'\s+', '_', diagram_name)
        else:
            diagram_name = f"diagram_{i+1}"
        
        output_path = diagrams_dir / f"{diagram_name}.png"
        
        print(f"Converting diagram {i+1}: {diagram_name}...")
        if convert_mermaid_to_image(mermaid_code, output_path):
            # Create replacement with image reference
            relative_path = f"diagrams/images/{diagram_name}.png"
            replacement = f'![{diagram_name}]({relative_path})'
            replacements.append({
                'old': block['full_block'],
                'new': replacement,
                'position': block['start']
            })
            print(f"  ✓ Created {output_path}")
        else:
            print(f"  ✗ Failed to create {output_path}")
    
    # Apply replacements in reverse order to maintain positions
    replacements.sort(key=lambda x: x['position'], reverse=True)
    
    for rep in replacements:
        content = content.replace(rep['old'], rep['new'], 1)
    
    # Write updated markdown
    output_file = project_root / "docs" / "TECHNICAL_ARCHITECTURE_WITH_IMAGES.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nUpdated markdown saved to: {output_file}")
    print(f"Total diagrams converted: {len(replacements)}")

if __name__ == "__main__":
    main()

