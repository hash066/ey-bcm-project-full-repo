import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox } from './UnifiedSection';

const CrisisCommunicationProcedure = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [contentSource, setContentSource] = useState(null);

  // Check database on mount - wrapped in useCallback to fix dependency warning
  const checkDatabaseForContent = useCallback(async () => {
    try {
      console.log('Checking database for Crisis Communication procedure...');
      const data = await getProcedure('crisis_communication');
      
      if (data.versions && data.versions.length > 0) {
        const latestVersion = data.versions[0];
        console.log('✅ Found existing content in database');
        setContent(latestVersion.content);
        setContentSource('database');
      } else {
        console.log('ℹ️ No existing content - using fallback');
        setContent(getFallbackContent());
        setContentSource('fallback');
      }
    } catch (err) {
      console.error('Error checking database:', err);
      setContent(getFallbackContent());
      setContentSource('fallback');
    }
  }, []); // Empty dependency array since it doesn't depend on any props/state

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 Generating AI content for Crisis Communication...');
      const aiContent = await generateLLMContent('crisis_communication', 1);
      
      if (aiContent && aiContent.content) {
        setContent(aiContent.content);
        setContentSource('ai');
        console.log('✅ AI content generated successfully');
      } else {
        throw new Error('AI generation returned empty content');
      }
    } catch (err) {
      console.error('❌ Error generating content:', err);
      setContent(getFallbackContent());
      setContentSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  const getFallbackContent = () => ({
    introduction: 'This Crisis Communication Procedure establishes protocols for effective communication during crisis situations to ensure timely, accurate, and consistent information flow to all stakeholders.',
    scope: 'Applies to all crisis scenarios requiring stakeholder communication including natural disasters, cyber incidents, operational disruptions, and reputational threats.',
    objectives: 'To ensure timely and accurate crisis communication, maintain stakeholder confidence, protect organizational reputation, and comply with regulatory requirements.',
    communication_strategy: 'Multi-channel approach ensuring rapid dissemination of accurate information through pre-approved messaging templates and designated spokespersons.',
    stakeholder_matrix: [
      { stakeholder: 'Internal Staff', channel: 'Email, Intranet, SMS', priority: 'High', contact_person: 'HR Head' },
      { stakeholder: 'Customers', channel: 'Email, Website, Social Media', priority: 'High', contact_person: 'Customer Service Head' },
      { stakeholder: 'Regulators', channel: 'Official Letter, Email', priority: 'Critical', contact_person: 'Compliance Head' },
      { stakeholder: 'Media', channel: 'Press Release, Press Conference', priority: 'Medium', contact_person: 'PR Manager' }
    ],
    crisis_levels: [
      { level: 'Minor', description: 'Limited impact, local response', response_time: '< 2 hours' },
      { level: 'Moderate', description: 'Regional impact, coordinated response', response_time: '< 1 hour' },
      { level: 'Major', description: 'Organization-wide impact', response_time: '< 30 minutes' },
      { level: 'Catastrophic', description: 'Critical threat to operations', response_time: 'Immediate' }
    ]
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Crisis Communication Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <UnifiedProcedureLayout
      procedureName="Crisis Communication Procedure"
      procedureType="crisis_communication"
      onGenerateContent={handleGenerateContent}
      isGenerating={loading}
      contentSource={contentSource}
    >
      {/* Document Information */}
      <UnifiedSection title="Document Information" icon="📋">
        <UnifiedTable
          headers={['Field', 'Value']}
          rows={[
            ['Document Name', 'Crisis Communication Procedure'],
            ['Document Owner', 'H.O. BCM Team'],
            ['Version', '1.0'],
            ['Prepared By', 'H.O. BCM Team'],
            ['Reviewed By', 'Head-OFRMD'],
            ['Approved By', 'IT Strategy Committee (ITSC)']
          ]}
        />
      </UnifiedSection>

      {/* Introduction */}
      <UnifiedSection title="1. Introduction" icon="📖">
        <p>{content.introduction}</p>
      </UnifiedSection>

      {/* Scope */}
      <UnifiedSection title="2. Scope" icon="🎯">
        <p>{content.scope}</p>
      </UnifiedSection>

      {/* Objectives */}
      <UnifiedSection title="3. Objectives" icon="✨">
        <p>{content.objectives}</p>
      </UnifiedSection>

      {/* Communication Strategy */}
      <UnifiedSection title="4. Communication Strategy" icon="📡">
        <p>{content.communication_strategy}</p>
        <UnifiedInfoBox type="info" title="Key Principle">
          All crisis communications must be timely, accurate, and consistent across all channels.
        </UnifiedInfoBox>
      </UnifiedSection>

      {/* Crisis Levels */}
      <UnifiedSection title="5. Crisis Classification" icon="⚠️">
        <UnifiedTable
          headers={['Level', 'Description', 'Response Time']}
          rows={
            content.crisis_levels?.map(level => [
              level.level,
              level.description,
              level.response_time
            ]) || []
          }
        />
      </UnifiedSection>

      {/* Stakeholder Matrix */}
      <UnifiedSection title="6. Stakeholder Communication Matrix" icon="👥">
        <UnifiedTable
          headers={['Stakeholder', 'Channel', 'Priority', 'Contact Person']}
          rows={
            content.stakeholder_matrix?.map(item => [
              item.stakeholder,
              item.channel,
              item.priority,
              item.contact_person
            ]) || []
          }
        />
      </UnifiedSection>
    </UnifiedProcedureLayout>
  );
};

export default CrisisCommunicationProcedure;
