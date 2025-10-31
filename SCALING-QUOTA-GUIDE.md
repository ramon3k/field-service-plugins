# API Quota & Resource Management Guide
**Scaling Multi-Tenant Architecture**

## Overview

When hosting a multi-tenant API serving many companies, you need to consider several resource limitations and quotas. Let's analyze the impact and mitigation strategies.

---

## Key Resource Concerns

### 1. **Database Connection Limits** ⚠️ HIGH IMPACT

#### The Problem
Each SQL Server has a **maximum connection limit**:

| Database Type | Default Max Connections |
|---------------|------------------------|
| SQL Server Express | 32,767 (theoretical)<br>~100-200 (practical) |
| Azure SQL Basic | 30 connections |
| Azure SQL Standard (S0) | 60 connections |
| Azure SQL Standard (S1) | 90 connections |
| Azure SQL Standard (S2) | 120 connections |
| Azure SQL Premium (P1) | 200 connections |

#### Your Current Setup

```javascript
// In tenant-connection-manager.js
const poolConfig = {
  server: tenant.DatabaseServer,
  database: tenant.DatabaseName,
  // DEFAULT: No pool limits set!
  pool: {
    max: 10,      // Max connections per tenant pool
    min: 0,       // Min idle connections
    idleTimeoutMillis: 30000
  }
};
```

**Current consumption per tenant**: Up to 10 connections

**With 10 companies**: 10 × 10 = **100 connections**
**With 50 companies**: 50 × 10 = **500 connections** ⚠️

#### Impact on Customer-Hosted Databases

If customers host their own databases:
- **Customer A** has their own Azure SQL (60 connections available)
- **Only Customer A's traffic** uses those 60 connections
- No problem! Each customer has isolated resources

If YOU host all databases on one server:
- **All 50 companies** share the same SQL Server
- **500 total connections needed** (50 × 10)
- Your server will **hit the connection limit** and reject new connections! 🔴

---

### 2. **Azure App Service Quotas**

#### Free/Shared Tier
```
❌ NOT suitable for multi-tenant production

Limits:
- CPU: 60 minutes/day total
- Memory: 1 GB
- Requests: ~100 per second
- Connections: Limited
```

#### Basic (B1) - $13/month
```
✅ Good for 5-10 small companies

Resources:
- CPU: 1 core, 100 ACU
- Memory: 1.75 GB
- Requests: ~500 per second
- Max connections: ~200-300 outbound
```

#### Standard (S1) - $70/month
```
✅ Good for 20-50 companies

Resources:
- CPU: 1 core, 100 ACU
- Memory: 1.75 GB
- Requests: ~1,000 per second
- Auto-scaling available
```

#### Premium (P1V3) - $150/month
```
✅ Good for 100+ companies

Resources:
- CPU: 2 cores, 195 ACU
- Memory: 8 GB
- Requests: ~5,000 per second
- Advanced scaling
```

---

### 3. **TenantRegistry Database Load**

Every API request queries the TenantRegistry to get tenant configuration:

```javascript
// This runs on EVERY request if no caching
async getTenantConfig(companyCode) {
  const result = await registryPool.request()
    .input('companyCode', sql.NVarChar, companyCode)
    .query('EXEC GetTenantByCode @companyCode');
  return result.recordset[0];
}
```

**Without caching:**
- 100 requests/second = 100 TenantRegistry queries/second
- 6,000 queries/minute
- Your TenantRegistry database gets hammered! 🔥

**With caching (current implementation):**
```javascript
// 5-minute cache per tenant
this.tenantCache = new Map();
this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
```

**Impact:**
- First request: Query TenantRegistry
- Next 5 minutes: Use cached config (no database hit)
- TenantRegistry queries: **~20/hour per company** instead of 6,000/minute
- Much better! ✅

---

### 4. **Network Bandwidth**

#### Azure App Service Bandwidth Limits

| Tier | Included Data Out | Overage Cost |
|------|------------------|--------------|
| Free | 165 MB/day | N/A (hard limit) |
| Basic | 165 GB/month | $0.087/GB |
| Standard | 165 GB/month | $0.087/GB |
| Premium | 165 GB/month | $0.087/GB |

**Typical API response sizes:**
- Ticket list: ~10-50 KB
- Customer list: ~5-20 KB  
- Single ticket: ~2-5 KB

**Usage calculation (50 companies, moderate usage):**
```
Average response: 20 KB
Requests per company per day: 1,000
Total daily requests: 50 × 1,000 = 50,000

Daily bandwidth: 50,000 × 20 KB = 1 GB/day
Monthly bandwidth: 30 GB/month

Cost: FREE (under 165 GB included)
```

**Heavy usage (50 companies, high traffic):**
```
Requests per company per day: 10,000
Total daily requests: 500,000

Daily bandwidth: 500,000 × 20 KB = 10 GB/day
Monthly bandwidth: 300 GB/month

Cost: (300 - 165) × $0.087 = $11.75/month overage
```

---

### 5. **API Rate Limiting**

Azure App Service doesn't have hard rate limits, but your server has CPU/memory limits:

**B1 instance (1.75 GB RAM, 1 core):**
- Can handle ~500 requests/second
- If 50 companies each make 10 requests/second = 500 total
- You're at capacity! ⚠️

**Mitigation: Implement rate limiting per tenant**

```javascript
// Add to tenant-middleware.js
const rateLimit = require('express-rate-limit');

const tenantRateLimiters = new Map();

function getTenantRateLimiter(companyCode) {
  if (!tenantRateLimiters.has(companyCode)) {
    tenantRateLimiters.set(companyCode, rateLimit({
      windowMs: 1 * 60 * 1000,  // 1 minute
      max: 100,                  // 100 requests per minute per company
      message: { error: 'Too many requests from your company. Please try again later.' }
    }));
  }
  return tenantRateLimiters.get(companyCode);
}

// Apply rate limiter after tenant identification
app.use(tenantMiddleware);
app.use((req, res, next) => {
  const limiter = getTenantRateLimiter(req.companyCode);
  limiter(req, res, next);
});
```

---

## Scalability Limits by Scenario

### Scenario A: You Host All Databases (Single SQL Server)

```
┌────────────────────────────────────────────────┐
│ YOUR SQL SERVER (Standard S2)                  │
│ Max connections: 120                           │
├────────────────────────────────────────────────┤
│ TenantRegistry: 5 connections                  │
│ DCPSP Production: 10 connections               │
│ Demo: 5 connections                            │
│ Customer 1: 10 connections                     │
│ Customer 2: 10 connections                     │
│ ...                                            │
│ Customer N: 10 connections                     │
└────────────────────────────────────────────────┘

Max tenants: (120 - 15 reserved) / 10 = ~10 active tenants
```

**Limit: ~10-12 companies** before hitting connection limits ⚠️

**Solution:**
- Reduce max connections per pool to 5
- Max tenants: ~20 companies
- Or upgrade to Premium tier (200 connections)
- Or use multiple SQL servers

---

### Scenario B: Customers Host Their Own Databases

```
┌────────────────────────────────────────────────┐
│ YOUR SQL SERVER (Basic)                        │
│ Max connections: 30                            │
├────────────────────────────────────────────────┤
│ TenantRegistry: 10 connections                 │
│ DCPSP Production: 10 connections               │
│ Demo: 5 connections                            │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ CUSTOMER A SQL SERVER (Their Azure SQL)       │
│ Max connections: 60                            │
├────────────────────────────────────────────────┤
│ Customer A traffic: 10 connections             │
│ Available: 50 connections                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ CUSTOMER B SQL SERVER (Their on-prem)         │
│ Max connections: 200                           │
├────────────────────────────────────────────────┤
│ Customer B traffic: 10 connections             │
│ Available: 190 connections                     │
└────────────────────────────────────────────────┘
```

**Limit: UNLIMITED** ✅ Each customer has their own database resources!

---

### Scenario C: Hybrid (Mix of Both)

```
YOUR SERVER:
- TenantRegistry
- Your production database  
- Demo databases (2-3)
- Small customers (5-10)

CUSTOMER SERVERS:
- Large enterprise customers
- Customers with compliance requirements
```

**Recommended split:**
- You host: 10-15 small customers + demos
- Customers host: Unlimited large customers

---

## Recommended Configuration for Scale

### 1. **Optimize Connection Pooling**

```javascript
// In tenant-connection-manager.js - UPDATED

const poolConfig = {
  server: tenant.DatabaseServer,
  database: tenant.DatabaseName,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 5,           // REDUCED from 10 to 5
    min: 0,           // No idle connections
    idleTimeoutMillis: 30000,  // Close idle after 30 seconds
    acquireTimeoutMillis: 30000,
    evictionRunIntervalMillis: 10000
  }
};
```

**Impact:**
- 50 companies × 5 connections = 250 total connections
- Still high, but more manageable
- Works if customers host their own databases

---

### 2. **Implement Connection Pool Limits**

```javascript
// Add global connection limit tracking
class TenantConnectionManager {
  constructor() {
    this.pools = new Map();
    this.tenantCache = new Map();
    this.maxGlobalConnections = 100;  // Global limit across all pools
    this.currentConnections = 0;
  }

  async getPool(companyCode) {
    // Check global limit
    if (this.currentConnections >= this.maxGlobalConnections) {
      throw new Error('Global connection limit reached. Please try again later.');
    }

    // ... existing code ...
  }

  trackConnections() {
    // Monitor active connections across all pools
    let total = 0;
    for (const [code, pool] of this.pools.entries()) {
      if (pool.connected) {
        total += pool.size || 0;
      }
    }
    this.currentConnections = total;
    return total;
  }
}
```

---

### 3. **Implement Tenant Prioritization**

```javascript
// Priority levels for different tenant types
const TENANT_PRIORITY = {
  PRODUCTION: 1,    // Your own production (highest priority)
  ENTERPRISE: 2,    // Paying enterprise customers
  STANDARD: 3,      // Regular customers
  DEMO: 4,          // Demo/trial customers (lowest priority)
  FREE: 5           // Free tier users
};

// In tenant-middleware.js
async function tenantMiddleware(req, res, next) {
  const companyCode = req.query.company || req.headers['x-company-code'] || 'DCPSP';
  
  try {
    const tenant = await connectionManager.getTenantConfig(companyCode);
    
    // If system under heavy load, deprioritize lower-tier customers
    const currentLoad = connectionManager.trackConnections();
    const maxLoad = connectionManager.maxGlobalConnections;
    
    if (currentLoad > maxLoad * 0.9) {  // 90% capacity
      if (tenant.Priority >= TENANT_PRIORITY.DEMO) {
        return res.status(503).json({
          error: 'Service temporarily unavailable. Please try again in a few moments.',
          retryAfter: 30
        });
      }
    }
    
    const pool = await connectionManager.getPool(companyCode);
    req.tenantPool = pool;
    req.companyCode = companyCode;
    next();
    
  } catch (error) {
    // ... error handling
  }
}
```

---

### 4. **Add Tenant to Priority Tiers**

```sql
-- Update Tenants table
ALTER TABLE TenantRegistry.dbo.Tenants
ADD Priority INT DEFAULT 3,  -- Standard priority
    Tier NVARCHAR(20) DEFAULT 'STANDARD';  -- FREE, STANDARD, ENTERPRISE

-- Set priorities
UPDATE TenantRegistry.dbo.Tenants SET Priority = 1, Tier = 'PRODUCTION' WHERE CompanyCode = 'DCPSP';
UPDATE TenantRegistry.dbo.Tenants SET Priority = 4, Tier = 'DEMO' WHERE IsDemo = 1;
UPDATE TenantRegistry.dbo.Tenants SET Priority = 2, Tier = 'ENTERPRISE' WHERE CompanyCode IN ('ACME', 'TECHSTART');
```

---

### 5. **Implement Request Rate Limiting**

```javascript
// Install: npm install express-rate-limit

const rateLimit = require('express-rate-limit');

// Different limits based on tier
const RATE_LIMITS = {
  FREE: { windowMs: 60000, max: 30 },       // 30 requests/minute
  STANDARD: { windowMs: 60000, max: 100 },  // 100 requests/minute
  ENTERPRISE: { windowMs: 60000, max: 500 }, // 500 requests/minute
  DEMO: { windowMs: 60000, max: 50 }        // 50 requests/minute
};

// In api.js after tenantMiddleware
app.use((req, res, next) => {
  const tenant = req.tenantConfig;
  const limits = RATE_LIMITS[tenant.Tier] || RATE_LIMITS.STANDARD;
  
  const limiter = rateLimit({
    ...limits,
    keyGenerator: (req) => req.companyCode,  // Rate limit per company
    message: {
      error: `Rate limit exceeded for ${tenant.Tier} tier`,
      limit: limits.max,
      window: `${limits.windowMs / 1000} seconds`
    }
  });
  
  limiter(req, res, next);
});
```

---

### 6. **Monitoring & Alerts**

```javascript
// Add to tenant-connection-manager.js
getDetailedStatus() {
  const pools = [];
  let totalConnections = 0;
  
  for (const [companyCode, pool] of this.pools.entries()) {
    const poolSize = pool.size || 0;
    totalConnections += poolSize;
    
    pools.push({
      companyCode,
      connected: pool.connected,
      activeConnections: poolSize,
      server: pool.config.server
    });
  }
  
  return {
    totalPools: this.pools.size,
    totalConnections,
    maxGlobalConnections: this.maxGlobalConnections,
    utilizationPercent: (totalConnections / this.maxGlobalConnections * 100).toFixed(1),
    pools: pools.sort((a, b) => b.activeConnections - a.activeConnections)
  };
}

// Monitoring endpoint
app.get('/api/admin/pool-status', (req, res) => {
  const status = connectionManager.getDetailedStatus();
  
  // Alert if over 80% capacity
  if (status.utilizationPercent > 80) {
    console.warn(`⚠️ WARNING: Connection pool at ${status.utilizationPercent}% capacity!`);
  }
  
  res.json(status);
});
```

---

## Capacity Planning

### Small Scale (1-10 companies)

**Your Infrastructure:**
```
Azure App Service: Basic B1 ($13/month)
Azure SQL: Basic ($5/month for TenantRegistry)
          + Standard S0 ($15/month for your DB)
          + Basic ($5/month per demo DB)
Total: ~$40/month

Max concurrent requests: ~500/second
Max active tenants: 10 companies
Connection pool limit: 50 total
```

**Recommendation:** ✅ Current setup is fine

---

### Medium Scale (10-50 companies)

**Recommended Infrastructure:**
```
Azure App Service: Standard S1 ($70/month)
Azure SQL: Basic ($5/month for TenantRegistry)
          + Standard S1 ($30/month for your DB with more connections)

Customer-hosted databases: Customers pay for their own
Total: ~$105/month (your cost)

Max concurrent requests: ~1,000/second
Max active tenants: 50 companies (if customer-hosted DBs)
                    or 15-20 (if you host all DBs on S1)
```

**Recommendations:**
- ✅ Implement rate limiting (100 req/min per tenant)
- ✅ Optimize connection pools (max: 5 per tenant)
- ✅ Encourage large customers to host their own databases
- ✅ Use connection pool monitoring

---

### Large Scale (50-200 companies)

**Recommended Infrastructure:**
```
Azure App Service: Premium P1V3 ($150/month) with auto-scaling
Azure SQL: Standard S2 ($60/month for TenantRegistry + monitoring)
          + Premium P1 ($465/month for consolidated customer DBs)
          OR customers host their own databases

Load Balancer: $18/month
Application Insights: ~$30/month
Total: ~$260/month (self-hosted DBs)
       ~$720/month (if hosting customer DBs)

Max concurrent requests: ~5,000/second
Max active tenants: 200+ companies (customer-hosted)
                    or 40-50 (if you host on Premium SQL)
```

**Recommendations:**
- ✅ **REQUIRE** enterprise customers to host their own databases
- ✅ Implement tiered service (Free, Standard, Enterprise)
- ✅ Use Azure Application Gateway for load balancing
- ✅ Implement caching layer (Redis)
- ✅ Use CDN for static assets
- ✅ Monitor with Application Insights

---

### Enterprise Scale (200+ companies)

**Recommended Infrastructure:**
```
Multi-region deployment:
- App Service: Premium P2V3 ($300/month × 2 regions)
- Azure SQL: Premium tier with read replicas
- Redis Cache: Standard ($75/month)
- Application Gateway: ~$200/month
- CDN: ~$50/month
Total: ~$1,200+/month

BUT: Most customers host their own databases
Revenue: 200 customers × $100/month = $20,000/month
Your infrastructure cost: $1,200/month
Profit margin: 94% 🎉
```

**Requirements:**
- ✅ **ALL** customers must host their own databases
- ✅ Multi-region deployment for high availability
- ✅ Advanced monitoring and alerting
- ✅ Dedicated support team
- ✅ SLA guarantees (99.9% uptime)

---

## Cost Comparison: Self-Hosted vs Customer-Hosted DBs

### Self-Hosted (50 customers)

```
Azure App Service Standard S1: $70/month
Azure SQL Standard S2: $60/month (120 connections)
Customer Databases (50 × $15): $750/month
Total: $880/month

Revenue (50 × $100/month): $5,000/month
Profit: $4,120/month (82% margin)
```

**Issues:**
- Limited to ~120 connections total
- High database costs as you scale
- You manage all backups and maintenance

---

### Customer-Hosted (50 customers)

```
Azure App Service Standard S1: $70/month
Azure SQL Basic: $5/month (TenantRegistry only)
Total: $75/month

Revenue (50 × $100/month): $5,000/month
Profit: $4,925/month (98.5% margin) 🚀
```

**Benefits:**
- Unlimited scaling potential
- Customers pay for their own databases
- Lower liability
- Better profit margins

---

## Recommendation: Hybrid Tiered Approach

### Tier 1: Free/Demo (You Host)
```
- Demo databases on your server
- Limited to 50 requests/minute
- 30-day trial
- Best for: Sales demos, proof of concept
Cost to you: $10/month (2-3 demo DBs on Basic tier)
```

### Tier 2: Standard ($99/month - You Host)
```
- Small businesses (1-10 users)
- Database on your shared server
- 100 requests/minute
- Standard support
Cost to you: $15/month (database)
Profit: $84/month per customer
Limit: 10-15 customers total on this tier
```

### Tier 3: Professional ($299/month - You Host)
```
- Medium businesses (10-50 users)
- Dedicated database on your server or customer-hosted
- 500 requests/minute
- Priority support
Cost to you: $30/month (if you host) or $0 (if they host)
Profit: $269/month per customer
```

### Tier 4: Enterprise ($999+/month - Customer Hosts)
```
- Large businesses (50+ users)
- MUST host their own database
- Unlimited requests
- 24/7 support, SLA guarantees
Cost to you: $0 (database), ~$10/month (API resources)
Profit: $989+/month per customer
```

---

## Action Items to Prepare for Scale

### Immediate (Before 10 companies):
- [x] ✅ Multi-tenant architecture implemented
- [ ] Add rate limiting per tenant
- [ ] Monitor connection pool usage
- [ ] Document customer onboarding for external databases

### Before 20 companies:
- [ ] Implement tiered service levels
- [ ] Add connection pool optimization (max: 5 per tenant)
- [ ] Set up Application Insights monitoring
- [ ] Create customer database setup guide
- [ ] Require enterprise customers to host their own DBs

### Before 50 companies:
- [ ] Upgrade to Standard S1 App Service
- [ ] Implement Redis caching layer
- [ ] Add load balancer
- [ ] Multi-region deployment plan
- [ ] Automated tenant onboarding system

---

## Monitoring Checklist

```javascript
// Add these metrics to your monitoring dashboard:
- Total active tenants
- Total database connections (by tenant)
- API requests per minute (by tenant)
- Response time (by tenant and endpoint)
- Error rate (by tenant)
- Connection pool utilization
- Memory usage
- CPU usage
- Bandwidth usage

// Alert thresholds:
- Connection pool > 80% → Warning
- Connection pool > 95% → Critical
- API response time > 1 second → Warning
- Error rate > 5% → Critical
- Any tenant > 200 req/min → Investigate
```

---

## Bottom Line

### Will you hit quotas?

**If customers host their own databases:** ✅ NO - You can scale to hundreds of companies
**If you host all databases:** ⚠️ YES - Limited to 10-20 companies without upgrades

### Recommended Strategy:

1. **Demo/Trial customers** - You host on Basic tier ($5/month per DB)
2. **Small customers (1-10 users)** - You host on Standard tier ($15-30/month per DB) - Limit to 10-15 total
3. **Medium/Large customers** - They host their own databases - Unlimited
4. **Enterprise customers** - MUST host their own databases - Unlimited

This gives you the best balance of:
- Easy onboarding for small customers
- Unlimited scalability for growth
- Excellent profit margins (95%+)
- Customer control and compliance

🚀 **You're ready to scale to hundreds of companies!**
