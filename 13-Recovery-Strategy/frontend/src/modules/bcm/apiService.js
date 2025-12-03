// API service for BCM Plan backend
const API_BASE_URL = 'http://localhost:8003';

class ApiService {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      ? `/departments/with-stats/?organization_id=${organizationId}` 
      : '/departments/with-stats/';
    return this.get(endpoint);
  }

  async createDepartment(department) {
    return this.post('/departments/', department);
  }

  // Dashboard Stats
  async getDashboardStats(organizationId = null) {
    const endpoint = organizationId 
      ? `/dashboard/stats?organization_id=${organizationId}` 
      : '/dashboard/stats';
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
      ? `/critical-staff/?organization_id=${organizationId}` 
      : '/critical-staff/';
    return this.get(endpoint);
  }

  // Processes
  async getProcesses(subdepartmentId = null) {
    const endpoint = subdepartmentId 
      ? `/processes/?subdepartment_id=${subdepartmentId}` 
      : '/processes/';
    return this.get(endpoint);
  }

  // BIA Process Info
  async getBIAProcessInfo(processId = null) {
    const endpoint = processId 
      ? `/bia-process-info/?process_id=${processId}` 
      : '/bia-process-info/';
    return this.get(endpoint);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export default new ApiService();
