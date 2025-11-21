import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import {
  ApprovalRequest,
  ApprovalStep,
  ClauseEditRequest,
  ClauseEditResponse,
  ApprovalActionRequest,
  PaginatedResponse,
  DashboardData,
  SystemStats
} from '../types';

class ApprovalService {
  // Submit clause edit for approval
  async submitClauseEdit(
    jobId: string,
    controlId: string,
    remedy: string,
    justification: string,
    requiredActions?: string[],
    evidenceRequired?: string[]
  ): Promise<ClauseEditResponse> {
    const requestData: ClauseEditRequest = {
      remedy,
      justification,
      required_actions: requiredActions,
      evidence_required: evidenceRequired,
    };

    const response = await axios.post<ClauseEditResponse>(
      `${API_ENDPOINTS.CONTROLS_ENHANCED.EDIT(controlId)}?jobId=${jobId}`,
      requestData
    );

    return response.data;
  }

  // Submit framework addition for approval
  async submitFrameworkAddition(
    frameworkData: any,
    justification: string
  ): Promise<ApprovalRequest> {
    const response = await axios.post<ApprovalRequest>(
      API_ENDPOINTS.APPROVAL.FRAMEWORK_ADDITION,
      {
        framework_data: frameworkData,
        justification,
      }
    );

    return response.data;
  }

  // Get approval requests with filtering and pagination
  async getApprovalRequests(
    page: number = 1,
    size: number = 20,
    statusFilter?: string,
    typeFilter?: string,
    roleFilter?: string
  ): Promise<PaginatedResponse<ApprovalRequest>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (statusFilter) params.append('status_filter', statusFilter);
    if (typeFilter) params.append('type_filter', typeFilter);
    if (roleFilter) params.append('role_filter', roleFilter);

    const response = await axios.get<PaginatedResponse<ApprovalRequest>>(
      `${API_ENDPOINTS.APPROVAL.REQUESTS}?${params.toString()}`
    );

    return response.data;
  }

  // Get specific approval request
  async getApprovalRequest(requestId: number): Promise<ApprovalRequest> {
    const response = await axios.get<ApprovalRequest>(
      `${API_ENDPOINTS.APPROVAL.REQUESTS}/${requestId}`
    );

    return response.data;
  }

  // Get pending approvals for current user
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const response = await axios.get<ApprovalRequest[]>(
      API_ENDPOINTS.APPROVAL.PENDING
    );

    return response.data;
  }

  // Approve or reject a request
  async processApproval(
    requestId: number,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<ApprovalRequest> {
    const requestData: ApprovalActionRequest = {
      decision,
      comments,
    };

    const response = await axios.post<ApprovalRequest>(
      API_ENDPOINTS.APPROVAL.APPROVE(requestId),
      requestData
    );

    return response.data;
  }

  // Get approval steps for a request
  async getApprovalSteps(requestId: number): Promise<ApprovalStep[]> {
    const response = await axios.get<ApprovalStep[]>(
      `${API_ENDPOINTS.APPROVAL.REQUESTS}/${requestId}/steps`
    );

    return response.data;
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<SystemStats> {
    const response = await axios.get<SystemStats>(
      API_ENDPOINTS.APPROVAL.DASHBOARD_STATS
    );

    return response.data;
  }

  // Get approval status for a control
  async getControlApprovalStatus(
    controlId: string,
    jobId: string
  ): Promise<{
    has_pending_approval: boolean;
    approval_request_id?: number;
    status?: string;
    current_approver_role?: string;
    submitted_at?: string;
    submitted_by?: string;
  }> {
    const response = await axios.get(
      `${API_ENDPOINTS.CONTROLS_ENHANCED.APPROVAL_STATUS(controlId)}?jobId=${jobId}`
    );

    return response.data;
  }

  // Check if user can approve a specific request
  canUserApproveRequest(request: ApprovalRequest, userRole: string): boolean {
    return request.current_approver_role === userRole && request.status === 'pending';
  }

  // Get approval chain for a request type
  getApprovalChain(submitterRole: string): string[] {
    const roleHierarchy: Record<string, string> = {
      process_owner: 'department_head',
      department_head: 'organization_head',
      organization_head: 'ey_admin',
      ey_admin: 'ey_admin',
    };

    const chain: string[] = [];
    let currentRole = roleHierarchy[submitterRole];

    while (currentRole && currentRole !== submitterRole) {
      chain.push(currentRole);
      currentRole = roleHierarchy[currentRole];
    }

    return chain;
  }

  // Format approval status for display
  formatApprovalStatus(status: string): {
    label: string;
    color: string;
    icon: string;
  } {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Approval',
          color: 'yellow',
          icon: '⏳',
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'green',
          icon: '✅',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'red',
          icon: '❌',
        };
      default:
        return {
          label: 'Unknown',
          color: 'gray',
          icon: '❓',
        };
    }
  }

  // Format role name for display
  formatRoleName(role: string): string {
    const roleNames: Record<string, string> = {
      process_owner: 'Process Owner',
      department_head: 'Department Head',
      organization_head: 'Organization Head',
      ey_admin: 'EY Admin',
    };

    return roleNames[role] || role;
  }

  // Get role level for sorting
  getRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      process_owner: 1,
      department_head: 2,
      organization_head: 3,
      ey_admin: 4,
    };

    return roleLevels[role] || 0;
  }
}

export const approvalService = new ApprovalService();
export default approvalService;
