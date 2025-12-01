#!/usr/bin/env python3
"""
Generate PDF from Technical Architecture Markdown document
"""

import os
import sys
import markdown
from pathlib import Path

# Try to import PDF generation libraries
try:
    from weasyprint import HTML, CSS
    HAS_WEASYPRINT = True
except ImportError:
    HAS_WEASYPRINT = False
    print("Warning: weasyprint not found. Install with: pip install weasyprint")

try:
    import pdfkit
    HAS_PDFKIT = True
except ImportError:
    HAS_PDFKIT = False

def convert_markdown_to_html(md_file, output_html):
    """Convert markdown to HTML"""
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(
        md_content,
        extensions=['extra', 'codehilite', 'tables', 'fenced_code']
    )
    
    # Create full HTML document with styling
    full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Technical Architecture Document</title>
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}
        body {{
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 5px;
            margin-top: 30px;
        }}
        h3 {{
            color: #555;
            margin-top: 20px;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #3498db;
            color: white;
        }}
        tr:nth-child(even) {{
            background-color: #f2f2f2;
        }}
        .mermaid {{
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin: 20px 0;
            font-family: monospace;
        }}
        .mermaid::before {{
            content: "Mermaid Diagram (render separately):";
            display: block;
            font-weight: bold;
            margin-bottom: 10px;
            color: #666;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""
    
    with open(output_html, 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    return output_html

def convert_html_to_pdf(html_file, output_pdf):
    """Convert HTML to PDF"""
    if HAS_WEASYPRINT:
        HTML(filename=html_file).write_pdf(output_pdf)
        return True
    elif HAS_PDFKIT:
        pdfkit.from_file(html_file, output_pdf)
        return True
    else:
        print("Error: No PDF generation library available.")
        print("Install one of:")
        print("  pip install weasyprint")
        print("  pip install pdfkit (requires wkhtmltopdf)")
        return False

def main():
    # Get script directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Define paths
    md_file = project_root / "docs" / "TECHNICAL_ARCHITECTURE.md"
    html_file = project_root / "docs" / "TECHNICAL_ARCHITECTURE.html"
    pdf_file = project_root / "Tech-arch-final.pdf"
    
    if not md_file.exists():
        print(f"Error: Markdown file not found: {md_file}")
        sys.exit(1)
    
    print(f"Converting {md_file} to HTML...")
    convert_markdown_to_html(md_file, html_file)
    print(f"HTML created: {html_file}")
    
    print(f"Converting HTML to PDF...")
    if convert_html_to_pdf(html_file, pdf_file):
        print(f"PDF created successfully: {pdf_file}")
    else:
        print("PDF generation failed. HTML file is available for manual conversion.")
        sys.exit(1)

if __name__ == "__main__":
    main()

