# Multi-Tenant Implementation Guide

## Overview
This guide explains how to implement multi-tenant functionality where:
1. Multiple companies share the same database
2. Data is separated by `CompanyCode`
3. Service requests can be submitted to specific companies
4. Each company manages only their own data

## Step 1: Database Setup

### Run the SQL script to create Companies table:
```sql
-- Located at: database/create-companies-table.sql
```

This creates:
- `Companies` table with company information
- Indexes for performance
- Initial DCPSP company record

## Step 2: Backend API (Already Implemented)

### Company Management Endpoints (in server/api.cjs):
- `GET /api/companies` - List all companies
- `GET /api/companies/active` - Get companies for service request dropdown
- `GET /api/companies/:code` - Get specific company
- `POST /api/companies` - Create new company
- `PUT /api/companies/:code` - Update company
- `DELETE /api/companies/:code` - Soft delete (deactivate) company

### Required: Add Company Code Middleware
Add this middleware to filter all data by user's company:

```javascript
// Middleware to set company code from authenticated user
const setCompanyContext = async (req, res, next) => {
  try {
    // Get company code from user's token/session
    const userId = req.headers['x-user-id'];
    if (userId) {
      const result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query('SELECT CompanyCode FROM Users WHERE UserID = @userId');
      
      if (result.recordset.length > 0) {
        req.companyCode = result.recordset[0].CompanyCode;
      }
    }
    next();
  } catch (err) {
    console.error('Error setting company context:', err);
    next();
  }
};

// Apply to all data endpoints
app.use('/api/tickets', setCompanyContext);
app.use('/api/customers', setCompanyContext);
app.use('/api/sites', setCompanyContext);
// ... etc
```

### Update All Query Endpoints
Add `WHERE CompanyCode = @companyCode` to all SELECT queries:

```javascript
// Example: GET /api/tickets
app.get('/api/tickets', async (req, res) => {
  const companyCode = req.companyCode || 'DCPSP';
  
  const result = await pool.request()
    .input('companyCode', sql.VarChar, companyCode)
    .query('SELECT * FROM Tickets WHERE CompanyCode = @companyCode ORDER BY CreatedAt DESC');
  
  res.json(result.recordset);
});
```

## Step 3: Frontend - Company Management UI

### Create CompanyManagementPage.tsx:
```typescript
// Features needed:
// 1. List all companies in a table
// 2. Add new company form
// 3. Edit company details
// 4. Toggle active/inactive status
// 5. Toggle AllowServiceRequests flag
```

### Add to Admin Navigation:
```typescript
// In Nav.tsx or main navigation
{currentUser?.role === 'Admin' && (
  <button onClick={() => setTab('Companies')}>
    🏢 Companies
  </button>
)}
```

## Step 4: Service Request Portal with Company Selection

### Update Customer Portal Form:
```typescript
// In customer portal or service request form:

const [companies, setCompanies] = useState([]);
const [selectedCompany, setSelectedCompany] = useState('');

// Load active companies on mount
useEffect(() => {
  fetch('https://field-service-api.azurewebsites.net/api/companies/active')
    .then(res => res.json())
    .then(data => setCompanies(data));
}, []);

// In form:
<select 
  value={selectedCompany} 
  onChange={(e) => setSelectedCompany(e.target.value)}
  required
>
  <option value="">Select your integrator...</option>
  {companies.map(company => (
    <option key={company.CompanyCode} value={company.CompanyCode}>
      {company.DisplayName}
    </option>
  ))}
</select>
```

### Create Service Request Endpoint:
```javascript
// In server/api.cjs - add this endpoint:

app.post('/api/service-requests', async (req, res) => {
  try {
    const {
      companyCode,  // From dropdown selection
      customerName,
      customerEmail,
      customerPhone,
      siteName,
      address,
      description,
      priority = 'Medium',
      requestType = 'Service Request'
    } = req.body;

    if (!companyCode) {
      return res.status(400).json({ error: 'Company selection is required' });
    }

    // Verify company exists and accepts service requests
    const companyCheck = await pool.request()
      .input('code', sql.NVarChar, companyCode)
      .query('SELECT * FROM Companies WHERE CompanyCode = @code AND IsActive = 1 AND AllowServiceRequests = 1');
    
    if (companyCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive company' });
    }

    const requestId = `SR-${Date.now()}`;
    
    await pool.request()
      .input('requestId', sql.NVarChar, requestId)
      .input('companyCode', sql.NVarChar, companyCode)
      .input('customerName', sql.NVarChar, customerName)
      .input('customerEmail', sql.NVarChar, customerEmail)
      .input('customerPhone', sql.NVarChar, customerPhone)
      .input('siteName', sql.NVarChar, siteName)
      .input('address', sql.NVarChar, address)
      .input('description', sql.NVarChar, description)
      .input('priority', sql.NVarChar, priority)
      .input('requestType', sql.NVarChar, requestType)
      .input('status', sql.NVarChar, 'New')
      .query(`
        INSERT INTO ServiceRequests (
          RequestID, CompanyCode, CustomerName, CustomerEmail, CustomerPhone,
          SiteName, Address, Description, Priority, RequestType, Status,
          CreatedAt, UpdatedAt
        )
        VALUES (
          @requestId, @companyCode, @customerName, @customerEmail, @customerPhone,
          @siteName, @address, @description, @priority, @requestType, @status,
          GETDATE(), GETDATE()
        )
      `);

    res.status(201).json({ 
      success: true, 
      requestId,
      message: `Service request submitted to ${companyCheck.recordset[0].DisplayName}` 
    });
  } catch (err) {
    console.error('Error creating service request:', err);
    res.status(500).json({ error: err.message });
  }
});
```

## Step 5: Testing

### 1. Create Companies Table
Run the SQL script in SSMS

### 2. Add Test Company
```javascript
POST /api/companies
{
  "companyCode": "TESTCO",
  "companyName": "Test Company Inc",
  "displayName": "Test Company",
  "contactEmail": "support@testco.com",
  "isActive": true,
  "allowServiceRequests": true
}
```

### 3. Create Test User for New Company
```sql
INSERT INTO Users (UserID, Username, PasswordHash, Email, FullName, Role, CompanyCode, IsActive)
VALUES ('test_001', 'testuser', 'YWJjMTIz', 'test@testco.com', 'Test User', 'Admin', 'TESTCO', 1);
```

### 4. Test Login
- Login as testuser should only see TESTCO data
- Login as admin should only see DCPSP data

### 5. Test Service Request
- Open service request form
- Select company from dropdown
- Submit request
- Verify it appears in selected company's queue only

## Step 6: Deployment

1. Run database migration (create-companies-table.sql) in Azure SQL
2. Deploy updated API to Azure App Service
3. Deploy updated frontend to Azure Static Web Apps
4. Test in production

## Security Notes

1. **Always filter by CompanyCode** - Never return cross-company data
2. **Validate company access** - Ensure users can't switch companies by manipulating headers
3. **Service request validation** - Only allow submissions to active companies
4. **Admin controls** - Only admins should manage companies

## Next Steps

Would you like me to:
1. Create the frontend CompanyManagementPage component?
2. Add the company context middleware to the API?
3. Update all existing queries to filter by CompanyCode?
4. Create the service request form with company dropdown?

Let me know which part you'd like to implement first!
