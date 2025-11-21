import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress?: number;
  uploadStatus?: string;
}

export default function UploadModal({ isOpen, onClose, onUpload, isUploading, uploadProgress = 0, uploadStatus }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      onClose();
    } else {
      // Show a message that upload is in progress
      const confirmed = window.confirm('Upload is in progress. Are you sure you want to cancel?');
      if (confirmed) {
        setSelectedFiles([]);
        onClose();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Upload Documents</h2>
              <p className="text-sm text-zinc-400">Upload policy documents for gap analysis</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Progress Bar */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium">{uploadStatus || 'Processing...'}</span>
                <span className="text-zinc-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* File Input Area */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center transition-colors ${
              !isUploading ? 'hover:border-yellow-400 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Click to select files</p>
            <p className="text-sm text-zinc-400">Accepts .docx, .pdf, .xlsx files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx,.pdf,.xlsx"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 border border-zinc-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-zinc-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-zinc-400 hover:text-red-400 transition-colors ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-6 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
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
  );
}
