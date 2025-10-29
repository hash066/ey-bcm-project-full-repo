import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { generateLLMContent } from '../services/enhancedProcedureService';

/**
 * Risk Assessment Procedure Component
 * MODIFIED: Auth bypassed, using hardcoded org ID
 */
const RiskAssessmentProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [criticalityThreshold, setCriticalityThreshold] = useState('12');
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId] = useState(1); // Hardcoded for testing
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    riskIdentification: [],
    riskAssessmentMatrix: {},
    mitigationStrategies: []
  });

  const [useLLMContent, setUseLLMContent] = useState(false);

  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'Risk Assessment Procedure',
    documentOwner: 'Risk Management Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'Risk Management Team',
    reviewedBy: 'Head-Risk Management',
    approvedBy: 'Risk Management Committee'
  });

  const [changeLog, setChangeLog] = useState([
    {
      srNo: 1,
      versionNo: '1.0',
      approvalDate: '',
      descriptionOfChange: 'Initial version of Risk Assessment Procedure'
    }
  ]);

  useEffect(() => {
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
        'risk_assessment',
        organizationName,
        organizationId,
        [
          'introduction',
          'scope',
          'objective',
          'methodology',
          'risk_identification',
          'risk_assessment_matrix',
          'mitigation_strategies'
        ],
        criticalityThreshold
      );

      if (data && data.llm_content) {
        setLlmContent({
          introduction: data.llm_content.introduction || '',
          scope: data.llm_content.scope || '',
          objective: data.llm_content.objective || '',
          methodology: data.llm_content.methodology || '',
          riskIdentification: data.llm_content.risk_identification || [],
          riskAssessmentMatrix: data.llm_content.risk_assessment_matrix || {},
          mitigationStrategies: data.llm_content.mitigation_strategies || []
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
    const element = document.getElementById('risk-assessment-procedure-document');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_Risk_Assessment_Procedure.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#FFD700' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#ff4444' }}>Error: {error}</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#181818', color: '#ffffff', padding: '20px' }}>
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
          <h1 style={{ color: '#FFD700', margin: 0 }}>Risk Assessment Procedure</h1>
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
          {llmError && <div style={{ color: '#ff4444', marginTop: '10px' }}>{llmError}</div>}
        </div>

        {/* Document Content */}
        <div id="risk-assessment-procedure-document" style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '40px',
          borderRadius: '5px'
        }}>
          {/* Document Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#000', borderBottom: '3px solid #FFD700', paddingBottom: '10px' }}>
              {organizationName}
            </h1>
            <h2 style={{ color: '#000' }}>Risk Assessment Procedure</h2>
          </div>

          {/* Document Info Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '30%' }}>Document Name</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.documentName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Document Owner</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.documentOwner}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Version No.</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.documentVersionNo}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Version Date</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.documentVersionDate}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Prepared By</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.preparedBy}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Reviewed By</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.reviewedBy}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Approved By</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{documentInfo.approvedBy}</td>
              </tr>
            </tbody>
          </table>

          {/* Change Log */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>Change Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #000' }}>
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
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{log.srNo}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{log.versionNo}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{log.approvalDate}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{log.descriptionOfChange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Content Sections */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>1. Introduction</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.introduction ? llmContent.introduction : (
                `This Risk Assessment Procedure establishes the framework for ${organizationName} to systematically identify, analyze, evaluate, and treat risks that could disrupt critical business operations and threaten organizational resilience.`
              )}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>2. Scope</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.scope ? llmContent.scope : (
                `This procedure applies to all risk assessments conducted for business continuity planning purposes at ${organizationName}, covering operational, technological, environmental, human, and external risks that could impact critical business functions.`
              )}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>3. Objective</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.objective ? llmContent.objective : (
                `The objective is to ensure comprehensive and consistent risk assessment across all business areas, enabling informed decision-making for risk treatment strategies and business continuity planning priorities.`
              )}
            </p>
          </div>

          {/* Risk Assessment Matrix */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>4. Risk Assessment Matrix</h3>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              Risk Level = Likelihood × Impact (on scale of 1-5)
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Risk Score</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Risk Level</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Action Required</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Management Level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>20-25</td>
                  <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#ff4444', color: '#fff', fontWeight: 'bold' }}>Critical</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Immediate action required</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Senior Management</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>15-19</td>
                  <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#ff9944', color: '#fff', fontWeight: 'bold' }}>High</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Action within 30 days</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Department Head</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>10-14</td>
                  <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#ffdd44', fontWeight: 'bold' }}>Medium</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Action within 90 days</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Process Owner</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>5-9</td>
                  <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#99dd44', fontWeight: 'bold' }}>Low</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Routine monitoring</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Team Lead</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1-4</td>
                  <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#44dd44', color: '#fff', fontWeight: 'bold' }}>Minimal</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Accept risk</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Team Lead</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Risk Identification */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>5. Risk Identification Categories</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Operational Risks:</strong> Process failures, supply chain disruptions, resource unavailability</li>
              <li><strong>Technological Risks:</strong> System failures, cyber attacks, data breaches, infrastructure failures</li>
              <li><strong>Environmental Risks:</strong> Natural disasters, pandemics, climate events</li>
              <li><strong>Human Risks:</strong> Key person dependency, skill gaps, labor disputes</li>
              <li><strong>External Risks:</strong> Regulatory changes, market disruptions, geopolitical events</li>
              <li><strong>Reputational Risks:</strong> Brand damage, customer confidence loss, media crises</li>
            </ul>
          </div>

          {/* Risk Treatment Strategies */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>6. Risk Treatment Strategies</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Strategy</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Description</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>When to Use</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Avoid</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Eliminate the risk by discontinuing the activity</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Critical/High risks with viable alternatives</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Mitigate</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Implement controls to reduce likelihood or impact</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>High/Medium risks where prevention is possible</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Transfer</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Shift risk to third party (insurance, outsourcing)</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Risks with significant financial impact</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Accept</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Acknowledge and monitor the risk without action</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Low/Minimal risks within risk appetite</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Review Frequency */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>7. Review and Update Frequency</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              Risk assessments must be reviewed and updated annually as a minimum, or immediately following significant organizational changes, major incidents, or when new threats emerge. The Risk Management Team is responsible for coordinating assessments and maintaining the risk register.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentProcedure;
