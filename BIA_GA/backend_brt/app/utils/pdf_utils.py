"""
PDF utility functions.
"""
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors

# For PDF embedding
try:
    from PyPDF2 import PdfMerger
    PYPDF2_AVAILABLE = True
except ImportError:
    print("PyPDF2 not installed. PDF embedding will not be available.")
    print("Install with: pip install PyPDF2")
    PYPDF2_AVAILABLE = False

def create_pdf_buffer(elements):
    """
    Create a PDF from a list of reportlab elements.
    
    Args:
        elements: List of reportlab elements
        
    Returns:
        io.BytesIO: PDF buffer
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    doc.build(elements)
    buffer.seek(0)
    return buffer

def embed_pdfs(main_pdf_buffer, pdf_files):
    """
    Embed PDF files into a main PDF.
    
    Args:
        main_pdf_buffer: Main PDF buffer
        pdf_files: List of PDF file buffers to embed
        
    Returns:
        io.BytesIO: Combined PDF buffer
    """
    if not PYPDF2_AVAILABLE:
        return main_pdf_buffer
    
    output = io.BytesIO()
    merger = PdfMerger()
    
    # Add the main PDF
    merger.append(main_pdf_buffer)
    
    # Add each PDF file
    for pdf_file in pdf_files:
        if hasattr(pdf_file, 'read'):
            merger.append(pdf_file)
    
    merger.write(output)
    merger.close()
    
    output.seek(0)
    return output
