// API service for BCM Plan backend
const API_BASE_URL = 'http://localhost:8002';

class ApiService {
  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('brt_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }

  // Organizations
  async getOrganizations() {
    return this.get('/organizations/');
  }

  async createOrganization(organization) {
    return this.post('/organizations/', organization);
  }

  // Departments
  async getDepartments(organizationId = null) {
    const endpoint = organizationId 
      ? `/departments/?organization_id=${organizationId}` 
      : '/departments/';
    return this.get(endpoint);
  }

  async getDepartmentsWithStats(organizationId = null) {
    const endpoint = organizationId 
      ? `/bcm/departments/with-stats/?organization_id=${organizationId}` 
      : '/bcm/departments/with-stats/';
    return this.get(endpoint);
  }

  async createDepartment(department) {
    return this.post('/departments/', department);
  }

  // Dashboard Stats
  async getDashboardStats(organizationId = null) {
    const endpoint = organizationId 
      ? `/bcm/dashboard/stats?organization_id=${organizationId}` 
      : '/bcm/dashboard/stats';
    return this.get(endpoint);
  }

  // BIA Information
  async getBIAInformation(organizationId = null) {
    const endpoint = organizationId 
      ? `/bia-information/?organization_id=${organizationId}` 
      : '/bia-information/';
    return this.get(endpoint);
  }

  // Critical Staff
  async getCriticalStaff(organizationId = null) {
    const endpoint = organizationId 
      ? `/bcm/critical-staff?organization_id=${organizationId}` 
      : '/bcm/critical-staff';
    return this.get(endpoint);
  }

  // Processes
  async getProcesses(departmentId = null, subdepartmentId = null) {
    let endpoint = '/bcm/processes/?';
    const params = [];
    if (departmentId) params.push(`department_id=${departmentId}`);
    if (subdepartmentId) params.push(`subdepartment_id=${subdepartmentId}`);
    endpoint += params.join('&');
    return this.get(endpoint);
  }

  // BIA Process Info
  async getBIAProcessInfo(processId = null) {
    const endpoint = processId 
      ? `/bia-process-info/?process_id=${processId}` 
      : '/bia-process-info/';
    return this.get(endpoint);
  }

  // Recovery Strategies Stats
  async getRecoveryStrategiesStats() {
    return this.get('/bcm/recovery-strategies/stats');
  }

  // Audit Trail
  async getAuditTrail(limit = 10) {
    return this.get(`/bcm/audit-trail?limit=${limit}`);
  }

  // Upcoming Reviews
  async getUpcomingReviews() {
    return this.get('/bcm/upcoming-reviews');
  }

  // Generate BCM PDF
  async generateBCMPdf(organizationId = null) {
    const endpoint = organizationId 
      ? `/bcm/generate-pdf?organization_id=${organizationId}` 
      : '/bcm/generate-pdf';
    return this.post(endpoint, {});
  }

  // Test database connection
  async testConnection() {
    return this.get('/bcm/test-connection');
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export default new ApiService();
