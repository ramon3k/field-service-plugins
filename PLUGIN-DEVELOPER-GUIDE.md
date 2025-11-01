# Plugin Developer Guide - Field Service System

## Overview
This guide documents the existing database schema, API endpoints, and system resources available to plugin developers. The principle is **plugins should integrate with existing system resources** rather than creating new tables or APIs when existing ones can serve the need.

## Database Schema

### Core Tables Available for Plugin Integration

#### Users Table
```sql
CREATE TABLE Users (
    ID NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Coordinator', 'Technician')),
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    Permissions NVARCHAR(MAX) -- JSON array of permissions
);
```
**Plugin Integration**: Use for user authentication, role-based features, activity tracking

#### Customers Table
```sql
CREATE TABLE Customers (
    CustomerID NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Reference for customer-specific features, contact information

#### Sites Table
```sql
CREATE TABLE Sites (
    SiteID NVARCHAR(50) PRIMARY KEY,
    CustomerID NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    GeoLocation NVARCHAR(50), -- "lat,lng" format
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```
**Plugin Integration**: Location-based features, site-specific data, mapping

#### Assets Table
```sql
CREATE TABLE Assets (
    AssetID NVARCHAR(50) PRIMARY KEY,
    SiteID NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(100),
    Model NVARCHAR(100),
    SerialNumber NVARCHAR(100),
    InstallDate DATE,
    WarrantyExpiration DATE,
    Status NVARCHAR(50) DEFAULT 'Active',
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (SiteID) REFERENCES Sites(SiteID)
);
```
**Plugin Integration**: Asset tracking, maintenance scheduling, equipment history

#### Tickets Table (Main Workflow)
```sql
CREATE TABLE Tickets (
    TicketID NVARCHAR(50) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'New', -- 'New', 'Scheduled', 'In-Progress', 'On-Hold', 'Complete', 'Closed'
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Critical'
    Customer NVARCHAR(200) NOT NULL,
    Site NVARCHAR(200) NOT NULL,
    AssetIDs NVARCHAR(MAX), -- Comma-separated asset IDs
    Category NVARCHAR(100),
    Description NVARCHAR(MAX) NOT NULL,
    ScheduledStart DATETIME2,
    ScheduledEnd DATETIME2,
    AssignedTo NVARCHAR(200),
    Owner NVARCHAR(100) DEFAULT 'Operations Coordinator',
    SLA_Due DATETIME2,
    Resolution NVARCHAR(MAX),
    ClosedBy NVARCHAR(100),
    ClosedDate DATETIME2,
    GeoLocation NVARCHAR(50), -- "lat,lng" format
    Tags NVARCHAR(500), -- Comma-separated tags
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Main workflow integration, task management, scheduling

#### Vendors Table
```sql
CREATE TABLE Vendors (
    VendorID NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Contact NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    ServiceAreas NVARCHAR(MAX), -- JSON array
    Specialties NVARCHAR(MAX), -- JSON array
    Rating DECIMAL(3,2),
    ServicesTexas BIT DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
```
**Plugin Integration**: Vendor management, contractor assignment, service area filtering

#### Activity/Audit Tables
```sql
CREATE TABLE CoordinatorNotes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    Note NVARCHAR(MAX) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);

CREATE TABLE AuditTrail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID NVARCHAR(50) NOT NULL,
    AuditID NVARCHAR(50) NOT NULL,
    Timestamp DATETIME2 NOT NULL,
    UserName NVARCHAR(100) NOT NULL,
    Action NVARCHAR(200) NOT NULL,
    Field NVARCHAR(100),
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    FOREIGN KEY (TicketID) REFERENCES Tickets(TicketID)
);
```
**Plugin Integration**: Activity logging, change tracking, communication history

## Available API Endpoints

### Authentication & User Management
- `GET /api/users` - Get all users
- User context automatically included in headers (`x-user-id`, `x-user-role`, `x-company-code`)

### Tickets & Workflow
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get specific ticket
- `DELETE /api/tickets/:id` - Delete ticket
- Tickets include embedded `CoordinatorNotes` and `AuditTrail`

### Customer & Site Management
- `GET /api/customers` - Get all customers
- `GET /api/sites` - Get all sites
- `DELETE /api/sites/:id` - Delete site

### Asset Management
- Assets are referenced in tickets via `AssetIDs` field
- Site relationships maintained through foreign keys

### Vendor Management
- `GET /api/vendors` - Get all vendors
- `DELETE /api/vendors/:id` - Delete vendor

### License Management (Existing Business Logic)
- `GET /api/licenses` - Get all licenses
- `GET /api/licenses/:id` - Get specific license
- `GET /api/licenses/site/:customer/:site` - Get licenses by site
- `DELETE /api/licenses/:id` - Delete license

### Activity & Logging
- `GET /api/activity-log` - Get activity log entries

## Multi-Tenant Support

### Company Code Isolation
All API requests automatically include `x-company-code` header for data isolation. The system supports:
- Company-specific data separation
- Automatic company context in all operations
- User-company relationships

### Headers Automatically Included
```typescript
headers: {
  'x-user-id': 'current-user-id',
  'x-user-name': 'current-user-name', 
  'x-user-role': 'Admin|Coordinator|Technician',
  'x-company-code': 'company-identifier',
  'x-company-name': 'company-display-name'
}
```

## Plugin Development Best Practices

### 1. Leverage Existing Resources First
- **Before creating new tables**: Check if existing tables can store your data
- **Before creating new APIs**: Check if existing endpoints can be extended
- **Use existing relationships**: CustomerID → SiteID → AssetID hierarchy

### 2. Integration Patterns

#### Example: Asset Monitoring Plugin
```typescript
// ✅ GOOD: Use existing assets table
const assets = await fetch('/api/sites').then(r => r.json())
const assetIds = assets.flatMap(site => site.assets || [])

// ❌ AVOID: Creating new asset table
// CREATE TABLE PluginAssets (...)
```

#### Example: Communication Plugin
```typescript
// ✅ GOOD: Extend existing ticket communication
const ticket = await fetch(`/api/tickets/${ticketId}`).then(r => r.json())
const notes = ticket.CoordinatorNotes || []

// ✅ GOOD: Use existing user context
headers['x-user-id'] // Available automatically
headers['x-company-code'] // Available automatically
```

### 3. Data Storage Strategies

#### Extend Existing Tables
```sql
-- Add plugin-specific columns to existing tables
ALTER TABLE Sites ADD PluginData NVARCHAR(MAX) -- JSON for plugin-specific data
ALTER TABLE Tickets ADD PluginFlags NVARCHAR(500) -- Plugin-specific flags
```

#### Use JSON Fields for Plugin Data
```sql
-- Store plugin configuration in existing JSON fields
UPDATE Sites SET Notes = JSON_MODIFY(Notes, '$.pluginConfig', @pluginData)
UPDATE Tickets SET Tags = Tags + ',plugin:feature-name'
```

#### Reference Existing IDs
```sql
-- Create plugin tables that reference existing entities
CREATE TABLE PluginUserPreferences (
    UserID NVARCHAR(50) NOT NULL, -- References Users.ID
    PluginName NVARCHAR(100) NOT NULL,
    Settings NVARCHAR(MAX), -- JSON configuration
    FOREIGN KEY (UserID) REFERENCES Users(ID)
)
```

### 4. Plugin Architecture Guidelines

#### Self-Contained Plugins
- Plugin files should include all necessary frontend components
- Minimal core application modifications
- Plugin-specific API endpoints prefixed: `/api/plugins/{plugin-name}/`

#### Use Existing UI Patterns
- Follow existing React component patterns
- Use existing styling and themes
- Integrate with existing navigation

#### Company-Aware Development
- All plugin data must respect `x-company-code` isolation
- Test with multiple company codes
- Handle company switching gracefully

## Common Integration Scenarios

### 1. User Activity Tracking
```typescript
// Use existing user context and audit trail patterns
const logActivity = async (action: string, details: any) => {
  const response = await fetch('/api/audit-trail', {
    method: 'POST',
    headers: buildHeaders('application/json'),
    body: JSON.stringify({
      action: `plugin:${pluginName}:${action}`,
      details: JSON.stringify(details)
    })
  })
}
```

### 2. Site-Specific Features
```typescript
// Leverage existing site data
const sites = await fetch('/api/sites').then(r => r.json())
const siteData = sites.find(s => s.SiteID === targetSiteId)
// Use siteData.GeoLocation, siteData.Contact, etc.
```

### 3. Customer Integration
```typescript
// Reference existing customer relationships
const customers = await fetch('/api/customers').then(r => r.json()) 
const customer = customers.find(c => c.CustomerID === targetCustomerId)
// Use customer.Contact, customer.Email for notifications
```

### 4. Ticket Workflow Integration
```typescript
// Extend existing ticket workflow
const tickets = await fetch('/api/tickets').then(r => r.json())
const activeTickets = tickets.filter(t => ['New', 'Scheduled', 'In-Progress'].includes(t.Status))
// Plugin can add workflow steps, notifications, etc.
```

## Development Environment Setup

### Local Database Access
1. Use SQL Server Express (local development)
2. Connection string available in application configuration
3. Database name: `FieldServiceDB`
4. All tables and indexes already created

### API Service Integration
1. Import existing `SqlApiService.ts` for database operations
2. Headers automatically managed for authentication and company context
3. Error handling and response processing already implemented

### Testing Multi-Tenancy
1. Create test users with different `companyCode` values
2. Verify data isolation between companies
3. Test plugin functionality across company boundaries

## Security Considerations

### Authentication
- User authentication handled by core application
- Plugin inherits user context and permissions
- Role-based access: Admin, Coordinator, Technician

### Data Access
- Respect existing role-based permissions
- Company-code isolation enforced automatically
- Sensitive data (passwords, etc.) already protected

### API Security
- All requests include authentication headers
- Rate limiting and error handling in place
- SQL injection protection through parameterized queries

## Migration Strategy

### Upgrading Existing Plugins
1. **Audit current plugin tables**: Identify data that could use existing tables
2. **Map to existing schema**: Plan data migration to existing tables
3. **Update API calls**: Switch to existing endpoints where possible
4. **Test thoroughly**: Ensure company isolation and data integrity

### New Plugin Development
1. **Start with existing schema**: Design around existing tables first
2. **Minimal new tables**: Only create new tables when absolutely necessary
3. **Reference existing IDs**: Always use foreign keys to existing entities
4. **Follow naming conventions**: Plugin tables should be clearly identified

This approach ensures plugins integrate seamlessly with the existing system while maintaining data consistency and multi-tenant isolation.