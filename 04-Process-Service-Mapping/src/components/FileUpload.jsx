import React, { useState } from 'react';
import { FaUpload, FaFilePdf, FaFileWord, FaFileCsv, FaTrash, FaEye } from 'react-icons/fa';
import apiService from '../../../services/apiService.js';

const FileUpload = ({ onFlowchartGenerated }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Load uploaded files on component mount
  React.useEffect(() => {
    // Comment out API calls to avoid backend crashes
    // loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const files = await apiService.listUploadedFiles();
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      setUploadedFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please select a valid file type (PDF, DOCX, or CSV)');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Call the FastAPI backend to parse the PDF and generate the flowchart
      const flowchartData = await apiService.uploadAndParsePDF(selectedFile);
      if (onFlowchartGenerated) {
        onFlowchartGenerated(flowchartData, selectedFile.name);
      }
      
      // Reload uploaded files list
      await loadUploadedFiles();
      
      // Clear selected file
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    try {
      await apiService.deleteUploadedFile(filename);
      await loadUploadedFiles();
    } catch (error) {
      console.error('Delete failed:', error);
      setUploadError('Failed to delete file. Please try again.');
    }
  };

  const handleGenerateFromFile = async (fileId) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Comment out API call to avoid backend crashes
      /*
      const flowchartData = await apiService.generateFlowchart(fileId);
      console.log('Flowchart generated from file:', flowchartData);
      
      if (onFlowchartGenerated) {
        onFlowchartGenerated(flowchartData.flowchart_data, fileId);
      }
      */
      
      // Use static data instead of API calls
      console.log('Using static data instead of API calls');
      const staticData = await apiService.getFlowchartData();
      if (onFlowchartGenerated) {
        onFlowchartGenerated(staticData, fileId);
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
      setUploadError(error.message || 'Generation failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf style={{ color: '#e74c3c' }} />;
      case 'docx':
        return <FaFileWord style={{ color: '#3498db' }} />;
      case 'csv':
        return <FaFileCsv style={{ color: '#27ae60' }} />;
      default:
        return <FaFilePdf style={{ color: '#95a5a6' }} />;
    }
  };

  return (
    <div style={{
      background: '#232323',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      border: '1.5px solid #FFD700',
      boxShadow: '0 4px 24px #00000044'
    }}>
      <h3 style={{ 
        color: '#FFD700', 
        fontWeight: 700, 
        fontSize: 20, 
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <FaUpload /> Upload Document
      </h3>
      
      <p style={{ color: '#FFD700cc', marginBottom: 20, fontSize: 14 }}>
        Upload a PDF, DOCX, or CSV file to extract organizational hierarchy and generate a process mapping flowchart.
      </p>

      {/* File Upload Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          border: '2px dashed #FFD700',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          background: '#181818',
          marginBottom: 16
        }}>
          <input
            type="file"
            accept=".pdf,.docx,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <div style={{ color: '#FFD700', fontSize: 48, marginBottom: 8 }}>
              <FaUpload />
            </div>
            <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 4 }}>
              {selectedFile ? selectedFile.name : 'Click to select file'}
            </div>
            <div style={{ color: '#FFD700cc', fontSize: 12 }}>
              PDF, DOCX, or CSV (max 10MB)
            </div>
          </label>
        </div>

        {selectedFile && (
          <div style={{
            background: '#181818',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #FFD700',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {getFileIcon(selectedFile.name)}
            <span style={{ color: '#f1f1f1', flex: 1 }}>{selectedFile.name}</span>
            <span style={{ color: '#FFD700cc', fontSize: 12 }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}

        {uploadError && (
          <div style={{
            background: '#e74c3c',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
            fontSize: 14
          }}>
            ⚠️ {uploadError}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          style={{
            padding: '12px 24px',
            background: selectedFile && !isUploading ? '#FFD700' : '#444',
            color: selectedFile && !isUploading ? '#232526' : '#666',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload & Generate Flowchart'}
        </button>
      </div>

      {/* Uploaded Files Section */}
      <div>
        <h4 style={{ color: '#FFD700', fontWeight: 600, marginBottom: 12 }}>
          Uploaded Files
        </h4>
        
        {isLoadingFiles ? (
          <div style={{ color: '#FFD700', textAlign: 'center', padding: 20 }}>
            Loading files...
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div style={{ 
            color: '#FFD700cc', 
            textAlign: 'center', 
            padding: 20,
            background: '#181818',
            borderRadius: 8
          }}>
            No files uploaded yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uploadedFiles.map((file) => (
              <div key={file.filename} style={{
                background: '#181818',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                {getFileIcon(file.filename)}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f1f1', fontWeight: 500 }}>
                    {file.filename}
                  </div>
                  <div style={{ color: '#FFD700cc', fontSize: 12 }}>
                    Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleGenerateFromFile(file.filename)}
                    disabled={isUploading}
                    style={{
                      padding: '6px 12px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FaEye /> Generate
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.filename)}
                    disabled={isUploading}
                    style={{
                      padding: '6px 12px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload; 
