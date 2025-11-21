// API configuration
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Existing endpoints
    UPLOAD: `${API_BASE_URL}/api/upload`,
    UPLOAD_STATUS: (jobId: string) => `${API_BASE_URL}/api/gap-assessment/upload/upload/status/${jobId}`,
    SUMMARY: (jobId: string) => `${API_BASE_URL}/api/gap-assessment/summary?jobId=${jobId}`,
    CONTROLS: (jobId: string) => `${API_BASE_URL}/api/gap-assessment/controls?jobId=${jobId}`,
    GENERATE_ACTION_PLAN: `${API_BASE_URL}/api/gap-assessment/ai/generate-plan`,
    GENERATE_RISK_SUMMARY: `${API_BASE_URL}/api/gap-assessment/ai/explain-risk`,
    GENERATE_EVIDENCE_CHECKLIST: `${API_BASE_URL}/api/gap-assessment/ai/suggest-evidence`,

    // Authentication endpoints
    AUTH: {
        LOGIN: `${API_BASE_URL}/api/gap-assessment/auth/login`,
        LOGOUT: `${API_BASE_URL}/api/gap-assessment/auth/logout`,
        ME: `${API_BASE_URL}/api/gap-assessment/auth/me`,
        USERS: `${API_BASE_URL}/api/gap-assessment/auth/users`,
        ROLES: `${API_BASE_URL}/api/gap-assessment/auth/roles`,
        STATS: `${API_BASE_URL}/api/gap-assessment/auth/stats`,
    },

    // Approval endpoints
    APPROVAL: {
        CLAUSE_EDIT: `${API_BASE_URL}/api/gap-assessment/approval/clause-edit`,
        FRAMEWORK_ADDITION: `${API_BASE_URL}/api/gap-assessment/approval/framework-addition`,
        REQUESTS: `${API_BASE_URL}/api/gap-assessment/approval/requests`,
        PENDING: `${API_BASE_URL}/api/gap-assessment/approval/pending`,
        APPROVE: (requestId: number) => `${API_BASE_URL}/api/gap-assessment/approval/requests/${requestId}/approve`,
        DASHBOARD_STATS: `${API_BASE_URL}/api/gap-assessment/approval/dashboard/stats`,
    },

    // Framework endpoints
    FRAMEWORK: {
        LIST: `${API_BASE_URL}/api/gap-assessment/framework`,
        CREATE: `${API_BASE_URL}/api/gap-assessment/framework`,
        AVAILABLE: `${API_BASE_URL}/api/gap-assessment/framework/available/list`,
        STATS: `${API_BASE_URL}/api/gap-assessment/framework/stats/summary`,
    },

    // Training corpus endpoints
    TRAINING: {
        LIST: `${API_BASE_URL}/api/gap-assessment/training`,
        CREATE: `${API_BASE_URL}/api/gap-assessment/training`,
        APPROVED: `${API_BASE_URL}/api/gap-assessment/training/approved/list`,
        STATS: `${API_BASE_URL}/api/gap-assessment/training/stats/summary`,
    },

    // Enhanced controls endpoints
    CONTROLS_ENHANCED: {
        EDIT: (controlId: string) => `${API_BASE_URL}/api/gap-assessment/controls/${controlId}/edit`,
        APPROVAL_STATUS: (controlId: string) => `${API_BASE_URL}/api/gap-assessment/controls/${controlId}/approval-status`,
    }
};
