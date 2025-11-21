import { Framework, Control, GapAnalysis, DocumentationItem, ActionPlan, AuditTrailEntry, ClauseMapping } from '../types';

export const frameworkOptions = {
  Standards: [
    { id: 'ISO22301', name: 'ISO 22301', description: 'Business Continuity Management Systems' },
    { id: 'ISO27001', name: 'ISO 27001', description: 'Information Security Management Systems' },
    { id: 'CSF', name: 'NIST Cybersecurity Framework', description: 'Framework for Improving Critical Infrastructure Cybersecurity' }
  ],
  "Acts of Parliament": [
    { id: 'DM_ACT', name: 'Disaster Management Act 2005', description: 'Disaster Management Act of Parliament' },
    { id: 'IT_ACT', name: 'Information Technology Act 2000', description: 'Information Technology Act of Parliament' }
  ],
  Regulations: [
    { id: 'RBI', name: 'RBI Guidelines', description: 'Reserve Bank of India Business Continuity Guidelines' },
    { id: 'IRDAI', name: 'IRDAI Guidelines', description: 'Insurance Regulatory and Development Authority of India' },
    { id: 'CERT_IN', name: 'CERT-In Directions', description: 'Indian Computer Emergency Response Team Directions' }
  ]
};

export const frameworks: Framework[] = [
  { id: '1', code: 'RBI', name: 'RBI Guidelines', description: 'Reserve Bank of India Business Continuity Guidelines', category: 'Regulations' },
  { id: '2', code: 'ISO22301', name: 'ISO 22301', description: 'Business Continuity Management Systems', category: 'Standards' },
  { id: '3', code: 'CSF', name: 'NIST Cybersecurity Framework', description: 'Framework for Improving Critical Infrastructure Cybersecurity', category: 'Standards' },
  { id: '4', code: 'IRDAI', name: 'IRDAI Guidelines', description: 'Insurance Regulatory and Development Authority of India', category: 'Regulations' }
];

export const controls: Control[] = [
  {
    id: 'c1',
    frameworkId: '1',
    frameworkCode: 'RBI',
    domain: 'Business Impact Analysis',
    controlName: 'Critical Business Functions Identification',
    controlCode: 'RBI 7.2.1',
    description: 'Organizations must identify and document all critical business functions, their dependencies, and recovery requirements.',
    regulatoryContext: 'RBI mandates financial institutions to conduct comprehensive business impact analysis to ensure operational resilience.',
    businessRationale: 'Understanding critical functions enables prioritized recovery efforts and resource allocation during disruptions.',
    currentScore: 85,
    targetScore: 100,
    priority: 'High',
    department: 'Risk Management',
    primaryOwner: 'Rajesh Kumar',
    ownerContact: 'rajesh.kumar@company.com',
    rtoHours: 4,
    rpoHours: 1,
    businessImpact: 'High - Affects core banking operations and customer transactions'
  },
  {
    id: 'c2',
    frameworkId: '2',
    frameworkCode: 'ISO22301',
    domain: 'Incident Response',
    controlName: 'Incident Response Procedures',
    controlCode: 'ISO 22301 8.3',
    description: 'Documented procedures for responding to disruptive incidents with clear escalation paths and decision-making frameworks.',
    regulatoryContext: 'ISO 22301 requires organizations to establish, implement and maintain processes to respond to disruptive incidents.',
    businessRationale: 'Rapid incident response minimizes operational downtime and protects business reputation.',
    currentScore: 70,
    targetScore: 100,
    priority: 'High',
    department: 'Operations',
    primaryOwner: 'Priya Sharma',
    ownerContact: 'priya.sharma@company.com',
    rtoHours: 2,
    rpoHours: 0.5,
    businessImpact: 'Critical - Direct impact on service availability'
  },
  {
    id: 'c3',
    frameworkId: '3',
    frameworkCode: 'CSF',
    domain: 'Recovery Planning',
    controlName: 'Data Backup and Recovery',
    controlCode: 'CSF RC.RP-1',
    description: 'Regular backup procedures with tested recovery capabilities for critical data and systems.',
    regulatoryContext: 'NIST CSF requires organizations to maintain resilient systems through backup and recovery capabilities.',
    businessRationale: 'Ensures data availability and business continuity in case of system failures or cyber incidents.',
    currentScore: 60,
    targetScore: 100,
    priority: 'High',
    department: 'IT Infrastructure',
    primaryOwner: 'Amit Patel',
    ownerContact: 'amit.patel@company.com',
    rtoHours: 8,
    rpoHours: 2,
    businessImpact: 'High - Data loss could affect compliance and operations'
  },
  {
    id: 'c4',
    frameworkId: '4',
    frameworkCode: 'IRDAI',
    domain: 'Communication',
    controlName: 'Stakeholder Communication Plan',
    controlCode: 'IRDAI 3.4.2',
    description: 'Established communication protocols for internal and external stakeholders during business disruptions.',
    regulatoryContext: 'IRDAI mandates insurance companies to maintain effective communication channels during crisis situations.',
    businessRationale: 'Transparent communication maintains stakeholder confidence and regulatory compliance.',
    currentScore: 75,
    targetScore: 100,
    priority: 'Medium',
    department: 'Corporate Communications',
    primaryOwner: 'Sneha Reddy',
    ownerContact: 'sneha.reddy@company.com',
    rtoHours: 1,
    rpoHours: 0,
    businessImpact: 'Medium - Affects stakeholder trust and regulatory compliance'
  },
  {
    id: 'c5',
    frameworkId: '1',
    frameworkCode: 'RBI',
    domain: 'Testing & Maintenance',
    controlName: 'BC Plan Testing',
    controlCode: 'RBI 9.1.3',
    description: 'Regular testing and validation of business continuity plans through simulations and exercises.',
    regulatoryContext: 'RBI requires annual testing of BC plans with documented results and remediation actions.',
    businessRationale: 'Testing validates plan effectiveness and identifies gaps before actual incidents occur.',
    currentScore: 50,
    targetScore: 100,
    priority: 'High',
    department: 'Business Continuity',
    primaryOwner: 'Vikram Singh',
    ownerContact: 'vikram.singh@company.com',
    rtoHours: 0,
    rpoHours: 0,
    businessImpact: 'High - Untested plans may fail during actual incidents'
  },
  {
    id: 'c6',
    frameworkId: '2',
    frameworkCode: 'ISO22301',
    domain: 'Risk Assessment',
    controlName: 'Business Continuity Risk Assessment',
    controlCode: 'ISO 22301 6.1',
    description: 'Systematic assessment of risks that could disrupt business operations and impact continuity objectives.',
    regulatoryContext: 'ISO 22301 mandates risk-based approach to business continuity management.',
    businessRationale: 'Understanding risks enables proactive mitigation and better resource allocation.',
    currentScore: 80,
    targetScore: 100,
    priority: 'Medium',
    department: 'Risk Management',
    primaryOwner: 'Anjali Mehta',
    ownerContact: 'anjali.mehta@company.com',
    rtoHours: 0,
    rpoHours: 0,
    businessImpact: 'Medium - Affects strategic planning and preparedness'
  },
  {
    id: 'c7',
    frameworkId: '3',
    frameworkCode: 'CSF',
    domain: 'Asset Management',
    controlName: 'Critical Asset Inventory',
    controlCode: 'CSF ID.AM-1',
    description: 'Comprehensive inventory of critical assets including hardware, software, and data resources.',
    regulatoryContext: 'NIST CSF requires organizations to maintain accurate inventory of critical assets for protection.',
    businessRationale: 'Asset visibility enables better protection, recovery prioritization, and investment decisions.',
    currentScore: 65,
    targetScore: 100,
    priority: 'Medium',
    department: 'IT Asset Management',
    primaryOwner: 'Karthik Iyer',
    ownerContact: 'karthik.iyer@company.com',
    rtoHours: 0,
    rpoHours: 0,
    businessImpact: 'Medium - Affects recovery prioritization'
  },
  {
    id: 'c8',
    frameworkId: '4',
    frameworkCode: 'IRDAI',
    domain: 'Supplier Management',
    controlName: 'Third-Party Service Provider Continuity',
    controlCode: 'IRDAI 4.2.1',
    description: 'Assessment and monitoring of business continuity capabilities of critical third-party service providers.',
    regulatoryContext: 'IRDAI requires insurance companies to ensure third-party resilience.',
    businessRationale: 'Third-party disruptions can cascade to organization operations.',
    currentScore: 55,
    targetScore: 100,
    priority: 'High',
    department: 'Vendor Management',
    primaryOwner: 'Deepak Gupta',
    ownerContact: 'deepak.gupta@company.com',
    rtoHours: 12,
    rpoHours: 4,
    businessImpact: 'High - Dependencies on critical vendors'
  }
];

export const gapAnalyses: GapAnalysis[] = [
  {
    id: 'g1',
    controlId: 'c1',
    gapDescription: 'While critical functions are identified, comprehensive dependency mapping is incomplete. Cross-functional dependencies and technology infrastructure requirements need detailed documentation.',
    existingArtifacts: [
      'Basic critical functions identification document',
      'Initial BIA template setup',
      'Preliminary department stakeholder list',
      'Monthly business impact assessment meetings'
    ],
    missingArtifacts: [
      'Complete dependency mapping matrix',
      'Technology infrastructure requirements document',
      'Cross-functional impact analysis',
      'Board-approved critical functions list'
    ],
    requiredActions: [
      'Conduct workshops with all departments to map dependencies',
      'Document technology requirements for each critical function',
      'Create visual dependency maps',
      'Obtain board approval for critical functions classification'
    ]
  },
  {
    id: 'g2',
    controlId: 'c2',
    gapDescription: 'Incident response procedures exist but lack clarity on escalation thresholds and decision authority. No documented playbooks for specific incident types.',
    existingArtifacts: [
      'Incident response team charter',
      'Emergency contact list (partially current)',
      'Basic incident logging system',
      'Monthly incident review meetings'
    ],
    missingArtifacts: [
      'Incident escalation matrix with clear thresholds',
      'Decision authority framework (RACI matrix)',
      'Incident-specific response playbooks',
      'Emergency contact directory (current version)'
    ],
    requiredActions: [
      'Define escalation thresholds based on impact severity',
      'Create RACI matrix for incident response',
      'Develop playbooks for top 10 incident scenarios',
      'Update and verify emergency contact information'
    ]
  },
  {
    id: 'g3',
    controlId: 'c3',
    gapDescription: 'Backup procedures are in place but recovery testing is infrequent. No documented evidence of successful recovery drills in the past 12 months.',
    existingArtifacts: [
      'Daily backup procedures (automated)',
      'Backup monitoring dashboard',
      '3-month backup retention policy',
      'Primary backup storage system in place'
    ],
    missingArtifacts: [
      'Recovery test reports (last 12 months)',
      'Recovery time validation data',
      'Backup integrity verification logs',
      'Off-site backup location details'
    ],
    requiredActions: [
      'Conduct quarterly recovery tests',
      'Document recovery time actuals vs. targets',
      'Implement automated backup verification',
      'Establish redundant off-site backup locations'
    ]
  }
];

export const documentationChecklists: DocumentationItem[] = [
  { id: 'd1', controlId: 'c1', documentType: 'Policy', documentName: 'Business Impact Analysis Policy', isRequired: true, isUploaded: true, uploadedAt: '2025-09-15' },
  { id: 'd2', controlId: 'c1', documentType: 'Procedure', documentName: 'BIA Execution Procedure', isRequired: true, isUploaded: true, uploadedAt: '2025-09-20' },
  { id: 'd3', controlId: 'c1', documentType: 'Report', documentName: 'BIA Results Report 2025', isRequired: true, isUploaded: false },
  { id: 'd4', controlId: 'c1', documentType: 'Approval', documentName: 'Board Approval Minutes', isRequired: true, isUploaded: false },
  { id: 'd5', controlId: 'c2', documentType: 'Policy', documentName: 'Incident Response Policy', isRequired: true, isUploaded: true, uploadedAt: '2025-08-10' },
  { id: 'd6', controlId: 'c2', documentType: 'Procedure', documentName: 'Incident Escalation Procedure', isRequired: true, isUploaded: false },
  { id: 'd7', controlId: 'c2', documentType: 'Playbook', documentName: 'Cyber Incident Playbook', isRequired: true, isUploaded: false },
  { id: 'd8', controlId: 'c3', documentType: 'Policy', documentName: 'Backup and Recovery Policy', isRequired: true, isUploaded: true, uploadedAt: '2025-07-05' },
  { id: 'd9', controlId: 'c3', documentType: 'Test Report', documentName: 'Recovery Test Report Q2 2025', isRequired: true, isUploaded: false },
];

export const actionPlans: ActionPlan[] = [
  {
    id: 'a1',
    controlId: 'c1',
    planType: 'immediate',
    actionDescription: 'Schedule dependency mapping workshops with all department heads',
    timelineDays: 14,
    status: 'approved',
    assignedTo: 'Rajesh Kumar',
    dueDate: '2025-10-21',
    aiGenerated: false
  },
  {
    id: 'a2',
    controlId: 'c1',
    planType: 'short_term',
    actionDescription: 'Complete technology infrastructure documentation for all critical functions',
    timelineDays: 45,
    status: 'in_progress',
    assignedTo: 'IT Team',
    dueDate: '2025-11-21',
    aiGenerated: false
  },
  {
    id: 'a3',
    controlId: 'c1',
    planType: 'long_term',
    actionDescription: 'Implement automated dependency tracking system',
    timelineDays: 180,
    status: 'pending',
    assignedTo: 'Digital Transformation Team',
    dueDate: '2026-04-05',
    aiGenerated: true
  },
  {
    id: 'a4',
    controlId: 'c2',
    planType: 'immediate',
    actionDescription: 'Define and document escalation thresholds with impact severity matrix',
    timelineDays: 7,
    status: 'approved',
    assignedTo: 'Priya Sharma',
    dueDate: '2025-10-14',
    aiGenerated: false
  },
  {
    id: 'a5',
    controlId: 'c3',
    planType: 'immediate',
    actionDescription: 'Schedule and execute full recovery test for critical systems',
    timelineDays: 21,
    status: 'in_progress',
    assignedTo: 'Amit Patel',
    dueDate: '2025-10-28',
    aiGenerated: false
  }
];

export const auditTrail: AuditTrailEntry[] = [
  {
    id: 'at1',
    controlId: 'c1',
    actionType: 'assessment',
    actionDescription: 'Initial gap assessment completed',
    reviewerName: 'Sarah Johnson',
    reviewerEmail: 'sarah.johnson@company.com',
    comments: 'Comprehensive review conducted. Identified 4 major gaps requiring immediate attention.',
    createdAt: '2025-09-25T10:30:00Z'
  },
  {
    id: 'at2',
    controlId: 'c1',
    actionType: 'upload',
    actionDescription: 'BIA Policy document uploaded',
    reviewerName: 'Rajesh Kumar',
    reviewerEmail: 'rajesh.kumar@company.com',
    comments: 'Updated policy version uploaded for review',
    createdAt: '2025-09-15T14:22:00Z'
  },
  {
    id: 'at3',
    controlId: 'c1',
    actionType: 'status_change',
    actionDescription: 'Control score updated',
    reviewerName: 'Sarah Johnson',
    reviewerEmail: 'sarah.johnson@company.com',
    comments: 'Score improved from 80% to 85% after documentation upload',
    previousValue: '80',
    newValue: '85',
    createdAt: '2025-09-20T16:45:00Z'
  },
  {
    id: 'at4',
    controlId: 'c2',
    actionType: 'review',
    actionDescription: 'Quarterly review conducted',
    reviewerName: 'Michael Chen',
    reviewerEmail: 'michael.chen@company.com',
    comments: 'Escalation procedures need revision. Action plan created.',
    createdAt: '2025-09-30T11:15:00Z'
  }
];

export const clauseMappings: ClauseMapping[] = [
  {
    id: 'cm1',
    controlId: 'c1',
    clause: 'RBI 7.2.1(a)',
    requirement: 'Identify and document all critical business functions with clear financial impact thresholds',
    observation: 'Critical functions list exists but impact thresholds need formal documentation',
    compliancePercent: 85,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Medium'
  },
  {
    id: 'cm2',
    controlId: 'c1',
    clause: 'RBI 7.2.1(b)',
    requirement: 'Map dependencies between critical functions and supporting infrastructure',
    observation: 'Basic dependency matrices created, cross-functional dependencies partially mapped',
    compliancePercent: 70,
    keyStrengthOrGap: 'Gap',
    difficulty: 'High'
  },
  {
    id: 'cm3',
    controlId: 'c1',
    clause: 'RBI 7.2.1(c)',
    requirement: 'Establish recovery time objectives (RTO) for each critical function',
    observation: 'RTOs defined and approved by management, need annual review',
    compliancePercent: 95,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Easy'
  },
  {
    id: 'cm4',
    controlId: 'c1',
    clause: 'RBI 7.2.2(a)',
    requirement: 'Conduct quarterly gap analyses and update recovery plans accordingly',
    observation: 'Annual reviews only, quarterly gap analyses not established',
    compliancePercent: 60,
    keyStrengthOrGap: 'Gap',
    difficulty: 'Medium'
  },
  {
    id: 'cm5',
    controlId: 'c2',
    clause: 'ISO 22301 8.3.1',
    requirement: 'Establish incident response team with clearly defined roles and responsibilities',
    observation: 'Incident response team structure exists but roles need clearer definition',
    compliancePercent: 75,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Medium'
  },
  {
    id: 'cm6',
    controlId: 'c2',
    clause: 'ISO 22301 8.3.2',
    requirement: 'Document procedures for incident detection, reporting, and assessment',
    observation: 'Basic detection procedures documented, assessment procedures need improvement',
    compliancePercent: 65,
    keyStrengthOrGap: 'Gap',
    difficulty: 'High'
  },
  {
    id: 'cm7',
    controlId: 'c2',
    clause: 'ISO 22301 8.3.3',
    requirement: 'Define escalation procedures and decision-making authority during incidents',
    observation: 'Escalation thresholds defined but unclear decision authority',
    compliancePercent: 55,
    keyStrengthOrGap: 'Gap',
    difficulty: 'High'
  },
  {
    id: 'cm8',
    controlId: 'c2',
    clause: 'ISO 22301 8.3.4',
    requirement: 'Establish communication protocols for internal and external stakeholders during incidents',
    observation: 'Internal communication protocols established, external protocols need finalization',
    compliancePercent: 80,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Easy'
  },
  {
    id: 'cm9',
    controlId: 'c3',
    clause: 'CSF RC.RP-1(a)',
    requirement: 'Maintain regular backup schedules for critical data and systems',
    observation: 'Daily backup schedules implemented and automated',
    compliancePercent: 90,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Easy'
  },
  {
    id: 'cm10',
    controlId: 'c3',
    clause: 'CSF RC.RP-1(b)',
    requirement: 'Test backup restoration capabilities quarterly',
    observation: 'Monthly testing conducted but quarterly requirement not fully met',
    compliancePercent: 75,
    keyStrengthOrGap: 'Strength',
    difficulty: 'Medium'
  },
  {
    id: 'cm11',
    controlId: 'c3',
    clause: 'CSF RC.RP-2',
    requirement: 'Protect the confidentiality of backups by implementing encryption and access controls',
    observation: 'Backup encryption implemented but access controls could be strengthened',
    compliancePercent: 70,
    keyStrengthOrGap: 'Gap',
    difficulty: 'High'
  }
];
