import { X, Upload, FileText, Check, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface FrameworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (frameworkData: any) => void;
}

export default function FrameworkUploadModal({
  isOpen,
  onClose,
  onUploadComplete
}: FrameworkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setUploadedFilePath(null);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or DOCX file only.');
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB.');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      setUploadProgress(10);

      // Step 1: Upload file
      const formData = new FormData();
      formData.append('files', selectedFile);

      const uploadResponse = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data && uploadResponse.data.jobId) {
        setUploadProgress(60);

        // Construct file path - backend saves as uploads/{jobId}/uuid.extension
        // For now, just pass a reference that admin can access
        const tempFilePath = `/uploads/${uploadResponse.data.jobId}/framework_file.${selectedFile.name.split('.').pop()}`;

        setUploadProgress(80);

        // Step 2: Submit framework addition request
        const response = await axios.post(API_ENDPOINTS.APPROVAL.FRAMEWORK_ADDITION, {
          document_file: tempFilePath,
          description: description.trim(),
          justification: `Framework addition request: ${description.trim()}`
        });

        setUploadProgress(100);

        // Show success message
        setTimeout(() => {
          // Notify parent component with the approval request data
          onUploadComplete({
            type: 'framework_request',
            message: 'Framework addition request submitted successfully',
            requestId: response.data.id,
            description: description.trim()
          });
          onClose();
          setSelectedFile(null);
          setDescription('');
          setUploadProgress(0);
        }, 1500);
      } else {
        throw new Error('Upload failed - invalid response');
      }

    } catch (err: any) {
      console.error('Framework upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit framework addition request. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'application/pdf':
        return <FileText className="w-8 h-8 text-red-400" />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return <FileText className="w-8 h-8 text-blue-400" />;
      default:
        return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  const getFileTypeDisplay = (fileType: string) => {
    switch (fileType) {
      case 'application/pdf':
        return 'PDF';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'DOCX';
      case 'application/msword':
        return 'DOC';
      default:
        return 'File';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="ml-auto w-full max-w-md bg-zinc-900 shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Upload New Framework</h2>
            <p className="text-zinc-400 mt-1">Upload PDF or DOCX files for processing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* File upload area */}
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 hover:border-yellow-500 transition-colors">
            <div className="text-center">
              {!selectedFile ? (
                <>
                  <Upload className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <div className="text-white font-medium mb-2">Choose a file to upload</div>
                  <div className="text-zinc-500 text-sm mb-4">PDF or DOCX files only • Max 50MB</div>
                  <label className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileSelect}
                    />
                  </label>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div>
                    <div className="text-white font-medium truncate">{selectedFile.name}</div>
                    <div className="text-zinc-400 text-sm">
                      {getFileTypeDisplay(selectedFile.type)} • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-zinc-400 hover:text-white text-sm underline"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description input */}
          {selectedFile && (
            <div className="space-y-2">
              <label className="block text-white font-medium">Framework Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a short description for this framework..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-none"
                rows={3}
              />
              <div className="text-xs text-zinc-500">
                Provide a brief summary of what this framework covers
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">Processing document...</span>
                <span className="text-yellow-400 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-zinc-500">
                {uploadProgress < 30 && 'Extracting content...'}
                {uploadProgress >= 30 && uploadProgress < 70 && 'Analyzing compliance requirements...'}
                {uploadProgress >= 70 && uploadProgress < 100 && 'Generating framework structure...'}
                {uploadProgress === 100 && 'Framework processed successfully!'}
              </div>
            </div>
          )}

          {/* Success message */}
          {uploadProgress === 100 && !isUploading && (
            <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-yellow-400 font-medium">Framework Addition Request Submitted</div>
                  <div className="text-zinc-400 text-sm">Your request has been submitted for approval. You will be notified once it is reviewed.</div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 p-6">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !description.trim() || isUploading || uploadProgress === 100}
              className="flex-1 bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : uploadProgress === 100 ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
