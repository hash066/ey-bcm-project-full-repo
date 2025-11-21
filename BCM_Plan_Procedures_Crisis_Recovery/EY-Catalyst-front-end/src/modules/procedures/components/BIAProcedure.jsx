import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const BIAProcedure = () => {
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
      console.log('🔍 [BIA] Checking database...');
      const data = await getProcedure('bia');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [BIA] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [BIA] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [BIA] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [BIA] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [BIA] Starting AI generation...');
      
      const aiContent = await generateLLMContent('bia', 'Sample Organization', 1, []);
      
      console.log('📦 [BIA] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [BIA] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [BIA] AI content generated successfully');
          
          try {
            await saveProcedure('bia', generatedContent);
            console.log('💾 [BIA] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [BIA] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [BIA] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [BIA] Content update request received from chatbot');
    console.log('   Current content keys:', content ? Object.keys(content) : 'null');
    console.log('   Updated content keys:', Object.keys(updatedContent));
    
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    console.log('✅ [BIA] State updated - React should re-render the page now');
    
    saveProcedure('bia', updatedContent)
      .then(() => console.log('💾 [BIA] Changes saved to database'))
      .catch(err => console.warn('⚠️ [BIA] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [BIA] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [BIA] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('bia', editedContent)
      .then(() => console.log('✅ [BIA] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [BIA] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Business Impact Analysis (BIA) Procedure establishes a systematic and standardized approach for identifying, analyzing, and evaluating the potential effects of disruptions to critical business operations. This procedure is an integral component of the organization's Business Continuity Management System (BCMS) and ensures compliance with ISO 22301:2019 standards.

The BIA serves as the foundation for developing effective business continuity and disaster recovery strategies by identifying time-sensitive activities and their resource dependencies. It provides critical insights into the consequences of interruptions to business functions and processes, enabling the organization to prioritize recovery efforts and allocate resources effectively.

This procedure supports informed decision-making regarding business continuity planning, risk management, and resource allocation. It establishes a clear understanding of the interdependencies between various business functions and the potential cascading effects of disruptions.`,

    scope: `This Business Impact Analysis Procedure applies to all business units, departments, functions, and processes across the organization, including but not limited to:

• Core banking operations and services
• IT infrastructure and applications  
• Customer-facing operations and support services
• Administrative and support functions
• Third-party services and vendor dependencies
• Regulatory and compliance activities
• Physical facilities and resources

The procedure encompasses both internal operations and external dependencies that support critical business functions. It covers all scenarios that could potentially disrupt normal business operations, including natural disasters, technological failures, cyber incidents, supply chain disruptions, and other business continuity threats.`,

    objective: `The primary objectives of this Business Impact Analysis Procedure are to:

1. Systematically identify and document all critical business functions and processes
2. Assess and quantify the potential financial, operational, and reputational impacts of disruptions
3. Determine Maximum Tolerable Period of Disruption (MTPD) for each critical function
4. Establish Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)
5. Identify and document resource requirements for business continuity
6. Analyze interdependencies between business functions and supporting resources
7. Prioritize recovery efforts based on criticality and impact severity
8. Provide data-driven inputs for business continuity strategy development
9. Support risk assessment and treatment planning processes
10. Ensure regulatory compliance and stakeholder expectations are met`,

    methodology: `The BIA process follows a structured, six-phase methodology designed to ensure comprehensive coverage and consistent results:

**Phase 1: Planning and Preparation**
- Define BIA scope, objectives, and success criteria
- Identify key stakeholders and subject matter experts
- Develop data collection instruments (questionnaires, interview templates)
- Establish impact assessment criteria and rating scales
- Create project timeline and resource allocation plan

**Phase 2: Data Collection**
- Conduct structured interviews with process owners and department heads
- Distribute and collect BIA questionnaires
- Gather documentation on business processes and workflows
- Identify resource dependencies (people, technology, facilities, information)
- Document current recovery capabilities and constraints

**Phase 3: Impact Analysis**
- Analyze financial impacts (revenue loss, recovery costs, penalties)
- Evaluate operational impacts (service disruption, productivity loss)
- Assess reputational and customer satisfaction impacts
- Determine regulatory and compliance implications
- Calculate cumulative impact over time

**Phase 4: Time Sensitivity Assessment**
- Determine Maximum Tolerable Period of Disruption (MTPD)
- Establish Recovery Time Objectives (RTO) for each function
- Define Recovery Point Objectives (RPO) for data and systems
- Identify time-critical dependencies and bottlenecks

**Phase 5: Criticality and Prioritization**
- Rank business functions based on impact severity
- Classify functions as critical, essential, or non-essential
- Establish recovery priority sequence
- Identify quick wins and long-term recovery requirements

**Phase 6: Documentation and Reporting**
- Compile comprehensive BIA report
- Present findings to senior management
- Obtain approval and sign-off
- Integrate results into business continuity planning`,

    process_flow: [
      '1. Planning & Preparation - Define scope, identify stakeholders, develop assessment tools',
      '2. Data Collection - Conduct interviews, distribute questionnaires, gather process documentation',
      '3. Impact Analysis - Quantify financial, operational, and reputational impacts',
      '4. RTO/RPO Determination - Establish recovery time and recovery point objectives',
      '5. Criticality Assessment - Rank functions based on impact severity and time sensitivity',
      '6. Recovery Priority Setting - Determine sequence of recovery based on criticality',
      '7. Dependency Mapping - Identify resource dependencies and interdependencies',
      '8. Documentation & Reporting - Compile findings and present to management',
      '9. Review & Approval - Obtain stakeholder validation and management sign-off',
      '10. Implementation & Monitoring - Integrate results into BCM planning and conduct periodic reviews'
    ],

    roles_responsibilities: {
      'BIA Coordinator': 'Overall coordination of BIA process, facilitation of interviews and workshops, consolidation of findings, report preparation',
      'Department Heads': 'Provide accurate information about business processes, review and validate BIA findings, approve RTO/RPO objectives',
      'Process Owners': 'Detail process requirements and workflows, identify resource dependencies, estimate impact scenarios',
      'IT Department': 'Provide technical input on system dependencies, data recovery capabilities, technology resource requirements',
      'Finance Department': 'Support financial impact calculations, validate cost estimates, review financial analysis',
      'BCM Team': 'Provide methodology support, conduct data analysis, prepare BIA reports, track action items',
      'Risk Management': 'Coordinate with enterprise risk management processes, align BIA with risk assessments',
      'Senior Management': 'Review and approve BIA results, allocate resources for recovery strategies, provide strategic direction',
      'Compliance Officer': 'Ensure regulatory requirements are addressed, validate compliance-related impacts'
    },

    review_frequency: `This Business Impact Analysis shall be reviewed and updated according to the following schedule:

**Mandatory Reviews:**
• Annual comprehensive review - Conducted once per calendar year
• Post-incident review - Within 30 days of any significant business disruption
• Post-exercise review - After business continuity exercises or tests

**Triggered Reviews:**
• Significant organizational changes (mergers, acquisitions, restructuring)
• Launch of new products or services
• Major technology implementations or upgrades
• Changes in regulatory requirements
• Significant changes in business strategy or operations
• Identification of new risks or threats
• Changes in third-party dependencies

All reviews shall be documented, and updates shall be approved by the IT Strategy Committee (ITSC) and relevant stakeholders.`,

    impact_parameters: [
      'Financial Loss - Direct revenue loss, recovery costs, penalties, fines',
      'Operational Impact - Service availability, productivity, processing capacity',
      'Customer Impact - Service disruption, customer satisfaction, customer retention',
      'Regulatory/Compliance - Regulatory breaches, compliance violations, audit findings',
      'Reputational Damage - Brand image, market confidence, stakeholder trust',
      'Contractual Obligations - SLA breaches, contractual penalties, customer commitments',
      'Employee Impact - Staff morale, productivity, safety',
      'Data Integrity - Data loss, data corruption, data recovery requirements'
    ],

    critical_processes: [
      'Core Banking Operations',
      'Customer Transaction Processing',
      'ATM and Digital Banking Services',
      'Payment and Settlement Systems',
      'Customer Support and Service Desk',
      'Risk Management and Compliance',
      'IT Infrastructure and Security',
      'Data Backup and Recovery',
      'Communication Systems',
      'Vendor and Third-party Management'
    ]
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Business Impact Analysis (BIA) Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Business Impact Analysis (BIA) Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Business Impact Analysis (BIA) Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-OFRMD'],
              ['Approved By', 'IT Strategy Committee (ITSC)']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for Business Impact Analysis and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Methodology" icon="🔬" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.methodology}</p>
        </UnifiedSection>

        <UnifiedSection title="5. Process Flow" icon="🔄" collapsible defaultOpen={true}>
          <UnifiedList items={content.process_flow || []} ordered={true} />
        </UnifiedSection>

        <UnifiedSection title="6. Roles and Responsibilities" icon="👥" collapsible defaultOpen={true}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>

        <UnifiedSection title="7. Review Frequency" icon="📅" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.review_frequency}</p>
        </UnifiedSection>

        <UnifiedSection title="8. Impact Assessment Parameters" icon="📊" collapsible defaultOpen={false}>
          <UnifiedList items={content.impact_parameters || []} />
        </UnifiedSection>

        <UnifiedSection title="9. Critical Business Processes" icon="⚙️" collapsible defaultOpen={false}>
          <UnifiedList items={content.critical_processes || []} />
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="bia"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="bia"
      />
    </>
  );
};

export default BIAProcedure;
