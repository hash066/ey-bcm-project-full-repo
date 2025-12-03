import React, { useEffect, useState, useRef } from 'react';
import { FaUsers, FaListAlt, FaBullhorn, FaQuestionCircle, FaCheckSquare, FaBuilding, FaExclamationTriangle, FaEnvelope, FaFileAlt, FaTimes, FaUpload, FaChevronDown } from 'react-icons/fa';
import {
  uploadCrisisTemplate,
  fillMissingFields,
  generateCrisisPlan,
  downloadCrisisPlanPDF,
  downloadCommunicationPDF,
  downloadCrisisZip,
  getCrisisSection,
  updateCrisisSection,
  generateSectionWithLLM,
  FALLBACK_CRISIS_DATA
} from '../crisisManagementService';

const DASHBOARD_SECTIONS = [
  {
    heading: 'Executive Summary',
    icon: <FaFileAlt size={32} color="#FFD700" />,
    description: 'Overview of the crisis management plan and its objectives.'
  },
  {
    heading: 'Action Plan',
    icon: <FaListAlt size={32} color="#FFD700" />,
    description: 'Step-by-step actions for crisis response and recovery.'
  },
  {
    heading: 'Crisis Management Team (CMT)',
    icon: <FaUsers size={32} color="#FFD700" />,
    description: 'Key team members, roles, and contact information.'
  },
  {
    heading: 'Stakeholders',
    icon: <FaEnvelope size={32} color="#FFD700" />,
    description: 'List of internal and external stakeholders.'
  },
  {
    heading: 'Potential Crises & Scenarios',
    icon: <FaExclamationTriangle size={32} color="#FFD700" />,
    description: 'Types of crises the organization may face.'
  },
  {
    heading: 'Communication Plan',
    icon: <FaBullhorn size={32} color="#FFD700" />,
    description: 'How information is communicated during a crisis.'
  },
  {
    heading: 'Media Statement Template',
    icon: <FaFileAlt size={32} color="#FFD700" />,
    description: 'Template for official media statements.'
  },
  {
    heading: 'FAQ in a Crisis',
    icon: <FaQuestionCircle size={32} color="#FFD700" />,
    description: 'Frequently asked questions and answers.'
  },
  {
    heading: 'Checklists',
    icon: <FaCheckSquare size={32} color="#FFD700" />,
    description: 'Internal and external checklists for crisis response.'
  },
  {
    heading: 'Company Information & Contacts',
    icon: <FaBuilding size={32} color="#FFD700" />,
    description: 'Organization details and main contacts.'
  }
];

const DOWNLOAD_OPTIONS = [
  { label: 'Crisis Management Plan', value: 'plan' },
  { label: 'Crisis Management Communication', value: 'communication' },
  { label: 'Both (Plan + Communication)', value: 'both' }
];

const CrisisManagement = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ heading: '', content: [], icon: null });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [missingData, setMissingData] = useState({});
  const [templateFile, setTemplateFile] = useState(null);
  const sectionRefs = useRef([]);
  const [editingSection, setEditingSection] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const [templateId, setTemplateId] = useState(null); // Store template_id from upload
  const [isUsingFallback, setIsUsingFallback] = useState(false); // Track if using fallback data

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5001/api/crisis-management-doc`);
        if (!res.ok) throw new Error('Failed to fetch document');
        const data = await res.json();
        setDoc(data);
        setIsUsingFallback(false);
      } catch (err) {
        console.log('Using fallback crisis management data due to API failure');
        setDoc(FALLBACK_CRISIS_DATA);
        setIsUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  // Simulate parsing and missing fields detection
  const handleTemplateUpload = async e => {
    const file = e.target.files[0];
    setTemplateFile(file);
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadCrisisTemplate(file);
      const { template_id, missing_fields = [] } = res.data;
      setTemplateId(template_id);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback template upload data');
      }
      
      if (missing_fields.length > 0) {
        setMissingFields(missing_fields);
        setUploadModalOpen(true);
      } else {
        setDoc({ title: 'Uploaded Crisis Management Plan', sections: DASHBOARD_SECTIONS.map(s => ({ heading: s.heading, content: [`Sample content for ${s.heading} from uploaded template.`] })) });
        setMissingFields([]);
        setUploadModalOpen(false);
      }
    } catch (err) {
      setError('Failed to upload template.');
    } finally {
      setLoading(false);
    }
  };

  const handleMissingDataChange = (field, value) => {
    setMissingData(prev => ({ ...prev, [field]: value }));
  };

  // Replace handleMissingDataSubmit with real API call
  const handleMissingDataSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // You need to keep track of template_id from uploadCrisisTemplate response
      // For now, assume template_id is available (store in state if needed)
      const template_id = 'template_xxxxx'; // TODO: store real template_id
      const res = await fillMissingFields(template_id, missingData);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback missing fields data');
      }
      
      // Optionally, fetch updated doc/plan
      setDoc({ title: 'Uploaded Crisis Management Plan (with user data)', sections: DASHBOARD_SECTIONS.map((s, idx) => ({ heading: s.heading, content: [`Sample content for ${s.heading} from uploaded template.`] })) });
      setUploadModalOpen(false);
      setMissingFields([]);
      setMissingData({});
    } catch (err) {
      setError('Failed to submit missing data.');
    } finally {
      setLoading(false);
    }
  };

  // Replace handleDownload with real API calls
  const handleDownload = async (type) => {
    setDownloading(true);
    setDownloadDropdown(false);
    try {
      let res;
      let filename = 'Crisis_Management_' + type;
      if (type === 'plan') {
        res = await downloadCrisisPlanPDF();
        filename += '.pdf';
      } else if (type === 'communication') {
        res = await downloadCommunicationPDF();
        filename += '.pdf';
      } else if (type === 'both') {
        res = await downloadCrisisZip();
        filename += '.zip';
      }
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback download data');
      }
      
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  const scrollToSection = idx => {
    setActiveSection(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showDashboard = !doc || !doc.sections || doc.sections.length === 0;

  const handleDashboardCardClick = idx => {
    let icon = DASHBOARD_SECTIONS[idx]?.icon;
    if (!showDashboard && doc && doc.sections && doc.sections[idx]) {
      setModalContent({
        heading: doc.sections[idx].heading,
        content: doc.sections[idx].content,
        icon
      });
      setModalOpen(true);
    } else {
      setModalContent({
        heading: DASHBOARD_SECTIONS[idx].heading,
        content: [DASHBOARD_SECTIONS[idx].description],
        icon
      });
      setModalOpen(true);
    }
  };

  const closeModal = () => setModalOpen(false);

  const renderModalContent = content => {
    if (content.length > 0 && content.every(line => line.trim().startsWith('-'))) {
      return (
        <ul style={{ margin: '12px 0 0 0', paddingLeft: 22 }}>
          {content.map((line, idx) => (
            <li key={idx} style={{ fontSize: 16, marginBottom: 8, color: 'var(--content-text)' }}>{line.replace(/^[-\s]+/, '')}</li>
          ))}
        </ul>
      );
    }
    return content.map((para, idx) => (
      <div key={idx} style={{ fontSize: 16, marginBottom: 10, textAlign: 'justify', lineHeight: 1.6 }}>{para}</div>
    ));
  };

  // Section modal: start editing
  const startEditSection = () => {
    setEditContent((modalContent.content || []).join('\n'));
    setEditingSection(true);
  };

  // Fetch latest section content after save or LLM generate
  const fetchSectionContent = async (section_id) => {
    try {
      const res = await getCrisisSection(section_id);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback section content data');
      }
      
      // Assume response has a 'content' field (string or array)
      setModalContent((prev) => ({ ...prev, content: Array.isArray(res.data.content) ? res.data.content : [res.data.content] }));
    } catch (err) {
      setError('Failed to fetch latest section content.');
    }
  };

  // Section modal: save edit
  const saveEditSection = async () => {
    if (!modalContent.heading) return;
    setLoading(true);
    setError(null);
    try {
      const section_id = modalContent.heading.toLowerCase().replace(/\s+/g, '-');
      const res = await updateCrisisSection(section_id, editContent);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback section update data');
      }
      
      await fetchSectionContent(section_id);
      setEditingSection(false);
    } catch (err) {
      setError('Failed to update section.');
    } finally {
      setLoading(false);
    }
  };

  // Section modal: generate with LLM
  const generateSectionLLM = async () => {
    if (!modalContent.heading) return;
    setLlmLoading(true);
    setError(null);
    try {
      const section = modalContent.heading;
      const context = (modalContent.content || []).join(' ');
      const res = await generateSectionWithLLM(section, context);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback LLM generation data');
      }
      
      setEditContent(res.data.content ? res.data.content.join('\n') : res.data.generated_content || '');
      setEditingSection(true);
      // Optionally, fetch latest after save
    } catch (err) {
      setError('Failed to generate section with LLM.');
    } finally {
      setLlmLoading(false);
    }
  };

  // Generate entire crisis management plan
  const [planGenerating, setPlanGenerating] = useState(false);
  const generateFullPlan = async () => {
    if (!templateId) {
      setError('No template uploaded.');
      return;
    }
    setPlanGenerating(true);
    setError(null);
    try {
      // For demo, use empty answers or collect from user as needed
      const answers = {};
      const res = await generateCrisisPlan(templateId, answers);
      
      // Check if this is fallback data
      if (res.isFallback) {
        setIsUsingFallback(true);
        console.log('Using fallback crisis plan generation data');
      }
      
      // Assume response has a 'plan' or 'sections' field
      setDoc(res.data.plan || res.data);
    } catch (err) {
      setError('Failed to generate crisis management plan.');
    } finally {
      setPlanGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Upload & Download Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px 0 40px' }}>
        <div>
          <label htmlFor="template-upload" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', background: 'var(--accent-color)', color: '#232323', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px var(--shadow-color)', marginRight: 18 }}>
            <FaUpload style={{ marginRight: 8 }} /> Upload Template
            <input id="template-upload" type="file" accept=".pdf,.doc,.docx,.json" style={{ display: 'none' }} onChange={handleTemplateUpload} />
          </label>
          {templateFile && <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{templateFile.name}</span>}
          <button onClick={generateFullPlan} disabled={planGenerating || !templateId} style={{ marginLeft: 18, padding: '10px 22px', background: 'var(--accent-color)', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px var(--shadow-color)', cursor: planGenerating || !templateId ? 'not-allowed' : 'pointer' }}>{planGenerating ? 'Generating Plan...' : 'Generate Plan'}</button>
        </div>
        
        {/* Fallback Data Indicator - Hidden by default */}
        {isUsingFallback && false && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 193, 7, 0.9)',
            color: '#232323',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaExclamationTriangle size={16} />
            Using Fallback Data (LLM Unavailable)
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button
            style={{ padding: '12px 36px', background: 'var(--accent-color)', color: '#232323', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px var(--shadow-color)', display: 'flex', alignItems: 'center', gap: 10 }}
            onClick={() => setDownloadDropdown(d => !d)}
            disabled={downloading}
            aria-haspopup="listbox"
            aria-expanded={downloadDropdown}
          >
            Download <FaChevronDown />
          </button>
          {downloadDropdown && (
            <ul style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--card-bg)', border: '1px solid var(--accent-color)', borderRadius: 8, boxShadow: '0 2px 8px var(--shadow-color)', margin: 0, padding: 0, listStyle: 'none', zIndex: 20, minWidth: 260 }}>
              {DOWNLOAD_OPTIONS.map(opt => (
                <li key={opt.value}>
                  <button
                    style={{ width: '100%', background: 'none', border: 'none', color: 'var(--content-text)', fontWeight: 600, fontSize: 16, padding: '14px 18px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => handleDownload(opt.value)}
                    disabled={downloading}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Section Navigation */}
      {!showDashboard && doc && doc.sections && (
        <nav style={{
          display: 'flex',
          gap: 18,
          padding: '18px 40px 0 40px',
          overflowX: 'auto',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 80,
          zIndex: 9
        }}>
          {doc.sections.map((section, idx) => (
            <button
              key={section.heading}
              onClick={() => scrollToSection(idx)}
              style={{
                background: idx === activeSection ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: idx === activeSection ? '#232323' : 'var(--content-text)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                padding: '10px 22px',
                cursor: 'pointer',
                boxShadow: idx === activeSection ? '0 2px 8px var(--shadow-color)' : 'none',
                transition: 'background 0.2s, color 0.2s',
                outline: 'none',
                marginBottom: 4
              }}
            >
              {section.heading}
            </button>
          ))}
        </nav>
      )}
      {/* Main Content or Dashboard */}
      <div style={{ flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
        {loading && <div style={{ gridColumn: '1/-1', textAlign: 'center', margin: 32, fontSize: 20 }}>Loading document...</div>}
        {showDashboard && DASHBOARD_SECTIONS.map((section, idx) => (
          <div key={idx} style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            boxShadow: '0 2px 16px rgba(0,0,0,0.13)',
            padding: '32px 28px',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--accent-color)',
            transition: 'border 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => handleDashboardCardClick(idx)}
          tabIndex={0}
          role="button"
          aria-label={`Go to ${section.heading}`}
          >
            <div style={{ marginBottom: 16 }}>{section.icon}</div>
            <h2 style={{ color: 'var(--accent-color)', fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: 0.5, textAlign: 'center' }}>{section.heading}</h2>
            <div style={{ fontSize: 16, color: 'var(--content-text)', textAlign: 'center', lineHeight: 1.6 }}>{section.description}</div>
          </div>
        ))}
        {!showDashboard && doc && doc.sections && doc.sections.map((section, idx) => (
          <div
            key={idx}
            ref={el => sectionRefs.current[idx] = el}
            style={{
              background: 'var(--card-bg)',
              borderRadius: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.13)',
              padding: '32px 28px',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              border: idx === activeSection ? '2px solid var(--accent-color)' : '2px solid transparent',
              transition: 'border 0.2s'
            }}
          >
            <h2 style={{ color: 'var(--accent-color)', fontSize: 22, fontWeight: 800, marginBottom: 14, letterSpacing: 0.5 }}>{section.heading}</h2>
            {section.content.map((para, pidx) => (
              <div key={pidx} style={{ fontSize: 17, color: 'var(--content-text)', marginBottom: 10, textAlign: 'justify', lineHeight: 1.7 }}>{para}</div>
            ))}
          </div>
        ))}
      </div>
      {/* Modal Popup for Section Info */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
            padding: '36px 32px 28px 32px',
            minWidth: 340,
            maxWidth: 480,
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            color: 'var(--content-text)'
          }}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                fontSize: 24,
                cursor: 'pointer',
                fontWeight: 700
              }}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
              {modalContent.icon && <div style={{ marginBottom: 8 }}>{modalContent.icon}</div>}
              <h2 style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: 22, marginBottom: 10, textAlign: 'center' }}>{modalContent.heading}</h2>
            </div>
            {editingSection ? (
              <>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={10}
                  style={{ width: '100%', borderRadius: 8, border: '1.5px solid var(--accent-color)', padding: 10, fontSize: 16, marginBottom: 16, background: 'var(--input-bg)', color: 'var(--input-text)' }}
                />
                <button onClick={saveEditSection} style={{ width: '100%', padding: '10px 0', background: 'var(--accent-color)', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>Save</button>
                <button onClick={() => setEditingSection(false)} style={{ width: '100%', padding: '10px 0', background: 'var(--bg-tertiary)', color: 'var(--accent-color)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                {renderModalContent(modalContent.content)}
                <button onClick={startEditSection} style={{ width: '100%', padding: '10px 0', background: 'var(--accent-color)', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 16, marginBottom: 8 }}>Edit</button>
                <button onClick={generateSectionLLM} disabled={llmLoading} style={{ width: '100%', padding: '10px 0', background: 'var(--bg-tertiary)', color: 'var(--accent-color)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>{llmLoading ? 'Generating...' : 'Generate with LLM'}</button>
              </>
            )}
            {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          </div>
        </div>
      )}
      {/* Modal for Missing Data Entry */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <form onSubmit={handleMissingDataSubmit} style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
            padding: '36px 32px 28px 32px',
            minWidth: 340,
            maxWidth: 480,
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            color: 'var(--content-text)'
          }}>
            <button
              onClick={() => setUploadModalOpen(false)}
              type="button"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                fontSize: 24,
                cursor: 'pointer',
                fontWeight: 700
              }}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h2 style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: 22, marginBottom: 18, textAlign: 'center' }}>Enter Missing Data</h2>
            {missingFields.map(field => (
              <div key={field} style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, color: 'var(--accent-color)', display: 'block', marginBottom: 6 }}>{field}</label>
                <input
                  type="text"
                  value={missingData[field] || ''}
                  onChange={e => handleMissingDataChange(field, e.target.value)}
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid var(--accent-color)', background: 'var(--input-bg)', color: 'var(--input-text)', fontSize: 16 }}
                />
              </div>
            ))}
            <button type="submit" style={{ width: '100%', padding: '12px 0', background: 'var(--accent-color)', color: '#232323', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer', marginTop: 10 }}>Submit</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CrisisManagement; 