import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const TrainingAwarenessProcedure = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isContentEmpty = (contentData) => {
    if (!contentData) return true;
    
    const hasIntroduction = contentData.introduction && contentData.introduction.trim().length > 0;
    const hasScope = contentData.scope && contentData.scope.trim().length > 0;
    const hasObjective = contentData.objective && contentData.objective.trim().length > 0;
    
    return !hasIntroduction && !hasScope && !hasObjective;
  };

  const checkDatabaseForContent = useCallback(async () => {
    try {
      console.log('[SEARCH] [Training Awareness] Checking database...');
      const data = await getProcedure('training_awareness');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('[WARNING] [Training Awareness] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('[SUCCESS] [Training Awareness] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('[INFO] [Training Awareness] Not in database, generating with AI');
        await handleGenerateContent();
      }
    } catch (err) {
      console.error('[ERROR] [Training Awareness] Database error:', err);
      await handleGenerateContent();
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('[AI] [Training Awareness] Starting AI generation...');
      
      const aiContent = await generateLLMContent('training_awareness', 'Sample Organization', 1, []);
      
      console.log('[RESPONSE] [Training Awareness] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('[WARNING] [Training Awareness] AI generated empty content, retrying');
          throw new Error('AI generated empty content');
        } else {
          setContent(generatedContent);
          console.log('[SUCCESS] [Training Awareness] AI content generated successfully');
          
          try {
            await saveProcedure('training_awareness', generatedContent);
            console.log('[SAVE] [Training Awareness] Saved to database');
          } catch (saveErr) {
            console.warn('[WARNING] [Training Awareness] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('[ERROR] [Training Awareness] Generation error:', err);
      setContent({ error: 'Failed to generate content. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('[UPDATE] [Training Awareness] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('training_awareness', updatedContent)
      .then(() => console.log('[SAVE] [Training Awareness] Changes saved to database'))
      .catch(err => console.warn('[WARNING] [Training Awareness] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('[EDIT] [Training Awareness] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('[SAVE] [Training Awareness] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('training_awareness', editedContent)
      .then(() => console.log('[SUCCESS] [Training Awareness] Edited content saved to database'))
      .catch(err => console.warn('[WARNING] [Training Awareness] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Training and Awareness Procedure establishes a comprehensive framework for ensuring all personnel have the knowledge, skills, and awareness necessary to support effective Business Continuity Management (BCM) and maintain organizational resilience. This procedure is designed to build competency across all levels of the organization and ensure that BCM principles are embedded in the organizational culture.

Effective training and awareness programs are essential for successful BCM implementation. This procedure provides structured approaches to education, skill development, and competency assessment that enable personnel to fulfill their roles during both normal operations and crisis situations.

The procedure supports the organization's Business Continuity Management System (BCMS) by ensuring that human resources are adequately prepared to execute BCM plans and procedures when required.`,

    scope: `This Training and Awareness Procedure applies to all employees, contractors, and relevant stakeholders across the organization, including but not limited to:

• All permanent and temporary employees
• Contractors and consultants
• Third-party service providers with BCM responsibilities
• Board members and senior leadership
• Emergency response teams and coordinators
• Department heads and process owners
• New hires during onboarding
• Visitors and guests (basic awareness)

The procedure covers all aspects of BCM training including awareness programs, technical training, competency assessments, and continuous education initiatives.`,

    objective: `The primary objectives of this Training and Awareness Procedure are to:

1. Build and maintain organizational competence in business continuity management
2. Ensure all personnel understand their roles and responsibilities during disruptions
3. Develop skills necessary to execute BCM plans and procedures effectively
4. Create awareness of business continuity principles and best practices
5. Establish competency standards and assessment criteria
6. Provide ongoing education and skill development opportunities
7. Foster a culture of resilience and preparedness
8. Ensure compliance with regulatory training requirements
9. Support continuous improvement of BCM capabilities
10. Enable effective knowledge transfer and succession planning`,

    training_programs: [
      {
        type: 'BCM Awareness Training',
        audience: 'All employees',
        frequency: 'Annual + Onboarding',
        duration: '1-2 hours',
        delivery: 'Online modules, presentations',
        content: 'BCM overview, organizational framework, individual responsibilities'
      },
      {
        type: 'BCM Plan Training',
        audience: 'Recovery team members',
        frequency: 'Semi-annually',
        duration: '3-4 hours',
        delivery: 'Workshops, hands-on sessions',
        content: 'Plan execution, procedures, tools, communication protocols'
      },
      {
        type: 'Crisis Management Training',
        audience: 'Crisis Management Team',
        frequency: 'Quarterly',
        duration: '4-6 hours',
        delivery: 'Simulations, tabletop exercises',
        content: 'Decision-making, coordination, communication, leadership'
      },
      {
        type: 'BCM Coordinator Certification',
        audience: 'BCM Team members',
        frequency: 'Annual + Certification renewal',
        duration: '16+ hours',
        delivery: 'Formal training, certification programs',
        content: 'Advanced BCM concepts, standards, implementation, audit'
      },
      {
        type: 'Emergency Response Training',
        audience: 'Floor wardens, safety teams',
        frequency: 'Annual',
        duration: '8 hours',
        delivery: 'Practical training, drills',
        content: 'First aid, evacuation, emergency procedures, safety protocols'
      }
    ],

    training_content_areas: [
      'BCM Fundamentals - Core concepts, terminology, and organizational framework',
      'Risk and Impact Assessment - Identifying threats, assessing impacts, prioritizing responses',
      'Plan Activation and Execution - Recognizing incidents, activating plans, executing procedures',
      'Roles and Responsibilities - Understanding individual and team responsibilities during disruptions',
      'Communication Protocols - Internal and external communication procedures and escalation paths',
      'Recovery Operations - Restoration strategies, workarounds, return to normal operations',
      'Tools and Systems - BCM software, communication platforms, documentation systems',
      'Regulatory Compliance - Legal requirements, reporting obligations, audit preparation',
      'Incident Management - Incident response, damage assessment, recovery coordination',
      'Stakeholder Management - Customer communication, vendor coordination, regulatory liaison'
    ],

    awareness_activities: [
      {
        activity: 'Monthly Email Campaigns',
        description: 'BCM tips, reminders, best practices, and success stories',
        frequency: 'Monthly',
        target: 'All employees'
      },
      {
        activity: 'Posters and Signage',
        description: 'Emergency procedures, evacuation routes, contact information',
        frequency: 'Permanent display, updated annually',
        target: 'All building occupants'
      },
      {
        activity: 'BCM Awareness Week',
        description: 'Dedicated week with events, presentations, and activities',
        frequency: 'Annual',
        target: 'Organization-wide'
      },
      {
        activity: 'Intranet Resources',
        description: 'BCM portal with resources, FAQs, documentation, and updates',
        frequency: 'Continuous updates',
        target: 'All employees'
      },
      {
        activity: 'Lunch and Learn Sessions',
        description: 'Informal educational sessions on specific BCM topics',
        frequency: 'Quarterly',
        target: 'Voluntary participation'
      }
    ],

    competency_assessment: `Training effectiveness and competency are assessed through multiple methods to ensure learning objectives are met:

**Assessment Methods:**
• Knowledge Tests - Pre and post-training assessments to measure learning outcomes
• Practical Exercises - Hands-on demonstrations of plan execution and recovery procedures
• Exercise Participation - Performance observation during drills and simulations
• Feedback Surveys - Participant evaluation of training quality and relevance
• Annual Competency Review - Formal assessment of BCM team members' skills and knowledge
• Peer Assessment - Team-based evaluation of collaborative skills and knowledge sharing

**Competency Standards:**
• Minimum 80% score on knowledge assessments
• Satisfactory performance in practical exercises
• Active participation in training sessions and exercises
• Demonstration of required skills and behaviors
• Completion of mandatory training within specified timeframes

**Remedial Actions:**
Personnel not meeting competency standards must complete remedial training within 30 days. Additional support includes mentoring, additional practice sessions, and follow-up assessments.`,

    roles_responsibilities: {
      'Training Coordinator': 'Overall training program management, scheduling, content development, record keeping',
      'BCM Manager': 'Training strategy, competency standards, program oversight, budget management',
      'Department Heads': 'Ensure staff participation, provide subject matter expertise, support training initiatives',
      'HR Department': 'Integration with onboarding, performance management, training administration',
      'Trainers/Facilitators': 'Content delivery, participant engagement, assessment administration, feedback collection',
      'Participants': 'Active engagement, skill application, feedback provision, knowledge sharing',
      'Senior Management': 'Strategic support, resource allocation, program endorsement, participation modeling'
    },

    training_records: `All training and awareness activities must be documented in the Training Management System with the following information:

• Participant names and employee IDs
• Training dates and duration
• Topics covered and learning objectives
• Assessment scores and competency ratings
• Training materials and resources used
• Trainer/facilitator information
• Feedback and evaluation results
• Completion certificates and credentials

The Training Coordinator prepares quarterly reports showing:
• Training completion rates by department and role
• Competency assessment results and trends
• Training gaps and remedial actions required
• Program effectiveness metrics and improvements
• Budget utilization and cost per participant

Target performance indicators:
• 95% compliance with mandatory training requirements
• 85% average satisfaction rating for training programs
• 90% pass rate on competency assessments
• 100% completion of remedial training within 30 days`
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Training and Awareness Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Training and Awareness Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="[DOC]">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Training and Awareness Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-HR'],
              ['Approved By', 'Training Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="[INFO]" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for competence and awareness and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="[SCOPE]" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="[OBJ]" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Training Programs" icon="[TRAIN]" collapsible defaultOpen={true}>
          <UnifiedTable
            headers={['Training Type', 'Target Audience', 'Frequency', 'Duration', 'Delivery Method']}
            rows={
              content.training_programs?.map(program => [
                program.type,
                program.audience,
                program.frequency,
                program.duration,
                program.delivery || 'Various'
              ]) || [
                ['BCM Awareness', 'All employees', 'Annual + Onboarding', '1-2 hours', 'Online modules'],
                ['BCM Plan Training', 'Recovery team members', 'Semi-annually', '3-4 hours', 'Workshops'],
                ['Crisis Management', 'Crisis Management Team', 'Quarterly', '4-6 hours', 'Simulations'],
                ['BCM Coordinator', 'BCM Team', 'Annual + Certification', '16+ hours', 'Formal training'],
                ['Emergency Response', 'Floor wardens, safety team', 'Annual', '8 hours', 'Practical training']
              ]
            }
          />
        </UnifiedSection>

        <UnifiedSection title="5. Training Content Areas" icon="[CONTENT]" collapsible defaultOpen={false}>
          <UnifiedList items={content.training_content_areas || []} />
        </UnifiedSection>

        <UnifiedSection title="6. Awareness Activities" icon="[AWARE]" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Activity', 'Description', 'Frequency', 'Target Audience']}
            rows={
              content.awareness_activities?.map(activity => [
                activity.activity,
                activity.description,
                activity.frequency,
                activity.target || 'All employees'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="7. Competency Assessment" icon="[ASSESS]" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.competency_assessment}</p>
        </UnifiedSection>

        <UnifiedSection title="8. Roles and Responsibilities" icon="[ROLES]" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>

        <UnifiedSection title="9. Training Records and Reporting" icon="[RECORDS]" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.training_records}</p>
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="training_awareness"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="training_awareness"
      />
    </>
  );
};

export default TrainingAwarenessProcedure;
