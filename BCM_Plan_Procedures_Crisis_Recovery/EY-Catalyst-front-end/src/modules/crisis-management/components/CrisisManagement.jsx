import React, { useState, useEffect } from "react";
import { FaDownload, FaEdit, FaSave, FaTimes, FaRobot } from "react-icons/fa";
import { getCrisisPlan, updateCrisisSection, downloadCrisisPDF, generateSectionWithAI } from "./crisisManagementService";
import "./CrisisManagement.css";

const CrisisManagementDashboard = () => {
  const [crisisData, setCrisisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCrisisPlan();
  }, []);

  const loadCrisisPlan = async () => {
    try {
      setLoading(true);
      const data = await getCrisisPlan();
      console.log('📊 Crisis plan loaded with', data.sections?.length, 'sections');
      setCrisisData(data);
      if (data?.sections && data.sections.length > 0) {
        setSelectedSection(data.sections[0]);
      }
    } catch (err) {
      console.error('Error loading crisis plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    setEditMode(false);
  };

  const handleEditClick = () => {
    setEditMode(true);
    const currentContent = selectedSection?.content?.join('\n') || '';
    setEditContent(currentContent);
    console.log('✏️ Edit mode activated for:', selectedSection?.heading);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const contentArray = editContent.split('\n').filter(line => line.trim() !== '');
      
      console.log('💾 Saving section:', selectedSection.id);
      console.log('📝 Content lines:', contentArray.length);
      
      await updateCrisisSection(selectedSection.id, contentArray);
      
      // Update local state
      const updatedSections = crisisData.sections.map(section =>
        section.id === selectedSection.id
          ? { ...section, content: contentArray }
          : section
      );
      setCrisisData({ ...crisisData, sections: updatedSections });
      setSelectedSection({ ...selectedSection, content: contentArray });
      setEditMode(false);
      
      console.log('✅ Section saved successfully');
      alert('✅ Section updated successfully!');
    } catch (err) {
      console.error('❌ Save error:', err);
      alert('❌ Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setGenerating(true);
      console.log('🤖 Generating AI content for:', selectedSection.id);
      
      const result = await generateSectionWithAI(selectedSection.id, {
        company_name: 'Your Company',
        industry: 'Technology',
        section_name: selectedSection.heading
      });
      
      console.log('✅ AI generated', result.content?.length, 'lines of content');
      
      // Update the edit textarea with AI content
      const aiContent = result.content?.join('\n') || '';
      setEditContent(aiContent);
      
      alert('✅ AI-generated content loaded! Review and click Save if satisfied.');
    } catch (err) {
      console.error('❌ AI generation error:', err);
      alert('❌ Failed to generate content with AI. Using fallback content.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('📥 Downloading PDF...');
      const blob = await downloadCrisisPDF();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crisis_management_plan_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
      console.log('✅ PDF downloaded');
    } catch (err) {
      console.error('❌ PDF download error:', err);
      alert('❌ Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="crisis-loading">
        <div className="loading-spinner"></div>
        <p>Loading Crisis Management Plan...</p>
      </div>
    );
  }

  if (!crisisData || !crisisData.sections) {
    return (
      <div className="crisis-loading">
        <p style={{ color: '#e74c3c', fontSize: '18px', marginBottom: '20px' }}>
          ❌ Failed to load crisis management data
        </p>
        <button onClick={loadCrisisPlan} className="btn-download">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="crisis-management-container">
      {/* Header */}
      <div className="crisis-header">
        <div>
          <h1 className="crisis-title">🚨 Crisis Management Plan</h1>
          <p className="crisis-subtitle">Comprehensive crisis response and management framework</p>
        </div>
        <div className="header-actions">
          <button className="btn-download" onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
            <FaDownload /> Export
          </button>
          {showDownloadMenu && (
            <div className="download-menu">
              <button onClick={handleDownloadPDF}>📄 Download PDF</button>
              <button onClick={() => window.print()}>📝 Print Plan</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="crisis-content">
        {/* Sidebar */}
        <div className="crisis-sidebar">
          <h3 className="sidebar-title">Plan Sections</h3>
          {crisisData.sections.map((section) => (
            <button
              key={section.id}
              className={`section-btn ${selectedSection?.id === section.id ? 'active' : ''}`}
              onClick={() => handleSectionClick(section)}
            >
              <span className="section-icon">{section.icon}</span>
              <span className="section-name">{section.heading}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="crisis-main">
          {selectedSection && (
            <>
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span className="title-icon">{selectedSection.icon}</span>
                    {selectedSection.heading}
                  </h2>
                </div>
                <div className="section-actions">
                  {!editMode ? (
                    <button className="btn-edit" onClick={handleEditClick}>
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <>
                      <button 
                        className="btn-ai" 
                        onClick={handleGenerateWithAI}
                        disabled={generating}
                      >
                        <FaRobot /> {generating ? 'Generating...' : 'AI Generate'}
                      </button>
                      <button 
                        className="btn-save" 
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <FaSave /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn-cancel" onClick={() => setEditMode(false)}>
                        <FaTimes /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="section-content">
                {editMode ? (
                  <textarea
                    className="content-editor"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    placeholder="Enter section content here... Each line will be a separate point."
                  />
                ) : (
                  <div className="content-display">
                    {selectedSection.content?.map((line, index) => (
                      <p key={index} className="content-line">
                        {line}
                      </p>
                    )) || <p style={{ color: '#999' }}>No content available. Click Edit to add content.</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrisisManagementDashboard;
