import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Enhanced Procedure Features Component
 * Provides advanced features for all procedure pages
 */
const EnhancedProcedureFeatures = ({ 
  procedureType, 
  organizationName, 
  documentContent, 
  onContentChange,
  documentInfo,
  changeLog 
}) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    dateRange: { start: '', end: '' },
    status: 'all',
    priority: 'all'
  });
  const [versions, setVersions] = useState([]);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [exportOptions, setExportOptions] = useState({
    format: 'pdf',
    includeComments: false,
    includeHistory: true,
    customSections: []
  });

  // Enhanced Features Configuration
  const features = [
    {
      id: 'search',
      name: 'Advanced Search',
      icon: '🔍',
      description: 'Search through content with filters'
    },
    {
      id: 'export',
      name: 'Export Options',
      icon: '📤',
      description: 'Export in multiple formats'
    },
    {
      id: 'versions',
      name: 'Version Control',
      icon: '📋',
      description: 'Compare and manage versions'
    },
    {
      id: 'collaborate',
      name: 'Collaboration',
      icon: '👥',
      description: 'Real-time collaboration tools'
    },
    {
      id: 'templates',
      name: 'Templates',
      icon: '📄',
      description: 'Manage procedure templates'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      description: 'Usage and performance metrics'
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      icon: '📝',
      description: 'Track all changes and activities'
    },
    {
      id: 'integration',
      name: 'Integrations',
      icon: '🔗',
      description: 'Connect with external systems'
    }
  ];

  // Advanced Search Function
  const performAdvancedSearch = (term, filters) => {
    if (!documentContent || !term) return [];
    
    const results = [];
    const searchRegex = new RegExp(term, 'gi');
    
    // Search through different content sections
    Object.entries(documentContent).forEach(([section, content]) => {
      if (typeof content === 'string' && searchRegex.test(content)) {
        const matches = content.match(searchRegex) || [];
        results.push({
          section,
          matches: matches.length,
          preview: content.substring(0, 200) + '...'
        });
      }
    });
    
    return results;
  };

  // Export Functions
  const exportToPDF = async () => {
    const element = document.getElementById(`${procedureType}-procedure-document`);
    if (!element) return;

    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_${procedureType}_Enhanced.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Document Info Sheet
    const docInfoData = Object.entries(documentInfo).map(([key, value]) => [
      key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value
    ]);
    const docInfoSheet = XLSX.utils.aoa_to_sheet([['Field', 'Value'], ...docInfoData]);
    XLSX.utils.book_append_sheet(workbook, docInfoSheet, 'Document Info');
    
    // Change Log Sheet
    const changeLogData = changeLog.map(entry => [
      entry.srNo,
      entry.versionNo,
      entry.approvalDate,
      entry.descriptionOfChange,
      entry.reviewedBy,
      entry.approvedBy
    ]);
    const changeLogSheet = XLSX.utils.aoa_to_sheet([
      ['Sr. No.', 'Version', 'Date', 'Description', 'Reviewed By', 'Approved By'],
      ...changeLogData
    ]);
    XLSX.utils.book_append_sheet(workbook, changeLogSheet, 'Change Log');
    
    // Content Analysis Sheet
    if (documentContent) {
      const contentData = Object.entries(documentContent).map(([section, content]) => [
        section,
        typeof content === 'string' ? content.length : JSON.stringify(content).length,
        typeof content === 'string' ? content.substring(0, 100) + '...' : 'Complex Data'
      ]);
      const contentSheet = XLSX.utils.aoa_to_sheet([
        ['Section', 'Length', 'Preview'],
        ...contentData
      ]);
      XLSX.utils.book_append_sheet(workbook, contentSheet, 'Content Analysis');
    }
    
    XLSX.writeFile(workbook, `${organizationName}_${procedureType}_Analysis.xlsx`);
  };

  const exportToWord = () => {
    // Create a comprehensive Word document structure
    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${organizationName} ${procedureType} Procedure</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .table { border-collapse: collapse; width: 100%; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${organizationName}</h1>
          <h2>${procedureType} Procedure</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        ${document.getElementById(`${procedureType}-procedure-document`)?.innerHTML || ''}
      </body>
      </html>
    `;
    
    const blob = new Blob([docContent], { type: 'application/msword' });
    saveAs(blob, `${organizationName}_${procedureType}_Procedure.doc`);
  };

  // Version Comparison
  const compareVersions = (version1, version2) => {
    // Implement version comparison logic
    return {
      additions: [],
      deletions: [],
      modifications: []
    };
  };

  // Collaboration Features
  const addComment = (section, comment) => {
    const newComment = {
      id: Date.now(),
      section,
      comment,
      author: 'Current User', // Get from auth context
      timestamp: new Date().toISOString(),
      resolved: false
    };
    setComments(prev => [...prev, newComment]);
  };

  const resolveComment = (commentId) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, resolved: true }
          : comment
      )
    );
  };

  // Template Management
  const saveAsTemplate = () => {
    const template = {
      id: Date.now(),
      name: `${procedureType}_template_${Date.now()}`,
      type: procedureType,
      content: documentContent,
      documentInfo,
      createdAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, template]);
    localStorage.setItem('procedure_templates', JSON.stringify([...templates, template]));
  };

  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template && onContentChange) {
      onContentChange(template.content);
    }
  };

  // Analytics
  const generateAnalytics = () => {
    return {
      wordCount: JSON.stringify(documentContent).length,
      sectionCount: Object.keys(documentContent || {}).length,
      lastModified: new Date().toISOString(),
      viewCount: parseInt(localStorage.getItem(`${procedureType}_views`) || '0') + 1,
      exportCount: parseInt(localStorage.getItem(`${procedureType}_exports`) || '0'),
      collaboratorCount: collaborators.length,
      commentCount: comments.length
    };
  };

  useEffect(() => {
    setAnalytics(generateAnalytics());
    // Load templates from localStorage
    const savedTemplates = localStorage.getItem('procedure_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, [documentContent, comments, collaborators]);

  const renderFeaturePanel = () => {
    switch (activeFeature) {
      case 'search':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>🔍 Advanced Search</h3>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search through document content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <select
                value={filterOptions.status}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value }))}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
              </select>
              <select
                value={filterOptions.priority}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, priority: e.target.value }))}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => performAdvancedSearch(searchTerm, filterOptions)}
                style={{
                  padding: '8px 15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
            {searchTerm && (
              <div style={{ marginTop: '15px' }}>
                <h4>Search Results:</h4>
                {performAdvancedSearch(searchTerm, filterOptions).map((result, index) => (
                  <div key={index} style={{ 
                    padding: '10px', 
                    background: 'white', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <strong>{result.section}</strong> ({result.matches} matches)
                    <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                      {result.preview}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'export':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📤 Export Options</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Export Format:</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                  style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="word">Word Document</option>
                  <option value="json">JSON Data</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Options:</label>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeComments}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                      style={{ marginRight: '8px' }}
                    />
                    Include Comments
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeHistory}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeHistory: e.target.checked }))}
                      style={{ marginRight: '8px' }}
                    />
                    Include Change History
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={exportToPDF}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                📄 Export PDF
              </button>
              <button
                onClick={exportToExcel}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                📊 Export Excel
              </button>
              <button
                onClick={exportToWord}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                📝 Export Word
              </button>
            </div>
          </div>
        );

      case 'versions':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📋 Version Control</h3>
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={() => {
                  const newVersion = {
                    id: Date.now(),
                    version: `v${versions.length + 1}.0`,
                    timestamp: new Date().toISOString(),
                    author: 'Current User',
                    changes: 'Manual save',
                    content: documentContent
                  };
                  setVersions(prev => [...prev, newVersion]);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                💾 Save Current Version
              </button>
              <button
                onClick={() => setSelectedVersions([])}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Clear Selection
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {versions.map((version, index) => (
                <div key={version.id} style={{
                  padding: '10px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{version.version}</strong> - {version.author}
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(version.timestamp).toLocaleString()} - {version.changes}
                    </small>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVersions(prev => [...prev, version.id]);
                        } else {
                          setSelectedVersions(prev => prev.filter(id => id !== version.id));
                        }
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    <button
                      onClick={() => onContentChange && onContentChange(version.content)}
                      style={{
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {selectedVersions.length === 2 && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#e9ecef', borderRadius: '5px' }}>
                <strong>Version Comparison Available</strong>
                <button
                  onClick={() => {
                    const [v1, v2] = selectedVersions.map(id => versions.find(v => v.id === id));
                    console.log('Comparing versions:', v1.version, 'vs', v2.version);
                    // Implement comparison logic
                  }}
                  style={{
                    padding: '5px 15px',
                    background: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Compare Selected
                </button>
              </div>
            )}
          </div>
        );

      case 'collaborate':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>👥 Collaboration</h3>
            <div style={{ marginBottom: '20px' }}>
              <h4>Active Collaborators ({collaborators.length})</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {collaborators.map((collaborator, index) => (
                  <div key={index} style={{
                    padding: '5px 10px',
                    background: '#007bff',
                    color: 'white',
                    borderRadius: '15px',
                    fontSize: '12px'
                  }}>
                    {collaborator.name} ({collaborator.role})
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCollaborator = {
                      name: `User ${collaborators.length + 1}`,
                      role: 'Editor',
                      joinedAt: new Date().toISOString()
                    };
                    setCollaborators(prev => [...prev, newCollaborator]);
                  }}
                  style={{
                    padding: '5px 10px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Collaborator
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4>Comments ({comments.filter(c => !c.resolved).length} active)</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {comments.map((comment, index) => (
                  <div key={comment.id} style={{
                    padding: '10px',
                    background: comment.resolved ? '#d4edda' : 'white',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{comment.author}</strong>
                      <small style={{ color: '#666' }}>
                        {new Date(comment.timestamp).toLocaleString()}
                      </small>
                    </div>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{comment.comment}</p>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Section: {comment.section}
                      {!comment.resolved && (
                        <button
                          onClick={() => resolveComment(comment.id)}
                          style={{
                            padding: '2px 8px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginLeft: '10px',
                            fontSize: '11px'
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      addComment('General', e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'templates':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📄 Template Management</h3>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={saveAsTemplate}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                💾 Save as Template
              </button>
              <button
                onClick={() => {
                  // Create a new blank template
                  const blankTemplate = {
                    id: Date.now(),
                    name: `Blank_${procedureType}_Template`,
                    type: procedureType,
                    content: {},
                    documentInfo: { ...documentInfo },
                    createdAt: new Date().toISOString()
                  };
                  setTemplates(prev => [...prev, blankTemplate]);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                📝 Create Blank Template
              </button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <h4>Available Templates ({templates.length})</h4>
              {templates.filter(t => t.type === procedureType).map((template, index) => (
                <div key={template.id} style={{
                  padding: '15px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{template.name}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <div>
                      <button
                        onClick={() => loadTemplate(template.id)}
                        style={{
                          padding: '5px 15px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          setTemplates(prev => prev.filter(t => t.id !== template.id));
                          localStorage.setItem('procedure_templates', 
                            JSON.stringify(templates.filter(t => t.id !== template.id))
                          );
                        }}
                        style={{
                          padding: '5px 15px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📊 Analytics & Insights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#007bff', margin: '0 0 10px 0' }}>📝 Content</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.wordCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Characters</div>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#28a745', margin: '0 0 10px 0' }}>📋 Sections</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.sectionCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Sections</div>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>👁️ Views</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.viewCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Views</div>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>📤 Exports</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.exportCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Exports</div>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#6f42c1', margin: '0 0 10px 0' }}>👥 Collaborators</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.collaboratorCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Active Users</div>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#20c997', margin: '0 0 10px 0' }}>💬 Comments</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.commentCount || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Comments</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
              <h4>📈 Usage Trends</h4>
              <div style={{ height: '100px', background: '#f8f9fa', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#666' }}>Chart visualization would go here</span>
              </div>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 Audit Trail</h3>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search audit logs..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {[
                { action: 'Document Created', user: 'System', timestamp: new Date().toISOString(), details: 'Initial document creation' },
                { action: 'Content Modified', user: 'Current User', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Updated introduction section' },
                { action: 'Version Saved', user: 'Current User', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Saved version 1.1' },
                { action: 'PDF Exported', user: 'Current User', timestamp: new Date(Date.now() - 10800000).toISOString(), details: 'Exported to PDF format' },
                { action: 'Comment Added', user: 'Reviewer', timestamp: new Date(Date.now() - 14400000).toISOString(), details: 'Added comment on section 3' }
              ].map((log, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{log.action}</strong> by {log.user}
                    <br />
                    <small style={{ color: '#666' }}>{log.details}</small>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'integration':
        return (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>🔗 System Integrations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {[
                { name: 'SharePoint', status: 'Connected', icon: '📁', description: 'Document storage and sharing' },
                { name: 'Slack', status: 'Available', icon: '💬', description: 'Team communication and notifications' },
                { name: 'Jira', status: 'Available', icon: '🎯', description: 'Issue tracking and project management' },
                { name: 'Teams', status: 'Connected', icon: '👥', description: 'Video conferencing and collaboration' },
                { name: 'Outlook', status: 'Available', icon: '📧', description: 'Email notifications and calendar' },
                { name: 'Power BI', status: 'Available', icon: '📊', description: 'Advanced analytics and reporting' }
              ].map((integration, index) => (
                <div key={index} style={{
                  padding: '15px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>{integration.icon}</span>
                    <div>
                      <strong>{integration.name}</strong>
                      <div style={{
                        fontSize: '12px',
                        color: integration.status === 'Connected' ? '#28a745' : '#6c757d',
                        fontWeight: 'bold'
                      }}>
                        {integration.status}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                    {integration.description}
                  </p>
                  <button
                    style={{
                      padding: '5px 15px',
                      background: integration.status === 'Connected' ? '#dc3545' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Feature Buttons */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '15px',
        background: '#232323',
        borderRadius: '10px'
      }}>
        <h3 style={{ width: '100%', color: '#FFD700', margin: '0 0 15px 0' }}>🚀 Enhanced Features</h3>
        {features.map(feature => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
            style={{
              padding: '10px 15px',
              background: activeFeature === feature.id ? '#FFD700' : '#444',
              color: activeFeature === feature.id ? '#232323' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.3s ease'
            }}
            title={feature.description}
          >
            <span>{feature.icon}</span>
            <span>{feature.name}</span>
          </button>
        ))}
      </div>

      {/* Feature Panel */}
      {activeFeature && renderFeaturePanel()}
    </div>
  );
};

export default EnhancedProcedureFeatures;