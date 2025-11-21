import { X, Upload, FileText, Check } from 'lucide-react';
import { useState } from 'react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Simulate processed framework data
      const frameworkData = {
        id: Date.now().toString(),
        code: `NEW_${Date.now()}`,
        name: `New Framework ${Date.now()}`,
        description: 'Auto-processed from uploaded document',
        category: 'Standards' as const // Default category
      };

      // Notify parent component
      onUploadComplete(frameworkData);

      // Close modal after success
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
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
            <div className="bg-green-950/20 border border-green-900/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-green-400 font-medium">Framework Added Successfully</div>
                  <div className="text-zinc-400 text-sm">The new framework has been processed and added to your list.</div>
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
              onClick={onClose}
              className="flex-1 bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || uploadProgress === 100}
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
