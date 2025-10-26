# User Management System Setup Guide

## Overview
Your field service application now includes a comprehensive user management system with Azure AD authentication and SharePoint integration. This allows you to manage user access within the app while leveraging your existing Microsoft 365 infrastructure.

## ✅ What's Been Implemented

### Authentication System
- **Azure AD Integration**: Single sign-on using Microsoft 365 accounts
- **MSAL Browser**: Modern authentication library for secure token handling
- **Microsoft Graph API**: Direct integration with SharePoint and user directory
- **Session Management**: Persistent login with automatic token refresh

### User Management Features
- **Role-Based Access Control**: 6 predefined roles with specific permissions
- **Built-in Admin Interface**: Manage users directly within the application
- **Permission System**: Fine-grained control over features and data access
- **Site Assignment**: Assign users to specific locations/sites
- **Azure AD Sync**: Pull user information from your existing directory

### User Roles & Permissions

| Role | Permissions | Description |
|------|-------------|-------------|
| **System Admin** | users.manage, reports.view, tickets.manage, sites.manage | Full system access including user management |
| **Field Manager** | reports.view, tickets.manage, sites.view | Manage tickets and view reporting data |
| **Field Technician** | tickets.update, tickets.view | Update and view assigned tickets |
| **Operations Staff** | tickets.view, reports.view | Monitor operations and view reports |
| **Customer** | tickets.view.own | View only their own tickets |
| **Viewer** | tickets.view.readonly | Read-only access to ticket information |

### Application Features
- **Smart Navigation**: Users tab only appears for System Admins
- **Conditional UI**: New ticket button only shown to users with ticket.manage permission
- **User Profile Display**: Shows current user name and role in header
- **Secure Logout**: Proper session cleanup on logout

## 🚀 Getting Started

### Step 1: Azure App Registration
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click **New registration**
3. Configure:
   - **Name**: "DCPSP Field Service App"
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: `http://localhost:5176` (for development)
4. Note down the **Application (client) ID** and **Directory (tenant) ID**

### Step 2: Configure API Permissions
In your app registration:
1. Go to **API permissions**
2. Add these Microsoft Graph permissions:
   - `Sites.ReadWrite.All` (for SharePoint lists)
   - `User.Read` (for user profile)
   - `User.ReadBasic.All` (for user management)
   - `Directory.Read.All` (for user directory access)
3. Click **Grant admin consent**

### Step 3: Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your values:
```env
VITE_CLIENT_ID=your-app-registration-client-id
VITE_TENANT_ID=your-azure-ad-tenant-id
VITE_SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/fieldservice
```

### Step 4: Run the Application
```bash
npm install
npm run dev
```

### Step 5: Test Authentication
1. Navigate to `http://localhost:5176`
2. You should see the login page
3. Click "Sign in with Microsoft"
4. Complete the Microsoft login flow
5. You should be redirected to the main application

## 🎯 Current Status

### ✅ Completed Features
- [x] Azure AD authentication with MSAL
- [x] Microsoft Graph integration
- [x] Role-based permission system
- [x] User management interface
- [x] Login/logout functionality
- [x] Permission-based UI elements
- [x] Environment configuration
- [x] Build and development testing

### 🔄 Next Steps
- [ ] Create SharePoint lists structure
- [ ] Implement SharePoint data operations
- [ ] Add real-time user synchronization
- [ ] Deploy to production environment

## 🔧 Technical Architecture

### Authentication Flow
```
User → Login Page → Azure AD → MSAL Token → Graph Client → Application
```

### Key Files
- `src/contexts/AuthContext.tsx`: Authentication state management
- `src/components/LoginPage.tsx`: Microsoft 365 branded login interface
- `src/components/UserManagementPage.tsx`: Admin interface for user management
- `src/services/UserManagementService.ts`: User role and permission logic
- `src/components/Nav.tsx`: Permission-aware navigation

### Permission System
The app uses a hierarchical permission model where each role inherits specific capabilities. Permissions are checked throughout the UI to show/hide features and control access to functionality.

## 🚀 Production Deployment

For production deployment:
1. Update redirect URIs in Azure App Registration
2. Configure production environment variables
3. Set up SharePoint lists (see SHAREPOINT_MIGRATION_GUIDE.md)
4. Deploy to your hosting platform
5. Test authentication flow in production

## 🔒 Security Features

- **Token-based authentication**: No passwords stored in application
- **Automatic token refresh**: Seamless session management
- **Permission-based access**: Users only see what they're authorized to access
- **Secure logout**: Proper session termination
- **Microsoft security**: Leverages enterprise-grade Azure AD security

Your field service application now has enterprise-ready user management that integrates seamlessly with your existing Microsoft 365 infrastructure!