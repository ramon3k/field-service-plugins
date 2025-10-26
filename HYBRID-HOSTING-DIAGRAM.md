# Multi-Tenant Architecture - Mixed Hosting

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐        ┌──────────────────────────────────┐  │
│  │   Frontend App   │        │   API Server (Node.js/Express)   │  │
│  │  (React + Vite)  │───────▶│   - tenant-middleware.js         │  │
│  │                  │        │   - tenant-connection-manager.js │  │
│  └──────────────────┘        └──────────────┬───────────────────┘  │
│                                              │                       │
│                                              ▼                       │
│                              ┌───────────────────────────┐          │
│                              │   TenantRegistry DB       │          │
│                              │  ┌─────────────────────┐ │          │
│                              │  │ CompanyCode         │ │          │
│                              │  │ DatabaseName        │ │          │
│                              │  │ DatabaseServer ◄────┼─┼──────┐   │
│                              │  │ Credentials         │ │      │   │
│                              │  └─────────────────────┘ │      │   │
│                              └───────────────────────────┘      │   │
│                                                                 │   │
│  ┌──────────────────────────────────────────────────────────┐  │   │
│  │         YOUR DATABASES (You Host & Pay For)              │  │   │
│  ├──────────────────────────────────────────────────────────┤  │   │
│  │                                                            │  │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │  │   │
│  │  │ FieldServiceDB      │  │ FieldServiceDB_Demo │        │  │   │
│  │  │ (DCPSP Production)  │  │ (Sales Demo)        │        │  │   │
│  │  └─────────────────────┘  └─────────────────────┘        │  │   │
│  │                                                            │  │   │
│  └──────────────────────────────────────────────────────────┘  │   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Routes to...
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
    
┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│  CUSTOMER A         │  │  CUSTOMER B          │  │  CUSTOMER C         │
│  (ACME Corp)        │  │  (TechStart)         │  │  (GlobalSec)        │
├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤
│                     │  │                      │  │                     │
│  Azure SQL Database │  │  On-Premises SQL     │  │  AWS RDS SQL Server │
│                     │  │  Server              │  │                     │
│  Server:            │  │                      │  │  Server:            │
│  acme-sql.database  │  │  Server:             │  │  globalsec-db.aws   │
│  .windows.net       │  │  sql.techstart.com   │  │  .rds.amazonaws.com │
│                     │  │  (via VPN)           │  │                     │
│  Database:          │  │                      │  │  Database:          │
│  FieldServiceDB_ACME│  │  Database:           │  │  FieldServiceDB     │
│                     │  │  FieldServiceDB      │  │                     │
│  ┌───────────────┐ │  │                      │  │  ┌───────────────┐  │
│  │ Customers     │ │  │  ┌───────────────┐   │  │  │ Customers     │  │
│  │ Sites         │ │  │  │ Customers     │   │  │  │ Sites         │  │
│  │ Tickets       │ │  │  │ Sites         │   │  │  │ Tickets       │  │
│  │ Users         │ │  │  │ Tickets       │   │  │  │ Users         │  │
│  │ ...           │ │  │  │ Users         │   │  │  │ ...           │  │
│  └───────────────┘ │  │  │ ...           │   │  │  └───────────────┘  │
│                     │  │  └───────────────┘   │  │                     │
│  THEY host & pay    │  │  THEY host & pay     │  │  THEY host & pay    │
│  for this database  │  │  for this database   │  │  for this database  │
└─────────────────────┘  └──────────────────────┘  └─────────────────────┘
```

## Request Flow Example

### User Login: ACME Employee

```
1. User visits: https://yourapp.com/login?company=ACME

2. Frontend sends login request to API:
   POST /api/auth/login?company=ACME
   { username: "john@acme.com", password: "..." }

3. API Middleware extracts company code:
   req.query.company = "ACME"

4. Connection Manager queries TenantRegistry:
   SELECT DatabaseServer, DatabaseName 
   FROM Tenants 
   WHERE CompanyCode = 'ACME'
   
   Result:
   - DatabaseServer: "acme-sql.database.windows.net"
   - DatabaseName: "FieldServiceDB_ACME"

5. Connection Manager creates/reuses pool:
   Pool["ACME"] = mssql.connect({
     server: "acme-sql.database.windows.net",
     database: "FieldServiceDB_ACME",
     user: "fieldservice_api",
     password: "..."
   })

6. API handler uses tenant pool:
   const user = await req.tenantPool.request()
     .input('username', sql.NVarChar, username)
     .query('SELECT * FROM Users WHERE Username = @username')
   
   This query runs on ACME's database at acme-sql.database.windows.net

7. Response sent back with data from ACME's database

8. All subsequent requests from ACME users route to acme-sql.database.windows.net
```

## Cost Comparison

### Traditional (You Host All Databases)

```
YOUR MONTHLY COSTS:
├─ TenantRegistry: $5
├─ Your Production DB: $15
├─ Demo DBs (2): $10
├─ ACME DB: $15
├─ TechStart DB: $15
├─ GlobalSec DB: $15
└─ Total: $75/month (grows with each customer!)
```

### Hybrid (Customers Host Their Own)

```
YOUR MONTHLY COSTS:
├─ TenantRegistry: $5
├─ Your Production DB: $15
├─ Demo DBs (2): $10
└─ Total: $30/month (fixed!)

CUSTOMER COSTS (they pay):
├─ ACME pays for their Azure SQL: $15/month
├─ TechStart pays for their on-prem server
└─ GlobalSec pays for their AWS RDS: ~$20/month
```

**Your savings**: $45/month with 3 customers, grows as you add more!

## Security & Compliance Benefits

### Data Sovereignty
```
┌─────────────────────────────────────────┐
│ Healthcare Customer (HIPAA)             │
├─────────────────────────────────────────┤
│ Their data NEVER leaves their servers   │
│ They control encryption keys             │
│ They manage audit logs                   │
│ Meets regulatory requirements            │
└─────────────────────────────────────────┘
```

### Financial Customer (PCI DSS)
```
┌─────────────────────────────────────────┐
│ Financial Services Customer             │
├─────────────────────────────────────────┤
│ Payment data stays on-premises          │
│ Controlled network access                │
│ Their security team has full control    │
│ Passes compliance audits                 │
└─────────────────────────────────────────┘
```

## Example Tenant Registry Configuration

```sql
-- Your TenantRegistry shows all tenants and where they're hosted:

SELECT 
  CompanyCode,
  CompanyName,
  DatabaseServer,
  CASE 
    WHEN DatabaseServer LIKE '%customer-portal%' THEN 'Your Server'
    ELSE 'Customer Hosted'
  END AS HostingLocation
FROM Tenants
WHERE IsActive = 1;
```

### Result:
```
┌─────────────┬──────────────────┬─────────────────────────┬──────────────────┐
│ CompanyCode │ CompanyName      │ DatabaseServer          │ HostingLocation  │
├─────────────┼──────────────────┼─────────────────────────┼──────────────────┤
│ DCPSP       │ DCPSP Production │ customer-portal-sql-... │ Your Server      │
│ DEMO        │ Demo Company     │ customer-portal-sql-... │ Your Server      │
│ ACME        │ ACME Corporation │ acme-sql.database...    │ Customer Hosted  │
│ TECHSTART   │ TechStart Inc    │ sql.techstart.com       │ Customer Hosted  │
│ GLOBALSEC   │ GlobalSec LLC    │ globalsec-db.aws...     │ Customer Hosted  │
└─────────────┴──────────────────┴─────────────────────────┴──────────────────┘
```

## Network Architecture

### Firewall Configuration

```
                    YOUR API SERVER
                    20.123.45.67
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  ACME    │    │TechStart │    │GlobalSec │
  │ Firewall │    │ Firewall │    │ Firewall │
  └────┬─────┘    └────┬─────┘    └────┬─────┘
       │               │               │
  Allow 20.123.45.67   │          Allow VPN
       │          Allow VPN           │
       ▼               ▼               ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │Azure SQL │    │On-Prem   │    │AWS RDS   │
  │Database  │    │SQL Server│    │SQL Server│
  └──────────┘    └──────────┘    └──────────┘
```

Each customer configures their firewall to allow connections from your API server IP address.

## Monitoring Dashboard

Your health check endpoint shows all tenant connections:

```json
{
  "activePools": 5,
  "tenants": [
    {
      "companyCode": "DCPSP",
      "server": "customer-portal-sql-server.database.windows.net",
      "hosting": "Your Server",
      "connected": true,
      "latency": "12ms"
    },
    {
      "companyCode": "ACME",
      "server": "acme-sql.database.windows.net",
      "hosting": "Customer Hosted (Azure)",
      "connected": true,
      "latency": "28ms"
    },
    {
      "companyCode": "TECHSTART",
      "server": "sql.techstart.com",
      "hosting": "Customer Hosted (On-Prem)",
      "connected": true,
      "latency": "156ms"
    }
  ]
}
```

---

**Bottom Line**: Your system is already built to support customers hosting their own databases. Just update the `DatabaseServer` field in the TenantRegistry for each customer, and the connection manager handles the rest automatically! 🚀
