import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaHistory, FaKeyboard, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('choose'); // 'choose', 'upload', 'past', 'manual'
  const [pastData, setPastData] = useState(null);
  const [fetchingPast, setFetchingPast] = useState(false);
  const [textPreview, setTextPreview] = useState('');
  const [excelPreview, setExcelPreview] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setStatus('');
    setTextPreview('');
    setExcelPreview(null);
    if (selectedFile) {
      if (selectedFile.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = ev => {
          const lines = (ev.target.result || '').split('\n').slice(0, 20).join('\n');
          setTextPreview(lines);
        };
        reader.readAsText(selectedFile);
      } else if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls')
      ) {
        const reader = new FileReader();
        reader.onload = ev => {
          const data = new Uint8Array(ev.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          // Only show first 10 rows and 10 columns
          const previewRows = json.slice(0, 10).map(row => row.slice(0, 10));
          setExcelPreview(previewRows);
        };
        reader.readAsArrayBuffer(selectedFile);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setStatus('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Upload to backend unified upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setStatus('File uploaded successfully! The backend will process and map the data.');
      } else {
        setStatus('Upload failed. Please try again.');
      }
    } catch (err) {
      setStatus('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch past data from backend
  const handleUsePastData = async () => {
    setMode('past');
    setFetchingPast(true);
    setStatus('Fetching past data...');
    try {
      // Replace /api/past-data with your backend endpoint
      const response = await fetch('/api/past-data');
      if (response.ok) {
        const data = await response.json();
        setPastData(data);
        setStatus('Fetched past data. You can proceed to the dashboard.');
      } else {
        setStatus('No past data found.');
      }
    } catch (err) {
      setStatus('An error occurred while fetching past data.');
    } finally {
      setFetchingPast(false);
    }
  };

  // Go to manual input page
  const handleManualInput = () => {
    navigate('/manual-input');
  };

  // File preview logic
  const renderFilePreview = () => {
    if (!file) return null;
    const fileType = file.type;
    const fileURL = URL.createObjectURL(file);
    if (excelPreview && (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    )) {
      return (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 6 }}>Excel Preview:</div>
          <div style={{ overflowX: 'auto', background: '#232323', borderRadius: 8, boxShadow: '0 2px 8px #FFD70022', padding: 8 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {excelPreview.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ border: '1px solid #FFD700', color: '#FFD700', padding: '4px 8px', fontSize: 13, minWidth: 40, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell !== undefined ? cell : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (fileType.startsWith('image/')) {
      return (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 6 }}>Image Preview:</div>
          <img src={fileURL} alt="preview" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, boxShadow: '0 2px 8px #FFD70022' }} />
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 6 }}>PDF Preview:</div>
          <embed src={fileURL} type="application/pdf" width="100%" height="300px" style={{ borderRadius: 8, boxShadow: '0 2px 8px #FFD70022' }} />
        </div>
      );
    } else if (fileType.startsWith('text/')) {
      return (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 6 }}>Text Preview:</div>
          <pre style={{ background: '#232323', color: '#FFD700', padding: 12, borderRadius: 8, maxHeight: 200, overflow: 'auto' }}>{textPreview}</pre>
        </div>
      );
    } else {
      // For Word or unknown types
      return (
        <div style={{ marginTop: 16, color: '#FFD700', fontWeight: 600 }}>
          <div>File: {file.name}</div>
          <div>Type: {fileType || 'Unknown'}</div>
          <div>Size: {(file.size / 1024).toFixed(1)} KB</div>
          <div style={{ marginTop: 6, color: '#aaa', fontWeight: 400 }}>
            Preview not available for this file type, but it will be uploaded.
          </div>
        </div>
      );
    }
  };

  // Stepper UI
  const renderStepper = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: mode === 'upload' ? 'linear-gradient(90deg, #FFD700 0%, #ffe066 100%)' : '#232323',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: mode === 'upload' ? '#222' : '#FFD700', fontSize: 22, boxShadow: mode === 'upload' ? '0 2px 8px #FFD70044' : 'none', transition: 'all 0.2s'
        }}><FaCloudUploadAlt /></div>
        <div style={{ color: mode === 'upload' ? '#FFD700' : '#aaa', fontWeight: 600, marginTop: 6, fontSize: 13 }}>Upload</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: mode === 'past' ? 'linear-gradient(90deg, #6a3093 0%, #a044ff 100%)' : '#232323',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: mode === 'past' ? '#fff' : '#a044ff', fontSize: 22, boxShadow: mode === 'past' ? '0 2px 8px #a044ff44' : 'none', transition: 'all 0.2s'
        }}><FaHistory /></div>
        <div style={{ color: mode === 'past' ? '#a044ff' : '#aaa', fontWeight: 600, marginTop: 6, fontSize: 13 }}>Past Data</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: mode === 'manual' ? 'linear-gradient(90deg, #00c3ff 0%, #ffff1c 100%)' : '#232323',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: mode === 'manual' ? '#222' : '#00c3ff', fontSize: 22, boxShadow: mode === 'manual' ? '0 2px 8px #00c3ff44' : 'none', transition: 'all 0.2s'
        }}><FaKeyboard /></div>
        <div style={{ color: mode === 'manual' ? '#00c3ff' : '#aaa', fontWeight: 600, marginTop: 6, fontSize: 13 }}>Manual</div>
      </div>
    </div>
  );

  return (
    <div className="homepage-container" style={{ 
      width: '100%', 
      maxWidth: '100%', 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 50%, #1a1a1a 100%)', 
      borderRadius: 16, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(106, 48, 147, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(0, 195, 255, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Header Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 className="homepage-title" style={{ 
          color: '#FFD700', 
          fontWeight: 900, 
          letterSpacing: 2, 
          fontSize: '2rem',
          marginBottom: '0.5rem',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
        }}>
          Business Continuity Management
        </h1>
        <p style={{ 
          color: '#ccc', 
          fontSize: '1rem', 
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem auto'
        }}>
          Choose your preferred method to set up your BCM data and start building your business continuity framework
        </p>
      {renderStepper()}
      </div>

      {mode === 'choose' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Main Options Grid */}
          <div className="homepage-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
          <button
            onClick={() => setMode('upload')}
            style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #ffe066 100%)',
              color: '#222',
              fontWeight: 700,
              border: 'none',
              borderRadius: 12,
                padding: '2rem 1.5rem',
                fontSize: 15,
              cursor: 'pointer',
                boxShadow: '0 6px 24px #FFD70022',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.2rem',
                minHeight: '160px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 16px 48px #FFD70033';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px #FFD70022';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                transform: 'rotate(45deg)',
                transition: 'all 0.4s ease'
              }} />
              <FaCloudUploadAlt style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Upload Files</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Import PDF, Excel, Word documents</div>
              </div>
          </button>
            
          <button
            onClick={handleUsePastData}
            style={{
                background: 'linear-gradient(135deg, #6a3093 0%, #a044ff 100%)',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 12,
                padding: '2rem 1.5rem',
                fontSize: 15,
              cursor: 'pointer',
                boxShadow: '0 6px 24px #a044ff22',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.2rem',
                minHeight: '160px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 16px 48px #a044ff33';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px #a044ff22';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                transform: 'rotate(45deg)',
                transition: 'all 0.4s ease'
              }} />
              <FaHistory style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Load Previous Data</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Continue from saved mappings</div>
              </div>
          </button>
            
          <button
            onClick={handleManualInput}
            style={{
                background: 'linear-gradient(135deg, #00c3ff 0%, #ffff1c 100%)',
              color: '#222',
              fontWeight: 700,
              border: 'none',
              borderRadius: 12,
                padding: '2rem 1.5rem',
                fontSize: 15,
              cursor: 'pointer',
                boxShadow: '0 6px 24px #00c3ff22',
                transition: 'all 0.4s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.2rem',
                minHeight: '160px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 16px 48px #00c3ff33';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 32px #00c3ff22';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                transform: 'rotate(45deg)',
                transition: 'all 0.4s ease'
              }} />
              <FaKeyboard style={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manual Entry</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Create data from scratch</div>
              </div>
          </button>
          </div>

          {/* Module Descriptions Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              color: '#FFD700', 
              textAlign: 'center', 
              marginBottom: '2rem', 
              fontSize: '1.8rem',
              fontWeight: 800
            }}>
              BCM Framework Modules
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{
                background: 'rgba(255, 215, 0, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: 12,
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700 }}>
                  🔄 Process & Service Mapping
                </h3>
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Create comprehensive visual maps of your business processes and services. Identify dependencies, 
                  critical paths, and potential bottlenecks in your operations.
                </p>
                <ul style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '1.2rem' }}>
                  <li>Interactive flow diagrams</li>
                  <li>Dependency mapping</li>
                  <li>Process optimization insights</li>
                  <li>Service impact analysis</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(106, 48, 147, 0.05)',
                border: '1px solid rgba(106, 48, 147, 0.2)',
                borderRadius: 12,
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#a044ff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700 }}>
                  📊 Business Impact Analysis (BIA)
                </h3>
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Assess the potential impact of disruptions on your business functions. Determine recovery objectives 
                  and prioritize critical operations based on financial, operational, and regulatory impacts.
                </p>
                <ul style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '1.2rem' }}>
                  <li>Criticality assessment</li>
                  <li>RTO/RPO determination</li>
                  <li>Impact quantification</li>
                  <li>ISO 22301 compliance</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(0, 195, 255, 0.05)',
                border: '1px solid rgba(0, 195, 255, 0.2)',
                borderRadius: 12,
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#00c3ff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700 }}>
                  🎯 Risk Assessment & Management
                </h3>
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Identify, analyze, and evaluate risks to your business continuity. Develop mitigation strategies 
                  and monitor risk levels to ensure organizational resilience.
                </p>
                <ul style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '1.2rem' }}>
                  <li>Risk identification</li>
                  <li>Probability assessment</li>
                  <li>Mitigation planning</li>
                  <li>Risk monitoring</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 700 }}>
                  📋 Business Continuity Planning
                </h3>
                <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Develop comprehensive business continuity plans with detailed recovery procedures, 
                  resource requirements, and communication protocols for various disruption scenarios.
                </p>
                <ul style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, paddingLeft: '1.2rem' }}>
                  <li>Recovery procedures</li>
                  <li>Resource allocation</li>
                  <li>Communication plans</li>
                  <li>Testing & validation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.2rem' }}>BCM Framework Overview</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>4</div>
                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Core Modules</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', color: '#a044ff', fontWeight: 'bold' }}>∞</div>
                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Process Maps</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', color: '#00c3ff', fontWeight: 'bold' }}>100%</div>
                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Customizable</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>24/7</div>
                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Access</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {mode === 'upload' && (
        <div className="homepage-upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
          <div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>
            <FaCloudUploadAlt style={{ marginRight: 8, color: '#FFD700', fontSize: 20 }} />
            Select a file (PDF, Excel, or Word):
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.txt,.png,.jpg,.jpeg,.gif"
              onChange={handleFileChange}
                  style={{ 
                    marginTop: 12, 
                    background: '#232323', 
                    color: '#FFD700', 
                    borderRadius: 8, 
                    padding: '0.75rem', 
                    border: '1px solid #FFD700', 
                    fontSize: 14,
                    width: '100%'
                  }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(90deg, #FFD700 0%, #ffe066 100%)',
              color: '#222',
              fontWeight: 700,
              border: 'none',
                  borderRadius: 10,
                  padding: '1rem',
                  fontSize: 16,
              cursor: 'pointer',
                  boxShadow: '0 4px 16px #FFD70022',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            {loading ? 'Uploading...' : <><FaCloudUploadAlt /> Upload File</>}
          </button>
          <button
            type="button"
            onClick={() => setMode('choose')}
            style={{
              background: 'none',
              color: '#FFD700',
              border: '1px solid #FFD700',
                  borderRadius: 8,
                  padding: '0.75rem',
              fontWeight: 600,
                  fontSize: 14,
              cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <FaArrowLeft /> Back
          </button>
        </form>
          </div>
          <div style={{ background: '#232323', borderRadius: 12, padding: '1.5rem', border: '1px solid #333' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.1rem' }}>File Preview</h3>
            {renderFilePreview()}
          </div>
        </div>
      )}
      {mode === 'past' && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ color: '#FFD700', textAlign: 'center', fontWeight: 600, marginBottom: '1rem' }}>
          {fetchingPast ? 'Fetching past data...' : status}
          </div>
          {pastData && (
            <div className="homepage-past-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '2rem',
              color: '#fff', 
              fontWeight: 400, 
              fontSize: 15 
            }}>
              <div style={{ background: '#232323', borderRadius: 12, padding: '1.5rem', border: '1px solid #333' }}>
                <div style={{ fontWeight: 700, color: '#FFD700', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <FaCheckCircle style={{ color: '#28a745', marginRight: 6 }} />Summary of Past Data
                </div>
                <pre style={{ 
                  background: '#1a1a1a', 
                  color: '#FFD700', 
                  borderRadius: 8, 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontSize: 13, 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  boxShadow: '0 2px 8px #FFD70022',
                  margin: 0
                }}>
                  {JSON.stringify(pastData, null, 2)}
                </pre>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                justifyContent: 'center'
              }}>
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #ffe066 100%)',
                  color: '#222',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 12,
                    padding: '1rem',
                  fontSize: 16,
                  cursor: 'pointer',
                    boxShadow: '0 4px 16px #FFD70022',
                    transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <FaCheckCircle style={{ color: '#28a745' }} /> Go to Dashboard
              </button>
                <button
                  style={{
                    background: 'none',
                    color: '#FFD700',
                    border: '1px solid #FFD700',
                    borderRadius: 10,
                    padding: '0.75rem',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                  onClick={() => setMode('choose')}
                >
                  <FaArrowLeft /> Back
                </button>
              </div>
            </div>
          )}
          {!pastData && (
            <div style={{ textAlign: 'center' }}>
          <button
            style={{
              background: 'none',
              color: '#FFD700',
              border: '1px solid #FFD700',
              borderRadius: 10,
                  padding: '0.75rem 1.5rem',
              fontWeight: 600,
                  fontSize: 14,
              cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  margin: '0 auto'
            }}
            onClick={() => setMode('choose')}
          >
            <FaArrowLeft /> Back
          </button>
        </div>
      )}
        </div>
      )}
      {mode === 'choose' && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: 'rgba(255, 215, 0, 0.05)', 
          border: '1px solid rgba(255, 215, 0, 0.2)', 
          borderRadius: 12,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.1rem' }}>Getting Started</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            color: '#ccc',
            fontSize: '0.9rem',
            lineHeight: 1.6
          }}>
            <div>
              <strong style={{ color: '#FFD700' }}>📁 Upload Files:</strong> Import existing documents to automatically extract and map your data
            </div>
            <div>
              <strong style={{ color: '#a044ff' }}>🔄 Load Previous:</strong> Continue working with your saved BCM framework data
            </div>
            <div>
              <strong style={{ color: '#00c3ff' }}>✏️ Manual Entry:</strong> Build your framework from scratch with our guided forms
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default HomePage;
