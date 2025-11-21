export interface Framework {
  id: number;
  code?: string;
  name: string;
  description?: string;
  category?: 'Standards' | 'Acts of Parliament' | 'Regulations';
  version?: string;
  content?: any;
  submitted_by?: number;
  approved_by?: number;
  global_available?: boolean;
  created_at?: string;
  updated_at?: string;
  submitted_by_user?: User;
  approved_by_user?: User;
}

export interface Control {
  id: string;
  frameworkId: string;
  frameworkCode: string;
  domain: string;
  controlName: string;
  controlCode: string;
  description: string;
  regulatoryContext: string;
  businessRationale: string;
  currentScore: number;
  targetScore: number;
  priority: 'High' | 'Medium' | 'Low';
  department: string;
  primaryOwner: string;
  ownerContact: string;
  rtoHours: number;
  rpoHours: number;
  businessImpact: string;
}

export interface GapAnalysis {
  id: string;
  controlId: string;
  gapDescription: string;
  existingArtifacts: string[];
  missingArtifacts: string[];
  requiredActions: string[];
}

export interface DocumentationItem {
  id: string;
  controlId: string;
  documentType: string;
  documentName: string;
  isRequired: boolean;
  isUploaded: boolean;
  uploadedAt?: string;
}

export interface EvidenceFile {
  id: string;
  controlId: string;
  checklistItemId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ActionPlan {
  id: string;
  controlId: string;
  planType: 'immediate' | 'short_term' | 'long_term';
  actionDescription: string;
  timelineDays: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: string;
  dueDate: string;
  completionDate?: string;
  aiGenerated: boolean;
}

export interface AuditTrailEntry {
  id: string;
  controlId: string;
  actionType: 'assessment' | 'comment' | 'upload' | 'status_change' | 'review';
  actionDescription: string;
  reviewerName: string;
  reviewerEmail: string;
  comments: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  controlId: string;
  insightType: 'action_plan' | 'risk_summary' | 'evidence_checklist';
  content: any;
  generatedAt: string;
  regeneratedCount: number;
}

export interface ClauseMapping {
  id: string;
  controlId: string;
  clause: string;
  requirement: string;
  observation: string;
  compliancePercent: number;
  keyStrengthOrGap: 'Strength' | 'Gap' | 'Neutral';
  difficulty: 'Easy' | 'Medium' | 'High';
}

export interface DashboardStats {
  totalControls: number;
  criticalGaps: number;
  averageCompliance: number;
  highPriorityGaps: number;
}

// RBAC and Approval System Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'process_owner' | 'department_head' | 'organization_head' | 'ey_admin';
  department: string;
  organization: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApprovalRequest {
  id: number;
  type: 'clause_edit' | 'framework_addition';
  title: string;
  payload: any;
  submitted_by: number;
  current_approver_role: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_history: any[];
  created_at: string;
  updated_at?: string;
  submitted_by_user?: User;
}

export interface ApprovalStep {
  id: number;
  request_id: number;
  role: string;
  approver_id?: number;
  decision: 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
  approver?: User;
}



export interface TrainingCorpus {
  id: number;
  clause_id: string;
  remedy: string;
  source?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  submitted_by: number;
  approved_by?: number;
  created_at: string;
  updated_at?: string;
  submitted_by_user?: User;
  approved_by_user?: User;
}

export interface RoleInfo {
  role: string;
  name: string;
  level: number;
  description: string;
}

export interface UserStats {
  total_submitted: number;
  total_approved: number;
  total_rejected: number;
  pending_approvals: number;
}

export interface SystemStats {
  total_users: number;
  total_requests: number;
  pending_approvals: number;
  approved_requests: number;
  rejected_requests: number;
  requests_by_type: Record<string, number>;
  requests_by_role: Record<string, number>;
}

export interface DashboardData {
  user_stats: UserStats;
  system_stats?: SystemStats;
  recent_activity: any[];
  user_role: string;
  user_permissions: Record<string, boolean>;
}

export interface ClauseEditRequest {
  remedy: string;
  justification: string;
  required_actions?: string[];
  evidence_required?: string[];
}

export interface ClauseEditResponse {
  success: boolean;
  message: string;
  approval_required: boolean;
  approval_request_id?: number;
  updated_control?: Control;
}

export interface ApprovalActionRequest {
  decision: 'approved' | 'rejected';
  comments?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
