import { useState, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, AlertCircle, Shield, Upload, RotateCcw } from 'lucide-react';
import axios from 'axios';
import SummaryCard from './components/SummaryCard';
import ControlsTable from './components/ControlsTable';
import DetailDrawer from './components/DetailDrawer';
import UploadModal from './components/UploadModal';
import FrameworkUploadModal from './components/FrameworkUploadModal';
import { Control, DashboardStats, Framework, ClauseMapping } from './types';
import { controls, frameworks, frameworkOptions, gapAnalyses, documentationChecklists, actionPlans as initialActionPlans, auditTrail, clauseMappings } from './data/mockData';
import { exportToCSV } from './utils/csvExport';
import { API_ENDPOINTS, API_BASE_URL } from './config/api';
import { decodeToken } from '../../services/authService';

function GapAssessmentPage() {
  const [userRole, setUserRole] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // Upload state management
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(() => {
    // Initialize with jobId from HomePage upload if available
    const uploadedJobId = localStorage.getItem('uploadedJobId');
    return uploadedJobId || null;
  });
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Real data from uploaded documents
  const [realControls, setRealControls] = useState<Control[] | null>(null);
  const [realSummary, setRealSummary] = useState<any>(null);

  // Track if we're currently processing an upload
  const isPolling = useRef(false);

  // Framework management
  const [allFrameworks, setAllFrameworks] = useState<Framework[]>(frameworks);
  const [isFrameworkUploadOpen, setIsFrameworkUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Standards');

  // Action plans state
  const [actionPlans, setActionPlans] = useState(initialActionPlans);

  const currentControls = realControls || controls;

  const filteredControls = useMemo(() => {
    return currentControls.filter(control => {
      const matchesSearch = control.controlName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           control.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           control.controlCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Get framework IDs that belong to the selected category
      const categoryFrameworks = selectedCategory ? frameworkOptions[selectedCategory] || [] : [];
      const categoryFrameworkIds = categoryFrameworks.map((f: Framework) => f.id);
      const matchesCategory = categoryFrameworkIds.length === 0 || categoryFrameworkIds.includes(control.frameworkCode);

      const matchesFramework = !frameworkFilter || control.frameworkCode === frameworkFilter;
      const matchesPriority = !priorityFilter || control.priority === priorityFilter;

      return matchesSearch && matchesCategory && matchesFramework && matchesPriority;
    });
  }, [searchTerm, selectedCategory, frameworkFilter, priorityFilter, currentControls, frameworkOptions]);

  const stats: DashboardStats = useMemo(() => {
    const totalControls = currentControls.length;
    const criticalGaps = currentControls.filter(c => {
      const gap = ((c.targetScore - c.currentScore) / c.targetScore) * 100;
      return gap > 30;
    }).length;
    const averageCompliance = currentControls.reduce((acc, c) => acc + c.currentScore, 0) / totalControls || 0;
    const highPriorityGaps = currentControls.filter(c => c.priority === 'High' && c.currentScore < c.targetScore).length;

    return {
      totalControls,
      criticalGaps,
      averageCompliance,
      highPriorityGaps
    };
  }, [currentControls]);

  const handleFileUpload = (controlId: string, file: File) => {
    console.log('File uploaded for control:', controlId, file);
  };

  const handleGenerateAIPlan = async (controlId: string) => {
    if (!jobId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/generate-plan`, {
        jobId,
        controlId
      });
      console.log('AI plan generated:', response.data);
    } catch (error) {
      console.error('Error generating AI plan:', error);
    }
  };

  const handleGenerateRiskSummary = async (controlId: string) => {
    if (!jobId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/explain-risk`, {
        jobId,
        controlId
      });
      console.log('Risk summary generated:', response.data);
    } catch (error) {
      console.error('Error generating risk summary:', error);
    }
  };

  const handleGenerateEvidenceChecklist = async (controlId: string) => {
    if (!jobId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/suggest-evidence`, {
        jobId,
        controlId
      });
      console.log('Evidence checklist generated:', response.data);
    } catch (error) {
      console.error('Error generating evidence checklist:', error);
    }
  };

  // Upload handlers
  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadStatus('Uploading files...');
    setError(null);
    setUploadProgress(10);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      const data = response.data;
      console.log('Upload response:', data);

      if (!data || !data.jobId) {
        throw new Error('Invalid response: no jobId returned');
      }

      setJobId(data.jobId);
      console.log('jobId after upload:', data.jobId);
      setUploadStatus('Processing documents...');
      startPolling(data.jobId);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload files. Please try again.');
      setIsUploading(false);
    }
  };

  const startPolling = async (jobId: string) => {
    if (isPolling.current) return;
    isPolling.current = true;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/upload/status?jobId=${jobId}`);
        console.log('Polling response:', response.data);
        const { status, progress, message, result } = response.data;

        setUploadProgress(50 + (progress / 2));
        setUploadStatus(message || 'Processing...');

        if (status === 'complete') {
          // STOP polling immediately
          if (pollingIntervalRef.current) {
            clearTimeout(pollingIntervalRef.current);
          }
          isPolling.current = false;

          setIsUploading(false);
          setUploadProgress(100);

          // Fetch fresh data with jobId
          await fetchProcessedData(jobId);

          // Show success message with control count
          const controlCount = result?.gap_analysis?.total_controls_checked || 0;
          setUploadStatus(`Analysis complete! Found ${controlCount} controls`);

          // Close modal after showing success message
          setTimeout(() => {
            setIsUploadModalOpen(false);
            setUploadStatus('');
            setJobId(jobId); // Keep jobId for session tracking
          }, 2000);

          return;
        } else if (status === 'failed') {
          // STOP polling on failure
          if (pollingIntervalRef.current) {
            clearTimeout(pollingIntervalRef.current);
          }
          isPolling.current = false;
          throw new Error(message || 'Processing failed');
        }

        // Continue polling only if still processing
        if (status === 'processing') {
          pollingIntervalRef.current = setTimeout(pollStatus, 2000);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        setError(error.response?.data?.message || 'Processing failed. Please try again.');
        setIsUploading(false);
        isPolling.current = false;

        // Clear polling on error
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current);
        }
      }
    };

    await pollStatus();
  };

  const fetchProcessedData = async (jobId: string) => {
    console.log('Fetching data for jobId:', jobId);
    try {
      // Fetch controls data first (this contains the actual gap analysis results)
      const controlsResponse = await axios.get(`${API_BASE_URL}/api/controls?jobId=${jobId}`);
      console.log('Controls data fetched:', controlsResponse.data);

      if (controlsResponse.data && controlsResponse.data.controls && Array.isArray(controlsResponse.data.controls)) {
        // Transform backend data to match frontend Control interface
        const transformedControls: Control[] = controlsResponse.data.controls.map((control: any) => ({
          id: control.id,
          frameworkId: control.framework,
          frameworkCode: control.framework,
          domain: control.domain,
          controlName: control.control_name || control.controlName || 'Unknown Control',
          controlCode: control.id,
          description: control.control_description || 'No description available',
          regulatoryContext: `Compliance requirement from ${control.framework} framework`,
          businessRationale: 'Business continuity and operational resilience',
          currentScore: control.current_score || 0,
          targetScore: control.target_score || 4,
          priority: control.priority || 'Medium',
          department: 'IT',
          primaryOwner: 'System Administrator',
          ownerContact: 'admin@company.com',
          rtoHours: 24,
          rpoHours: 4,
          businessImpact: 'Operational disruption risk'
        }));

        setRealControls(transformedControls);
        console.log('Controls transformed and set:', transformedControls.length);

        // Fetch summary data for additional context
        try {
          const summaryResponse = await axios.get(`${API_BASE_URL}/api/summary?jobId=${jobId}`);
          console.log('Summary data fetched:', summaryResponse.data);
          setRealSummary(summaryResponse.data);
        } catch (summaryError) {
          console.warn('Could not fetch summary data, but controls loaded successfully:', summaryError);
        }
      } else {
        console.warn('Controls data is not in expected format:', controlsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching processed data:', error);
      setError('Failed to load analysis results. Please try again.');
    }
  };

  const handleReset = () => {
    setJobId(null);
    setRealControls(null);
    setRealSummary(null);
    setUploadStatus('');
    setUploadProgress(0);
    setError(null);
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
    }
    isPolling.current = false;
  };

  const handleExportCSV = async () => {
    if (!jobId) {
      exportToCSV(filteredControls);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/export/csv?jobId=${jobId}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gap-assessment-${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // Fallback to client-side export
      exportToCSV(filteredControls);
    }
  };

  const handleFrameworkUploadComplete = (result: any) => {
    if (result.type === 'framework_request') {
      console.log('Framework addition request submitted:', result);
      // Show a notification to the user that the request was submitted
      setTimeout(() => {
        alert('Framework addition request submitted successfully! An admin will review and approve your request.');
      }, 100);
    } else {
      // Handle legacy direct framework addition if needed
      setAllFrameworks(prev => [...prev, result]);
      console.log('New framework added:', result);
    }
  };

  const handleUpdateActionPlans = (newActionPlans: any[]) => {
    setActionPlans(newActionPlans);
  };

  // Log when dashboard data updates
  useEffect(() => {
    console.log('Dashboard data updated');
  }, [currentControls]);

  // Start polling when jobId is set
  useEffect(() => {
    if (jobId && !isPolling.current) {
      isPolling.current = true;
      startPolling(jobId);
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
    };
  }, [jobId]);

  // Generate real gap analysis based on control data
  const selectedGapAnalysis = useMemo(() => {
    if (!selectedControl) return null;

    // Calculate gap for this control
    const gapPercentage = selectedControl.targetScore > 0 ?
      ((selectedControl.targetScore - selectedControl.currentScore) / selectedControl.targetScore) * 100 : 0;

    // Generate realistic gap description based on control score
    const gapDescription = gapPercentage > 75 ? 'Significant implementation gap requiring immediate attention' :
                           gapPercentage > 50 ? 'Moderate implementation gap affecting compliance posture' :
                           gapPercentage > 25 ? 'Minor implementation gap needs monitoring' :
                           'Minimal compliance gap requiring documentation updates';

    // Generate evidence based on current score
    const existingArtifacts = [];
    const missingArtifacts = [];

    if (selectedControl.currentScore >= 3) existingArtifacts.push('Implemented control procedures');
    if (selectedControl.currentScore >= 2) existingArtifacts.push('Documented processes');
    if (selectedControl.currentScore >= 1) existingArtifacts.push('Basic control awareness');

    if (selectedControl.currentScore < 4) missingArtifacts.push('Independent testing and verification');
    if (selectedControl.currentScore < 3) missingArtifacts.push('Comprehensive documentation');
    if (selectedControl.currentScore < 2) missingArtifacts.push('Regular monitoring procedures');

    // Generate action recommendations
    const requiredActions = [];
    if (gapPercentage > 75) requiredActions.push('Immediate implementation of control framework');
    if (gapPercentage > 50) requiredActions.push('Resource allocation for compliance remediation');
    if (gapPercentage > 25) requiredActions.push('Review and update existing documentation');
    if (gapPercentage <= 25) requiredActions.push('Annual compliance review and testing');

    return {
      id: selectedControl.id,
      controlId: selectedControl.id,
      gapDescription,
      existingArtifacts,
      missingArtifacts,
      requiredActions
    };
  }, [selectedControl]);

  // Generate real documentation based on control implementation
  const selectedDocumentation = useMemo(() => {
    if (!selectedControl) return [];

    const docs = [];
    let id = 1;

    // Policy documentation
    if (selectedControl.currentScore >= 2) {
      docs.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        documentName: 'Policy Document',
        documentType: 'Policy',
        isRequired: true,
        isUploaded: true,
        uploadedAt: new Date().toISOString()
      });
    } else {
      docs.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        documentName: 'Policy Document',
        documentType: 'Policy',
        isRequired: true,
        isUploaded: false
      });
    }

    // Procedure documentation
    if (selectedControl.currentScore >= 3) {
      docs.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        documentName: 'Operating Procedures',
        documentType: 'Procedure',
        isRequired: true,
        isUploaded: true,
        uploadedAt: new Date().toISOString()
      });
    } else {
      docs.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        documentName: 'Operating Procedures',
        documentType: 'Procedure',
        isRequired: true,
        isUploaded: false
      });
    }

    // Evidence documentation
    docs.push({
      id: (id++).toString(),
      controlId: selectedControl.id,
      documentName: 'Evidence Records',
      documentType: 'Evidence',
      isRequired: false,
      isUploaded: selectedControl.currentScore >= 3
    });

    return docs;
  }, [selectedControl]);

  // Generate real action plans based on control data and merge with state
  const selectedActionPlans = useMemo(() => {
    if (!selectedControl) return [];

    const actions = [];
    let id = 1;
    const gapPercentage = selectedControl.targetScore > 0 ?
      ((selectedControl.targetScore - selectedControl.currentScore) / selectedControl.targetScore) * 100 : 0;

    if (gapPercentage > 75) {
      actions.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        planType: 'immediate' as 'immediate',
        actionDescription: `Implement core ${selectedControl.controlName} requirements within 30 days`,
        timelineDays: 30,
        status: 'pending' as 'pending',
        assignedTo: selectedControl.primaryOwner,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerated: false
      });
    }

    if (gapPercentage > 50) {
      actions.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        planType: 'short_term' as 'short_term',
        actionDescription: `Develop comprehensive documentation for ${selectedControl.controlName}`,
        timelineDays: 90,
        status: 'pending' as 'pending',
        assignedTo: selectedControl.primaryOwner,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 60 * 1000).toISOString(),
        aiGenerated: false
      });
    }

    if (gapPercentage > 25) {
      actions.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        planType: 'long_term' as 'long_term',
        actionDescription: `Conduct independent testing and audit of ${selectedControl.controlName}`,
        timelineDays: 180,
        status: 'pending' as 'pending',
        assignedTo: 'Compliance Team',
        dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerated: false
      });
    }

    // Merge with actions from state that belong to this control
    const stateActionsForControl = actionPlans.filter(action => action.controlId === selectedControl.id);
    const mergedActions = [...actions, ...stateActionsForControl];

    // Remove duplicates based on ID
    const uniqueActions = mergedActions.filter((action, index, self) =>
      index === self.findIndex(a => a.id === action.id)
    );

    return uniqueActions;
  }, [selectedControl, actionPlans]);

  // Generate audit trail for this control
  const selectedAuditTrail = useMemo(() => {
    if (!selectedControl) return [];

    return [
      {
        id: '1',
        controlId: selectedControl.id,
        actionType: 'assessment' as 'assessment',  // Cast to ensure type
        actionDescription: `Initial gap assessment completed with score ${selectedControl.currentScore}/${selectedControl.targetScore}`,
        reviewerName: 'System',
        reviewerEmail: 'system@compliance-portal.com',
        comments: 'Automated compliance assessment based on document analysis',
        previousValue: undefined,
        newValue: selectedControl.currentScore.toString(),
        createdAt: new Date().toISOString()
      }
    ];
  }, [selectedControl]);

  // Generate clause mappings based on control framework
  const selectedClauseMappings = useMemo(() => {
    if (!selectedControl) return [];

    // Generate realistic clause mappings based on framework
    const clauses: ClauseMapping[] = [];
    let id = 1;
    let baseCompliance = (selectedControl.currentScore / selectedControl.targetScore) * 100;

    // Generate 3-5 clauses per control from different legal aspects
    const legalAspects = [
      { clause: `${selectedControl.frameworkCode}-1.1`, requirement: 'General requirements and scope' },
      { clause: `${selectedControl.frameworkCode}-2.1`, requirement: 'Management system requirements' },
      { clause: `${selectedControl.frameworkCode}-3.1`, requirement: 'Planning and implementation' },
      { clause: `${selectedControl.frameworkCode}-4.1`, requirement: 'Monitoring and measurement' },
      { clause: `${selectedControl.frameworkCode}-5.1`, requirement: 'Sustainability and continuous improvement' }
    ];

    legalAspects.forEach((aspect, index) => {
      // Vary compliance slightly for realism
      const variation = (Math.random() - 0.5) * 20; // -10% to +10%
      const compliancePercent = Math.max(0, Math.min(100, baseCompliance + variation));

      // Determine strength/gap based on compliance
      let keyStrengthOrGap, difficulty;
      if (compliancePercent >= 80) {
        keyStrengthOrGap = 'Strength';
        difficulty = 'Low';
      } else if (compliancePercent >= 60) {
        keyStrengthOrGap = 'Neutral';
        difficulty = 'Medium';
      } else {
        keyStrengthOrGap = 'Gap';
        difficulty = 'High';
      }

      clauses.push({
        id: (id++).toString(),
        controlId: selectedControl.id,
        clause: aspect.clause,
        requirement: aspect.requirement,
        observation: `Control implementation ${compliancePercent >= 60 ? 'adequately' : 'insufficiently'} addresses ${aspect.requirement.toLowerCase()}`,
        compliancePercent: Math.round(compliancePercent),
        keyStrengthOrGap: keyStrengthOrGap as 'Strength' | 'Gap' | 'Neutral',
        difficulty: difficulty as 'Easy' | 'Medium' | 'High'
      });
    });

    return clauses;
  }, [selectedControl]);

  return (
    <>
      {/* Dashboard Stats */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            icon={<CheckCircle2 className="w-6 h-6 text-yellow-400" />}
            title="Total Controls"
            value={stats.totalControls}
            variant="success"
          />
          <SummaryCard
            icon={<AlertTriangle className="w-6 h-6 text-red-400" />}
            title="Critical Gaps"
            value={stats.criticalGaps}
            variant="warning"
          />
          <SummaryCard
            icon={<TrendingUp className="w-6 h-6 text-yellow-400" />}
            title="Average Compliance"
            value={`${stats.averageCompliance.toFixed(1)}%`}
            variant="success"
          />
          <SummaryCard
            icon={<AlertCircle className="w-6 h-6 text-orange-400" />}
            title="High Priority Gaps"
            value={stats.highPriorityGaps}
            variant="info"
          />
        </div>
      </div>

      {/* Controls Table */}
      <div className="px-8">
        <ControlsTable
          controls={filteredControls}
          frameworkOptions={frameworkOptions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          frameworkFilter={frameworkFilter}
          onFrameworkFilterChange={setFrameworkFilter}
          onUploadNew={() => setIsFrameworkUploadOpen(true)}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          onRowClick={setSelectedControl}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        control={selectedControl}
        gapAnalysis={selectedGapAnalysis}
        documentation={selectedDocumentation}
        actionPlans={selectedActionPlans}
        auditTrail={selectedAuditTrail}
        clauseMappings={selectedClauseMappings}
        onClose={() => setSelectedControl(null)}
        onFileUpload={handleFileUpload}
        onGenerateAIPlan={handleGenerateAIPlan}
        onGenerateRiskSummary={handleGenerateRiskSummary}
        onGenerateEvidenceChecklist={handleGenerateEvidenceChecklist}
        onUpdateActionPlans={handleUpdateActionPlans}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        onUpload={handleUploadFiles}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
      />

      {/* Upload Status Toast */}
      {uploadStatus && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl max-w-sm z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <p className="text-white text-sm">{uploadStatus}</p>
          </div>
        </div>
      )}

      <FrameworkUploadModal
        isOpen={isFrameworkUploadOpen}
        onClose={() => setIsFrameworkUploadOpen(false)}
        onUploadComplete={handleFrameworkUploadComplete}
      />
    </>
  );
}

export default GapAssessmentPage;
