#!/usr/bin/env python3
"""
PDF Documentation Generator for EY Catalyst Modules

This script generates PDF documentation with automatically integrated screenshots.
It supports both Process & Service Mapping and Business Impact Analysis modules.

Usage:
    python generate_pdf_documentation.py --module bia --screenshots ./screenshots/bia
    python generate_pdf_documentation.py --module psm --screenshots ./screenshots/psm
    python generate_pdf_documentation.py --all --screenshots ./screenshots
"""

import os
import sys
import argparse
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import markdown
import re

class DocumentationGenerator:
    def __init__(self, output_dir="pdf_docs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for better formatting"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.darkblue
        ))
        
        # Subsection header style
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            textColor=colors.darkgreen
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='BodyText',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            alignment=TA_JUSTIFY
        ))
        
        # Caption style for images
        self.styles.add(ParagraphStyle(
            name='ImageCaption',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.grey
        ))

    def _find_screenshots(self, screenshots_dir):
        """Find all screenshot files in the specified directory"""
        screenshots = {}
        screenshots_path = Path(screenshots_dir)
        
        if not screenshots_path.exists():
            print(f"Warning: Screenshots directory {screenshots_dir} not found")
            return screenshots
        
        # Common image extensions
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp'}
        
        for file_path in screenshots_path.rglob('*'):
            if file_path.suffix.lower() in image_extensions:
                # Extract a key from the filename for matching
                key = file_path.stem.lower().replace('-', ' ').replace('_', ' ')
                screenshots[key] = file_path
        
        return screenshots

    def _match_screenshot_to_content(self, content, screenshots):
        """Match screenshot files to content sections based on keywords"""
        matches = []
        
        # Define mapping of content sections to screenshot keywords
        section_keywords = {
            'dashboard': ['dashboard', 'overview', 'main'],
            'department selection': ['department', 'selection', 'dept'],
            'bia information': ['information', 'form', 'bia info'],
            'impact scale': ['scale', 'impact scale', 'configuration'],
            'impact analysis': ['analysis', 'impact analysis'],
            'critical dependencies': ['dependencies', 'critical', 'vendor', 'staff'],
            'recovery planning': ['recovery', 'planning', 'requirements'],
            'timeline summary': ['summary', 'timeline', 'report'],
            'process mapping': ['process', 'mapping', 'creation'],
            'service mapping': ['service', 'mapping', 'catalog'],
            'statistics modal': ['modal', 'statistics', 'details'],
            'dependency analysis': ['dependency', 'analysis', 'visual']
        }
        
        # Convert content to lowercase for matching
        content_lower = content.lower()
        
        for section, keywords in section_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                # Find matching screenshots
                for screenshot_key, screenshot_path in screenshots.items():
                    if any(keyword in screenshot_key for keyword in keywords):
                        matches.append((section, screenshot_path))
                        break
        
        return matches

    def _process_markdown_content(self, content, screenshots):
        """Process markdown content and integrate screenshots"""
        story = []
        
        # Convert markdown to HTML
        html = markdown.markdown(content)
        
        # Split content into sections
        sections = re.split(r'<h[1-6]>', html)
        headers = re.findall(r'<h([1-6])>(.*?)</h\1>', html)
        
        for i, section in enumerate(sections[1:], 1):  # Skip first empty section
            if i <= len(headers):
                level, title = headers[i-1]
                level = int(level)
                
                # Add header
                if level == 1:
                    story.append(Paragraph(title, self.styles['CustomTitle']))
                elif level == 2:
                    story.append(Paragraph(title, self.styles['SectionHeader']))
                else:
                    story.append(Paragraph(title, self.styles['SubsectionHeader']))
                
                # Process section content
                section_content = self._process_section_content(section, screenshots)
                story.extend(section_content)
                
                # Add page break after major sections
                if level <= 2:
                    story.append(PageBreak())
        
        return story

    def _process_section_content(self, section_html, screenshots):
        """Process individual section content and add relevant screenshots"""
        story = []
        
        # Convert HTML to plain text for processing
        text_content = re.sub(r'<[^>]+>', '', section_html)
        
        # Check for screenshot matches
        matches = self._match_screenshot_to_content(text_content, screenshots)
        
        # Add text content
        paragraphs = section_html.split('</p>')
        for para in paragraphs:
            if para.strip():
                # Clean up HTML tags
                clean_text = re.sub(r'<[^>]+>', '', para).strip()
                if clean_text:
                    story.append(Paragraph(clean_text, self.styles['BodyText']))
        
        # Add relevant screenshots
        for section_name, screenshot_path in matches:
            try:
                # Add screenshot with caption
                img = Image(str(screenshot_path), width=6*inch, height=4*inch)
                img.drawHeight = 4*inch
                img.drawWidth = 6*inch
                story.append(img)
                
                # Add caption
                caption = f"Figure: {section_name.replace('_', ' ').title()}"
                story.append(Paragraph(caption, self.styles['ImageCaption']))
                story.append(Spacer(1, 12))
                
            except Exception as e:
                print(f"Warning: Could not add screenshot {screenshot_path}: {e}")
        
        return story

    def generate_bia_documentation(self, screenshots_dir):
        """Generate BIA documentation PDF"""
        print("Generating Business Impact Analysis documentation...")
        
        # Read the BIA user guide
        bia_content = self._read_markdown_file("Business_Impact_Analysis_User_Guide.md")
        if not bia_content:
            print("Error: Could not read BIA user guide file")
            return False
        
        # Find screenshots
        screenshots = self._find_screenshots(screenshots_dir)
        print(f"Found {len(screenshots)} screenshots")
        
        # Generate PDF
        output_file = self.output_dir / "Business_Impact_Analysis_User_Guide.pdf"
        doc = SimpleDocTemplate(str(output_file), pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Create content
        story = []
        
        # Add title page
        story.append(Paragraph("Business Impact Analysis (BIA) User Guide", self.styles['CustomTitle']))
        story.append(Spacer(1, 30))
        story.append(Paragraph("EY Catalyst Application", self.styles['SectionHeader']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Comprehensive guide for conducting Business Impact Analysis following ISO 22301:2019 standards", self.styles['BodyText']))
        story.append(PageBreak())
        
        # Add table of contents placeholder
        story.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("1. Introduction", self.styles['BodyText']))
        story.append(Paragraph("2. Understanding Business Impact Analysis", self.styles['BodyText']))
        story.append(Paragraph("3. Getting Started with BIA", self.styles['BodyText']))
        story.append(Paragraph("4. Step-by-Step BIA Process", self.styles['BodyText']))
        story.append(Paragraph("5. Dashboard Overview", self.styles['BodyText']))
        story.append(Paragraph("6. Best Practices", self.styles['BodyText']))
        story.append(Paragraph("7. Troubleshooting", self.styles['BodyText']))
        story.append(Paragraph("8. Compliance and Standards", self.styles['BodyText']))
        story.append(Paragraph("9. Getting Help and Support", self.styles['BodyText']))
        story.append(PageBreak())
        
        # Process main content
        content_story = self._process_markdown_content(bia_content, screenshots)
        story.extend(content_story)
        
        # Build PDF
        doc.build(story)
        print(f"BIA documentation generated: {output_file}")
        return True

    def generate_psm_documentation(self, screenshots_dir):
        """Generate Process & Service Mapping documentation PDF"""
        print("Generating Process & Service Mapping documentation...")
        
        # Read the PSM user guide
        psm_content = self._read_markdown_file("Process_Service_Mapping_User_Guide.md")
        if not psm_content:
            print("Error: Could not read PSM user guide file")
            return False
        
        # Find screenshots
        screenshots = self._find_screenshots(screenshots_dir)
        print(f"Found {len(screenshots)} screenshots")
        
        # Generate PDF
        output_file = self.output_dir / "Process_Service_Mapping_User_Guide.pdf"
        doc = SimpleDocTemplate(str(output_file), pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Create content
        story = []
        
        # Add title page
        story.append(Paragraph("Process & Service Mapping User Guide", self.styles['CustomTitle']))
        story.append(Spacer(1, 30))
        story.append(Paragraph("EY Catalyst Application", self.styles['SectionHeader']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("Comprehensive guide for mapping business processes, services, and dependencies", self.styles['BodyText']))
        story.append(PageBreak())
        
        # Add table of contents placeholder
        story.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("1. Introduction", self.styles['BodyText']))
        story.append(Paragraph("2. Getting Started", self.styles['BodyText']))
        story.append(Paragraph("3. Dashboard Overview", self.styles['BodyText']))
        story.append(Paragraph("4. Understanding Your Organization's Structure", self.styles['BodyText']))
        story.append(Paragraph("5. Working with Processes", self.styles['BodyText']))
        story.append(Paragraph("6. Service Mapping", self.styles['BodyText']))
        story.append(Paragraph("7. BCM Coordination", self.styles['BodyText']))
        story.append(Paragraph("8. Best Practices", self.styles['BodyText']))
        story.append(Paragraph("9. Troubleshooting", self.styles['BodyText']))
        story.append(Paragraph("10. Advanced Features", self.styles['BodyText']))
        story.append(Paragraph("11. Getting Help", self.styles['BodyText']))
        story.append(PageBreak())
        
        # Process main content
        content_story = self._process_markdown_content(psm_content, screenshots)
        story.extend(content_story)
        
        # Build PDF
        doc.build(story)
        print(f"PSM documentation generated: {output_file}")
        return True

    def _read_markdown_file(self, filename):
        """Read markdown file content"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"Error: File {filename} not found")
            return None
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            return None

    def generate_all_documentation(self, screenshots_dir):
        """Generate documentation for both modules"""
        success = True
        
        # Generate BIA documentation
        bia_screenshots = Path(screenshots_dir) / "bia"
        if bia_screenshots.exists():
            success &= self.generate_bia_documentation(str(bia_screenshots))
        else:
            print(f"Warning: BIA screenshots directory {bia_screenshots} not found")
        
        # Generate PSM documentation
        psm_screenshots = Path(screenshots_dir) / "process-service-mapping"
        if psm_screenshots.exists():
            success &= self.generate_psm_documentation(str(psm_screenshots))
        else:
            print(f"Warning: PSM screenshots directory {psm_screenshots} not found")
        
        return success

def main():
    parser = argparse.ArgumentParser(description='Generate PDF documentation with screenshots')
    parser.add_argument('--module', choices=['bia', 'psm'], help='Module to generate documentation for')
    parser.add_argument('--all', action='store_true', help='Generate documentation for all modules')
    parser.add_argument('--screenshots', required=True, help='Directory containing screenshots')
    parser.add_argument('--output', default='pdf_docs', help='Output directory for PDFs')
    
    args = parser.parse_args()
    
    generator = DocumentationGenerator(args.output)
    
    if args.all:
        success = generator.generate_all_documentation(args.screenshots)
    elif args.module == 'bia':
        success = generator.generate_bia_documentation(args.screenshots)
    elif args.module == 'psm':
        success = generator.generate_psm_documentation(args.screenshots)
    else:
        print("Please specify --module or --all")
        return 1
    
    if success:
        print(f"\nDocumentation generated successfully in {args.output}/")
        print("Files created:")
        for pdf_file in Path(args.output).glob("*.pdf"):
            print(f"  - {pdf_file}")
    else:
        print("Error: Failed to generate documentation")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 