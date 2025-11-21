import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { User, RoleInfo, UserStats } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Store token
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Store user
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear auth data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    delete axios.defaults.headers.common['Authorization'];
  }

  // Login
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await axios.post<TokenResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = response.data.access_token;
      this.setToken(token);

      // Get user info
      const userResponse = await axios.get<User>(API_ENDPOINTS.AUTH.ME);
      const user = userResponse.data;
      this.setUser(user);

      return { user, token };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await axios.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get<User>(API_ENDPOINTS.AUTH.ME);
      const user = response.data;
      this.setUser(user);
      return user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        this.clearAuth();
        return null;
      }
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await axios.get<UserStats>(API_ENDPOINTS.AUTH.STATS);
    return response.data;
  }

  // Get available roles
  async getRoles(): Promise<RoleInfo[]> {
    const response = await axios.get<RoleInfo[]>(API_ENDPOINTS.AUTH.ROLES);
    return response.data;
  }

  // Check permissions
  async checkPermissions(requiredRole: string): Promise<{ has_permission: boolean }> {
    const response = await axios.get(`${API_ENDPOINTS.AUTH.ROLES}/permissions/check?required_role=${requiredRole}`);
    return response.data;
  }

  // Register new user (admin only)
  async registerUser(userData: {
    email: string;
    name: string;
    role: string;
    department: string;
    organization: string;
    password: string;
  }): Promise<User> {
    const response = await axios.post<User>(API_ENDPOINTS.AUTH.USERS, userData);
    return response.data;
  }

  // Get all users (admin only)
  async getUsers(): Promise<User[]> {
    const response = await axios.get<User[]>(API_ENDPOINTS.AUTH.USERS);
    return response.data;
  }

  // Update user (admin only)
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response = await axios.put<User>(`${API_ENDPOINTS.AUTH.USERS}/${userId}`, userData);
    return response.data;
  }

  // Delete user (admin only)
  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_ENDPOINTS.AUTH.USERS}/${userId}`);
    return response.data;
  }

  // Initialize axios with auth token
  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  // Check if user has role
  hasRole(user: User | null, role: string): boolean {
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(user: User | null, roles: string[]): boolean {
    return user ? roles.includes(user.role) : false;
  }

  // Check if user can approve for a role
  canApproveForRole(user: User | null, targetRole: string): boolean {
    if (!user) return false;

    const roleHierarchy: Record<string, number> = {
      process_owner: 1,
      department_head: 2,
      organization_head: 3,
      ey_admin: 4,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;

    return userLevel > targetLevel;
  }

  // Get user permissions
  getUserPermissions(user: User | null): Record<string, boolean> {
    if (!user) {
      return {
        can_create_users: false,
        can_approve_requests: false,
        can_manage_frameworks: false,
        can_approve_frameworks: false,
        can_delete_frameworks: false,
        can_view_all_users: false,
        can_view_dashboard: false,
        can_submit_clause_edits: false,
        can_submit_framework_additions: false,
        can_escalate_requests: false,
      };
    }

    return {
      can_create_users: this.canApproveForRole(user, 'department_head'),
      can_approve_requests: this.canApproveForRole(user, 'process_owner'),
      can_manage_frameworks: this.canApproveForRole(user, 'department_head'),
      can_approve_frameworks: this.canApproveForRole(user, 'organization_head'),
      can_delete_frameworks: this.hasRole(user, 'ey_admin'),
      can_view_all_users: this.canApproveForRole(user, 'department_head'),
      can_view_dashboard: true,
      can_submit_clause_edits: this.hasRole(user, 'process_owner'),
      can_submit_framework_additions: this.canApproveForRole(user, 'department_head'),
      can_escalate_requests: this.hasRole(user, 'ey_admin'),
    };
  }
}

export const authService = new AuthService();
export default authService;
