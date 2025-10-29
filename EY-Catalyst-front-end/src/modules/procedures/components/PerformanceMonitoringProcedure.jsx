import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { generateLLMContent } from '../services/enhancedProcedureService';

/**
 * Performance Monitoring Procedure Component
 * MODIFIED: Auth bypassed, using hardcoded org ID
 */
const PerformanceMonitoringProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId] = useState(1); // Hardcoded for testing

  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'Performance Monitoring Procedure',
    documentOwner: 'Performance Management Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'Performance Management Team',
    reviewedBy: 'Head-PMO',
    approvedBy: 'Performance Management Committee'
  });

  const [changeLog, setChangeLog] = useState([
    {
      srNo: 1,
      versionNo: '1.0',
      approvalDate: '',
      descriptionOfChange: 'Initial version of Performance Monitoring Procedure'
    }
  ]);

  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    performanceIndicators: [],
    monitoringFrequency: {},
    reportingRequirements: ''
  });

  const [useLLMContent, setUseLLMContent] = useState(false);

  useEffect(() => {
    // Simulate loading organization data
    setOrganizationName('Sample Organization');
    setLoading(false);
  }, []);

  const handleGenerateLLMContent = async () => {
    if (!organizationId || !organizationName) {
      setLlmError('Organization information not available');
      return;
    }

    setIsLoadingLLM(true);
    setLlmError(null);

    try {
      const data = await generateLLMContent(
        'performance_monitoring',
        organizationName,
        organizationId,
        [
          'introduction',
          'scope',
          'objective',
          'methodology',
          'performance_indicators',
          'monitoring_frequency',
          'reporting_requirements'
        ]
      );

      if (data && data.llm_content) {
        setLlmContent({
          introduction: data.llm_content.introduction || '',
          scope: data.llm_content.scope || '',
          objective: data.llm_content.objective || '',
          methodology: data.llm_content.methodology || '',
          performanceIndicators: data.llm_content.performance_indicators || [],
          monitoringFrequency: data.llm_content.monitoring_frequency || {},
          reportingRequirements: data.llm_content.reporting_requirements || ''
        });
        setUseLLMContent(true);
      }
    } catch (err) {
      console.error('Error generating LLM content:', err);
      setLlmError('Failed to generate AI content. Please try again.');
    } finally {
      setIsLoadingLLM(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('performance-monitoring-procedure-document');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_Performance_Monitoring_Procedure.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#FFD700' }}>
        Loading organization data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ff4444' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#181818',
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #FFD700',
          paddingBottom: '10px'
        }}>
          <h1 style={{ color: '#FFD700', margin: 0 }}>Performance Monitoring Procedure</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleGenerateLLMContent}
              disabled={isLoadingLLM}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: isLoadingLLM ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isLoadingLLM ? 'Generating...' : 'Generate AI Content'}
            </button>
            <button
              onClick={handleExportPDF}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Export to PDF
            </button>
          </div>
        </div>

        {/* LLM Toggle */}
        <div style={{
          backgroundColor: '#1e1e1e',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #FFD700'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useLLMContent}
              onChange={(e) => setUseLLMContent(e.target.checked)}
              style={{ marginRight: '10px', cursor: 'pointer' }}
            />
            <span>Use AI-Generated Content</span>
          </label>
          {llmError && (
            <div style={{ color: '#ff4444', marginTop: '10px' }}>
              {llmError}
            </div>
          )}
        </div>

        {/* Document Content */}
        <div
          id="performance-monitoring-procedure-document"
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '40px',
            borderRadius: '5px'
          }}
        >
          {/* Document Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#000', borderBottom: '3px solid #FFD700', paddingBottom: '10px' }}>
              {organizationName}
            </h1>
            <h2 style={{ color: '#000' }}>Performance Monitoring Procedure</h2>
          </div>

          {/* Document Information Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '30px',
            border: '1px solid #000'
          }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '30%' }}>
                  Document Name
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.documentName}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Document Owner
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.documentOwner}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Version No.
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.documentVersionNo}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Version Date
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.documentVersionDate}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Prepared By
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.preparedBy}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Reviewed By
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.reviewedBy}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  Approved By
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {documentInfo.approvedBy}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Change Log */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              Change Log
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #000'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Sr. No.</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Version No.</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Approval Date</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Description of Change</th>
                </tr>
              </thead>
              <tbody>
                {changeLog.map((log) => (
                  <tr key={log.srNo}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {log.srNo}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {log.versionNo}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {log.approvalDate}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {log.descriptionOfChange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Introduction */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              1. Introduction
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.introduction ? llmContent.introduction : (
                `This Performance Monitoring Procedure establishes the framework for ${organizationName} to systematically monitor, measure, and evaluate the effectiveness of its Business Continuity Management System (BCMS) and related processes.`
              )}
            </p>
          </div>

          {/* Scope */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              2. Scope
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.scope ? llmContent.scope : (
                `This procedure applies to all aspects of the BCMS at ${organizationName}, including BCM plans, recovery strategies, crisis management procedures, and related business continuity activities. It covers all departments and critical business functions.`
              )}
            </p>
          </div>

          {/* Objective */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              3. Objective
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.objective ? llmContent.objective : (
                `The objective is to ensure continuous improvement of the BCMS through regular monitoring, measurement, analysis, and evaluation of key performance indicators (KPIs) that demonstrate the effectiveness and maturity of business continuity capabilities.`
              )}
            </p>
          </div>

          {/* Performance Indicators */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              4. Key Performance Indicators (KPIs)
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #000'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>KPI</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Measurement</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Target</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Plan Currency</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of plans reviewed within schedule</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>100%</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Exercise Completion</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of scheduled exercises completed</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>≥ 95%</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Training Attendance</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of staff completed BCM training</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>≥ 90%</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Semi-annually</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>RTO Achievement</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of processes meeting RTO in tests</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>≥ 95%</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Per exercise</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Incident Response Time</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Average time from alert to response</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>≤ 30 minutes</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Per incident</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Audit Findings Closure</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of findings closed within timeline</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>100%</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Monthly</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Monitoring Frequency */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              5. Monitoring Frequency
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #000'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Activity</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Frequency</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Responsible</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>KPI Data Collection</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Monthly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM Coordinator</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Performance Review Meeting</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM Team</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Management Review</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Semi-annually</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Senior Management</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Trend Analysis</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM Coordinator</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Dashboard Updates</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Real-time/Monthly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM Coordinator</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reporting Requirements */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              6. Reporting Requirements
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.reportingRequirements ? llmContent.reportingRequirements : (
                <>
                  Performance monitoring reports must be prepared quarterly and include:
                  <ul style={{ lineHeight: '1.8', marginTop: '10px' }}>
                    <li>Current KPI values and trend analysis</li>
                    <li>Comparison against targets and previous periods</li>
                    <li>Identification of variances and root causes</li>
                    <li>Corrective and preventive actions taken or planned</li>
                    <li>Recommendations for improvement</li>
                    <li>Executive summary for senior management</li>
                  </ul>
                  Reports must be submitted to the BCM Committee within 10 working days of period end.
                </>
              )}
            </p>
          </div>

          {/* Continuous Improvement */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              7. Continuous Improvement
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              Performance monitoring results must drive continuous improvement initiatives. Underperforming KPIs require formal action plans with assigned ownership, target completion dates, and progress tracking. The BCM Coordinator is responsible for maintaining an improvement register and reporting progress to senior management during semi-annual reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitoringProcedure;
