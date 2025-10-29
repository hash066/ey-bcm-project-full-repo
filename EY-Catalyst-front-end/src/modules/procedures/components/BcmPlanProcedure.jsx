import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure } from '../services/procedureService';
import '../../bia/styles/BIAStyles.css';
import '../../bia/styles/BusinessImpactAnalysis.css';

/**
 * BCM Plan Procedure Component
 * UPDATED: Uses enhanced-procedures endpoints with port 8002 + DEBUG LOGS
 */
const BcmPlanProcedure = () => {
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId] = useState(1);

  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    planStructure: '',
    activationCriteria: [],
    recoveryStrategies: []
  });

  const [useLLMContent, setUseLLMContent] = useState(false);

  // Check database on mount
  useEffect(() => {
    const fetchData = async () => {
      setOrganizationName('Sample Organization');
      await checkDatabaseForContent();
      setLoading(false);
    };
    fetchData();
  }, []);

  // Check if BCM Plan exists in database
  const checkDatabaseForContent = async () => {
    try {
      console.log('Checking database for BCM Plan...');
      const data = await getProcedure('bcm_plan');
      if (data && data.generated_content) {
        console.log('Found existing content in database');
        console.log('Database content keys:', Object.keys(data.generated_content));
        console.log('Full database content:', data.generated_content);
        const content = data.generated_content;
        const mappedContent = {
          introduction: content.introduction || '',
          scope: content.scope || '',
          objective: content.objective || content.objectives || '',
          methodology: content.methodology || '',
          planStructure: content.plan_structure || content.planStructure || '',
          activationCriteria: content.activation_criteria || content.activationCriteria || [],
          recoveryStrategies: content.recovery_strategies || content.recoveryStrategies || []
        };
        console.log('Mapped LLM Content:', mappedContent);
        setLlmContent(mappedContent);
        setUseLLMContent(data.use_llm_content || false);
        console.log('useLLMContent set to:', data.use_llm_content);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Database check failed:', error.message);
      return false;
    }
  };

  // Generate LLM content using enhanced-procedures endpoint
  const handleGenerateLLMContent = async () => {
    if (!organizationId || !organizationName) {
      console.error('Organization information not available');
      return;
    }
    setIsLoadingLLM(true);
    try {
      console.log('Generating BCM Plan procedure...');
      const result = await generateLLMContent(
        'bcm_plan',
        organizationName,
        organizationId,
        [
          'introduction',
          'scope',
          'objective',
          'methodology',
          'plan_structure',
          'activation_criteria',
          'recovery_strategies',
          'roles_responsibilities',
          'review_frequency'
        ]
      );
      console.log('Generation Result:', result);
      console.log('Generated content keys:', Object.keys(result.generated_content || {}));
      if (result && result.generated_content) {
        const content = result.generated_content;
        console.log('Full generated content:', content);
        const mappedContent = {
          introduction: content.introduction || '',
          scope: content.scope || '',
          objective: content.objective || content.objectives || '',
          methodology: content.methodology || '',
          planStructure: content.plan_structure || content.planStructure || '',
          activationCriteria: content.activation_criteria || content.activationCriteria || [],
          recoveryStrategies: content.recovery_strategies || content.recoveryStrategies || []
        };
        console.log('Mapped LLM Content:', mappedContent);
        setLlmContent(mappedContent);
        setUseLLMContent(true);
        console.log('useLLMContent set to: true');
        console.log('Content saved to database automatically by backend');
        // Refresh from DB to confirm save
        setTimeout(() => checkDatabaseForContent(), 1000);
      } else {
        throw new Error('No content in response');
      }
    } catch (err) {
      console.error('Error generating content:', err);
    } finally {
      setIsLoadingLLM(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('bcm-plan-procedure-document');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_BCM_Plan.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#FFD700' }}>Loading...</div>;
  }

  // DEBUG: Log render state
  console.log('Rendering with useLLMContent:', useLLMContent);
  console.log('Current llmContent:', llmContent);

  return (
    <div className="bia-container">
      <div className="bia-main-container">
        {/* Header */}
        <button onClick={handleGenerateLLMContent} disabled={isLoadingLLM}>
          {isLoadingLLM ? 'Generating...' : 'Generate Content'}
        </button>
        <button onClick={handleExportPDF}>Export PDF</button>
        <div id="bcm-plan-procedure-document">
          {/* Document content here */}
        </div>
      </div>
    </div>
  );
};

export default BcmPlanProcedure;