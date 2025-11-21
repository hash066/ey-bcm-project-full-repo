import React, { useState, useEffect, useCallback } from 'react';
import { generateLLMContent } from '../services/enhancedProcedureService';
import { getProcedure, saveProcedure } from '../services/procedureService';
import UnifiedProcedureLayout from './UnifiedProcedureLayout';
import { UnifiedSection, UnifiedTable, UnifiedInfoBox, UnifiedList } from './UnifiedSection';
import FloatingChatbot from './FloatingChatbot';
import ContentEditorModal from './ContentEditorModal';

const PerformanceMonitoringProcedure = () => {
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
      console.log('🔍 [Performance Monitoring] Checking database...');
      const data = await getProcedure('performance_monitoring');
      
      if (data.versions && data.versions.length > 0) {
        const dbContent = data.versions[0].content;
        
        if (isContentEmpty(dbContent)) {
          console.log('⚠️ [Performance Monitoring] Database content is empty, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          console.log('✅ [Performance Monitoring] Found valid content in database');
          setContent(dbContent);
        }
      } else {
        console.log('ℹ️ [Performance Monitoring] Not in database, using fallback');
        setContent(getDetailedFallbackContent());
      }
    } catch (err) {
      console.error('❌ [Performance Monitoring] Database error:', err);
      setContent(getDetailedFallbackContent());
    }
  }, []);

  useEffect(() => {
    checkDatabaseForContent();
  }, [checkDatabaseForContent]);

  const handleGenerateContent = async () => {
    setLoading(true);
    
    try {
      console.log('🤖 [Performance Monitoring] Starting AI generation...');
      
      const aiContent = await generateLLMContent('performance_monitoring', 'Sample Organization', 1, []);
      
      console.log('📦 [Performance Monitoring] Received response:', aiContent);
      
      if (aiContent && (aiContent.generated_content || aiContent.content)) {
        const generatedContent = aiContent.generated_content || aiContent.content;
        
        if (isContentEmpty(generatedContent)) {
          console.warn('⚠️ [Performance Monitoring] AI generated empty content, using fallback');
          setContent(getDetailedFallbackContent());
        } else {
          setContent(generatedContent);
          console.log('✅ [Performance Monitoring] AI content generated successfully');
          
          try {
            await saveProcedure('performance_monitoring', generatedContent);
            console.log('💾 [Performance Monitoring] Saved to database');
          } catch (saveErr) {
            console.warn('⚠️ [Performance Monitoring] Could not save to database:', saveErr);
          }
        }
      } else {
        throw new Error('AI generation returned no content');
      }
    } catch (err) {
      console.error('❌ [Performance Monitoring] Generation error:', err);
      setContent(getDetailedFallbackContent());
    } finally {
      setLoading(false);
    }
  };

  const handleContentUpdate = (updatedContent) => {
    console.log('📝 [Performance Monitoring] Content update request received from chatbot');
    setContent({
      ...updatedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('performance_monitoring', updatedContent)
      .then(() => console.log('💾 [Performance Monitoring] Changes saved to database'))
      .catch(err => console.warn('⚠️ [Performance Monitoring] Could not save updated content:', err));
  };

  const handleEditContent = () => {
    console.log('✏️ [Performance Monitoring] Opening content editor');
    setIsEditorOpen(true);
  };

  const handleSaveEdited = (editedContent) => {
    console.log('💾 [Performance Monitoring] Saving manually edited content');
    setContent({
      ...editedContent,
      _timestamp: Date.now()
    });
    
    saveProcedure('performance_monitoring', editedContent)
      .then(() => console.log('✅ [Performance Monitoring] Edited content saved to database'))
      .catch(err => console.warn('⚠️ [Performance Monitoring] Could not save edited content:', err));
  };

  const getDetailedFallbackContent = () => ({
    introduction: `The Performance Monitoring Procedure establishes a comprehensive framework for systematically monitoring, measuring, and evaluating the effectiveness of the organization's Business Continuity Management System (BCMS) and related processes. This procedure ensures that BCM performance is continuously assessed against established objectives and targets.

Effective performance monitoring is essential for demonstrating the value and effectiveness of BCM investments and ensuring continuous improvement. This procedure provides structured approaches to data collection, analysis, and reporting that enable evidence-based decision-making and strategic planning.

The procedure supports the organization's commitment to excellence and ensures compliance with ISO 22301:2019 requirements for monitoring, measurement, analysis, and evaluation of BCMS performance.`,

    scope: `This Performance Monitoring Procedure applies to all aspects of the BCMS and business continuity activities across the organization, including but not limited to:

• Business continuity plans and procedures
• Recovery strategies and capabilities
• Crisis management and communication processes
• Training and awareness programs
• Exercise and testing activities
• Vendor and supplier continuity arrangements
• Risk management and mitigation measures
• Incident response and recovery operations

The procedure covers all organizational levels, departments, and locations, and includes performance measurement of both internal capabilities and external dependencies.`,

    objective: `The primary objectives of this Performance Monitoring Procedure are to:

1. Establish systematic monitoring and measurement of BCMS performance
2. Provide objective evidence of BCM effectiveness and maturity
3. Support data-driven decision-making and resource allocation
4. Identify trends, patterns, and improvement opportunities
5. Demonstrate compliance with regulatory and standard requirements
6. Enable benchmarking against industry best practices
7. Support continuous improvement initiatives
8. Facilitate management review and strategic planning
9. Enhance stakeholder confidence in BCM capabilities
10. Ensure accountability and transparency in BCM performance`,

    performance_indicators: [
      {
        kpi: 'Plan Currency',
        measurement: '% of BCM plans reviewed and updated within scheduled timeframes',
        target: '100%',
        frequency: 'Quarterly',
        owner: 'BCM Coordinator'
      },
      {
        kpi: 'Exercise Completion',
        measurement: '% of scheduled BCM exercises completed successfully',
        target: '≥ 95%',
        frequency: 'Quarterly',
        owner: 'Exercise Coordinator'
      },
      {
        kpi: 'Training Compliance',
        measurement: '% of staff completed mandatory BCM training',
        target: '≥ 90%',
        frequency: 'Semi-annually',
        owner: 'Training Coordinator'
      },
      {
        kpi: 'RTO Achievement',
        measurement: '% of critical processes meeting RTO during exercises',
        target: '≥ 95%',
        frequency: 'Per exercise',
        owner: 'Process Owners'
      },
      {
        kpi: 'Incident Response Time',
        measurement: 'Average time from incident alert to initial response',
        target: '≤ 30 minutes',
        frequency: 'Per incident',
        owner: 'Crisis Manager'
      },
      {
        kpi: 'Audit Findings Closure',
        measurement: '% of audit findings closed within agreed timelines',
        target: '100%',
        frequency: 'Monthly',
        owner: 'BCM Manager'
      },
      {
        kpi: 'Vendor BCM Compliance',
        measurement: '% of critical vendors with adequate BCM arrangements',
        target: '100%',
        frequency: 'Semi-annually',
        owner: 'Vendor Manager'
      },
      {
        kpi: 'Communication Effectiveness',
        measurement: 'Stakeholder satisfaction rating for crisis communications',
        target: '≥ 4.0/5.0',
        frequency: 'Post-incident',
        owner: 'Communications Lead'
      }
    ],

    monitoring_activities: [
      {
        activity: 'KPI Data Collection',
        frequency: 'Monthly',
        responsible: 'BCM Coordinator',
        method: 'Automated dashboards and manual reports',
        deliverable: 'Monthly KPI report'
      },
      {
        activity: 'Performance Review Meeting',
        frequency: 'Quarterly',
        responsible: 'BCM Team',
        method: 'Structured review sessions',
        deliverable: 'Quarterly performance assessment'
      },
      {
        activity: 'Management Review',
        frequency: 'Semi-annually',
        responsible: 'Senior Management',
        method: 'Executive review sessions',
        deliverable: 'Management review minutes and decisions'
      },
      {
        activity: 'Trend Analysis',
        frequency: 'Quarterly',
        responsible: 'BCM Coordinator',
        method: 'Statistical analysis and trending',
        deliverable: 'Trend analysis report'
      },
      {
        activity: 'Benchmarking Study',
        frequency: 'Annually',
        responsible: 'BCM Manager',
        method: 'Industry comparison and best practice review',
        deliverable: 'Benchmarking report and recommendations'
      },
      {
        activity: 'Dashboard Updates',
        frequency: 'Real-time/Daily',
        responsible: 'BCM Coordinator',
        method: 'Automated data feeds and manual updates',
        deliverable: 'Live performance dashboard'
      }
    ],

    reporting_requirements: `Performance monitoring reports must be prepared according to the following schedule and requirements:

**Monthly Reports:**
• KPI status and performance against targets
• Incident summary and response performance
• Training completion and compliance status
• Action item progress and completion

**Quarterly Reports:**
• Comprehensive performance assessment
• Trend analysis and variance explanations
• Exercise results and lessons learned
• Improvement recommendations and action plans

**Semi-Annual Reports:**
• Management review preparation
• Strategic performance evaluation
• Benchmarking results and industry comparison
• Annual planning input and recommendations

**Annual Reports:**
• Comprehensive BCMS performance review
• Maturity assessment and capability evaluation
• ROI analysis and value demonstration
• Strategic recommendations for following year

All reports must include executive summaries, key findings, recommendations, and supporting data visualizations. Reports must be submitted within 10 working days of period end.`,

    data_collection: `Performance data is collected through multiple sources and methods to ensure accuracy and completeness:

**Automated Data Sources:**
• BCMS software and management systems
• Exercise management platforms
• Training management systems
• Incident management systems
• Communication platforms and tools

**Manual Data Collection:**
• Stakeholder surveys and feedback forms
• Exercise observation and evaluation
• Audit findings and assessment results
• Vendor performance evaluations
• Process owner assessments

**Data Quality Standards:**
• Accuracy - Data must be verified and validated
• Completeness - All required data points collected
• Timeliness - Data collected within specified timeframes
• Consistency - Standardized collection methods used
• Reliability - Multiple sources used for validation`,

    roles_responsibilities: {
      'BCM Manager': 'Overall performance monitoring oversight, strategic analysis, management reporting, improvement planning',
      'BCM Coordinator': 'Daily performance monitoring, data collection, dashboard maintenance, trend analysis, report preparation',
      'Process Owners': 'Provide process-specific performance data, validate measurements, implement improvements',
      'Exercise Coordinator': 'Collect and analyze exercise performance data, evaluate effectiveness, report results',
      'Training Coordinator': 'Monitor training completion and effectiveness, assess competency levels, report compliance',
      'Quality Manager': 'Validate measurement methods, audit performance data, ensure accuracy and reliability',
      'Senior Management': 'Review performance results, approve improvement actions, provide strategic direction',
      'IT Support': 'Maintain monitoring systems, ensure data integrity, provide technical support for dashboards'
    },

    continuous_improvement: `Performance monitoring results drive continuous improvement through systematic analysis and action:

**Performance Analysis:**
• Regular review of KPI trends and patterns
• Root cause analysis for underperformance
• Identification of improvement opportunities
• Benchmarking against best practices

**Improvement Actions:**
• Development of corrective action plans
• Resource allocation for improvement initiatives
• Process optimization and enhancement
• Technology upgrades and system improvements

**Implementation Tracking:**
• Progress monitoring of improvement actions
• Effectiveness measurement of implemented changes
• Validation of improvement results
• Documentation of lessons learned

**Feedback Loop:**
• Regular review and update of KPIs and targets
• Refinement of measurement methods
• Enhancement of reporting processes
• Stakeholder feedback incorporation

The BCM Manager is responsible for ensuring all improvement actions are tracked to completion and that lessons learned are incorporated into future performance monitoring activities.`
  });

  if (!content) {
    return (
      <UnifiedProcedureLayout procedureName="Performance Monitoring Procedure">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading content...</p>
        </div>
      </UnifiedProcedureLayout>
    );
  }

  return (
    <>
      <UnifiedProcedureLayout
        procedureName="Performance Monitoring Procedure"
        onGenerateContent={handleGenerateContent}
        onEditContent={handleEditContent}
        isGenerating={loading}
      >
        <UnifiedSection title="Document Information" icon="📋">
          <UnifiedTable
            headers={['Field', 'Value']}
            rows={[
              ['Document Name', 'Performance Monitoring Procedure'],
              ['Document Owner', 'H.O. BCM Team'],
              ['Version Number', '1.0'],
              ['Prepared By', 'H.O. BCM Team'],
              ['Reviewed By', 'Head-PMO'],
              ['Approved By', 'Performance Management Committee']
            ]}
          />
        </UnifiedSection>

        <UnifiedSection title="1. Introduction" icon="📖" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.introduction}</p>
          <UnifiedInfoBox type="info" title="ISO 22301:2019 Compliance">
            This procedure aligns with ISO 22301:2019 requirements for monitoring, measurement, analysis and evaluation and supports the organization's Business Continuity Management System (BCMS).
          </UnifiedInfoBox>
        </UnifiedSection>

        <UnifiedSection title="2. Scope" icon="🎯" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.scope}</p>
        </UnifiedSection>

        <UnifiedSection title="3. Objective" icon="✨" collapsible defaultOpen={true}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.objective}</p>
        </UnifiedSection>

        <UnifiedSection title="4. Key Performance Indicators (KPIs)" icon="📊" collapsible defaultOpen={true}>
          <UnifiedTable
            headers={['KPI', 'Measurement', 'Target', 'Frequency', 'Owner']}
            rows={
              content.performance_indicators?.map(kpi => [
                kpi.kpi,
                kpi.measurement,
                kpi.target,
                kpi.frequency,
                kpi.owner || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="5. Monitoring Activities" icon="🔍" collapsible defaultOpen={false}>
          <UnifiedTable
            headers={['Activity', 'Frequency', 'Responsible', 'Method', 'Deliverable']}
            rows={
              content.monitoring_activities?.map(activity => [
                activity.activity,
                activity.frequency,
                activity.responsible,
                activity.method || 'N/A',
                activity.deliverable || 'N/A'
              ]) || []
            }
          />
        </UnifiedSection>

        <UnifiedSection title="6. Reporting Requirements" icon="📄" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.reporting_requirements}</p>
        </UnifiedSection>

        <UnifiedSection title="7. Data Collection" icon="📈" collapsible defaultOpen={false}>
          <p style={{ whiteSpace: 'pre-line' }}>{content.data_collection}</p>
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
        procedureType="performance_monitoring"
        currentContent={content}
        onContentUpdate={handleContentUpdate}
      />

      <ContentEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        content={content}
        onSave={handleSaveEdited}
        procedureType="performance_monitoring"
      />
    </>
  );
};

export default PerformanceMonitoringProcedure;