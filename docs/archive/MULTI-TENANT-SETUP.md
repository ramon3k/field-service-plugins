# Multi-Tenant Setup Guide

## Overview
This guide will help you set up multi-tenancy for your Field Service Management application, allowing you to have separate databases for production, demo, and different clients.

## Architecture
- **Tenant Registry Database**: Central database that maps company codes to their specific databases
- **Per-Tenant Databases**: Each client/demo gets their own database
- **Connection Pool Manager**: Dynamically creates and manages database connections
- **Middleware**: Routes requests to the correct database based on company code

---

## Step 1: Create Tenant Registry Database

Run these SQL scripts in order on your Azure SQL Server:

```bash
# 1. Create the tenant registry
sqlcmd -S customer-portal-sql-server.database.windows.net -U sqladmin -P CustomerPortal2025! -i database/setup-multi-tenant.sql

# 2. Create demo database schema
sqlcmd -S customer-portal-sql-server.database.windows.net -U sqladmin -P CustomerPortal2025! -i database/setup-demo-database.sql

# 3. Populate demo database with sample data
sqlcmd -S customer-portal-sql-server.database.windows.net -U sqladmin -P CustomerPortal2025! -i database/populate-demo-data.sql
```

Or use Azure Data Studio / SQL Server Management Studio to run the scripts manually.

---

## Step 2: Update Environment Variables

Add these to your `.env` file:

```env
# Default tenant for requests without company code
DEFAULT_COMPANY_CODE=DCPSP

# Enable multi-tenant mode (optional, defaults to true if registry exists)
MULTI_TENANT_ENABLED=true
```

Your existing DB variables remain the same - they're used for connecting to the registry and as credentials for all tenant databases.

---

## Step 3: Integrate Middleware into API

### Option A: Quick Integration (Minimal Changes)

Add to the top of `server/api.js`:

```javascript
// Add after your other requires
const { tenantMiddleware, getTenantHealthCheck, connectionManager } = require('./tenant-middleware');

// Add after your CORS middleware, before routes
app.use(tenantMiddleware);

// Add health check endpoint
app.get('/api/health/tenants', getTenantHealthCheck);

// Replace all instances of `pool` with `req.tenantPool` in your route handlers
// Example:
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await req.tenantPool.request()  // Changed from pool.request()
      .query('SELECT * FROM Tickets ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    // ... error handling
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing tenant connections...');
  await connectionManager.closeAll();
  process.exit(0);
});
```

### Option B: Full Migration Script

I can provide a script that automatically updates all your routes if you'd like.

---

## Step 4: Update Frontend for Demo Mode

### Method 1: Query Parameter (Easiest)
Add company code to API requests:

```typescript
// In your API calls, add ?company=DEMO
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// For demo mode
const companyCode = 'DEMO'; // or get from localStorage/context
const response = await fetch(`${API_BASE_URL}/api/tickets?company=${companyCode}`);
```

### Method 2: Header (More Professional)
```typescript
const response = await fetch(`${API_BASE_URL}/api/tickets`, {
  headers: {
    'X-Company-Code': 'DEMO'
  }
});
```

### Method 3: Subdomain (Best for Production)
Set up DNS:
- Production: `fsm.dcpsp.com` → DCPSP database
- Demo: `demo.fsm.dcpsp.com` → DEMO database
- Customer: `acme.fsm.dcpsp.com` → ACME database

---

## Step 5: Create Demo Link/Button

Add a demo mode toggle to your app:

```typescript
// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface TenantContextType {
  companyCode: string;
  setCompanyCode: (code: string) => void;
  isDemo: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [companyCode, setCompanyCode] = useState(
    localStorage.getItem('companyCode') || 'DCPSP'
  );

  const handleSetCompanyCode = (code: string) => {
    setCompanyCode(code);
    localStorage.setItem('companyCode', code);
  };

  return (
    <TenantContext.Provider value={{
      companyCode,
      setCompanyCode: handleSetCompanyCode,
      isDemo: companyCode === 'DEMO'
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
```

Then add a demo banner/button:

```typescript
// In your header component
import { useTenant } from './contexts/TenantContext';

function Header() {
  const { isDemo, setCompanyCode } = useTenant();

  return (
    <header>
      {isDemo && (
        <div style={{ background: '#fbbf24', padding: '8px', textAlign: 'center' }}>
          🎭 DEMO MODE - Showing sample data for demonstration purposes
          <button onClick={() => setCompanyCode('DCPSP')}>
            Exit Demo
          </button>
        </div>
      )}
      {/* Rest of header */}
    </header>
  );
}
```

---

## Step 6: Test Multi-Tenancy

### Test Production Database
```bash
curl http://localhost:5000/api/tickets?company=DCPSP
# Should return your production tickets
```

### Test Demo Database
```bash
curl http://localhost:5000/api/tickets?company=DEMO
# Should return demo tickets with sample data
```

### Test Health Check
```bash
curl http://localhost:5000/api/health/tenants
# Should show active connection pools
```

---

## Usage Scenarios

### 1. Sales Demo
Create a shareable link: `https://fsm.dcpsp.com/login?company=DEMO`
- Login with: `demo` / `demo123`
- Shows realistic sample data
- All ticket states represented
- Multiple vendors, locations across US

### 2. Customer Onboarding
Create customer-specific database:
```sql
INSERT INTO TenantRegistry.dbo.Tenants (CompanyCode, CompanyName, DatabaseName, IsDemo)
VALUES ('ACME', 'ACME Corporation', 'FieldServiceDB_ACME', 0);
```

Then clone your schema:
```sql
CREATE DATABASE FieldServiceDB_ACME AS COPY OF FieldServiceDB;
```

Give customer their URL: `https://acme.fsm.dcpsp.com`

### 3. Different Demo Scenarios
- **DEMO**: General field service
- **DEMO-HVAC**: HVAC-specific scenarios
- **DEMO-SECURITY**: Security system focus

Each with tailored sample data!

---

## Security Considerations

1. **Tenant Isolation**: Each tenant's data is completely separate
2. **Connection Pooling**: Efficient resource usage per tenant
3. **Cache Expiry**: Tenant configs cached for 5 minutes, then refreshed
4. **Authentication**: Still enforced per-tenant (user must belong to that tenant)

---

## Monitoring

Check tenant health:
```bash
curl http://field-service-api.azurewebsites.net/api/health/tenants
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-20T10:30:00Z",
  "activePools": 2,
  "cachedConfigs": 3,
  "tenants": [
    {
      "companyCode": "DCPSP",
      "connected": true,
      "database": "FieldServiceDB"
    },
    {
      "companyCode": "DEMO",
      "connected": true,
      "database": "FieldServiceDB_Demo"
    }
  ]
}
```

---

## Cost Considerations

Azure SQL pricing per database:
- **Basic**: $5/month (2GB) - Good for demos
- **Standard S0**: $15/month (250GB) - Good for small customers
- **Your production**: Keep current tier

Recommendation:
- Production: Current database
- Demo: Basic tier (enough for demos)
- Per-customer: Scale as needed

---

## Next Steps

1. Run the SQL setup scripts
2. Test with `?company=DEMO` parameter
3. Integrate middleware into api.js
4. Add demo mode toggle to frontend
5. Share demo link with prospects!

---

## Troubleshooting

**Problem**: "Tenant not found" error
**Solution**: Check TenantRegistry.dbo.Tenants table has entry for that company code

**Problem**: Connection timeout
**Solution**: Check Azure SQL firewall rules allow your server IP

**Problem**: Can't switch between tenants
**Solution**: Clear connection pool: restart API server

---

## Questions?

This setup gives you:
✅ Unlimited demo environments
✅ Per-customer databases (true multi-tenancy)
✅ Easy customer onboarding
✅ Data isolation and security
✅ Scalable architecture

Need help with integration? Just ask!
