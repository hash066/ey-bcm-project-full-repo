import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const RiskAssessmentProcedure = () => {
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
      console.log('🔍 [Risk Assessment] Checking database...');
      const data = await getProcedure('risk_assessment');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [Risk Assessment] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [Risk Assessment] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [Risk Assessment] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [Risk Assessment] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [Risk Assessment] Starting AI generation...');
      
      const aiContent = await generateLLMContent('risk_assessment', 'Sample Organization', 1, []);
      
      console.log('📦 [Risk Assessment] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [Risk Assessment] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [Risk Assessment] AI content generated successfully');
          
          try {
            await saveProcedure('risk_assessment', generatedContent);
            console.log('💾 [Risk Assessment] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [Risk Assessment] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [Risk Assessment] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [Risk Assessment] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('risk_assessment', updatedContent)
      .then(() => console.log('💾 [Risk Assessment] Changes saved to database'))
      .catch(err => console.warn('⚠️ [Risk Assessment] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [Risk Assessment] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [Risk Assessment] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('risk_assessment', editedContent)
      .then(() => console.log('✅ [Risk Assessment] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [Risk Assessment] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Risk Assessment Procedure establishes a comprehensive framework for systematically identifying, analyzing, evaluating, and treating risks that could disrupt critical business operations and threaten organizational resilience. This procedure ensures that risk assessment activities are conducted consistently across all business areas and support effective business continuity planning.

Risk assessment is a fundamental component of the Business Continuity Management System (BCMS) that enables the organization to understand its risk landscape and make informed decisions about risk treatment strategies. This procedure provides structured approaches to risk identification, analysis, and evaluation that support strategic planning and operational decision-making.

The procedure supports the organization's risk management objectives and ensures compliance with ISO 22301:2019 requirements for risk assessment and treatment within the BCMS framework.`,

    scope: `This Risk Assessment Procedure applies to all risk assessments conducted for business continuity planning purposes across the organization, including but not limited to:

• Operational risks affecting critical business processes
• Technological risks including system failures and cyber threats
• Environmental risks such as natural disasters and climate events
• Human risks including key person dependencies and skill gaps
• External risks including regulatory changes and market disruptions
• Reputational risks affecting brand and stakeholder confidence
• Supply chain and vendor-related risks
• Physical security and facility-related risks

The procedure covers all organizational levels, departments, and locations, and applies to both internal operations and external dependencies that could impact business continuity.`,

    objective: `The primary objectives of this Risk Assessment Procedure are to:

1. Establish systematic and consistent risk identification processes
2. Provide standardized methods for risk analysis and evaluation
3. Enable informed decision-making for risk treatment strategies
4. Support business continuity planning and strategy development
5. Ensure compliance with regulatory and standard requirements
6. Facilitate risk-based resource allocation and prioritization
7. Enable continuous monitoring and review of risk landscape
8. Support organizational learning and risk awareness
9. Provide input for business impact analysis and recovery planning
10. Enhance overall organizational resilience and preparedness`,

    risk_categories: [
      {
        category: 'Operational Risks',
        description: 'Risks arising from internal processes, systems, and human factors',
        examples: 'Process failures, supply chain disruptions, resource unavailability, quality issues'
      },
      {
        category: 'Technological Risks',
        description: 'Risks related to technology systems, infrastructure, and cyber security',
        examples: 'System failures, cyber attacks, data breaches, infrastructure failures, software bugs'
      },
      {
        category: 'Environmental Risks',
        description: 'Risks from natural and environmental factors beyond organizational control',
        examples: 'Natural disasters, pandemics, climate events, environmental contamination'
      },
      {
        category: 'Human Risks',
        description: 'Risks related to human resources and organizational capabilities',
        examples: 'Key person dependency, skill gaps, labor disputes, workplace accidents'
      },
      {
        category: 'External Risks',
        description: 'Risks from external factors affecting organizational operations',
        examples: 'Regulatory changes, market disruptions, geopolitical events, economic instability'
      },
      {
        category: 'Reputational Risks',
        description: 'Risks that could damage organizational reputation and stakeholder confidence',
        examples: 'Brand damage, customer confidence loss, media crises, social media incidents'
      }
    ],

    risk_assessment_matrix: [
      {
        score_range: '20-25',
        risk_level: 'Critical',
        color: '#ff4444',
        action_required: 'Immediate action required',
        management_level: 'Senior Management',
        timeline: 'Within 24 hours'
      },
      {
        score_range: '15-19',
        risk_level: 'High',
        color: '#ff9944',
        action_required: 'Urgent action required',
        management_level: 'Department Head',
        timeline: 'Within 30 days'
      },
      {
        score_range: '10-14',
        risk_level: 'Medium',
        color: '#ffdd44',
        action_required: 'Action required',
        management_level: 'Process Owner',
        timeline: 'Within 90 days'
      },
      {
        score_range: '5-9',
        risk_level: 'Low',
        color: '#99dd44',
        action_required: 'Routine monitoring',
        management_level: 'Team Lead',
        timeline: 'Within 6 months'
      },
      {
        score_range: '1-4',
        risk_level: 'Minimal',
        color: '#44dd44',
        action_required: 'Accept risk',
        management_level: 'Team Lead',
        timeline: 'Annual review'
      }
    ],

    risk_treatment_strategies: [
      {
        strategy: 'Avoid',
        description: 'Eliminate the risk by discontinuing the activity or changing the approach',
        when_to_use: 'Critical/High risks with viable alternatives available',
        examples: 'Discontinuing high-risk activities, changing suppliers, relocating operations'
      },
      {
        strategy: 'Mitigate',
        description: 'Implement controls to reduce the likelihood or impact of the risk',
        when_to_use: 'High/Medium risks where prevention or reduction is possible',
        examples: 'Installing backup systems, implementing security controls, training staff'
      },
      {
        strategy: 'Transfer',
        description: 'Shift the risk to a third party through insurance, outsourcing, or contracts',
        when_to_use: 'Risks with significant financial impact that can be transferred cost-effectively',
        examples: 'Insurance policies, outsourcing arrangements, contractual risk transfer'
      },
      {
        strategy: 'Accept',
        description: 'Acknowledge and monitor the risk without taking specific action',
        when_to_use: 'Low/Minimal risks within organizational risk appetite',
        examples: 'Minor operational risks, low-probability events with minimal impact'
      }
    ],

    assessment_methodology: `The risk assessment process follows a structured, five-phase methodology:

**Phase 1: Risk Identification**
• Conduct stakeholder workshops and interviews
• Review historical incident data and lessons learned
• Analyze business processes and dependencies
• Consider external threat intelligence and industry reports
• Use structured techniques (brainstorming, checklists, scenarios)

**Phase 2: Risk Analysis**
• Assess likelihood of risk occurrence (1-5 scale)
• Evaluate potential impact on business objectives (1-5 scale)
• Consider existing controls and their effectiveness
• Calculate inherent and residual risk scores
• Document assumptions and rationale

**Phase 3: Risk Evaluation**
• Compare risk scores against organizational risk criteria
• Prioritize risks based on score and strategic importance
• Identify risks requiring immediate attention
• Consider risk interdependencies and cumulative effects
• Validate results with stakeholders

**Phase 4: Risk Treatment Planning**
• Select appropriate treatment strategies for each risk
• Develop detailed treatment plans with timelines
• Assign ownership and accountability for actions
• Estimate resource requirements and costs
• Define success criteria and monitoring approaches

**Phase 5: Documentation and Communication**
• Document all assessment results and decisions
• Update risk registers and management systems
• Communicate findings to relevant stakeholders
• Integrate results into business continuity planning
• Schedule follow-up reviews and updates`,

    roles_responsibilities: {
      'Risk Assessment Coordinator': 'Overall coordination of risk assessment process, methodology development, training delivery',
      'Risk Owners': 'Identify and assess risks in their areas, implement treatment actions, monitor effectiveness',
      'Process Owners': 'Provide process expertise, validate risk assessments, support treatment implementation',
      'Risk Management Team': 'Provide methodology support, conduct quality reviews, maintain risk registers',
      'Senior Management': 'Approve risk appetite and criteria, review assessment results, authorize treatment actions',
      'Internal Audit': 'Provide independent assurance on risk assessment quality and effectiveness',
      'BCM Team': 'Integrate risk assessment results into business continuity planning and strategy development'
    },

    review_frequency: `Risk assessments must be reviewed and updated according to the following schedule:

**Regular Reviews:**
• Annual comprehensive risk assessment review
• Quarterly review of critical and high risks
• Monthly monitoring of risk treatment progress
• Semi-annual validation of risk criteria and methodology

**Triggered Reviews:**
• Following significant organizational changes
• After major incidents or near-miss events
• When new threats or vulnerabilities are identified
• Following changes in business strategy or operations
• When regulatory requirements change
• After major technology implementations

All reviews must be documented with findings, updates, and recommendations. The Risk Assessment Coordinator is responsible for scheduling reviews and ensuring completion within specified timeframes.`
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Risk Assessment Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Risk Assessment Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Risk Assessment Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-Risk Management'],
              ['Approved By', 'Risk Management Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for risk assessment and treatment and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Risk Categories" icon="📊" collapsible defaultOpen={true}>
          {content.risk_categories?.map((category, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{category.category}</h4>
              <p style={{ margin: '0 0 0.5rem 0' }}>{category.description}</p>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>Examples:</strong> {category.examples}
              </div>
            </div>
          )) || (
            <p>No risk categories defined.</p>
          )}
        </UnifiedSection>

        <UnifiedSection title="5. Risk Assessment Matrix" icon="🎯" collapsible defaultOpen={false}>
          <p style={{ marginBottom: '1rem' }}>Risk Level = Likelihood × Impact (on scale of 1-5)</p>
          <UnifiedTable
            headers={['Risk Score', 'Risk Level', 'Action Required', 'Management Level', 'Timeline']}
            rows={
              content.risk_assessment_matrix?.map(matrix => [
                matrix.score_range,
                matrix.risk_level,
                matrix.action_required,
                matrix.management_level,
                matrix.timeline || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="6. Risk Treatment Strategies" icon="🛡️" collapsible defaultOpen={false}>
          {content.risk_treatment_strategies?.map((strategy, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>{strategy.strategy}</h4>
              <p style={{ margin: '0 0 0.5rem 0' }}>{strategy.description}</p>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>When to use:</strong> {strategy.when_to_use}<br/>
                <strong>Examples:</strong> {strategy.examples}
              </div>
            </div>
          )) || (
            <p>No treatment strategies defined.</p>
          )}
        </UnifiedSection>

        <UnifiedSection title="7. Assessment Methodology" icon="🔬" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.assessment_methodology}</p>
        </UnifiedSection>

        <UnifiedSection title="8. Roles and Responsibilities" icon="👥" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Role', 'Responsibilities']}
            rows={Object.entries(content.roles_responsibilities || {}).map(([role, resp]) => [role, resp])}
          />
        </UnifiedSection>

        <UnifiedSection title="9. Review Frequency" icon="📅" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.review_frequency}</p>
        </UnifiedSection>
      </UnifiedProcedureLayout>

      <FloatingChatbot 
        procedureType="risk_assessment"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="risk_assessment"
      />
    </>
  );
};

export default RiskAssessmentProcedure;