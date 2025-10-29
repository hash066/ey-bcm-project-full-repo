import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { generateLLMContent } from '../services/enhancedProcedureService';

/**
 * Training and Awareness Procedure Component
 * MODIFIED: Rebuilt with full procedure structure, no auth
 */
const TrainingAwarenessProcedure = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [organizationName, setOrganizationName] = useState('Your Organization');
  const [organizationId] = useState(1); // Hardcoded for testing

  const [documentInfo, setDocumentInfo] = useState({
    documentName: 'Training and Awareness Procedure',
    documentOwner: 'Training & Development Team',
    documentVersionNo: '1.0',
    documentVersionDate: new Date().toISOString().split('T')[0],
    preparedBy: 'Training & Development Team',
    reviewedBy: 'Head-HR',
    approvedBy: 'Training Committee'
  });

  const [changeLog, setChangeLog] = useState([
    {
      srNo: 1,
      versionNo: '1.0',
      approvalDate: '',
      descriptionOfChange: 'Initial version of Training and Awareness Procedure'
    }
  ]);

  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [llmContent, setLlmContent] = useState({
    introduction: '',
    scope: '',
    objective: '',
    methodology: '',
    trainingPrograms: [],
    awarenessActivities: [],
    competencyRequirements: ''
  });

  const [useLLMContent, setUseLLMContent] = useState(false);

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
        'training_awareness',
        organizationName,
        organizationId,
        [
          'introduction',
          'scope',
          'objective',
          'methodology',
          'training_programs',
          'awareness_activities',
          'competency_requirements'
        ]
      );

      if (data && data.llm_content) {
        setLlmContent({
          introduction: data.llm_content.introduction || '',
          scope: data.llm_content.scope || '',
          objective: data.llm_content.objective || '',
          methodology: data.llm_content.methodology || '',
          trainingPrograms: data.llm_content.training_programs || [],
          awarenessActivities: data.llm_content.awareness_activities || [],
          competencyRequirements: data.llm_content.competency_requirements || ''
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
    const element = document.getElementById('training-awareness-procedure-document');
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${organizationName}_Training_Awareness_Procedure.pdf`,
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
          <h1 style={{ color: '#FFD700', margin: 0 }}>Training and Awareness Procedure</h1>
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
        <div id="training-awareness-procedure-document" style={{
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
            <h2 style={{ color: '#000' }}>Training and Awareness Procedure</h2>
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
                `This Training and Awareness Procedure establishes the framework for ${organizationName} to ensure all personnel have the knowledge, skills, and awareness necessary to support effective Business Continuity Management (BCM) and maintain organizational resilience.`
              )}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>2. Scope</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.scope ? llmContent.scope : (
                `This procedure applies to all employees, contractors, and relevant stakeholders at ${organizationName}. It covers BCM training programs, awareness campaigns, competency assessments, and continuous education initiatives related to business continuity and organizational resilience.`
              )}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>3. Objective</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              {useLLMContent && llmContent.objective ? llmContent.objective : (
                `The objective is to build and maintain organizational competence in business continuity management, ensuring all personnel understand their roles and responsibilities during disruptions and can execute BCM plans effectively.`
              )}
            </p>
          </div>

          {/* Training Programs */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>4. Training Programs</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Training Type</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Target Audience</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Frequency</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>BCM Awareness</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>All employees</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Annual + Onboarding</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>1 hour</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>BCM Plan Training</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Recovery team members</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Semi-annually</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>3 hours</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Crisis Management</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Crisis Management Team</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>4 hours</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>BCM Coordinator</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM Team</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Annual + Certification</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>16+ hours</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>First Aid & Safety</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Floor wardens, safety team</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Annual</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>8 hours</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Training Content */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>5. Training Content Areas</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>BCM Fundamentals:</strong> Core concepts, terminology, and organizational BCM framework</li>
              <li><strong>Risk & Impact Assessment:</strong> Identifying threats, assessing impacts, and prioritizing responses</li>
              <li><strong>Plan Activation & Execution:</strong> Recognizing incidents, activating plans, and executing procedures</li>
              <li><strong>Roles & Responsibilities:</strong> Understanding individual and team responsibilities during disruptions</li>
              <li><strong>Communication Protocols:</strong> Internal and external communication procedures and escalation paths</li>
              <li><strong>Recovery Operations:</strong> Restoration strategies, workarounds, and return to normal operations</li>
              <li><strong>Tools & Systems:</strong> BCM software, communication platforms, and documentation systems</li>
            </ul>
          </div>

          {/* Awareness Activities */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>6. Awareness Activities</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Activity</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Description</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Email Campaigns</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM tips, reminders, and best practices</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Monthly</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Posters & Signage</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Emergency procedures, evacuation routes</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Permanent display</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>BCM Week</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Dedicated awareness week with events and activities</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Annual</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Intranet Content</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>BCM resources, FAQs, and documentation</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Continuous</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Lunch & Learns</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Informal sessions on BCM topics</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Quarterly</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Competency Assessment */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>7. Competency Assessment</h3>
            <div style={{ lineHeight: '1.6' }}>
              {useLLMContent && llmContent.competencyRequirements ? (
                <div dangerouslySetInnerHTML={{ __html: llmContent.competencyRequirements }} />
              ) : (
                <>
                  <p style={{ marginBottom: '10px' }}>
                    Training effectiveness is assessed through multiple methods:
                  </p>
                  <ul style={{ lineHeight: '1.8' }}>
                    <li><strong>Knowledge Tests:</strong> Pre and post-training assessments to measure learning outcomes</li>
                    <li><strong>Practical Exercises:</strong> Hands-on demonstrations of plan execution and recovery procedures</li>
                    <li><strong>Exercise Participation:</strong> Performance observation during drills and simulations</li>
                    <li><strong>Feedback Surveys:</strong> Participant evaluation of training quality and relevance</li>
                    <li><strong>Annual Competency Review:</strong> Formal assessment of BCM team members' skills and knowledge</li>
                  </ul>
                  <p style={{ marginTop: '15px' }}>
                    Minimum competency standards require 80% score on knowledge assessments and satisfactory performance in practical exercises. Personnel not meeting standards must complete remedial training within 30 days.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Training Records */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>8. Training Records and Reporting</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              All training and awareness activities must be documented in the Training Management System. Records include participant names, dates, topics covered, assessment scores, and training materials used. The Training Coordinator prepares quarterly reports showing training completion rates, competency assessment results, and gaps requiring attention. Target is 95% compliance with mandatory training requirements.
            </p>
          </div>

          {/* Continuous Improvement */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#000', borderBottom: '2px solid #FFD700', paddingBottom: '5px' }}>9. Continuous Improvement</h3>
            <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
              Training programs and awareness campaigns are reviewed annually based on participant feedback, exercise outcomes, actual incident experiences, and changes to the BCM framework. Lessons learned from real disruptions and test exercises are incorporated into training content to ensure relevance and effectiveness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingAwarenessProcedure;
