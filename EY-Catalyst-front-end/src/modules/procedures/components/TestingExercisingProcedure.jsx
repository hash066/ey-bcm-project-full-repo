import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { generateLLMContent } from '../services/enhancedProcedureService';

/**
 * Testing and Exercising Procedure Component
 * MODIFIED: Auth bypassed, using hardcoded org ID
 */
const TestingExercisingProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId] = useState(1); // Hardcoded for testing

  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'Testing and Exercising Procedure',
    documentOwner: 'BCM Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'BCM Team',
    reviewedBy: 'Head-ORMD',
    approvedBy: 'ORMC - Operational Risk Management Committee'
  });

  const [changeLog, setChangeLog] = useState([
    {
      srNo: 1,
      versionNo: '1.0',
      approvalDate: '',
      descriptionOfChange: 'Initial version of Testing and Exercising Procedure'
    }
  ]);

  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    testingTypes: [],
    exerciseSchedule: {},
    evaluationCriteria: []
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
        'testing_exercising',
        organizationName,
        organizationId,
        [
          'introduction',
          'scope',
          'objective',
          'methodology',
          'testing_types',
          'exercise_schedule',
          'evaluation_criteria'
        ]
      );

      if (data && data.llm_content) {
        setLlmContent({
          introduction: data.llm_content.introduction || '',
          scope: data.llm_content.scope || '',
          objective: data.llm_content.objective || '',
          methodology: data.llm_content.methodology || '',
          testingTypes: data.llm_content.testing_types || [],
          exerciseSchedule: data.llm_content.exercise_schedule || {},
          evaluationCriteria: data.llm_content.evaluation_criteria || []
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
    const element = document.getElementById('testing-exercising-procedure-document');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_Testing_Exercising_Procedure.pdf`,
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
          <h1 style={{ color: '#FFD700', margin: 0 }}>Testing and Exercising Procedure</h1>
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
          id="testing-exercising-procedure-document"
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
            <h2 style={{ color: '#000' }}>Testing and Exercising Procedure</h2>
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
                `This Testing and Exercising Procedure establishes a systematic approach for ${organizationName} to validate and improve its Business Continuity Management (BCM) capabilities through regular testing and exercises.`
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
                `This procedure applies to all business continuity plans, disaster recovery plans, and crisis management procedures developed by ${organizationName}. It covers all departments and critical business functions.`
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
                `The objective is to ensure all BCM plans and procedures are regularly tested, validated, and improved through structured exercises that simulate real disruption scenarios.`
              )}
            </p>
          </div>

          {/* Testing Types */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              4. Testing Types
            </h3>
            {useLLMContent && llmContent.testingTypes && llmContent.testingTypes.length > 0 ? (
              llmContent.testingTypes.map((test, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <p style={{ lineHeight: '1.6', margin: '5px 0' }}>
                    <strong>{test.type || `Test ${index + 1}`}:</strong> {test.description}
                  </p>
                  <p style={{ lineHeight: '1.6', margin: '5px 0', fontSize: '14px', color: '#333' }}>
                    <em>Frequency: {test.frequency} | Participants: {test.participants}</em>
                  </p>
                </div>
              ))
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ lineHeight: '1.6', margin: '5px 0' }}>
                    <strong>Desktop/Tabletop Exercises:</strong> Discussion-based sessions where team members walk through scenarios and response procedures without actual system activation.
                  </p>
                  <p style={{ lineHeight: '1.6', margin: '5px 0', fontSize: '14px', color: '#333' }}>
                    <em>Frequency: Quarterly | Participants: BCM Team, Department Heads</em>
                  </p>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ lineHeight: '1.6', margin: '5px 0' }}>
                    <strong>Functional Tests:</strong> Targeted testing of specific systems, processes, or recovery capabilities to validate individual components of BCM plans.
                  </p>
                  <p style={{ lineHeight: '1.6', margin: '5px 0', fontSize: '14px', color: '#333' }}>
                    <em>Frequency: Semi-annually | Participants: IT Team, Operations Team</em>
                  </p>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ lineHeight: '1.6', margin: '5px 0' }}>
                    <strong>Full-Scale Simulations:</strong> Comprehensive exercises that replicate real disruption scenarios, involving all relevant teams and stakeholders.
                  </p>
                  <p style={{ lineHeight: '1.6', margin: '5px 0', fontSize: '14px', color: '#333' }}>
                    <em>Frequency: Annually | Participants: All Departments, Senior Management</em>
                  </p>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ lineHeight: '1.6', margin: '5px 0' }}>
                    <strong>Post-Incident Reviews:</strong> Structured analysis of actual incidents to identify lessons learned and improvement opportunities.
                  </p>
                  <p style={{ lineHeight: '1.6', margin: '5px 0', fontSize: '14px', color: '#333' }}>
                    <em>Frequency: After each incident | Participants: Incident Response Team</em>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Exercise Schedule */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              5. Exercise Schedule
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #000'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Exercise Type</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Frequency</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Duration</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Desktop Exercise</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>2-3 hours</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Department level</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Functional Test</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Semi-annually</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>4-6 hours</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>System/Process specific</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Full-Scale Simulation</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Annually</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Full day</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Organization-wide</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Post-Incident Review</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>As needed</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>2-4 hours</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Incident-specific</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Evaluation Criteria */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              6. Evaluation Criteria
            </h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #000'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Criteria</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Measurement</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Target</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Response Time</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Time from incident to activation</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Within RTO limits</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Plan Effectiveness</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>% of objectives achieved</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>≥ 90%</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Team Coordination</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Communication effectiveness</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Excellent rating</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Resource Adequacy</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Availability when needed</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>100%</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Documentation</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Completeness and accuracy</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Review and Improvement */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>
              7. Review and Continuous Improvement
            </h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              All exercises must be followed by a comprehensive debrief session within 48 hours. Findings and improvement recommendations should be documented and tracked through to implementation. The BCM Coordinator is responsible for ensuring corrective actions are completed within agreed timelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingExercisingProcedure;
