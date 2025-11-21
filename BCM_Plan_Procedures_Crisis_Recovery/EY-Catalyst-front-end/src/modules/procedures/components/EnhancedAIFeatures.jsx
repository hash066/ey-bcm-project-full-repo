import React, { useState } from 'react';

/**
 * Enhanced AI Features Component
 * Provides AI-powered features for procedure generation and analysis
 */
const EnhancedAIFeatures = ({ 
  procedureType,
  isLoadingLLM,
  onGenerateComplete,
  onRegenerate,
  onRefine,
  onAnalyze,
  onExportDocx,
  onLoadVersions,
  versions = [],
  analysisResult
}) => {
  const [showEnhancedOptions, setShowEnhancedOptions] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [existingProcedureText, setExistingProcedureText] = useState('');

  const handleRefine = () => {
    if (refinementText.trim() && onRefine) {
      onRefine(refinementText);
      setRefinementText('');
    }
  };

  const handleAnalyze = () => {
    if (existingProcedureText.trim() && onAnalyze) {
      onAnalyze(existingProcedureText);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowEnhancedOptions(!showEnhancedOptions)}
        style={{
          background: '#9C27B0',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          marginRight: '10px',
          cursor: 'pointer'
        }}
      >
        Enhanced Options
      </button>

      {showEnhancedOptions && (
        <div style={{
          background: '#1a1a1a',
          border: '2px solid #9C27B0',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#9C27B0', marginBottom: '20px' }}>🚀 Enhanced AI Features</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <button
              onClick={onGenerateComplete}
              disabled={isLoadingLLM}
              style={{
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                cursor: isLoadingLLM ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              🎯 Generate Complete Procedure
            </button>
            
            <button
              onClick={onRegenerate}
              disabled={isLoadingLLM}
              style={{
                background: '#FF9800',
                color: '#fff',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                cursor: isLoadingLLM ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              🔄 Regenerate Fresh
            </button>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#9C27B0', display: 'block', marginBottom: '10px' }}>✨ Refine Procedure:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="e.g., 'Make more technical', 'Simplify language', 'Add more examples'"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #9C27B0',
                  background: '#333',
                  color: '#fff'
                }}
              />
              <button
                onClick={handleRefine}
                disabled={isLoadingLLM || !refinementText.trim()}
                style={{
                  background: isLoadingLLM || !refinementText.trim() ? '#666' : '#9C27B0',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: isLoadingLLM || !refinementText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Refine
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#9C27B0', display: 'block', marginBottom: '10px' }}>📊 Analyze Existing Procedure:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea
                value={existingProcedureText}
                onChange={(e) => setExistingProcedureText(e.target.value)}
                placeholder="Paste existing procedure text for gap analysis..."
                style={{
                  flex: 1,
                  height: '80px',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #9C27B0',
                  background: '#333',
                  color: '#fff',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={isLoadingLLM || !existingProcedureText.trim()}
                style={{
                  background: isLoadingLLM || !existingProcedureText.trim() ? '#666' : '#FF5722',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: isLoadingLLM || !existingProcedureText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Analyze
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onExportDocx}
              style={{
                background: '#2196F3',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📄 Export DOCX
            </button>
            
            <button
              onClick={onLoadVersions}
              style={{
                background: '#607D8B',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📁 View Versions ({versions.length})
            </button>
          </div>
          
          {analysisResult && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#333',
              borderRadius: '8px',
              border: '1px solid #FF5722'
            }}>
              <h4 style={{ color: '#FF5722', marginBottom: '10px' }}>📊 Analysis Results</h4>
              <p style={{ color: '#fff' }}>Compliance Score: {analysisResult.analysis?.compliance_score || 'N/A'}/10</p>
              {analysisResult.analysis?.gaps && (
                <div>
                  <strong style={{ color: '#FFD700' }}>Gaps Found:</strong>
                  <ul style={{ color: '#ccc', marginTop: '5px' }}>
                    {analysisResult.analysis.gaps.slice(0, 3).map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default EnhancedAIFeatures;