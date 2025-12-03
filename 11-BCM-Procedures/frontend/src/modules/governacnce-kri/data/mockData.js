// src/data/mockData.js

export const maturityScore = {
    overall: 75,
    categories: [
        { name: 'Strategy', score: 80 },
        { name: 'Organization', score: 70 },
        { name: 'Technology', score: 75 },
        { name: 'Process', score: 90 },
    ],
};

export const kris = [
    {
        id: 1,
        name: 'Cybersecurity Risk Exposure',
        level: 'High',
        owner: 'IT Security',
        trend: 'Up', // Could be 'Up', 'Down', 'Stable' for future visualization
        lastReviewed: '2025-07-10',
        progress: 85, // Represents severity/completion for the progress bar
        icon: 'fas fa-shield-alt'
    },
    {
        id: 2,
        name: 'Regulatory Compliance Adherence',
        level: 'Medium',
        owner: 'Legal',
        trend: 'Stable',
        lastReviewed: '2025-07-05',
        progress: 60,
        icon: 'fas fa-exclamation-triangle'
    },
    {
        id: 3,
        name: 'Operational Resilience Score',
        level: 'Low',
        owner: 'Operations',
        trend: 'Down',
        lastReviewed: '2025-07-12',
        progress: 30,
        icon: 'fas fa-chart-line'
    },
    {
        id: 4,
        name: 'Data Privacy Breach Likelihood',
        level: 'Critical',
        owner: 'Data Governance',
        trend: 'Up',
        lastReviewed: '2025-07-18',
        progress: 92,
        icon: 'fas fa-server'
    },
    {
        id: 5,
        name: 'Third-Party Risk Score',
        level: 'Medium',
        owner: 'Procurement',
        trend: 'Stable',
        lastReviewed: '2025-07-15',
        progress: 55,
        icon: 'fas fa-handshake'
    },
];

export const audits = {
    summary: {
        open: 5,
        inProgress: 2,
        closed: 18,
    },
    details: [
        {
            id: 'A101',
            item: 'Financial Controls Review',
            owner: 'Finance Dept.',
            due: '2025-08-01',
            status: 'In Progress',
            riskLevel: 'low',
            findings: '3 Minor',
            details: 'Comprehensive review of financial controls for Q2. Identified minor discrepancies in expense reporting. Remedial actions initiated.',
        },
        {
            id: 'B202',
            item: 'Cybersecurity Infrastructure Audit',
            owner: 'IT Security',
            due: '2025-07-25',
            status: 'Open',
            riskLevel: 'high',
            findings: '1 Major',
            details: 'Assessment of current cybersecurity infrastructure. Discovered a critical vulnerability in a legacy system. Patching scheduled for next week.',
        },
        {
            id: 'C303',
            item: 'HR Policy Compliance Check',
            owner: 'HR Dept.',
            due: '2025-08-10',
            status: 'Closed',
            riskLevel: 'medium',
            findings: '2 Moderate',
            details: 'Compliance check of HR policies and procedures. Found inconsistencies in onboarding documentation and training records. Policy update in progress.',
        },
        {
            id: 'D404',
            item: 'Cloud Security Configuration Audit',
            owner: 'Cloud Ops',
            due: '2025-07-20',
            status: 'Closed',
            riskLevel: 'low',
            findings: '0 Critical',
            details: 'Review of cloud security configurations across all platforms. Excellent adherence to best practices, no critical findings.',
        },
        {
            id: 'E505',
            item: 'Data Governance Framework Review',
            owner: 'Data Governance',
            due: '2025-09-01',
            status: 'Open',
            riskLevel: 'high',
            findings: '1 Major, 2 Minor',
            details: 'Assessment of the enterprise data governance framework. Identified gaps in data retention policies and access controls. Framework revision planned for Q3.',
        },
    ],
};

export const recentActivities = [
    {
        id: 1,
        activity: 'John Doe reviewed Q2 Compliance Report.',
        date: 'July 20, 2025, 10:30 AM',
        icon: 'fas fa-user-shield'
    },
    {
        id: 2,
        activity: 'Jane Smith submitted new Risk Assessment document.',
        date: 'July 19, 2025, 03:45 PM',
        icon: 'fas fa-file-alt'
    },
    {
        id: 3,
        activity: 'System Alert: High severity vulnerability detected in Finance module.',
        date: 'July 18, 2025, 09:00 AM',
        icon: 'fas fa-bell'
    },
    {
        id: 4,
        activity: 'Mike Johnson completed mandatory GRC training.',
        date: 'July 17, 2025, 01:15 PM',
        icon: 'fas fa-check-circle'
    },
    {
        id: 5,
        activity: 'Automated policy scan initiated for all cloud resources.',
        date: 'July 16, 2025, 11:00 AM',
        icon: 'fas fa-cogs'
    },
    {
        id: 6,
        activity: 'Audit B202 status updated to "In Progress".',
        date: 'July 15, 2025, 02:00 PM',
        icon: 'fas fa-sync-alt'
    },
];