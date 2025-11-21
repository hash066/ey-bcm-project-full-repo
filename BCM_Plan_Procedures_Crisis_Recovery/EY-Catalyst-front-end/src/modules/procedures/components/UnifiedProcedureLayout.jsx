import React, { useState, useRef } from 'react';

const UnifiedProcedureLayout = ({ 
  procedureName,
  children,
  onGenerateContent,
  onEditContent,
  isGenerating = false
}) => {

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Handle export to PDF
  const handleExportPDF = () => {
    console.log('📄 Exporting to PDF...');
    setShowExportDropdown(false);
    
    // Use browser print API for PDF
    window.print();
  };

  // Handle export to DOC (Word format)
  const handleExportDOC = () => {
    console.log('📝 Exporting to DOC...');
    setShowExportDropdown(false);
    
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${procedureName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
          h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #3b82f6; color: white; }
        </style>
      </head>
      <body>
        <h1>${procedureName}</h1>
        ${document.getElementById('procedure-content')?.innerHTML || ''}
      </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${procedureName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle edit content
  const handleEditContent = () => {
    console.log('✏️ Edit content clicked');
    if (onEditContent) {
      onEditContent();
    } else {
      alert('Edit functionality: Open inline editor or modal to edit procedure content');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* UNIFIED HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        padding: '2rem 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.875rem',
              fontWeight: '700',
              letterSpacing: '-0.025em'
            }}>
              {procedureName}
            </h1>
            <p style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.875rem',
              opacity: 0.9
            }}>
              ISO 22301:2019 Compliant | Version 1.0
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Generate AI Button */}
            {onGenerateContent && (
              <button
                onClick={onGenerateContent}
                disabled={isGenerating}
                style={{
                  backgroundColor: isGenerating ? '#94a3b8' : 'white',
                  color: isGenerating ? 'white' : '#1e40af',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span>{isGenerating ? '⏳' : '🤖'}</span>
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            )}

            {/* Edit Content Button */}
            <button
              onClick={handleEditContent}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <span>✏️</span>
              Edit Content
            </button>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
              >
                <span>📥</span>
                Export
                <span style={{ fontSize: '0.75rem' }}>▼</span>
              </button>

              {/* Dropdown Menu */}
              {showExportDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  zIndex: 1000
                }}>
                  <button
                    onClick={handleExportPDF}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      backgroundColor: 'white',
                      color: '#334155',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Export as PDF</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Download in PDF format</div>
                    </div>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

                  <button
                    onClick={handleExportDOC}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      backgroundColor: 'white',
                      color: '#334155',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>📝</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Export as Word</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Download in DOC format</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div id="procedure-content" style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 2rem 3rem'
      }}>
        {children}
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: '1px solid #e2e8f0',
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.875rem',
        backgroundColor: 'white'
      }}>
        <p style={{ margin: 0 }}>
          © 2025-26 | Bank Internal Purpose | ISO 22301:2019 Compliant
        </p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #procedure-content, #procedure-content * {
            visibility: visible;
          }
          #procedure-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedProcedureLayout;
