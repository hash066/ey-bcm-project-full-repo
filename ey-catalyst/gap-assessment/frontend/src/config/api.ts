// API configuration
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Existing endpoints
    UPLOAD: `${API_BASE_URL}/api/upload`,
    UPLOAD_STATUS: (jobId: string) => `${API_BASE_URL}/api/upload/status?jobId=${jobId}`,
    SUMMARY: (jobId: string) => `${API_BASE_URL}/api/summary?jobId=${jobId}`,
    CONTROLS: (jobId: string) => `${API_BASE_URL}/api/controls?jobId=${jobId}`,
    GENERATE_ACTION_PLAN: `${API_BASE_URL}/api/ai/generate-plan`,
    GENERATE_RISK_SUMMARY: `${API_BASE_URL}/api/ai/explain-risk`,
    GENERATE_EVIDENCE_CHECKLIST: `${API_BASE_URL}/api/ai/suggest-evidence`,

    // Authentication endpoints
    AUTH: {
        LOGIN: `${API_BASE_URL}/api/auth/login`,
        LOGOUT: `${API_BASE_URL}/api/auth/logout`,
        ME: `${API_BASE_URL}/api/auth/me`,
        USERS: `${API_BASE_URL}/api/auth/users`,
        ROLES: `${API_BASE_URL}/api/auth/roles`,
        STATS: `${API_BASE_URL}/api/auth/stats`,
    },

    // Approval endpoints
    APPROVAL: {
        CLAUSE_EDIT: `${API_BASE_URL}/api/approval/clause-edit`,
        FRAMEWORK_ADDITION: `${API_BASE_URL}/api/approval/framework-addition`,
        REQUESTS: `${API_BASE_URL}/api/approval/requests`,
        PENDING: `${API_BASE_URL}/api/approval/pending`,
        APPROVE: (requestId: number) => `${API_BASE_URL}/api/approval/requests/${requestId}/approve`,
        DASHBOARD_STATS: `${API_BASE_URL}/api/approval/dashboard/stats`,
    },

    // Framework endpoints
    FRAMEWORK: {
        LIST: `${API_BASE_URL}/api/framework`,
        CREATE: `${API_BASE_URL}/api/framework`,
        AVAILABLE: `${API_BASE_URL}/api/framework/available/list`,
        STATS: `${API_BASE_URL}/api/framework/stats/summary`,
    },

    // Training corpus endpoints
    TRAINING: {
        LIST: `${API_BASE_URL}/api/training`,
        CREATE: `${API_BASE_URL}/api/training`,
        APPROVED: `${API_BASE_URL}/api/training/approved/list`,
        STATS: `${API_BASE_URL}/api/training/stats/summary`,
    },

    // Enhanced controls endpoints
    CONTROLS_ENHANCED: {
        EDIT: (controlId: string) => `${API_BASE_URL}/api/controls/${controlId}/edit`,
        APPROVAL_STATUS: (controlId: string) => `${API_BASE_URL}/api/controls/${controlId}/approval-status`,
    }
};
