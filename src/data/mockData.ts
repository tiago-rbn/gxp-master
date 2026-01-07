// Mock data for CSVOne prototype

export interface System {
  id: string;
  name: string;
  vendor: string;
  version: string;
  type: 'COTS' | 'Configured' | 'Custom';
  gampCategory: 1 | 3 | 4 | 5;
  gxpImpact: 'Direct' | 'Indirect' | 'None';
  criticality: 'High' | 'Medium' | 'Low';
  validationStatus: 'Validated' | 'In Progress' | 'Pending' | 'Expired';
  responsible: string;
  lastValidation?: string;
  nextRevalidation?: string;
}

export interface RiskAssessment {
  id: string;
  systemId: string;
  systemName: string;
  type: 'IRA' | 'FRA';
  qualityImpact: 1 | 2 | 3;
  patientImpact: 1 | 2 | 3;
  dataImpact: 1 | 2 | 3;
  probability: 1 | 2 | 3;
  severity: 1 | 2 | 3;
  detectability: 1 | 2 | 3;
  riskLevel: 'High' | 'Medium' | 'Low';
  controls: string;
  residualRisk: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Mitigated' | 'Accepted';
  createdAt: string;
}

export interface ValidationProject {
  id: string;
  name: string;
  systemId: string;
  systemName: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
  progress: number;
  responsible: string;
  startDate: string;
  endDate: string;
  documents: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'URS' | 'FS' | 'DS' | 'IQ' | 'OQ' | 'PQ' | 'RTM' | 'Report';
  systemId: string;
  systemName: string;
  version: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Obsolete';
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  systemId: string;
  systemName: string;
  type: 'Enhancement' | 'Bug Fix' | 'Configuration' | 'Upgrade';
  gxpImpact: 'High' | 'Medium' | 'Low' | 'None';
  status: 'Requested' | 'Analysis' | 'Approved' | 'Implementing' | 'Completed' | 'Rejected';
  requester: string;
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Validator' | 'Responsible' | 'Reader';
  status: 'Active' | 'Inactive';
  lastAccess: string;
}

export const systems: System[] = [
  {
    id: '1',
    name: 'SAP ERP',
    vendor: 'SAP SE',
    version: 'S/4HANA 2023',
    type: 'Configured',
    gampCategory: 4,
    gxpImpact: 'Direct',
    criticality: 'High',
    validationStatus: 'Validated',
    responsible: 'João Silva',
    lastValidation: '2024-06-15',
    nextRevalidation: '2025-06-15',
  },
  {
    id: '2',
    name: 'LIMS',
    vendor: 'LabWare',
    version: '8.5.2',
    type: 'Configured',
    gampCategory: 4,
    gxpImpact: 'Direct',
    criticality: 'High',
    validationStatus: 'In Progress',
    responsible: 'Maria Santos',
    lastValidation: '2023-12-01',
    nextRevalidation: '2024-12-01',
  },
  {
    id: '3',
    name: 'Quality Management System',
    vendor: 'MasterControl',
    version: '2024.1',
    type: 'COTS',
    gampCategory: 4,
    gxpImpact: 'Direct',
    criticality: 'High',
    validationStatus: 'Validated',
    responsible: 'Ana Costa',
    lastValidation: '2024-03-20',
    nextRevalidation: '2025-03-20',
  },
  {
    id: '4',
    name: 'Environmental Monitoring',
    vendor: 'Vaisala',
    version: '4.2',
    type: 'COTS',
    gampCategory: 4,
    gxpImpact: 'Direct',
    criticality: 'Medium',
    validationStatus: 'Pending',
    responsible: 'Carlos Oliveira',
  },
  {
    id: '5',
    name: 'Document Management',
    vendor: 'DocuSign',
    version: 'Enterprise',
    type: 'COTS',
    gampCategory: 3,
    gxpImpact: 'Indirect',
    criticality: 'Medium',
    validationStatus: 'Validated',
    responsible: 'Lucia Ferreira',
    lastValidation: '2024-01-10',
    nextRevalidation: '2025-01-10',
  },
  {
    id: '6',
    name: 'Custom Lab Automation',
    vendor: 'Internal',
    version: '2.1.0',
    type: 'Custom',
    gampCategory: 5,
    gxpImpact: 'Direct',
    criticality: 'High',
    validationStatus: 'In Progress',
    responsible: 'Pedro Almeida',
  },
  {
    id: '7',
    name: 'Microsoft Windows Server',
    vendor: 'Microsoft',
    version: '2022',
    type: 'COTS',
    gampCategory: 1,
    gxpImpact: 'None',
    criticality: 'Low',
    validationStatus: 'Validated',
    responsible: 'TI Team',
    lastValidation: '2024-02-28',
    nextRevalidation: '2025-02-28',
  },
  {
    id: '8',
    name: 'Batch Record System',
    vendor: 'Werum',
    version: 'PAS-X 3.2',
    type: 'Configured',
    gampCategory: 4,
    gxpImpact: 'Direct',
    criticality: 'High',
    validationStatus: 'Expired',
    responsible: 'Fernando Lima',
    lastValidation: '2022-08-15',
    nextRevalidation: '2023-08-15',
  },
];

export const riskAssessments: RiskAssessment[] = [
  {
    id: '1',
    systemId: '1',
    systemName: 'SAP ERP',
    type: 'IRA',
    qualityImpact: 3,
    patientImpact: 2,
    dataImpact: 3,
    probability: 2,
    severity: 3,
    detectability: 2,
    riskLevel: 'High',
    controls: 'Audit trail, access control, backup procedures',
    residualRisk: 'Medium',
    status: 'Mitigated',
    createdAt: '2024-05-01',
  },
  {
    id: '2',
    systemId: '2',
    systemName: 'LIMS',
    type: 'IRA',
    qualityImpact: 3,
    patientImpact: 3,
    dataImpact: 3,
    probability: 2,
    severity: 3,
    detectability: 1,
    riskLevel: 'High',
    controls: 'Electronic signatures, data validation, SOPs',
    residualRisk: 'Low',
    status: 'Mitigated',
    createdAt: '2024-04-15',
  },
  {
    id: '3',
    systemId: '4',
    systemName: 'Environmental Monitoring',
    type: 'IRA',
    qualityImpact: 2,
    patientImpact: 2,
    dataImpact: 2,
    probability: 1,
    severity: 2,
    detectability: 1,
    riskLevel: 'Low',
    controls: 'Calibration, alarms, redundancy',
    residualRisk: 'Low',
    status: 'Accepted',
    createdAt: '2024-06-01',
  },
  {
    id: '4',
    systemId: '6',
    systemName: 'Custom Lab Automation',
    type: 'FRA',
    qualityImpact: 3,
    patientImpact: 2,
    dataImpact: 3,
    probability: 3,
    severity: 2,
    detectability: 2,
    riskLevel: 'High',
    controls: 'Code review, testing, validation protocols',
    residualRisk: 'Medium',
    status: 'Open',
    createdAt: '2024-07-10',
  },
  {
    id: '5',
    systemId: '8',
    systemName: 'Batch Record System',
    type: 'IRA',
    qualityImpact: 3,
    patientImpact: 3,
    dataImpact: 3,
    probability: 2,
    severity: 3,
    detectability: 2,
    riskLevel: 'High',
    controls: 'Revalidation needed',
    residualRisk: 'High',
    status: 'Open',
    createdAt: '2023-07-01',
  },
];

export const validationProjects: ValidationProject[] = [
  {
    id: '1',
    name: 'LIMS Upgrade Validation',
    systemId: '2',
    systemName: 'LIMS',
    status: 'In Progress',
    progress: 65,
    responsible: 'Maria Santos',
    startDate: '2024-08-01',
    endDate: '2024-11-30',
    documents: 12,
  },
  {
    id: '2',
    name: 'Custom Lab Automation Initial Validation',
    systemId: '6',
    systemName: 'Custom Lab Automation',
    status: 'Planning',
    progress: 15,
    responsible: 'Pedro Almeida',
    startDate: '2024-09-15',
    endDate: '2025-02-28',
    documents: 3,
  },
  {
    id: '3',
    name: 'Batch Record Revalidation',
    systemId: '8',
    systemName: 'Batch Record System',
    status: 'On Hold',
    progress: 0,
    responsible: 'Fernando Lima',
    startDate: '2024-10-01',
    endDate: '2025-01-31',
    documents: 0,
  },
  {
    id: '4',
    name: 'QMS Annual Review',
    systemId: '3',
    systemName: 'Quality Management System',
    status: 'Completed',
    progress: 100,
    responsible: 'Ana Costa',
    startDate: '2024-02-01',
    endDate: '2024-04-15',
    documents: 8,
  },
];

export const documents: Document[] = [
  { id: '1', name: 'LIMS URS v2.0', type: 'URS', systemId: '2', systemName: 'LIMS', version: '2.0', status: 'Approved', author: 'Maria Santos', createdAt: '2024-08-05', updatedAt: '2024-08-20' },
  { id: '2', name: 'LIMS Functional Specification', type: 'FS', systemId: '2', systemName: 'LIMS', version: '1.5', status: 'Approved', author: 'Maria Santos', createdAt: '2024-08-15', updatedAt: '2024-08-28' },
  { id: '3', name: 'LIMS IQ Protocol', type: 'IQ', systemId: '2', systemName: 'LIMS', version: '1.0', status: 'Approved', author: 'João Silva', createdAt: '2024-09-01', updatedAt: '2024-09-10' },
  { id: '4', name: 'LIMS OQ Protocol', type: 'OQ', systemId: '2', systemName: 'LIMS', version: '1.0', status: 'Review', author: 'João Silva', createdAt: '2024-09-15', updatedAt: '2024-09-20' },
  { id: '5', name: 'LIMS PQ Protocol', type: 'PQ', systemId: '2', systemName: 'LIMS', version: '0.5', status: 'Draft', author: 'Ana Costa', createdAt: '2024-10-01', updatedAt: '2024-10-05' },
  { id: '6', name: 'SAP ERP Validation Report', type: 'Report', systemId: '1', systemName: 'SAP ERP', version: '1.0', status: 'Approved', author: 'João Silva', createdAt: '2024-06-15', updatedAt: '2024-06-15' },
  { id: '7', name: 'Custom Lab URS', type: 'URS', systemId: '6', systemName: 'Custom Lab Automation', version: '1.0', status: 'Draft', author: 'Pedro Almeida', createdAt: '2024-09-20', updatedAt: '2024-10-01' },
  { id: '8', name: 'QMS RTM', type: 'RTM', systemId: '3', systemName: 'Quality Management System', version: '3.0', status: 'Approved', author: 'Ana Costa', createdAt: '2024-04-01', updatedAt: '2024-04-10' },
  { id: '9', name: 'Environmental Monitoring DS', type: 'DS', systemId: '4', systemName: 'Environmental Monitoring', version: '1.0', status: 'Draft', author: 'Carlos Oliveira', createdAt: '2024-07-01', updatedAt: '2024-07-15' },
  { id: '10', name: 'SAP ERP RTM', type: 'RTM', systemId: '1', systemName: 'SAP ERP', version: '2.5', status: 'Approved', author: 'João Silva', createdAt: '2024-05-20', updatedAt: '2024-06-10' },
];

export const changeRequests: ChangeRequest[] = [
  { id: '1', title: 'LIMS Report Module Enhancement', systemId: '2', systemName: 'LIMS', type: 'Enhancement', gxpImpact: 'Medium', status: 'Approved', requester: 'Maria Santos', createdAt: '2024-09-25', priority: 'Medium' },
  { id: '2', title: 'SAP ERP Security Patch', systemId: '1', systemName: 'SAP ERP', type: 'Bug Fix', gxpImpact: 'Low', status: 'Implementing', requester: 'TI Team', createdAt: '2024-10-01', priority: 'High' },
  { id: '3', title: 'Batch Record System Upgrade to v3.3', systemId: '8', systemName: 'Batch Record System', type: 'Upgrade', gxpImpact: 'High', status: 'Analysis', requester: 'Fernando Lima', createdAt: '2024-10-05', priority: 'High' },
  { id: '4', title: 'Environmental Monitoring Alarm Configuration', systemId: '4', systemName: 'Environmental Monitoring', type: 'Configuration', gxpImpact: 'Medium', status: 'Requested', requester: 'Carlos Oliveira', createdAt: '2024-10-10', priority: 'Low' },
];

export const users: User[] = [
  { id: '1', name: 'João Silva', email: 'joao.silva@empresa.com', role: 'Admin', status: 'Active', lastAccess: '2024-10-15 09:30' },
  { id: '2', name: 'Maria Santos', email: 'maria.santos@empresa.com', role: 'Validator', status: 'Active', lastAccess: '2024-10-15 10:15' },
  { id: '3', name: 'Ana Costa', email: 'ana.costa@empresa.com', role: 'Validator', status: 'Active', lastAccess: '2024-10-14 16:45' },
  { id: '4', name: 'Pedro Almeida', email: 'pedro.almeida@empresa.com', role: 'Responsible', status: 'Active', lastAccess: '2024-10-15 08:00' },
  { id: '5', name: 'Carlos Oliveira', email: 'carlos.oliveira@empresa.com', role: 'Responsible', status: 'Active', lastAccess: '2024-10-13 14:20' },
  { id: '6', name: 'Lucia Ferreira', email: 'lucia.ferreira@empresa.com', role: 'Reader', status: 'Active', lastAccess: '2024-10-10 11:00' },
  { id: '7', name: 'Fernando Lima', email: 'fernando.lima@empresa.com', role: 'Validator', status: 'Inactive', lastAccess: '2024-09-01 09:00' },
];

// Dashboard stats
export const dashboardStats = {
  totalSystems: systems.length,
  validatedSystems: systems.filter(s => s.validationStatus === 'Validated').length,
  highRisks: riskAssessments.filter(r => r.riskLevel === 'High' && r.status === 'Open').length,
  pendingChanges: changeRequests.filter(c => c.status !== 'Completed' && c.status !== 'Rejected').length,
  activeProjects: validationProjects.filter(p => p.status === 'In Progress').length,
  gampDistribution: {
    gamp1: systems.filter(s => s.gampCategory === 1).length,
    gamp3: systems.filter(s => s.gampCategory === 3).length,
    gamp4: systems.filter(s => s.gampCategory === 4).length,
    gamp5: systems.filter(s => s.gampCategory === 5).length,
  },
  projectStatus: {
    planning: validationProjects.filter(p => p.status === 'Planning').length,
    inProgress: validationProjects.filter(p => p.status === 'In Progress').length,
    review: validationProjects.filter(p => p.status === 'Review').length,
    completed: validationProjects.filter(p => p.status === 'Completed').length,
    onHold: validationProjects.filter(p => p.status === 'On Hold').length,
  },
};
