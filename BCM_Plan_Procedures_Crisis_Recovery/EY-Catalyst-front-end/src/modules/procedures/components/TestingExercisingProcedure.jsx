import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const TestingExercisingProcedure = () => {
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
      console.log('🔍 [Testing Exercising] Checking database...');
      const data = await getProcedure('testing_exercising');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [Testing Exercising] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [Testing Exercising] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [Testing Exercising] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [Testing Exercising] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [Testing Exercising] Starting AI generation...');
      
      const aiContent = await generateLLMContent('testing_exercising', 'Sample Organization', 1, []);
      
      console.log('📦 [Testing Exercising] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [Testing Exercising] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [Testing Exercising] AI content generated successfully');
          
          try {
            await saveProcedure('testing_exercising', generatedContent);
            console.log('💾 [Testing Exercising] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [Testing Exercising] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [Testing Exercising] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [Testing Exercising] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('testing_exercising', updatedContent)
      .then(() => console.log('💾 [Testing Exercising] Changes saved to database'))
      .catch(err => console.warn('⚠️ [Testing Exercising] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [Testing Exercising] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [Testing Exercising] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('testing_exercising', editedContent)
      .then(() => console.log('✅ [Testing Exercising] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [Testing Exercising] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Testing and Exercising Procedure establishes a systematic approach for validating and improving the organization's Business Continuity Management (BCM) capabilities through regular testing and exercises. This procedure ensures that all BCM plans, procedures, and arrangements are regularly tested, validated, and improved to maintain their effectiveness and relevance.

Regular testing and exercising are essential components of an effective BCM program. They provide opportunities to validate plan effectiveness, identify gaps and weaknesses, test coordination mechanisms, and build confidence in the organization's ability to respond to disruptions.

This procedure supports the organization's Business Continuity Management System (BCMS) by ensuring that all BCM arrangements are regularly validated and continuously improved based on lessons learned from exercises and real incidents.`,

    scope: `This Testing and Exercising Procedure applies to all business continuity plans, disaster recovery plans, crisis management procedures, and emergency response arrangements developed by the organization, including:

• Business continuity plans for all critical business functions
• IT disaster recovery plans and procedures
• Crisis management and communication plans
• Emergency response and evacuation procedures
• Vendor and supplier continuity arrangements
• Alternate site and workspace arrangements
• Data backup and recovery procedures
• Staff notification and communication systems

The procedure covers all organizational levels, departments, and locations, and includes coordination with external stakeholders such as emergency services, vendors, and customers.`,

    objective: `The primary objectives of this Testing and Exercising Procedure are to:

1. Validate the effectiveness of BCM plans and procedures
2. Identify gaps, weaknesses, and improvement opportunities
3. Test coordination and communication mechanisms
4. Build confidence and competence in plan execution
5. Verify recovery time and recovery point objectives
6. Assess resource adequacy and availability
7. Evaluate decision-making processes and authorities
8. Test stakeholder notification and communication procedures
9. Validate assumptions and dependencies
10. Ensure continuous improvement of BCM capabilities`,

    testing_types: [
      {
        type: 'Desktop/Tabletop Exercises',
        description: 'Discussion-based sessions where team members walk through scenarios and response procedures without actual system activation',
        frequency: 'Quarterly',
        participants: 'BCM Team, Department Heads, Key Personnel',
        duration: '2-3 hours',
        complexity: 'Low'
      },
      {
        type: 'Functional Tests',
        description: 'Targeted testing of specific systems, processes, or recovery capabilities to validate individual components of BCM plans',
        frequency: 'Semi-annually',
        participants: 'IT Team, Operations Team, Process Owners',
        duration: '4-6 hours',
        complexity: 'Medium'
      },
      {
        type: 'Full-Scale Simulations',
        description: 'Comprehensive exercises that replicate real disruption scenarios, involving all relevant teams and stakeholders',
        frequency: 'Annually',
        participants: 'All Departments, Senior Management, External Partners',
        duration: 'Full day or multi-day',
        complexity: 'High'
      },
      {
        type: 'Post-Incident Reviews',
        description: 'Structured analysis of actual incidents to identify lessons learned and improvement opportunities',
        frequency: 'After each significant incident',
        participants: 'Incident Response Team, Affected Departments',
        duration: '2-4 hours',
        complexity: 'Variable'
      },
      {
        type: 'Component Testing',
        description: 'Testing of individual BCM components such as communication systems, backup procedures, or alternate sites',
        frequency: 'Monthly',
        participants: 'Technical Teams, System Administrators',
        duration: '1-2 hours',
        complexity: 'Low-Medium'
      }
    ],

    exercise_schedule: [
      {
        exercise_type: 'Desktop Exercise',
        frequency: 'Quarterly',
        duration: '2-3 hours',
        scope: 'Department level',
        participants: '5-15 people',
        preparation_time: '2-3 weeks'
      },
      {
        exercise_type: 'Functional Test',
        frequency: 'Semi-annually',
        duration: '4-6 hours',
        scope: 'System/Process specific',
        participants: '10-25 people',
        preparation_time: '4-6 weeks'
      },
      {
        exercise_type: 'Full-Scale Simulation',
        frequency: 'Annually',
        duration: 'Full day',
        scope: 'Organization-wide',
        participants: '50+ people',
        preparation_time: '8-12 weeks'
      },
      {
        exercise_type: 'Component Test',
        frequency: 'Monthly',
        duration: '1-2 hours',
        scope: 'Technical systems',
        participants: '3-8 people',
        preparation_time: '1 week'
      }
    ],

    evaluation_criteria: [
      {
        criteria: 'Response Time',
        measurement: 'Time from incident notification to plan activation',
        target: 'Within established RTO limits',
        weight: 'High'
      },
      {
        criteria: 'Plan Effectiveness',
        measurement: 'Percentage of exercise objectives achieved',
        target: '≥ 90%',
        weight: 'High'
      },
      {
        criteria: 'Communication Effectiveness',
        measurement: 'Timeliness and accuracy of communications',
        target: 'Excellent rating (4.5/5)',
        weight: 'High'
      },
      {
        criteria: 'Resource Adequacy',
        measurement: 'Availability of required resources when needed',
        target: '100%',
        weight: 'Medium'
      },
      {
        criteria: 'Documentation Quality',
        measurement: 'Completeness and accuracy of exercise documentation',
        target: '100%',
        weight: 'Medium'
      },
      {
        criteria: 'Participant Preparedness',
        measurement: 'Knowledge and readiness of exercise participants',
        target: 'Good rating (4.0/5)',
        weight: 'Medium'
      }
    ],

    exercise_planning: `Exercise planning follows a structured approach to ensure exercises are realistic, challenging, and provide meaningful learning opportunities:

**Planning Phase (8-12 weeks before exercise):**
• Define exercise objectives and scope
• Develop exercise scenario and timeline
• Identify participants and observers
• Prepare exercise materials and documentation
• Coordinate logistics and resources
• Conduct pre-exercise briefings

**Execution Phase (Exercise day):**
• Conduct opening briefing
• Execute exercise scenario
• Monitor and document activities
• Collect observations and feedback
• Conduct hot wash/immediate debrief

**Evaluation Phase (1-2 weeks after exercise):**
• Analyze exercise results
• Prepare exercise report
• Identify improvement actions
• Conduct formal debrief session
• Update plans and procedures`,

    roles_responsibilities: {
      'Exercise Director': 'Overall exercise management, scenario control, decision authority, safety oversight',
      'Exercise Coordinator': 'Exercise planning, logistics coordination, participant management, documentation',
      'Scenario Controllers': 'Inject delivery, timeline management, participant guidance, realism maintenance',
      'Observers/Evaluators': 'Performance observation, data collection, assessment against criteria, feedback provision',
      'Participants': 'Active engagement, realistic response, procedure execution, learning participation',
      'Safety Officer': 'Safety oversight, risk management, emergency procedures, incident response',
      'BCM Manager': 'Exercise approval, resource allocation, strategic oversight, improvement implementation'
    },

    continuous_improvement: `All exercises must be followed by comprehensive evaluation and improvement activities:

**Immediate Actions (Within 24 hours):**
• Conduct hot wash session with participants
• Document immediate observations and issues
• Address any safety or security concerns
• Collect participant feedback forms

**Short-term Actions (Within 2 weeks):**
• Prepare detailed exercise report
• Analyze performance against objectives
• Identify improvement opportunities
• Develop corrective action plan
• Conduct formal debrief session

**Long-term Actions (Within 3 months):**
• Implement approved improvements
• Update plans and procedures
• Provide additional training if needed
• Schedule follow-up exercises
• Share lessons learned across organization

The BCM Coordinator is responsible for tracking all improvement actions to completion and ensuring lessons learned are incorporated into future exercises and plan updates.`
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Testing and Exercising Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Testing and Exercising Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Testing and Exercising Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-ORMD'],
              ['Approved By', 'ORMC - Operational Risk Management Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for testing and exercising and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Testing Types" icon="🧪" collapsible defaultOpen={true}>
          {content.testing_types?.map((test, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{test.type}</h4>
              <p style={{ margin: '0 0 0.5rem 0' }}>{test.description}</p>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>Frequency:</strong> {test.frequency} | <strong>Duration:</strong> {test.duration} | <strong>Participants:</strong> {test.participants}
              </div>
            </div>
          )) || (
            <p>No testing types defined.</p>
          )}
        </UnifiedSection>

        <UnifiedSection title="5. Exercise Schedule" icon="📅" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Exercise Type', 'Frequency', 'Duration', 'Scope', 'Participants', 'Preparation Time']}
            rows={
              content.exercise_schedule?.map(schedule => [
                schedule.exercise_type,
                schedule.frequency,
                schedule.duration,
                schedule.scope,
                schedule.participants || 'N/A',
                schedule.preparation_time || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="6. Evaluation Criteria" icon="📊" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Criteria', 'Measurement', 'Target', 'Weight']}
            rows={
              content.evaluation_criteria?.map(criteria => [
                criteria.criteria,
                criteria.measurement,
                criteria.target,
                criteria.weight || 'Medium'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="7. Exercise Planning" icon="📋" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.exercise_planning}</p>
        </UnifiedSection>

        <UnifiedSection title="8. Roles and Responsibilities" icon="👥" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>

        <UnifiedSection title="9. Continuous Improvement" icon="🔄" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.continuous_improvement}</p>
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="testing_exercising"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="testing_exercising"
      />
    </>
  );
};

export default TestingExercisingProcedure;
