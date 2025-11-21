import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const BcmPlanProcedure = () => {
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
      console.log('🔍 [BCM Plan] Checking database...');
      const data = await getProcedure('bcm_plan');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [BCM Plan] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [BCM Plan] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [BCM Plan] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [BCM Plan] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [BCM Plan] Starting AI generation...');
      
      const aiContent = await generateLLMContent('bcm_plan', 'Sample Organization', 1, []);
      
      console.log('📦 [BCM Plan] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [BCM Plan] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [BCM Plan] AI content generated successfully');
          
          try {
            await saveProcedure('bcm_plan', generatedContent);
            console.log('💾 [BCM Plan] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [BCM Plan] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [BCM Plan] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [BCM Plan] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('bcm_plan', updatedContent)
      .then(() => console.log('💾 [BCM Plan] Changes saved to database'))
      .catch(err => console.warn('⚠️ [BCM Plan] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [BCM Plan] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [BCM Plan] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('bcm_plan', editedContent)
      .then(() => console.log('✅ [BCM Plan] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [BCM Plan] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Business Continuity Management (BCM) Plan Development Procedure establishes a comprehensive framework for creating, maintaining, and updating business continuity plans that enable the organization to continue critical operations during and after disruptive incidents. This procedure ensures that BCM plans are developed systematically, consistently, and in alignment with organizational objectives and regulatory requirements.

Effective BCM planning is essential for organizational resilience and the ability to respond to, recover from, and adapt to disruptions. This procedure provides structured approaches to plan development that ensure all critical aspects of business continuity are addressed and that plans are practical, actionable, and regularly tested.

The procedure supports the organization's Business Continuity Management System (BCMS) and ensures compliance with ISO 22301:2019 requirements for business continuity planning and plan development.`,

    scope: `This BCM Plan Development Procedure applies to all business continuity planning activities across the organization, including but not limited to:

• Departmental business continuity plans
• Process-specific continuity plans
• IT disaster recovery plans
• Crisis management plans
• Communication and stakeholder management plans
• Vendor and supplier continuity plans
• Site-specific emergency response plans
• Recovery and restoration plans

The procedure covers all organizational levels, departments, and locations, and applies to both internal operations and external dependencies that are critical to business continuity.`,

    objective: `The primary objectives of this BCM Plan Development Procedure are to:

1. Establish systematic and consistent approaches to BCM plan development
2. Ensure all critical business functions have adequate continuity plans
3. Provide standardized plan structures and content requirements
4. Define clear activation criteria and escalation procedures
5. Establish recovery strategies and resource requirements
6. Ensure plans are practical, actionable, and regularly tested
7. Support coordination and integration across all organizational levels
8. Enable rapid and effective response to disruptive incidents
9. Facilitate continuous improvement of BCM capabilities
10. Ensure compliance with regulatory and standard requirements`,

    plan_structure: `All BCM plans must follow a standardized structure to ensure consistency and usability:

**Section 1: Plan Overview**
• Plan purpose, scope, and objectives
• Plan activation criteria and authority
• Plan owner and contact information
• Document control and version history

**Section 2: Situation Assessment**
• Critical business functions and processes covered
• Key dependencies and interdependencies
• Risk assessment summary and key threats
• Impact analysis and recovery priorities

**Section 3: Response Organization**
• Response team structure and roles
• Decision-making authority and escalation
• Communication protocols and contact lists
• Coordination with other plans and external agencies

**Section 4: Response Procedures**
• Immediate response actions and priorities
• Damage assessment and situation evaluation
• Resource mobilization and deployment
• Stakeholder notification and communication

**Section 5: Recovery Strategies**
• Recovery options and alternatives
• Resource requirements and availability
• Recovery time objectives and priorities
• Workaround procedures and temporary solutions

**Section 6: Plan Maintenance**
• Review and update schedules
• Testing and exercise requirements
• Training and awareness activities
• Performance monitoring and improvement`,

    activation_criteria: [
      {
        trigger: 'System Failure',
        description: 'Critical IT systems or infrastructure failure affecting business operations',
        authority: 'IT Manager or BCM Coordinator',
        notification_time: '< 30 minutes'
      },
      {
        trigger: 'Facility Damage',
        description: 'Physical damage to facilities preventing normal operations',
        authority: 'Facility Manager or Site Manager',
        notification_time: '< 1 hour'
      },
      {
        trigger: 'Staff Unavailability',
        description: 'Significant number of key staff unavailable due to illness, emergency, or other causes',
        authority: 'Department Head or HR Manager',
        notification_time: '< 2 hours'
      },
      {
        trigger: 'Supplier Disruption',
        description: 'Critical supplier or vendor unable to provide essential services or products',
        authority: 'Procurement Manager or Process Owner',
        notification_time: '< 4 hours'
      },
      {
        trigger: 'Regulatory Action',
        description: 'Regulatory intervention or requirements affecting business operations',
        authority: 'Compliance Officer or Legal Counsel',
        notification_time: '< 1 hour'
      },
      {
        trigger: 'Security Incident',
        description: 'Cyber attack, data breach, or physical security incident',
        authority: 'Security Manager or CISO',
        notification_time: 'Immediate'
      }
    ],

    recovery_strategies: [
      {
        strategy: 'Alternate Site Operations',
        description: 'Relocate operations to pre-arranged alternate facilities',
        rto: '4-24 hours',
        resources: 'Alternate site, equipment, staff, transportation',
        considerations: 'Site readiness, capacity, technology compatibility'
      },
      {
        strategy: 'Work from Home',
        description: 'Enable remote work capabilities for affected staff',
        rto: '2-8 hours',
        resources: 'Remote access technology, laptops, communication tools',
        considerations: 'Security, productivity, collaboration tools'
      },
      {
        strategy: 'Manual Workarounds',
        description: 'Implement manual processes to maintain critical functions',
        rto: '1-4 hours',
        resources: 'Trained staff, manual procedures, paper forms',
        considerations: 'Capacity limitations, error rates, compliance'
      },
      {
        strategy: 'Third-party Services',
        description: 'Engage external providers for temporary service delivery',
        rto: '4-48 hours',
        resources: 'Pre-contracted services, vendor relationships',
        considerations: 'Cost, quality, security, integration'
      },
      {
        strategy: 'System Recovery',
        description: 'Restore systems and data from backups',
        rto: '2-24 hours',
        resources: 'Backup systems, recovery procedures, technical staff',
        considerations: 'Data currency, system integrity, testing'
      },
      {
        strategy: 'Reciprocal Agreements',
        description: 'Utilize facilities or resources from partner organizations',
        rto: '8-48 hours',
        resources: 'Partner agreements, shared resources',
        considerations: 'Availability, compatibility, mutual obligations'
      }
    ],

    development_process: `BCM plan development follows a structured, six-phase process:

**Phase 1: Planning and Preparation**
• Define plan scope, objectives, and success criteria
• Identify stakeholders and plan development team
• Gather relevant documentation and assessments
• Establish project timeline and resource allocation
• Conduct initial stakeholder meetings

**Phase 2: Requirements Analysis**
• Review business impact analysis results
• Analyze risk assessment findings
• Identify critical functions and dependencies
• Determine recovery requirements and objectives
• Validate assumptions with stakeholders

**Phase 3: Strategy Development**
• Evaluate recovery strategy options
• Assess resource requirements and availability
• Develop cost-benefit analysis for alternatives
• Select optimal recovery strategies
• Define implementation approach

**Phase 4: Plan Documentation**
• Develop plan content following standard structure
• Create detailed procedures and checklists
• Prepare contact lists and resource inventories
• Develop communication templates and protocols
• Review and validate content with stakeholders

**Phase 5: Plan Validation**
• Conduct desktop reviews and walkthroughs
• Perform initial testing and validation exercises
• Gather feedback and identify improvements
• Refine procedures and update documentation
• Obtain formal approval and sign-off

**Phase 6: Implementation and Maintenance**
• Distribute plans to relevant personnel
• Conduct training and awareness sessions
• Schedule regular reviews and updates
• Plan testing and exercise activities
• Establish performance monitoring`,

    roles_responsibilities: {
      'BCM Manager': 'Overall BCM planning oversight, strategy development, plan approval, resource allocation',
      'Plan Owners': 'Plan development and maintenance, stakeholder coordination, testing oversight, performance monitoring',
      'Process Owners': 'Provide process expertise, validate requirements, support plan development, participate in testing',
      'Department Heads': 'Resource provision, staff participation, plan approval, implementation support',
      'BCM Coordinator': 'Plan development support, template maintenance, training coordination, compliance monitoring',
      'IT Department': 'Technology recovery strategies, system requirements, technical plan components',
      'HR Department': 'Staff availability planning, communication support, training coordination',
      'Facilities Management': 'Alternate site planning, physical resource requirements, facility-related procedures',
      'Communications Team': 'Stakeholder communication plans, message development, media relations'
    },

    maintenance_requirements: `BCM plans require regular maintenance to ensure continued effectiveness and relevance:

**Regular Maintenance Activities:**
• Monthly review of contact information and resource lists
• Quarterly review of procedures and recovery strategies
• Semi-annual comprehensive plan review and update
• Annual plan validation through testing and exercises

**Triggered Maintenance:**
• Following organizational changes (structure, processes, technology)
• After incidents or exercises that identify improvement opportunities
• When new risks or threats are identified
• Following changes in regulatory requirements or standards
• When recovery strategies or resources change

**Maintenance Documentation:**
• All changes must be documented with rationale and approval
• Version control must be maintained for all plan documents
• Change logs must track modifications and responsible parties
• Distribution lists must be updated to reflect current personnel

**Quality Assurance:**
• Plans must be reviewed by independent parties before approval
• Changes must be validated through testing or simulation
• Stakeholder feedback must be incorporated into updates
• Compliance with standards and regulations must be verified

The Plan Owner is responsible for ensuring all maintenance activities are completed on schedule and that plans remain current and effective.`
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="BCM Plan Development Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="BCM Plan Development Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'BCM Plan Development Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-BCM'],
              ['Approved By', 'BCM Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for business continuity strategies and plans and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Plan Structure" icon="📄" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.plan_structure}</p>
        </UnifiedSection>

        <UnifiedSection title="5. Activation Criteria" icon="🚨" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Trigger', 'Description', 'Authority', 'Notification Time']}
            rows={
              content.activation_criteria?.map(criteria => [
                criteria.trigger,
                criteria.description,
                criteria.authority,
                criteria.notification_time
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="6. Recovery Strategies" icon="🔄" collapsible defaultOpen={false}>
          {content.recovery_strategies?.map((strategy, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{strategy.strategy}</h4>
              <p style={{ margin: '0 0 0.5rem 0' }}>{strategy.description}</p>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>RTO:</strong> {strategy.rto} | <strong>Resources:</strong> {strategy.resources}<br/>
                <strong>Considerations:</strong> {strategy.considerations}
              </div>
            </div>
          )) || (
            <p>No recovery strategies defined.</p>
          )}
        </UnifiedSection>

        <UnifiedSection title="7. Development Process" icon="🔧" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.development_process}</p>
        </UnifiedSection>

        <UnifiedSection title="8. Roles and Responsibilities" icon="👥" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>

        <UnifiedSection title="9. Maintenance Requirements" icon="🔧" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.maintenance_requirements}</p>
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="bcm_plan"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="bcm_plan"
      />
    </>
  );
};

export default BcmPlanProcedure;