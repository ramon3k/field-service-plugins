# Database Routing Verification Test

## ✅ FIXES APPLIED

### 1. Database Cleanup
- ✅ Removed all demo data (CompanyCode='DEMO') from FieldServiceDB (production)
- ✅ Cleared all data from FieldServiceDB-DEMO
- **Production database now contains ONLY DCPSP data**
- **Demo database is completely empty**

### 2. API Routing Fixes
- ✅ Applied `companyDatabaseMiddleware` globally to all `/api/*` routes
- ✅ Updated `validateUserId()` to accept `dbPool` parameter
- ✅ Updated `generateTicketID()` to accept `dbPool` parameter
- ✅ Replaced **48 occurrences** of `pool.request()` with `req.pool.request()`
- ✅ Updated all calls to `validateUserId()` to pass `req.pool`
- ✅ Deployed to Azure successfully

### 3. What Changed

**Before:**
- Middleware existed but was never applied to routes
- All endpoints used default `pool` variable (FieldServiceDB)
- Login worked correctly, but all other requests went to wrong database

**After:**
- Middleware now applied globally: `app.use('/api', companyDatabaseMiddleware)`
- All 30+ endpoints now use `req.pool` (tenant-specific connection)
- Database routing properly isolated per company code

---

## 🧪 TESTING PLAN

### Test 1: DCPSP Database Isolation

1. **Login to DCPSP**:
   - Company code: `DCPSP`
   - Should see all your production data

2. **Verify ticket list**:
   - GET /api/tickets
   - Should show ONLY DCPSP tickets
   - Should NOT show any demo data

3. **Create a test ticket**:
   - POST /api/tickets
   - Verify proper ticket naming (TKT-YYYY-MM-NNN)
   - Verify it appears in FieldServiceDB

### Test 2: DEMO Database Isolation

1. **Login to DEMO**:
   - Company code: `DEMO`
   - Should connect to FieldServiceDB-DEMO (empty)

2. **Verify empty database**:
   - GET /api/tickets
   - Should return empty array []
   - Should NOT show DCPSP data

3. **Create a demo ticket manually**:
   - POST /api/tickets
   - Verify proper ticket naming (TKT-YYYY-MM-NNN, NOT DEMO-CA-001)
   - Verify it appears ONLY in FieldServiceDB-DEMO

### Test 3: Cross-Contamination Check

1. **Create tickets in both databases**:
   - Login as DCPSP, create ticket "DCPSP Test"
   - Login as DEMO, create ticket "DEMO Test"

2. **Verify isolation**:
   - Login as DCPSP, should ONLY see "DCPSP Test"
   - Login as DEMO, should ONLY see "DEMO Test"

---

## 🔍 HOW TO TEST

### Option 1: Using the Frontend

1. Go to your frontend application
2. Login with company code and credentials
3. Navigate to tickets page
4. Create test tickets
5. Verify they appear only in the correct database

### Option 2: Using API Directly

```bash
# Test DCPSP Login
curl -X POST https://field-service-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-user","password":"your-pass","tenantCode":"DCPSP"}'

# Get DCPSP tickets (use token from login)
curl -X GET https://field-service-api.azurewebsites.net/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Company-Code: DCPSP"

# Test DEMO Login
curl -X POST https://field-service-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo-user","password":"demo-pass","tenantCode":"DEMO"}'

# Get DEMO tickets (should be empty)
curl -X GET https://field-service-api.azurewebsites.net/api/tickets \
  -H "Authorization: Bearer DEMO_TOKEN" \
  -H "X-Company-Code: DEMO"
```

### Option 3: Direct Database Query

```sql
-- Check production database
USE FieldServiceDB;
SELECT COUNT(*) as DCPSPTickets FROM Tickets WHERE CompanyCode = 'DCPSP';
SELECT COUNT(*) as DEMOTickets FROM Tickets WHERE CompanyCode = 'DEMO'; -- Should be 0

-- Check demo database
USE [FieldServiceDB-DEMO];
SELECT COUNT(*) as TotalTickets FROM Tickets; -- Should be 0 initially
```

---

## ✅ SUCCESS CRITERIA

Your database routing is working correctly if:

1. ✅ Login with DCPSP shows only DCPSP data
2. ✅ Login with DEMO shows empty database (or only demo data)
3. ✅ Creating tickets with DCPSP goes to FieldServiceDB
4. ✅ Creating tickets with DEMO goes to FieldServiceDB-DEMO
5. ✅ No cross-contamination between databases
6. ✅ Ticket naming follows proper format (TKT-YYYY-MM-NNN)

---

## 🎯 NEXT STEPS

1. **Test the fix** using one of the methods above
2. **Create demo data manually** with proper naming:
   - Login with DEMO company code
   - Create customers, sites, tickets through the UI
   - System will automatically use proper naming format
3. **Report back** if you see any cross-contamination

---

## 📊 TECHNICAL SUMMARY

**Files Modified:**
- `server/api.cjs`: 48 pool references updated, middleware applied globally
- Database cleanup: Removed 56 rows from production, cleared demo database

**Middleware Flow:**
```
Request → companyDatabaseMiddleware
         → Extract company code (from header/query/body)
         → Get database pool for company
         → req.pool = tenant-specific pool
         → Endpoint uses req.pool.request()
         → Query goes to correct database
```

**Database Mapping:**
- DCPSP → FieldServiceDB (production)
- DEMO → FieldServiceDB-DEMO (demo)
- KIT → FieldServiceDB-DEMO (demo)

The architecture is now properly implemented and should provide complete database isolation.
