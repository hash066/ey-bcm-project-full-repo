import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const CrisisCommunicationProcedure = () => {
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
      console.log('🔍 [Crisis Communication] Checking database...');
      const data = await getProcedure('crisis_communication');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [Crisis Communication] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [Crisis Communication] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [Crisis Communication] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [Crisis Communication] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [Crisis Communication] Starting AI generation...');
      
      const aiContent = await generateLLMContent('crisis_communication', 'Sample Organization', 1, []);
      
      console.log('📦 [Crisis Communication] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [Crisis Communication] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [Crisis Communication] AI content generated successfully');
          
          try {
            await saveProcedure('crisis_communication', generatedContent);
            console.log('💾 [Crisis Communication] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [Crisis Communication] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [Crisis Communication] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [Crisis Communication] Content update request received from chatbot');
    console.log('   Current content keys:', content ? Object.keys(content) : 'null');
    console.log('   Updated content keys:', Object.keys(updatedContent));
    
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    console.log('✅ [Crisis Communication] State updated - React should re-render the page now');
    
    saveProcedure('crisis_communication', updatedContent)
      .then(() => console.log('💾 [Crisis Communication] Changes saved to database'))
      .catch(err => console.warn('⚠️ [Crisis Communication] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [Crisis Communication] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [Crisis Communication] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('crisis_communication', editedContent)
      .then(() => console.log('✅ [Crisis Communication] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [Crisis Communication] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Crisis Communication Procedure establishes a comprehensive framework for managing communications during crisis situations to ensure timely, accurate, and consistent information flow to all stakeholders. This procedure is designed to protect organizational reputation, maintain stakeholder confidence, and ensure regulatory compliance during disruptive events.

Effective crisis communication is critical for maintaining business continuity and organizational resilience. This procedure provides clear guidelines for communication protocols, stakeholder engagement, message coordination, and media management during various crisis scenarios.

The procedure supports the organization's Business Continuity Management System (BCMS) by ensuring that communication activities are coordinated, consistent, and aligned with recovery objectives.`,

    scope: `This Crisis Communication Procedure applies to all crisis scenarios that may impact the organization's operations, reputation, or stakeholder relationships, including but not limited to:

• Natural disasters and extreme weather events
• Cyber security incidents and data breaches
• Operational disruptions and system failures
• Regulatory violations and compliance issues
• Workplace accidents and safety incidents
• Reputational threats and negative publicity
• Supply chain disruptions
• Financial crises and market volatility

The procedure covers all internal and external stakeholders and applies to all organizational levels and departments.`,

    objectives: `The primary objectives of this Crisis Communication Procedure are to:

1. Ensure timely and accurate communication during crisis situations
2. Maintain stakeholder confidence and trust throughout the crisis
3. Protect and preserve organizational reputation
4. Coordinate consistent messaging across all communication channels
5. Comply with regulatory reporting and disclosure requirements
6. Support business continuity and recovery operations
7. Minimize misinformation and speculation
8. Facilitate effective decision-making through clear communication
9. Maintain transparency while protecting sensitive information
10. Enable rapid escalation and response coordination`,

    communication_strategy: `The organization employs a multi-channel communication strategy designed to ensure rapid and effective dissemination of accurate information to all relevant stakeholders. The strategy is built on the following principles:

**Timeliness:** Communications are initiated within predetermined timeframes based on crisis severity
**Accuracy:** All information is verified before dissemination
**Consistency:** Messaging is coordinated across all channels and spokespersons
**Transparency:** Information is shared openly while protecting sensitive details
**Empathy:** Communications demonstrate concern for affected parties
**Accountability:** The organization takes responsibility for its actions and responses`,

    stakeholder_matrix: [
      { stakeholder: 'Internal Staff', channel: 'Email, Intranet, SMS, Town Halls', priority: 'High', contact_person: 'HR Head', response_time: '< 30 minutes' },
      { stakeholder: 'Customers', channel: 'Email, Website, Social Media, Call Center', priority: 'High', contact_person: 'Customer Service Head', response_time: '< 1 hour' },
      { stakeholder: 'Regulators', channel: 'Official Letter, Email, Phone', priority: 'Critical', contact_person: 'Compliance Head', response_time: '< 2 hours' },
      { stakeholder: 'Media', channel: 'Press Release, Press Conference, Interviews', priority: 'Medium', contact_person: 'PR Manager', response_time: '< 4 hours' },
      { stakeholder: 'Shareholders', channel: 'Stock Exchange Filing, Email, Website', priority: 'High', contact_person: 'Investor Relations', response_time: '< 2 hours' },
      { stakeholder: 'Vendors/Partners', channel: 'Email, Phone, Portal', priority: 'Medium', contact_person: 'Procurement Head', response_time: '< 4 hours' }
    ],

    crisis_levels: [
      { level: 'Level 1 - Minor', description: 'Limited impact, local response, minimal stakeholder concern', response_time: '< 4 hours', approval: 'Department Head' },
      { level: 'Level 2 - Moderate', description: 'Regional impact, coordinated response, moderate stakeholder concern', response_time: '< 2 hours', approval: 'Crisis Manager' },
      { level: 'Level 3 - Major', description: 'Organization-wide impact, significant stakeholder concern', response_time: '< 1 hour', approval: 'Crisis Management Team' },
      { level: 'Level 4 - Catastrophic', description: 'Critical threat to operations, severe stakeholder impact', response_time: 'Immediate', approval: 'CEO/Senior Leadership' }
    ],

    communication_channels: [
      'Internal Email and Intranet Systems',
      'External Website and Customer Portals',
      'Social Media Platforms (LinkedIn, Twitter, Facebook)',
      'Traditional Media (Press Releases, Interviews)',
      'Direct Communication (Phone, SMS, Letters)',
      'Regulatory Reporting Systems',
      'Investor Relations Platforms',
      'Emergency Notification Systems'
    ],

    message_templates: {
      'Initial Notification': 'We are aware of [incident description] and are actively investigating. We will provide updates as more information becomes available.',
      'Progress Update': 'We continue to address [incident description]. Current status: [status update]. Expected resolution: [timeframe].',
      'Resolution Notice': 'The [incident description] has been resolved. Normal operations have resumed. We apologize for any inconvenience caused.',
      'Regulatory Filing': 'In accordance with regulatory requirements, we are reporting [incident description] that occurred on [date]. Immediate actions taken include [actions].'
    },

    roles_responsibilities: {
      'Crisis Communication Lead': 'Overall coordination of crisis communications, message approval, stakeholder liaison',
      'Spokesperson': 'Authorized to speak on behalf of the organization, media interviews, public statements',
      'Content Creator': 'Drafting messages, updating website content, social media management',
      'Stakeholder Liaison': 'Direct communication with specific stakeholder groups, relationship management',
      'Legal Counsel': 'Review of all communications for legal implications, regulatory compliance',
      'Senior Leadership': 'Strategic direction, final approval for major communications, executive presence'
    }
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
    <>
      <UnifiedProcedureLayout
        procedureName="Crisis Communication Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
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

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for crisis communication and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objectives" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objectives}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Communication Strategy" icon="📡" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.communication_strategy}</p>
          <UnifiedInfoBox type="warning" title="Key Principle">
            All crisis communications must be timely, accurate, and consistent across all channels.
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="5. Crisis Classification" icon="⚠️" collapsible defaultOpen={true}>
          <UnifiedTable
            headers={['Level', 'Description', 'Response Time', 'Approval Required']}
            rows={
              content.crisis_levels?.map(level => [
                level.level,
                level.description,
                level.response_time,
                level.approval || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="6. Stakeholder Communication Matrix" icon="👥" collapsible defaultOpen={true}>
          <UnifiedTable
            headers={['Stakeholder', 'Channel', 'Priority', 'Contact Person', 'Response Time']}
            rows={
              content.stakeholder_matrix?.map(item => [
                item.stakeholder,
                item.channel,
                item.priority,
                item.contact_person,
                item.response_time || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="7. Communication Channels" icon="📢" collapsible defaultOpen={false}>
          <UnifiedList items={content.communication_channels || []} />
        </UnifiedSection>

        <UnifiedSection title="8. Roles and Responsibilities" icon="👤" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="crisis_communication"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="crisis_communication"
      />
    </>
  );
};

export default CrisisCommunicationProcedure;
