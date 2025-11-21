import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const NonconformityProcedure = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isContentEmpty = (contentData) => {
    if (!contentData) return true;
    
    const hasIntroduction = contentData.introduction && contentData.introduction.trim().length > 0;
    const hasScope = contentData.scope && contentData.scope.trim().length > 0;
    const hasObjectives = contentData.objectives && contentData.objectives.trim().length > 0;
    
    return !hasIntroduction && !hasScope && !hasObjectives;
  };

  const checkDatabaseForContent = useCallback(async () => {
    try {
      console.log('🔍 [Nonconformity] Checking database...');
      const data = await getProcedure('nonconformity');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [Nonconformity] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [Nonconformity] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [Nonconformity] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [Nonconformity] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [Nonconformity] Starting AI generation...');
      
      const aiContent = await generateLLMContent('nonconformity', 'Sample Organization', 1, []);
      
      console.log('📦 [Nonconformity] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [Nonconformity] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [Nonconformity] AI content generated successfully');
          
          try {
            await saveProcedure('nonconformity', generatedContent);
            console.log('💾 [Nonconformity] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [Nonconformity] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [Nonconformity] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [Nonconformity] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('nonconformity', updatedContent)
      .then(() => console.log('💾 [Nonconformity] Changes saved to database'))
      .catch(err => console.warn('⚠️ [Nonconformity] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [Nonconformity] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [Nonconformity] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('nonconformity', editedContent)
      .then(() => console.log('✅ [Nonconformity] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [Nonconformity] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Nonconformity and Corrective Actions Procedure establishes a systematic approach for identifying, documenting, analyzing, and addressing nonconformities within the organization's Business Continuity Management System (BCMS). This procedure ensures consistent handling of issues that deviate from established standards, requirements, or expectations, and provides a framework for continuous improvement.

Effective nonconformity management is essential for maintaining the integrity and effectiveness of the BCMS. This procedure provides clear guidelines for identifying deviations, investigating root causes, implementing corrective actions, and preventing recurrence of similar issues.

The procedure supports the organization's commitment to continuous improvement and ensures compliance with ISO 22301:2019 requirements for nonconformity and corrective action management.`,

    scope: `This Nonconformity and Corrective Actions Procedure applies to all nonconformities identified within the organization's BCMS, including but not limited to:

• Deviations from BCM policies and procedures
• Failures in business continuity plan execution
• Non-compliance with regulatory requirements
• Inadequate performance of BCM processes
• Deficiencies identified through audits and reviews
• Issues arising from exercises and testing
• Stakeholder complaints related to BCM
• System and process failures affecting continuity

The procedure covers both internal operations and external provider-related nonconformities that impact business continuity capabilities.`,

    objectives: `The primary objectives of this Nonconformity and Corrective Actions Procedure are to:

1. Establish a standardized process for identifying and handling nonconformities
2. Ensure thorough investigation of root causes and contributing factors
3. Implement effective corrective actions to address identified issues
4. Prevent recurrence through systematic preventive measures
5. Maintain proper documentation for audit and review purposes
6. Support continuous improvement of the BCMS
7. Ensure compliance with regulatory and standard requirements
8. Facilitate organizational learning from nonconformities
9. Enhance overall BCM effectiveness and reliability
10. Promote a culture of quality and continuous improvement`,

    definitions: {
      'Nonconformity': 'Non-fulfillment of a requirement related to the BCMS',
      'Correction': 'Action to eliminate a detected nonconformity',
      'Corrective Action': 'Action to eliminate the cause of a nonconformity and prevent recurrence',
      'Preventive Action': 'Action to eliminate the cause of a potential nonconformity',
      'Root Cause': 'The fundamental reason for the occurrence of a nonconformity',
      'Containment': 'Immediate action to limit the impact of a nonconformity',
      'Effectiveness Review': 'Evaluation to determine if corrective actions achieved intended results'
    },

    identification_sources: [
      'Internal BCMS audits and assessments',
      'External audits and regulatory inspections',
      'Customer and stakeholder complaints',
      'BCM exercise and testing results',
      'Process monitoring and measurement',
      'Management reviews and evaluations',
      'Employee observations and reports',
      'Incident and near-miss investigations',
      'Supplier and vendor performance reviews',
      'Regulatory compliance monitoring'
    ],

    roles_responsibilities: {
      'Nonconformity Reporter': 'Identify and report nonconformities, provide initial information, support investigation',
      'Process Owner': 'Investigate nonconformities in their area, implement corrective actions, verify effectiveness',
      'BCM Coordinator': 'Coordinate investigation process, track progress, maintain records, report status',
      'Quality Manager': 'Oversee nonconformity process, approve corrective actions, conduct effectiveness reviews',
      'Senior Management': 'Provide resources, approve significant actions, review trends and performance',
      'Internal Auditor': 'Verify implementation and effectiveness, conduct follow-up audits, provide independent assessment'
    }
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Nonconformity and Corrective Actions Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Nonconformity and Corrective Actions Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Nonconformity and Corrective Actions Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-Quality'],
              ['Approved By', 'Quality Management Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for nonconformity and corrective action and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objectives" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objectives}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Definitions" icon="📚" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Term', 'Definition']}
            rows={Object.entries(content.definitions || {}).map(([term, def]) => [term, def])}
          />
        </UnifiedSection>

        <UnifiedSection title="5. Identification Sources" icon="🔍" collapsible defaultOpen={false}>
          <UnifiedList items={content.identification_sources || []} />
        </UnifiedSection>

        <UnifiedSection title="6. Roles and Responsibilities" icon="👥" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="nonconformity"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="nonconformity"
      />
    </>
  );
};

export default NonconformityProcedure;