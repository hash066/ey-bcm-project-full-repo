import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure } from '../services/procedureService';
import '../../bia/styles/BIAStyles.css';
import '../../bia/styles/BusinessImpactAnalysis.css';

const UniversalProcedureViewer = () => {
  const { procedureType } = useParams();
  const [loading, setLoading] = useState(false);
  const [checkingDb, setCheckingDb] = useState(true);
  const [content, setContent] = useState(null);
  const [contentSource, setContentSource] = useState(null);
  const [error, setError] = useState(null);
  const [organizationName] = useState('Sample Organization');

  // Check database on mount
  useEffect(() => {
    const fetchData = async () => {
      await checkDatabaseForContent();
      setLoading(false);
    };
    fetchData();
  }, [procedureType, checkDatabaseForContent]); // Added checkDatabaseForContent as dependency

  // Check if procedure exists in database
  const checkDatabaseForContent = async () => {
    try {
      console.log(`Checking database for ${procedureType} procedure...`);
      
      const data = await getProcedure(procedureType);
      
      if (data && data.generated_content) {
        console.log('Found existing content in database');
        console.log('Content fields:', Object.keys(data.generated_content));
        setContent(data.generated_content);
        setContentSource('database');
      } else {
        console.log('No existing content found');
        setContentSource(null);
      }
    } catch (err) {
      console.log('Error checking database:', err.message);
    } finally {
      setCheckingDb(false);
    }
  };

  const handleGenerateLLMContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Generating ${procedureType} procedure using Groq API...`);
      
      const result = await generateLLMContent(
        procedureType,
        organizationName,
        1,
        [
          'introduction',
          'scope',
          'objectives',
          'definitions',
          'process_steps',
          'roles_responsibilities',
          'documentation',
          'review_frequency'
        ]
      );
      
      console.log('Generation Result:', result);
      
      if (result && result.generated_content) {
        setContent(result.generated_content);
        setContentSource('ai-generated');
        console.log('Content saved to database automatically by backend');
        
        // Refresh from DB to confirm save
        setTimeout(() => checkDatabaseForContent(), 1000);
      } else {
        throw new Error('No content in response');
      }
      
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err.message);
      setContentSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  const getContent = (field) => {
    // Handle field name variations
    const fieldMap = {
      'objectives': 'objectives',
      'process_steps': 'process_steps'
    };
    
    const actualField = fieldMap[field] || field;
    
    // Try content first
    if (content && content[actualField] && content[actualField] !== null) {
      return content[actualField];
    }
    
    if (content && content[field] && content[field] !== null) {
      return content[field];
    }
    
    // Fallback content
    const fallbackContent = {
      introduction: `This ${procedureType} procedure establishes the framework for managing and executing ${procedureType}-related activities within the organization.`,
      scope: `This procedure applies to all ${procedureType} activities and processes within the organization.`,
      objectives: `The objectives are to ensure consistent and effective management of ${procedureType} activities, maintain compliance with relevant standards and regulations, and promote continuous improvement.`,
      definitions: `Key terms and definitions related to ${procedureType} management and execution.`,
      process_steps: `Detailed steps for executing ${procedureType}-related activities and processes.`,
      roles_responsibilities: `Defined roles and responsibilities for personnel involved in ${procedureType} activities.`,
      documentation: `Required documentation and records related to ${procedureType} activities.`,
      review_frequency: `This procedure shall be reviewed annually or when significant changes occur that affect ${procedureType} activities.`
    };
    
    return fallbackContent[field] || fallbackContent[actualField] || `Content for ${field} will be generated.`;
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: "'Arial', sans-serif",
      backgroundColor: '#f8f9fa'
    },
    header: {
      background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 10px 0'
    },
    subtitle: {
      fontSize: '16px',
      opacity: 0.95,
      margin: '5px 0'
    },
    sourceIndicator: {
      padding: '15px 20px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '600',
      background: contentSource === 'database' ? '#e8f5e9' : '#e3f2fd',
      color: contentSource === 'database' ? '#2e7d32' : '#1565c0',
      border: `2px solid ${contentSource === 'database' ? '#4caf50' : '#2196f3'}`
    },
    buttonContainer: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px'
    },
    button: {
      padding: '14px 28px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    generateBtn: {
      background: loading ? '#95a5a6' : '#e53935',
      color: 'white',
      opacity: loading ? 0.7 : 1,
      cursor: loading ? 'not-allowed' : 'pointer'
    },
    refreshBtn: {
      border: '2px solid #e53935',
      background: 'white',
      color: '#e53935'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '80px 20px',
      color: '#7f8c8d'
    },
    loadingIcon: {
      fontSize: '48px',
      marginBottom: '20px'
    }
  };

  const renderContent = () => {
    if (checkingDb) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingIcon}>🔄</div>
          <h3>Checking database...</h3>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingIcon}>⏳</div>
          <h3>Generating content with Groq AI...</h3>
          <p>This may take a few moments</p>
        </div>
      );
    }

    return (
      <div style={{padding: '20px'}}>
        <h2 style={{fontSize: '24px', color: '#2c3e50', marginBottom: '20px', textTransform: 'capitalize'}}>
          {procedureType?.replace(/_/g, ' ')} Procedure
        </h2>
        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e53935'}}>
          <p style={{lineHeight: '1.8', color: '#2c3e50'}}>{getContent('introduction')}</p>
        </div>
        
        <h3 style={{fontSize: '20px', color: '#34495e', marginTop: '30px', marginBottom: '15px'}}>Scope</h3>
        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e53935'}}>
          <p style={{lineHeight: '1.8', color: '#2c3e50'}}>{getContent('scope')}</p>
        </div>

        <h3 style={{fontSize: '20px', color: '#34495e', marginTop: '30px', marginBottom: '15px'}}>Objectives</h3>
        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e53935'}}>
          <p style={{lineHeight: '1.8', color: '#2c3e50'}}>{getContent('objectives')}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {procedureType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Procedure
        </h1>
        <p style={styles.subtitle}>📋 Universal Procedure Viewer | ISO 22301:2019</p>
      </div>

      {contentSource && (
        <div style={styles.sourceIndicator}>
          <span>{contentSource === 'database' ? '💾' : '🤖'}</span>
          <span>
            {contentSource === 'database' 
              ? 'Content loaded from database' 
              : 'Content generated using Groq AI API'}
          </span>
        </div>
      )}

      <div style={styles.buttonContainer}>
        <button 
          onClick={handleGenerateLLMContent}
          disabled={loading}
          style={{...styles.button, ...styles.generateBtn}}
        >
          {loading ? (
            <>
              <span>⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              {content ? 'Regenerate with AI' : 'Generate AI Content'}
            </>
          )}
        </button>
        
        <button 
          onClick={checkDatabaseForContent}
          disabled={checkingDb}
          style={{...styles.button, ...styles.refreshBtn}}
        >
          <span>🔄</span>
          {checkingDb ? 'Checking...' : 'Refresh from DB'}
        </button>
      </div>

      {error && (
        <div style={{padding: '20px', background: '#ffebee', borderRadius: '8px', marginBottom: '20px', color: '#c62828'}}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <div style={{background: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
        {renderContent()}
      </div>
    </div>
  );
};

export default UniversalProcedureViewer;