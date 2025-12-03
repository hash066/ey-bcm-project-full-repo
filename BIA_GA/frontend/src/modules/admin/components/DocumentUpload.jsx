import React, { useState, useRef } from 'react';
import { FaUpload, FaFile, FaFilePdf, FaFileWord, FaFileAlt, FaTrash, FaCheck, FaExclamationTriangle, FaSpinner, FaClock } from 'react-icons/fa';
import { uploadMultipleDocuments } from '../services/adminService';
import './DocumentUpload.css';

/**
 * Document Upload Component
 * Allows users to upload documents to the vector store
 */
const DocumentUpload = ({ organizationId, organizationName }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    'application/pdf': { icon: <FaFilePdf />, name: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: <FaFileWord />, name: 'DOCX' },
    'application/msword': { icon: <FaFileWord />, name: 'DOC' },
    'text/plain': { icon: <FaFileAlt />, name: 'TXT' }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    }
  };

  // Validate files and add them to the list
  const validateAndAddFiles = (newFiles) => {
    // Reset error
    setError(null);
    
    // Validate file types
    const validFiles = newFiles.filter(file => {
      const isValidType = Object.keys(supportedTypes).includes(file.type);
      if (!isValidType) {
        setError(`Unsupported file type: ${file.name}. Only PDF, DOCX, and TXT files are supported.`);
      }
      return isValidType;
    });
    
    // Add valid files to the list
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      // Clear success message when adding new files
      setSuccessMessage('');
    }
  };

  // Remove file from the list
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    return supportedTypes[file.type]?.icon || <FaFile />;
  };

  // Get file type name based on file type
  const getFileTypeName = (file) => {
    return supportedTypes[file.type]?.name || 'Unknown';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload files to vector store
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage('');
    setCurrentFileIndex(0);
    setUploadProgress(0);
    setIsInCooldown(false);
    setCooldownRemaining(0);

    try {
      const results = await uploadMultipleDocuments(
        files,
        {
          // Progress callback - called for each file start
          onProgress: (currentIndex, totalFiles, currentFile) => {
            setCurrentFileIndex(currentIndex);
            if (currentFile) {
              const progress = Math.round((currentIndex / totalFiles) * 100);
              setUploadProgress(progress);
              setIsInCooldown(false);
              setCooldownRemaining(0);
            } else {
              // Final progress update
              setUploadProgress(100);
              setIsInCooldown(false);
              setCooldownRemaining(0);
            }
          },
          
          // File completion callback
          onFileComplete: (file, result, index) => {
            console.log(`Successfully uploaded: ${file.name}`);
            
            // Start cooldown if not the last file
            if (index < files.length - 1) {
              setIsInCooldown(true);
              let remaining = 2;
              setCooldownRemaining(remaining);
              
              const cooldownInterval = setInterval(() => {
                remaining--;
                setCooldownRemaining(remaining);
                if (remaining <= 0) {
                  clearInterval(cooldownInterval);
                  setIsInCooldown(false);
                }
              }, 1000);
            }
          },
          
          // File error callback
          onFileError: (file, error, index) => {
            console.error(`Failed to upload: ${file.name}`, error);
            
            // Start cooldown if not the last file (even on error)
            if (index < files.length - 1) {
              setIsInCooldown(true);
              let remaining = 2;
              setCooldownRemaining(remaining);
              
              const cooldownInterval = setInterval(() => {
                remaining--;
                setCooldownRemaining(remaining);
                if (remaining <= 0) {
                  clearInterval(cooldownInterval);
                  setIsInCooldown(false);
                }
              }, 1000);
            }
          }
        },
        2000 // 2-second cooldown between uploads
      );

      // Handle results
      setUploading(false);
      setIsInCooldown(false);
      setCooldownRemaining(0);
      
      // Set error messages for different failure types
      if (results.extractionFailures.length > 0) {
        const failedFileNames = results.extractionFailures.map(f => f.file);
        setError(
          `Failed to extract text from ${results.extractionFailures.length} file(s): ${failedFileNames.join(', ')}. ` +
          `This could be due to document format issues, protection, or corruption. Try converting to a different format or checking file permissions.`
        );
      } else if (results.failedFiles.length > 0) {
        const failedFileNames = results.failedFiles.map(f => f.file);
        setError(`Failed to upload ${results.failedFiles.length} file(s): ${failedFileNames.join(', ')}`);
      }
      
      // Set success message
      if (results.successful > 0) {
        setSuccessMessage(
          `Successfully uploaded ${results.successful} of ${results.total} file(s) to the vector store. ` +
          `${results.total > 1 ? 'Files were processed sequentially with 2-second intervals to ensure stability.' : ''}`
        );
        
        // Clear files list after successful upload, or keep only failed files
        if (results.failed === 0) {
          setFiles([]);
        } else {
          // Keep only failed files in the list
          const allFailedNames = [
            ...results.failedFiles.map(f => f.file),
            ...results.extractionFailures.map(f => f.file)
          ];
          setFiles(prevFiles => prevFiles.filter(file => allFailedNames.includes(file.name)));
        }
      }

    } catch (error) {
      console.error('Error in upload pipeline:', error);
      setError(`Upload pipeline failed: ${error.message}`);
      setUploading(false);
      setIsInCooldown(false);
      setCooldownRemaining(0);
    }
  };

  // Clear success message after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="document-upload-container">
      <h3>Upload Documents to Vector Store</h3>
      <p className="upload-description">
        Upload business documents (PDF, DOCX, or TXT) for {organizationName || 'your organization'} to be processed and stored in the vector database for semantic search and retrieval. Documents are sent directly to the Hugging Face Space LLM endpoint.
      </p>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}

      {/* File drop area */}
      <div 
        className={`drop-area ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <div className="drop-message">
          <FaUpload className="upload-icon" />
          <p>Drag & drop files here or</p>
          <button 
            type="button" 
            className="browse-button"
            onClick={onButtonClick}
          >
            Browse Files
          </button>
          <p className="file-types">Supported formats: PDF, DOCX, TXT</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected Files ({files.length})</h4>
          <ul>
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="file-item">
                <div className="file-info">
                  <div className="file-icon">{getFileIcon(file)}</div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {getFileTypeName(file)} • {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="remove-file-button"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-info">
            <span>Uploading {currentFileIndex + 1} of {files.length}: {files[currentFileIndex].name}</span>
            <span>{uploadProgress}%</span>
            {isInCooldown && (
              <span>
                Cooldown: {cooldownRemaining} seconds remaining
              </span>
            )}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="pipeline-info">
            <FaClock /> Files are being processed sequentially with 2-second intervals to ensure stability.
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="upload-actions">
        <button
          type="button"
          className="upload-button"
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? (
            <>
              <FaSpinner className="spinner" /> Uploading...
            </>
          ) : (
            <>
              <FaUpload /> Upload to Vector Store
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
