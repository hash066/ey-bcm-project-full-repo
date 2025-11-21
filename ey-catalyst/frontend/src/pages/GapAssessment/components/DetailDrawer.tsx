import { Control, GapAnalysis, DocumentationItem, ActionPlan, AuditTrailEntry, ClauseMapping } from '../types';
import { X, Upload, FileText, CheckCircle2, Circle, AlertCircle, Clock, User, Calendar, Download, Sparkles, Edit3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import ClauseEditModal from './ClauseEditModal';
import ClausePermissionModal from './ClausePermissionModal';
import ActionEditModal from './ActionEditModal';

interface DetailDrawerProps {
  control: Control | null;
  gapAnalysis: GapAnalysis | null;
  documentation: DocumentationItem[];
  actionPlans: ActionPlan[];
  auditTrail: AuditTrailEntry[];
  clauseMappings: ClauseMapping[];
  onClose: () => void;
  onFileUpload: (controlId: string, file: File) => void;
  onGenerateAIPlan: (controlId: string) => void;
  onGenerateRiskSummary: (controlId: string) => void;
  onGenerateEvidenceChecklist: (controlId: string) => void;
  onUpdateActionPlans: (newActionPlans: ActionPlan[]) => void;
}

export default function DetailDrawer({
  control,
  gapAnalysis,
  documentation,
  actionPlans,
  auditTrail,
  clauseMappings,
  onClose,
  onFileUpload,
  onGenerateAIPlan,
  onGenerateRiskSummary,
  onGenerateEvidenceChecklist,
  onUpdateActionPlans
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'gap' | 'documentation' | 'actions' | 'audit' | 'clauses'>('overview');
  const [aiFeatures, setAiFeatures] = useState({
    actionPlan: false,
    riskSummary: false,
    evidenceChecklist: false
  });

  // Clause editing states
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    clause: null as ClauseMapping | null
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    clause: null as ClauseMapping | null
  });

  // Action editing states
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    action: null as any
  });

  if (!control) return null;

  const gap = ((control.targetScore - control.currentScore) / control.targetScore) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && control) {
      onFileUpload(control.id, file);
    }
  };

  const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Find the file input and trigger click
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleApproveAction = (actionId: string) => {
    console.log('Approving action:', actionId);
    // Create a new action plan with approved status
    const newAction = {
      id: `approved-${actionId}`,
      controlId: control!.id,
      planType: 'immediate' as 'immediate' | 'short_term' | 'long_term',
      actionDescription: 'Convene emergency cross-functional workshop within 7 days to initiate rapid dependency mapping for top 5 critical functions', // This should come from the AI generated action
      timelineDays: 7,
      status: 'approved' as 'pending' | 'approved' | 'in_progress' | 'completed' | 'overdue',
      assignedTo: 'IT Department',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      aiGenerated: false
    };
    const newActionPlans = [...actionPlans, newAction];
    onUpdateActionPlans(newActionPlans);
  };

  const handleModifyAction = (actionId: string) => {
    console.log('Modifying action:', actionId);
    const actionToEdit = {
      actionDescription: 'Convene emergency cross-functional workshop within 7 days to initiate rapid dependency mapping for top 5 critical functions',
      assignedTo: 'IT Department',
      planType: 'immediate' as 'immediate' | 'short_term' | 'long_term',
      timelineDays: 7
    };
    setActionModal({ isOpen: true, action: actionToEdit });
  };

  const handleSaveAction = (actionData: Partial<ActionPlan>) => {
    console.log('Saving modified action:', actionData);
    const newAction = {
      ...actionData,
      id: `modified-${Date.now()}`,
      controlId: control!.id,
      status: 'approved' as 'pending' | 'approved' | 'in_progress' | 'completed' | 'overdue',
      aiGenerated: false,
      dueDate: new Date(Date.now() + (actionData.timelineDays || 7) * 24 * 60 * 60 * 1000).toISOString()
    } as ActionPlan;
    const newActionPlans = [...actionPlans, newAction];
    onUpdateActionPlans(newActionPlans);
    handleCloseActionModal();
  };

  const handleCloseActionModal = () => {
    setActionModal({ isOpen: false, action: null });
  };

  const handleEditClause = (clause: ClauseMapping) => {
    console.log('Opening permission modal for clause:', clause);
    setPermissionModal({ isOpen: true, clause });
  };

  const handlePermissionGranted = () => {
    console.log('Permission granted for clause:', permissionModal.clause);
    if (permissionModal.clause) {
      setPermissionModal({ isOpen: false, clause: null });
      setEditModal({ isOpen: true, clause: permissionModal.clause });
      console.log('Edit modal should now open with clause:', permissionModal.clause);
    }
  };

  const handleSaveClause = (clauseId: string, data: Partial<ClauseMapping>) => {
    console.log('Saving clause changes:', clauseId, data);
    // TODO: Implement API call to save changes
    // For now, just log and close modal
  };

  const handleClosePermissionModal = () => {
    setPermissionModal({ isOpen: false, clause: null });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, clause: null });
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      pending: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      approved: 'bg-blue-950/50 text-blue-400 border-blue-900',
      in_progress: 'bg-yellow-950/30 text-yellow-400 border-yellow-900',
      completed: 'bg-green-950/30 text-green-400 border-green-900',
      overdue: 'bg-red-950/50 text-red-400 border-red-900'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  };

  const getPlanTypeLabel = (type: string) => {
    const labels = {
      immediate: 'Immediate (0-30 days)',
      short_term: 'Short-term (30-90 days)',
      long_term: 'Long-term (90+ days)'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStrengthOrGapText = (compliancePercent: number) => {
    if (compliancePercent >= 90) return 'Strength';
    if (compliancePercent < 70) return 'Gap';
    return 'Neutral';
  };

  const getStrengthOrGapColor = (type: string) => {
    switch (type) {
      case 'Strength': return 'text-green-400 bg-green-950/30 border-green-900';
      case 'Gap': return 'text-red-400 bg-red-950/30 border-red-900';
      default: return 'text-yellow-400 bg-yellow-950/30 border-yellow-900';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="ml-auto w-full max-w-4xl bg-zinc-900 shadow-2xl relative flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-950/30 text-yellow-400 border border-yellow-900">
                {control.frameworkCode}
              </span>
              <span className="text-zinc-400 text-sm">{control.controlCode}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{control.controlName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-2 px-6 py-4 border-b border-zinc-800 bg-black overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'gap', label: 'Gap Analysis' },
            { id: 'documentation', label: 'Documentation' },
            { id: 'clauses', label: 'Clauses' },
            { id: 'actions', label: 'Action Plans' },
            { id: 'audit', label: 'Audit Trail' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <div className="text-zinc-400 text-sm mb-1">Current Score</div>
                  <div className="text-2xl font-bold text-yellow-400">{control.currentScore}%</div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <div className="text-zinc-400 text-sm mb-1">Target Score</div>
                  <div className="text-2xl font-bold text-green-400">{control.targetScore}%</div>
                </div>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <div className="text-zinc-400 text-sm mb-1">Gap</div>
                  <div className="text-2xl font-bold text-red-400">{gap.toFixed(0)}%</div>
                </div>
              </div>

              <div className="bg-black border border-zinc-800 rounded-lg p-5">
                <h3 className="text-yellow-400 font-semibold mb-3">Control Description</h3>
                <p className="text-zinc-300 leading-relaxed">{control.description}</p>
              </div>

              <div className="bg-black border border-zinc-800 rounded-lg p-5">
                <h3 className="text-yellow-400 font-semibold mb-3">Regulatory Context</h3>
                <p className="text-zinc-300 leading-relaxed">{control.regulatoryContext}</p>
              </div>

              <div className="bg-black border border-zinc-800 rounded-lg p-5">
                <h3 className="text-yellow-400 font-semibold mb-3">Business Rationale</h3>
                <p className="text-zinc-300 leading-relaxed">{control.businessRationale}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-yellow-400 font-semibold mb-3">Ownership</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-zinc-500 text-sm">Department</div>
                      <div className="text-white">{control.department}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-sm">Primary Owner</div>
                      <div className="text-white">{control.primaryOwner}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-sm">Contact</div>
                      <div className="text-white">{control.ownerContact}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-yellow-400 font-semibold mb-3">Recovery Objectives</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-zinc-500 text-sm">RTO (Recovery Time Objective)</div>
                      <div className="text-white">{control.rtoHours} hours</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-sm">RPO (Recovery Point Objective)</div>
                      <div className="text-white">{control.rpoHours} hours</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-sm">Business Impact</div>
                      <div className="text-white">{control.businessImpact}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gap' && gapAnalysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-yellow-400">AI-Powered Risk Analysis</h3>
                <button
                  onClick={() => {
                    setAiFeatures({ ...aiFeatures, riskSummary: !aiFeatures.riskSummary });
                    if (!aiFeatures.riskSummary) onGenerateRiskSummary(control.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    aiFeatures.riskSummary
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {aiFeatures.riskSummary ? 'AI Enabled' : 'Enable AI'}
                </button>
              </div>

              {aiFeatures.riskSummary && (
                <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-2">AI Risk Summary</h4>
                      <p className="text-zinc-300 leading-relaxed">
                        This control gap presents a <strong>HIGH</strong> risk to operational resilience. The 15% gap in critical business function identification
                        could result in incomplete recovery strategies, affecting the organization's ability to respond effectively to disruptions.
                        <br /><br />
                        <strong>Compliance Impact:</strong> Failure to complete dependency mapping violates RBI guidelines section 7.2.1, potentially
                        resulting in regulatory scrutiny. Cross-framework analysis shows similar requirements in ISO 22301 clause 8.2.3.
                        <br /><br />
                        <strong>Business Risk:</strong> Without complete dependency documentation, recovery priorities may be misaligned, leading to
                        extended downtime of critical services and potential financial losses estimated at $50K-$200K per hour of disruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-black border border-zinc-800 rounded-lg p-5">
                <h3 className="text-yellow-400 font-semibold mb-3">Gap Description</h3>
                <p className="text-zinc-300 leading-relaxed">{gapAnalysis.gapDescription}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Existing Artifacts ({gapAnalysis.existingArtifacts?.length || 0})
                  </h3>
                  <ul className="space-y-2">
                    {(gapAnalysis.existingArtifacts || []).map((artifact, index) => (
                      <li key={index} className="flex items-start gap-3 text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                        {artifact}
                      </li>
                    ))}
                    {(gapAnalysis.existingArtifacts?.length === 0 || !gapAnalysis.existingArtifacts) && (
                      <li className="text-zinc-500 text-sm">No existing artifacts documented</li>
                    )}
                  </ul>
                </div>

                <div className="bg-black border border-zinc-800 rounded-lg p-5">
                  <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Missing Artifacts ({gapAnalysis.missingArtifacts?.length || 0})
                  </h3>
                  {(gapAnalysis.missingArtifacts?.length || 0) > 0 ? (
                    <ul className="space-y-2">
                      {gapAnalysis.missingArtifacts.map((artifact, index) => (
                        <li key={index} className="flex items-start gap-3 text-zinc-300">
                          <Circle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                          {artifact}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 text-sm">No missing artifacts identified</p>
                  )}
                </div>
              </div>

              <div className="bg-black border border-zinc-800 rounded-lg p-5">
                <h3 className="text-yellow-400 font-semibold mb-3">Required Actions</h3>
                <ul className="space-y-2">
                  {gapAnalysis.requiredActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-3 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'documentation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-yellow-400">Documentation Checklist</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAiFeatures({ ...aiFeatures, evidenceChecklist: !aiFeatures.evidenceChecklist });
                      if (!aiFeatures.evidenceChecklist) onGenerateEvidenceChecklist(control.id);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      aiFeatures.evidenceChecklist
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Checklist
                  </button>
                  <label className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload File
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {aiFeatures.evidenceChecklist && (
                <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-3">AI-Generated Evidence Requirements</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                          <span className="text-zinc-300">Dependency Mapping Spreadsheet (Excel/CSV)</span>
                          <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">Quick Upload</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                          <span className="text-zinc-300">Technology Stack Documentation (PDF)</span>
                          <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">Quick Upload</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black rounded-lg">
                          <span className="text-zinc-300">Board Meeting Minutes with Approvals (PDF)</span>
                          <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">Quick Upload</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {documentation.map((doc) => (
                  <div key={doc.id} className="bg-black border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {doc.isUploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-zinc-400" />
                          <span className="text-white font-medium">{doc.documentName}</span>
                          {doc.isRequired && (
                            <span className="text-xs text-red-400">(Required)</span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-500">{doc.documentType}</div>
                      </div>
                    </div>
                    {doc.isUploaded ? (
                      <div className="text-sm text-zinc-400">
                        Uploaded {new Date(doc.uploadedAt!).toLocaleDateString()}
                      </div>
                    ) : (
                      <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>
                    {documentation.filter(d => d.isUploaded).length} of {documentation.length} documents uploaded
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clauses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-yellow-400">Clause-wise Analysis</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-yellow-950/50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700 whitespace-nowrap">Clause</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700">Requirement</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700">Observation</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700 whitespace-nowrap">Compliance %</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700 whitespace-nowrap">Key Strength/Gap</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400 border-b border-zinc-700">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clauseMappings.map((mapping, index) => (
                      <tr key={mapping.id} className={`${index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-zinc-900/10'} hover:bg-zinc-800/30 transition-colors`}>
                        <td className="px-4 py-3 border-b border-zinc-800 text-sm font-mono text-yellow-400">
                          {mapping.clause}
                        </td>
                        <td className="px-4 py-3 border-b border-zinc-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-white text-sm leading-relaxed">{mapping.requirement}</p>
                            </div>
                            <button
                              onClick={() => handleEditClause(mapping)}
                              className="flex items-center gap-1 mt-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs rounded transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-zinc-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-white text-sm leading-relaxed">{mapping.observation}</p>
                            </div>
                            <button
                              onClick={() => handleEditClause(mapping)}
                              className="flex items-center gap-1 mt-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs rounded transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-zinc-800">
                          <span className="text-zinc-400 text-sm text-center block bg-zinc-800/50 px-3 py-2 rounded border border-zinc-700">
                            {mapping.compliancePercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-zinc-800">
                          <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium border ${getStrengthOrGapColor(mapping.keyStrengthOrGap)} bg-zinc-800/50`}>
                            {mapping.keyStrengthOrGap}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-zinc-800">
                          <span className="text-zinc-400 text-sm inline-flex items-center px-3 py-2 rounded border border-zinc-700 bg-zinc-800/50 w-full justify-center">
                            {mapping.difficulty}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {clauseMappings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                          No clause mappings available for this control
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-yellow-400">Remediation Action Plans</h3>
                <button
                  onClick={() => {
                    setAiFeatures({ ...aiFeatures, actionPlan: !aiFeatures.actionPlan });
                    if (!aiFeatures.actionPlan) onGenerateAIPlan(control.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    aiFeatures.actionPlan
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {aiFeatures.actionPlan ? 'AI Enabled' : 'Generate AI Plan'}
                </button>
              </div>

              {aiFeatures.actionPlan && (
                <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-semibold mb-3">AI-Generated Prioritized Action Plan</h4>
                      <div className="space-y-3">
                        <div className="bg-black rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-yellow-400">IMMEDIATE PRIORITY</span>
                            <span className="text-xs text-zinc-500">Impact Score: 9.2/10</span>
                          </div>
                          <p className="text-zinc-300 mb-2">Convene emergency cross-functional workshop within 7 days to initiate rapid dependency mapping for top 5 critical functions</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveAction('ai-generated-action-1')}
                              className="text-xs bg-green-950/50 text-green-400 border border-green-900 px-3 py-1 rounded-full hover:bg-green-900/50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleModifyAction('ai-generated-action-1')}
                              className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full hover:bg-zinc-700 transition-colors"
                            >
                              Modify
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {['immediate', 'short_term', 'long_term'].map((planType) => {
                const plans = actionPlans.filter(p => p.planType === planType);
                if (plans.length === 0) return null;

                return (
                  <div key={planType} className="bg-black border border-zinc-800 rounded-lg p-5">
                    <h4 className="text-yellow-400 font-semibold mb-4">{getPlanTypeLabel(planType)}</h4>
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-white flex-1">{plan.actionDescription}</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ml-3 ${getStatusBadge(plan.status)}`}>
                              {plan.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-zinc-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Assigned to
                              </div>
                              <div className="text-zinc-300">{plan.assignedTo}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due Date
                              </div>
                              <div className="text-zinc-300">{new Date(plan.dueDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Timeline
                              </div>
                              <div className="text-zinc-300">{plan.timelineDays} days</div>
                            </div>
                          </div>
                          {plan.aiGenerated && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                              <Sparkles className="w-3 h-3" />
                              AI Generated
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-yellow-400">Audit Trail & History</h3>
                <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              {auditTrail.map((entry) => (
                <div key={entry.id} className="bg-black border border-zinc-800 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-950/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{entry.reviewerName}</div>
                        <div className="text-sm text-zinc-400">{entry.reviewerEmail}</div>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="ml-13 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
                        {entry.actionType.toUpperCase()}
                      </span>
                      <span className="text-white font-medium">{entry.actionDescription}</span>
                    </div>

                    {entry.comments && (
                      <p className="text-zinc-300 leading-relaxed">{entry.comments}</p>
                    )}

                    {entry.previousValue && entry.newValue && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">Changed from</span>
                        <span className="text-red-400">{entry.previousValue}</span>
                        <span className="text-zinc-500">to</span>
                        <span className="text-green-400">{entry.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ClausePermissionModal
        isOpen={permissionModal.isOpen}
        onClose={handleClosePermissionModal}
        onGranted={handlePermissionGranted}
        userRole="Editor"
      />

      <ClauseEditModal
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        clause={editModal.clause}
        onSave={handleSaveClause}
      />

      <ActionEditModal
        isOpen={actionModal.isOpen}
        onClose={handleCloseActionModal}
        action={actionModal.action}
        onSave={handleSaveAction}
      />
    </div>
  );
}
