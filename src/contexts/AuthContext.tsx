// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { UserManagementService } from '../services/UserManagementService';

interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  department?: string;
  jobTitle?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  graphClient: Client | null;
  msalInstance: PublicClientApplication | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  getUserRole: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID || "YOUR_CLIENT_ID_HERE",
    // Try using 'common' endpoint first, which works for any Azure AD tenant
    authority: import.meta.env.VITE_TENANT_ID ? 
      `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}` : 
      "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  }
};

const loginRequest = {
  scopes: [
    "User.Read",           // Sign in and read user profile
    "Sites.ReadWrite.All"  // Read and write SharePoint sites and lists
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [graphClient, setGraphClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [msalInstance] = useState(new PublicClientApplication(msalConfig));

  useEffect(() => {
    initializeAuth();
  }, []);

  // Expose auth context globally for API layer
  useEffect(() => {
    (window as any).__AUTH_CONTEXT__ = {
      isAuthenticated,
      user,
      graphClient,
      msalInstance
    };
  }, [isAuthenticated, user, graphClient, msalInstance]);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await msalInstance.initialize();
      const accounts = msalInstance.getAllAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        
        // Try to get access token silently
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account
          });
          
          setupGraphClient(response.accessToken);
          // Wait for graph client to be set up before loading profile
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadUserProfile();
          setIsAuthenticated(true);
        } catch (error) {
          console.log('Silent token acquisition failed, user needs to login');
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupGraphClient = (accessToken: string) => {
    const client = Client.init({
      authProvider: async (done) => {
        done(null, accessToken);
      }
    });
    setGraphClient(client);
    console.log('DEBUG: Graph client set up successfully');
  };

  const loadUserProfile = async () => {
    if (!graphClient) {
      console.log('DEBUG: Cannot load user profile - graphClient not available');
      return;
    }
    
    try {
      console.log('DEBUG: Loading user profile...');
      const profile = await graphClient.api('/me').get();
      console.log('DEBUG: User profile loaded:', profile.displayName);
      setUser({
        id: profile.id,
        displayName: profile.displayName,
        userPrincipalName: profile.userPrincipalName,
        mail: profile.mail,
        department: profile.department,
        jobTitle: profile.jobTitle
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response) {
        setIsAuthenticated(true);
        setupGraphClient(response.accessToken);
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await msalInstance.logoutPopup();
      setIsAuthenticated(false);
      setUser(null);
      setGraphClient(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserRole = (): string => {
    if (!user) return 'Viewer';
    
    // For demo purposes, assign roles based on job title or department
    // In production, this would come from SharePoint or Active Directory groups
    const jobTitle = user.jobTitle?.toLowerCase() || '';
    const department = user.department?.toLowerCase() || '';
    
    if (jobTitle.includes('admin') || jobTitle.includes('manager')) {
      return 'System Admin';
    } else if (department.includes('field') || jobTitle.includes('technician')) {
      return 'Field Technician';
    } else if (department.includes('operations')) {
      return 'Operations Staff';
    } else {
      return 'Viewer';
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Temporarily give all authenticated users full permissions for testing
    // TODO: Restore proper role-based permissions later
    if (isAuthenticated) {
      console.log('DEBUG: Granting permission', permission, 'to authenticated user');
      return true;
    }
    
    return false;
    
    /*
    if (!user) return false;
    
    const userRole = getUserRole();
    
    // Simple permission checking based on role hierarchy
    const rolePermissions: Record<string, string[]> = {
      'System Admin': ['users.manage', 'reports.view', 'tickets.manage', 'sites.manage'],
      'Field Manager': ['reports.view', 'tickets.manage', 'sites.view'],
      'Field Technician': ['tickets.update', 'tickets.view'],
      'Operations Staff': ['tickets.view', 'reports.view'],
      'Customer': ['tickets.view.own'],
      'Viewer': ['tickets.view.readonly']
    };
    
    return rolePermissions[userRole]?.includes(permission) || false;
    */
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        graphClient,
        msalInstance,
        login, 
        logout, 
        isLoading,
        hasPermission,
        getUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};