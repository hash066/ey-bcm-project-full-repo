import React, { createContext, useContext, useState, ReactNode } from 'react';

// Permission types
export type Permission =
  | 'BCM_VIEW_DASHBOARD'
  | 'BCM_EDIT_PLAN'
  | 'BCM_RUN_TEST'
  | 'CRM_VIEW_ACCOUNTS'
  | 'CRM_CREATE_LEAD'
  | 'CRM_DELETE_ACCOUNT'
  | 'SYS_MANAGE_USERS';

// Role types
export type Role = 'System Admin' | 'BCM Coordinator' | 'Sales Manager' | 'Viewer';

// User type
export interface User {
  email: string;
  role: Role;
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'System Admin': [
    'BCM_VIEW_DASHBOARD',
    'BCM_EDIT_PLAN',
    'BCM_RUN_TEST',
    'CRM_VIEW_ACCOUNTS',
    'CRM_CREATE_LEAD',
    'CRM_DELETE_ACCOUNT',
    'SYS_MANAGE_USERS',
  ],
  'BCM Coordinator': [
    'BCM_VIEW_DASHBOARD',
    'BCM_EDIT_PLAN',
    'BCM_RUN_TEST',
    'CRM_VIEW_ACCOUNTS',
  ],
  'Sales Manager': [
    'CRM_VIEW_ACCOUNTS',
    'CRM_CREATE_LEAD',
    'BCM_VIEW_DASHBOARD',
  ],
  'Viewer': ['BCM_VIEW_DASHBOARD', 'CRM_VIEW_ACCOUNTS'],
};

// Hardcoded users
const USERS: Record<string, User> = {
  'admin@ey.com': { email: 'admin@ey.com', role: 'System Admin' },
  'bcm_coord@ey.com': { email: 'bcm_coord@ey.com', role: 'BCM Coordinator' },
  'sales_mgr@ey.com': { email: 'sales_mgr@ey.com', role: 'Sales Manager' },
  'viewer@ey.com': { email: 'viewer@ey.com', role: 'Viewer' },
};

interface AuthContextType {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string): boolean => {
    const foundUser = USERS[email.toLowerCase()];
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const permissions = user ? ROLE_PERMISSIONS[user.role] : [];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, permissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
