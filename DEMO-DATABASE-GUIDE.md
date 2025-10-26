# 🎯 Comprehensive Demo Database Setup Guide

## Overview

This guide explains how the demo database showcases all features of the Field Service Management application with realistic nationwide data.

## 📊 Demo Data Structure

### 🏢 **Company Codes**

The application now supports multi-tenant routing via company codes:

| Company Code | Database | Description |
|--------------|----------|-------------|
| `DCPSP` | FieldServiceDB | Production data (your real data) |
| `DEMO` | FieldServiceDB | Demo data with CompanyCode='DEMO' |
| `KIT` | FieldServiceDB | Demo data with CompanyCode='DEMO' (alias) |

**Future Companies**: Each new customer gets their own company code:
```javascript
// In server/api.cjs
const TENANT_DATABASE_MAP = {
  'DCPSP': 'FieldServiceDB',
  'DEMO': 'FieldServiceDB',
  'ACME-001': 'FieldServiceDB_ACME',      // Future: ACME Corp gets their own DB
  'TECHCORP': 'FieldServiceDB_TechCorp',  // Future: TechCorp gets their own DB
};
```

### 🗺️ **Geographic Coverage**

Demo data spans 8 states to demonstrate nationwide field service operations:

#### **California (CA)**
- **Customers**: Retail chain, Tech campus, Medical center
- **Technician**: Mike Chen (CA) - `demo-tech-ca`
- **Vendor**: CA Demo Vendor
- **Tickets**: Fire alarms, access control, CCTV, panic buttons

#### **Texas (TX)**
- **Customers**: Oil & Gas HQ, Shopping mall, University
- **Technician**: Jose Rodriguez (TX) - `demo-tech-tx`
- **Vendor**: TX Demo Vendor
- **Tickets**: Intrusion alarms, battery replacement, campus upgrades

#### **New York (NY)**
- **Customers**: Financial tower, Hotel group, Museum complex
- **Technician**: David Cohen (NY) - `demo-tech-ny`
- **Vendor**: NY Demo Vendor
- **Tickets**: Elevator cameras, safe malfunctions, motion sensors

#### **Florida (FL)**
- **Customers**: Resort hotels, Theme parks, Retirement community
- **Technician**: Maria Garcia (FL) - `demo-tech-fl`
- **Vendor**: FL Demo Vendor
- **Tickets**: Beach gate locks, ride cameras, medical alerts

#### **Illinois (IL)**
- **Customers**: Manufacturing plant, Airport complex
- **Technician**: John Smith (IL) - `demo-tech-il`
- **Vendor**: IL Demo Vendor
- **Tickets**: Loading dock sensors, TSA compliance

#### **Washington (WA)**
- **Customers**: Tech startup hub, Coffee chain HQ
- **Technician**: Emily Zhang (WA) - `demo-tech-wa`
- **Vendor**: WA Demo Vendor
- **Tickets**: Conference room integration, server room access

#### **Colorado (CO)**
- **Customers**: Ski resort, Data center
- **Technician**: Robert Martinez (CO) - `demo-tech-co`
- **Vendor**: CO Demo Vendor
- **Tickets**: Ski lift cameras, environmental monitoring

#### **Georgia (GA)**
- **Customers**: Distribution center, Medical campus
- **Technician**: Lisa Brown (GA) - `demo-tech-ga`
- **Vendor**: GA Demo Vendor
- **Tickets**: Forklift sensors, patient room monitors

## 👥 Demo Users

All demo users have password: `demo123` (base64 encoded in database)

### Administrative Users
- `demo-admin` - Administrator with full access
- `demo-coordinator` - Sarah Johnson, Coordinator role

### Regional Technicians (8 states)
```
demo-tech-ca  → Mike Chen (CA)      | CA Demo Vendor
demo-tech-tx  → Jose Rodriguez (TX) | TX Demo Vendor
demo-tech-ny  → David Cohen (NY)    | NY Demo Vendor
demo-tech-fl  → Maria Garcia (FL)   | FL Demo Vendor
demo-tech-il  → John Smith (IL)     | IL Demo Vendor
demo-tech-wa  → Emily Zhang (WA)    | WA Demo Vendor
demo-tech-co  → Robert Martinez (CO)| CO Demo Vendor
demo-tech-ga  → Lisa Brown (GA)     | GA Demo Vendor
```

### Vendor Managers
```
demo-vendor-ca  → CA Vendor Manager
demo-vendor-tx  → TX Vendor Manager
demo-vendor-ny  → NY Vendor Manager
```

## 🏢 Demo Customers (18 Total)

Each customer demonstrates different industry verticals:

- **Retail**: Shopping malls, retail chains
- **Healthcare**: Hospitals, medical centers, retirement communities
- **Technology**: Tech campuses, startup hubs, data centers
- **Education**: Universities, school districts
- **Hospitality**: Hotels, resorts, theme parks
- **Industrial**: Manufacturing plants, warehouses, oil & gas
- **Transportation**: Airports
- **Financial**: Office towers, corporate headquarters

## 📍 Demo Sites (27 Total)

- Each customer has 1-3 sites
- All sites have **real geocoordinates** for map visualization
- Realistic addresses per state

Example geocoordinates:
```
Los Angeles, CA:    34.0928, -118.3287
Houston, TX:        29.7604, -95.3698
New York, NY:       40.7074, -74.0113
Miami Beach, FL:    25.7907, -80.1300
```

## 🔐 Demo Licenses (22 Total)

Various security license types demonstrating the license management system:

- **Fire Alarm** - California State Fire Marshal
- **Burglar Alarm** - State security bureaus
- **Access Control** - County/city permits
- **Medical Alert** - Healthcare facility permits
- **High-Rise Security** - Building department permits
- **Industrial Security** - State DPS permits
- **Airport Security** - TSA/FAA compliance

## 🎫 Demo Tickets (35 Total)

Tickets demonstrate all features and statuses:

### By Status
- **New** (8 tickets) - Unassigned, awaiting scheduling
- **Scheduled** (10 tickets) - Assigned with future dates
- **In-Progress** (7 tickets) - Technicians actively working
- **Complete** (10 tickets) - Finished work with notes

### By Priority
- **Critical** (3 tickets) - Urgent issues (safe malfunction, medical alert)
- **High** (8 tickets) - Important but not emergent
- **Medium** (16 tickets) - Standard work orders
- **Low** (8 tickets) - Routine maintenance

### By Category
- Fire Alarm maintenance and inspections
- Access Control repairs and installations
- CCTV camera issues and installations
- Burglar Alarm false alarms and testing
- Medical Alert system failures
- System upgrades and integrations
- Annual inspections and compliance
- New installations

### Activity Logs
In-progress and complete tickets have:
- Creation logs
- Assignment logs
- Status change logs
- Technician notes with timestamps
- Completion summaries

### Customer Notes
Many tickets include:
- Customer context and urgency
- Special requirements
- Technical specifications
- Compliance requirements

## 🚀 Installation Steps

### 1. Load Demo Data to Azure

Run the batch file:
```batch
LOAD-DEMO-DATA.bat
```

Or run SQL scripts manually:
```batch
sqlcmd -S customer-portal-sql-server.database.windows.net ^
       -d FieldServiceDB ^
       -U %DB_USER% ^
       -P %DB_PASSWORD% ^
       -i database\create-comprehensive-demo-data.sql

sqlcmd -S customer-portal-sql-server.database.windows.net ^
       -d FieldServiceDB ^
       -U %DB_USER% ^
       -P %DB_PASSWORD% ^
       -i database\create-demo-tickets.sql
```

### 2. Deploy Updated API

The API now includes multi-tenant routing:

```bash
# Deploy backend
.\deploy-fix-kudu.ps1

# Or manually
az webapp restart --name field-service-api --resource-group customer-portal_group
```

### 3. Test Company Code Routing

#### Option A: Header-based routing
```javascript
fetch('https://field-service-api.azurewebsites.net/api/tickets', {
  headers: {
    'x-company-code': 'DEMO'
  }
})
```

#### Option B: Query parameter
```
https://field-service-api.azurewebsites.net/api/tickets?company=DEMO
```

#### Option C: Frontend integration
```typescript
// In your authService or API service
localStorage.setItem('companyCode', 'DEMO');

// API calls will include the company code
const companyCode = localStorage.getItem('companyCode') || 'DCPSP';
fetch(`${API_URL}/api/tickets?company=${companyCode}`);
```

## 🎯 Demo Scenarios to Showcase

### 1. **Geographic Distribution**
- Login as `demo-admin`
- View map with pins across all 8 states
- Show diversity of customer types and locations

### 2. **Technician Workflow**
- Login as `demo-tech-ca`
- See tickets assigned to California technician
- View in-progress ticket with activity log
- Demonstrate updating ticket status

### 3. **Coordinator Dashboard**
- Login as `demo-coordinator`
- See all tickets across all states
- Assign new tickets to regional technicians
- View activity across the organization

### 4. **Vendor Management**
- Login as `demo-vendor-ca`
- View only tickets for CA Demo Vendor
- See technicians from their vendor company

### 5. **License Management**
- View licenses across all states
- Show different licensing requirements per state
- Demonstrate expiring licenses (some set to expire soon)

### 6. **Status Progression**
- Show tickets in various stages:
  - New → Scheduled → In-Progress → Complete → Closed
- Demonstrate SLA tracking
- Show overdue tickets

### 7. **Priority Handling**
- Critical: Safe malfunction in NY hotel (guest locked out)
- High: Fire alarm fault in CA retail store
- Medium: Routine maintenance in TX
- Low: Scheduled upgrades in CO

### 8. **Multi-Industry Support**
- Healthcare: Medical alert systems
- Retail: Burglar alarms and CCTV
- Education: Campus-wide access control
- Hospitality: Hotel security systems
- Industrial: Manufacturing facility monitoring

## 🔧 Adding Future Tenants

When adding a new customer company:

### 1. Add to Tenant Map
```javascript
// server/api.cjs
const TENANT_DATABASE_MAP = {
  'DCPSP': 'FieldServiceDB',
  'DEMO': 'FieldServiceDB',
  'NEWCOMPANY': 'FieldServiceDB_NewCompany',  // ← Add new entry
};
```

### 2. Create Their Database (Optional - for separate DB)
```sql
-- Create database for new tenant
CREATE DATABASE FieldServiceDB_NewCompany;
GO

-- Copy schema from FieldServiceDB
-- Run create-database-complete.sql against new database

-- Populate with their data
USE FieldServiceDB_NewCompany;
-- Insert their users, customers, sites, etc.
```

### 3. OR Use Shared Database with CompanyCode
```sql
-- All data stays in FieldServiceDB
-- Just use CompanyCode='NEWCOMPANY' in all inserts
INSERT INTO Users (..., CompanyCode) VALUES (..., 'NEWCOMPANY');
INSERT INTO Customers (..., CompanyCode) VALUES (..., 'NEWCOMPANY');
```

### 4. Test Routing
```bash
curl https://field-service-api.azurewebsites.net/api/tickets?company=NEWCOMPANY
```

## 📱 Frontend Integration

### Setting Company Code on Login

```typescript
// In authService.ts
export const login = async (credentials: LoginCredentials) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  
  // Store company code from user data
  localStorage.setItem('companyCode', data.companyCode || 'DCPSP');
  localStorage.setItem('fieldservice_auth_user', JSON.stringify(data));
  
  return data;
};
```

### Including Company Code in API Calls

```typescript
// In SqlApiService.ts
private getHeaders(): HeadersInit {
  const user = authService.getCurrentUser();
  const companyCode = localStorage.getItem('companyCode') || 'DCPSP';
  
  return {
    'Content-Type': 'application/json',
    'x-company-code': companyCode,
    'x-user-id': user?.id || '',
    'x-user-fullname': user?.fullName || '',
    'x-user-role': user?.role || ''
  };
}
```

## 🧹 Cleanup

To remove all demo data:

```sql
-- Remove demo tickets
DELETE FROM Notes WHERE TicketID LIKE 'DEMO-%';
DELETE FROM ActivityLog WHERE TicketID LIKE 'DEMO-%';
DELETE FROM Attachments WHERE TicketID LIKE 'DEMO-%';
DELETE FROM Tickets WHERE TicketID LIKE 'DEMO-%';

-- Remove demo infrastructure
DELETE FROM Licenses WHERE CustomerID LIKE 'DEMO-%';
DELETE FROM Sites WHERE CustomerID LIKE 'DEMO-%';
DELETE FROM Customers WHERE CustomerID LIKE 'DEMO-%';
DELETE FROM Users WHERE Username LIKE 'demo-%';
```

## 🎓 Training Script

Use this script when demoing to prospects:

1. **Introduction** (2 min)
   - "This is a nationwide field service management system"
   - "We have technicians in 8 states managing security systems"
   - Show map with nationwide coverage

2. **Coordinator View** (3 min)
   - Login as demo-coordinator
   - Show dashboard with statistics
   - Show tickets in various states
   - Demonstrate assigning a new ticket

3. **Technician View** (3 min)
   - Login as demo-tech-ca
   - Show assigned tickets
   - Open in-progress ticket
   - Show activity log history
   - Demonstrate adding notes

4. **Customer Diversity** (2 min)
   - Show different customer types
   - Healthcare, retail, education, hospitality
   - Different license requirements per industry

5. **License Management** (2 min)
   - Show licenses across states
   - Different compliance requirements
   - Expiring licenses tracking

## 📊 Summary Statistics

- **Geographic Coverage**: 8 states
- **Total Demo Users**: 14 (3 admin + 8 techs + 3 vendors)
- **Total Customers**: 18 (across industries)
- **Total Sites**: 27 (with geocoordinates)
- **Total Licenses**: 22 (various types)
- **Total Tickets**: 35 (all statuses represented)
- **Activity Logs**: 30+ entries
- **Customer Notes**: 9 tickets with context

All demo data is clearly marked with:
- Username prefix: `demo-`
- Customer ID prefix: `DEMO-`
- Ticket ID prefix: `DEMO-`
- Company Code: `DEMO`

This makes it easy to identify and manage demo data separately from production data.
