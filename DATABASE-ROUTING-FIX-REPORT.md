# Database Routing Fix Report

## ✅ COMPLETED: Database Cleanup

Successfully cleaned both databases:

### Production Database (FieldServiceDB)
- Removed 36 rows with CompanyCode='DEMO':
  - 16 Tickets (DEMO-CA-001, etc.)
  - 10 Sites
  - 10 Customers
- Removed 8 demo Users
- Removed 2 ActivityLog entries for demo users
- **Status**: ✅ Now contains ONLY DCPSP data

### Demo Database (FieldServiceDB-DEMO)  
- Cleared all data:
  - 4 CoordinatorNotes
  - 16 Tickets
  - 10 Sites
  - 10 Customers
  - 8 Users
- **Status**: ✅ Completely empty, ready for you to populate manually

---

## 🔍 ROOT CAUSE IDENTIFIED: API Routing Architecture Problem

Your frustration was 100% justified. The routing is fundamentally broken.

### The Problem

**The login endpoint was fixed, but ALL OTHER endpoints are still using the default database connection.**

Here's what's happening in `server/api.cjs`:

1. **Lines 56-62**: Multi-tenant database mapping exists ✅
   ```javascript
   const TENANT_DATABASE_MAP = {
     'DCPSP': 'FieldServiceDB',
     'DEMO': 'FieldServiceDB-DEMO',
     'KIT': 'FieldServiceDB-DEMO'
   };
   ```

2. **Lines 118-135**: Middleware exists to extract company code ✅
   ```javascript
   async function companyDatabaseMiddleware(req, res, next) {
     const companyCode = req.headers['x-company-code'] || 'DCPSP';
     req.pool = await getPoolForCompany(companyCode);
     next();
   }
   ```

3. **Lines 152-165**: Legacy `pool` variable connects to DEFAULT database ❌
   ```javascript
   let pool; // Default connection to FieldServiceDB
   pool = await sql.connect({ database: 'FieldServiceDB' });
   ```

4. **Lines 245-2000+**: ALL API ENDPOINTS use `pool.request()` instead of `req.pool.request()` ❌

### Example of Broken Endpoints

**GET /api/tickets** (line 245):
```javascript
app.get('/api/tickets', async (req, res) => {
  const result = await pool.request().query(query);  // ❌ Uses default DB
  // Should be: await req.pool.request()
```

**POST /api/tickets** (line 369):
```javascript
app.post('/api/tickets', async (req, res) => {
  await pool.request()  // ❌ Uses default DB
  // Should be: await req.pool.request()
```

**And 30+ more endpoints...**

### Why Login "Worked" But Nothing Else Did

The login endpoint (line 633) was special-cased:
```javascript
app.post('/api/auth/login', async (req, res) => {
  const { username, password, tenantCode } = req.body;
  const tenantPool = await getPoolForCompany(tenantCode);  // ✅ Gets correct DB
  const result = await tenantPool.request()...  // ✅ Uses correct DB
```

But every other endpoint still uses the default `pool` variable, which always connects to `FieldServiceDB`.

**This means:**
- Login finds the right user (if you login as DEMO user)
- But every subsequent request (GET tickets, POST ticket, etc.) hits the default FieldServiceDB
- Result: Cross-contamination exactly as you reported

---

## 🔧 WHAT NEEDS TO BE FIXED

### Option 1: Apply Middleware + Update All Endpoints (Recommended)

1. **Apply middleware globally** before defining routes:
   ```javascript
   // Add this after line 135 (after middleware definition)
   app.use('/api', companyDatabaseMiddleware);
   ```

2. **Replace ALL occurrences** of `pool.request()` with `req.pool.request()`:
   - Line 174: `validateUserId` function
   - Line 207: `logActivity` function  
   - Line 245: GET /api/tickets
   - Line 303: GET /api/tickets/:id
   - Line 342: GET /api/tickets (with filters)
   - Line 369: POST /api/tickets
   - Line 440: PUT /api/tickets/:id
   - Lines 500-900: Users, Sites, Customers, Licenses, Vendors endpoints
   - Lines 1500-2000: Service requests, attachments, coordinator notes
   - **Total: 30+ endpoints need updating**

3. **Update helper functions** to accept pool parameter:
   ```javascript
   // Before:
   async function validateUserId(userId) {
     const result = await pool.request()...
   }
   
   // After:
   async function validateUserId(userId, dbPool) {
     const result = await dbPool.request()...
   }
   ```

### Option 2: Simple Global Approach (Alternative)

Since you're using JWT tokens, another approach:
1. Store the company code in the JWT token during login
2. Extract company code from token in middleware
3. Apply middleware globally
4. Update all endpoints to use `req.pool`

---

## 📋 TESTING PLAN (After Fix)

1. **Test DCPSP Login**:
   - Login with DCPSP user
   - Verify tickets list shows only DCPSP data
   - Create a test ticket
   - Verify it appears in FieldServiceDB (not DEMO)

2. **Test DEMO Login**:
   - Login with DEMO company code
   - Verify tickets list is empty (FieldServiceDB-DEMO is empty)
   - Create a test ticket manually
   - Verify it appears only in FieldServiceDB-DEMO
   - Verify proper ticket naming format (not DEMO-CA-001)

3. **Test Cross-Contamination**:
   - Login as DCPSP, verify no demo data visible
   - Login as DEMO, verify no DCPSP data visible
   - Create tickets in both, verify isolation

---

## 🎯 IMMEDIATE NEXT STEPS

1. ✅ **DONE**: Databases cleaned
2. ⏳ **TODO**: Decide on fixing approach (Option 1 or 2)
3. ⏳ **TODO**: Update all 30+ endpoints to use tenant routing
4. ⏳ **TODO**: Deploy updated API
5. ⏳ **TODO**: Test database isolation thoroughly

---

## 💡 WHY THIS HAPPENED

The multi-tenant architecture was partially implemented:
- ✅ Tenant mapping created
- ✅ Middleware created  
- ✅ Pool management created
- ❌ **Middleware never applied to routes**
- ❌ **Endpoints never updated to use `req.pool`**

The login endpoint was fixed as a one-off, but the underlying architecture wasn't fully converted.

---

## RECOMMENDATION

**I suggest we do a comprehensive fix:**
1. Apply the middleware globally
2. Create a script to find and replace ALL `pool.request()` with `req.pool.request()`
3. Update helper functions to accept pool parameter
4. Deploy once with complete fix
5. Test thoroughly

This will ensure proper database isolation going forward.

Let me know if you want me to proceed with this comprehensive fix, or if you'd prefer a different approach.
