// src/services/UserManagementService.ts
import { Client } from '@microsoft/microsoft-graph-client';

export interface SystemUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  department?: string;
  jobTitle?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
  assignedSites: string[];
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  name: 'System Admin' | 'Field Manager' | 'Field Technician' | 'Operations Staff' | 'Customer' | 'Viewer';
  description: string;
  permissions: string[];
}

export interface Permission {
  resource: 'Tickets' | 'Sites' | 'Customers' | 'Assets' | 'Reports' | 'Users';
  actions: ('Create' | 'Read' | 'Update' | 'Delete')[];
}

export class UserManagementService {
  private graphClient: Client;
  private readonly USER_ROLES_LIST = 'UserRoles';
  private readonly USER_PERMISSIONS_LIST = 'UserPermissions';
  
  // Default roles for the field service system
  private static DEFAULT_ROLES: UserRole[] = [
    {
      id: '1',
      name: 'System Admin',
      description: 'Full system access and user management',
      permissions: ['*'] // All permissions
    },
    {
      id: '2', 
      name: 'Field Manager',
      description: 'Manage tickets, technicians, and reports',
      permissions: ['Tickets.*', 'Sites.*', 'Customers.*', 'Assets.*', 'Reports.Read', 'Users.Read']
    },
    {
      id: '3',
      name: 'Field Technician', 
      description: 'View and update assigned tickets',
      permissions: ['Tickets.Read', 'Tickets.Update', 'Sites.Read', 'Assets.Read']
    },
    {
      id: '4',
      name: 'Operations Staff',
      description: 'Monitor operations and view reports',
      permissions: ['Tickets.Read', 'Sites.Read', 'Reports.Read']
    },
    {
      id: '5',
      name: 'Customer',
      description: 'View tickets for their sites only',
      permissions: ['Tickets.Read.Own', 'Sites.Read.Own']
    },
    {
      id: '6',
      name: 'Viewer',
      description: 'Read-only access to basic information',
      permissions: ['Tickets.Read', 'Sites.Read']
    }
  ];

  constructor(graphClient: Client) {
    this.graphClient = graphClient;
  }

  /**
   * Get all users from Azure AD with their system roles
   */
  async getAllUsers(): Promise<SystemUser[]> {
    try {
      // Get users from Azure AD
      const response = await this.graphClient
        .api('/users')
        .select('id,displayName,userPrincipalName,mail,department,jobTitle')
        .get();

      const users: SystemUser[] = [];
      
      for (const user of response.value) {
        // Get user's role from SharePoint list
        const userRole = await this.getUserRole(user.id);
        const assignedSites = await this.getUserSites(user.id);
        
        users.push({
          id: user.id,
          displayName: user.displayName,
          userPrincipalName: user.userPrincipalName,
          mail: user.mail,
          department: user.department,
          jobTitle: user.jobTitle,
          role: userRole,
          status: 'Active', // Could be enhanced to check actual status
          assignedSites: assignedSites,
          permissions: this.getRolePermissions(userRole.name)
        });
      }

      return users;
    } catch (error) {
      console.error('Failed to get users:', error);
      throw new Error('Failed to retrieve users from Azure AD');
    }
  }

  /**
   * Assign a role to a user
   */
  async assignUserRole(userId: string, roleName: UserRole['name']): Promise<void> {
    try {
      // Store user role assignment in SharePoint list
      await this.graphClient
        .api(`/sites/{site-id}/lists/${this.USER_ROLES_LIST}/items`)
        .post({
          fields: {
            UserId: userId,
            RoleName: roleName,
            AssignedDate: new Date().toISOString(),
            AssignedBy: 'Current User' // Could be enhanced to get current user
          }
        });
    } catch (error) {
      console.error('Failed to assign role:', error);
      throw new Error('Failed to assign role to user');
    }
  }

  /**
   * Remove role from user
   */
  async removeUserRole(userId: string): Promise<void> {
    try {
      // Find and remove user role assignment
      const items = await this.graphClient
        .api(`/sites/{site-id}/lists/${this.USER_ROLES_LIST}/items`)
        .filter(`fields/UserId eq '${userId}'`)
        .get();

      if (items.value.length > 0) {
        await this.graphClient
          .api(`/sites/{site-id}/lists/${this.USER_ROLES_LIST}/items/${items.value[0].id}`)
          .delete();
      }
    } catch (error) {
      console.error('Failed to remove user role:', error);
      throw new Error('Failed to remove role from user');
    }
  }

  /**
   * Assign sites to a user (for customers and technicians)
   */
  async assignUserSites(userId: string, siteIds: string[]): Promise<void> {
    try {
      // Remove existing site assignments
      await this.removeUserSites(userId);
      
      // Add new site assignments
      for (const siteId of siteIds) {
        await this.graphClient
          .api(`/sites/{site-id}/lists/UserSiteAssignments/items`)
          .post({
            fields: {
              UserId: userId,
              SiteId: siteId,
              AssignedDate: new Date().toISOString()
            }
          });
      }
    } catch (error) {
      console.error('Failed to assign sites:', error);
      throw new Error('Failed to assign sites to user');
    }
  }

  /**
   * Remove all site assignments for a user
   */
  async removeUserSites(userId: string): Promise<void> {
    try {
      const items = await this.graphClient
        .api(`/sites/{site-id}/lists/UserSiteAssignments/items`)
        .filter(`fields/UserId eq '${userId}'`)
        .get();

      for (const item of items.value) {
        await this.graphClient
          .api(`/sites/{site-id}/lists/UserSiteAssignments/items/${item.id}`)
          .delete();
      }
    } catch (error) {
      console.error('Failed to remove user sites:', error);
    }
  }

  /**
   * Check if user has permission for a specific action
   */
  hasPermission(user: SystemUser, resource: string, action: string): boolean {
    // System Admin has all permissions
    if (user.role.name === 'System Admin') {
      return true;
    }

    // Check specific permissions
    const permissionKey = `${resource}.${action}`;
    const hasWildcard = user.role.permissions.includes(`${resource}.*`) || 
                       user.role.permissions.includes('*');
    const hasSpecific = user.role.permissions.includes(permissionKey);

    return hasWildcard || hasSpecific;
  }

  /**
   * Get user's role (private helper)
   */
  private async getUserRole(userId: string): Promise<UserRole> {
    try {
      const items = await this.graphClient
        .api(`/sites/{site-id}/lists/${this.USER_ROLES_LIST}/items`)
        .filter(`fields/UserId eq '${userId}'`)
        .get();

      if (items.value.length > 0) {
        const roleName = items.value[0].fields.RoleName;
        return UserManagementService.DEFAULT_ROLES.find(r => r.name === roleName) || 
               UserManagementService.DEFAULT_ROLES[5]; // Default to Viewer
      }
      
      return UserManagementService.DEFAULT_ROLES[5]; // Default to Viewer
    } catch (error) {
      console.error('Failed to get user role:', error);
      return UserManagementService.DEFAULT_ROLES[5]; // Default to Viewer
    }
  }

  /**
   * Get user's assigned sites (private helper)
   */
  private async getUserSites(userId: string): Promise<string[]> {
    try {
      const items = await this.graphClient
        .api(`/sites/{site-id}/lists/UserSiteAssignments/items`)
        .filter(`fields/UserId eq '${userId}'`)
        .get();

      return items.value.map((item: any) => item.fields.SiteId);
    } catch (error) {
      console.error('Failed to get user sites:', error);
      return [];
    }
  }

  /**
   * Get permissions for a role (private helper)
   */
  private getRolePermissions(roleName: UserRole['name']): Permission[] {
    const rolePermissions: { [key in UserRole['name']]: Permission[] } = {
      'System Admin': [
        { resource: 'Tickets', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Sites', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Customers', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Assets', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Reports', actions: ['Read'] },
        { resource: 'Users', actions: ['Create', 'Read', 'Update', 'Delete'] }
      ],
      'Field Manager': [
        { resource: 'Tickets', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Sites', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Customers', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Assets', actions: ['Create', 'Read', 'Update', 'Delete'] },
        { resource: 'Reports', actions: ['Read'] },
        { resource: 'Users', actions: ['Read'] }
      ],
      'Field Technician': [
        { resource: 'Tickets', actions: ['Read', 'Update'] },
        { resource: 'Sites', actions: ['Read'] },
        { resource: 'Assets', actions: ['Read'] }
      ],
      'Operations Staff': [
        { resource: 'Tickets', actions: ['Read'] },
        { resource: 'Sites', actions: ['Read'] },
        { resource: 'Reports', actions: ['Read'] }
      ],
      'Customer': [
        { resource: 'Tickets', actions: ['Read'] },
        { resource: 'Sites', actions: ['Read'] }
      ],
      'Viewer': [
        { resource: 'Tickets', actions: ['Read'] },
        { resource: 'Sites', actions: ['Read'] }
      ]
    };

    return rolePermissions[roleName] || [];
  }

  /**
   * Get all available roles
   */
  getAvailableRoles(): UserRole[] {
    return UserManagementService.DEFAULT_ROLES;
  }
}