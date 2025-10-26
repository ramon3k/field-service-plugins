# Testing Company Data Isolation

## Issue Found
The second company was seeing all data from DCPSP because the frontend wasn't sending the user ID in headers.

## Fix Implemented
Updated `SqlApiService.ts` to read SQL user data from localStorage and send it in headers:
- `x-user-id`: User's database ID
- `x-user-name`: Username  
- `x-user-role`: User role
- `x-user-company-code`: Will be looked up by backend middleware

The backend middleware (`attachCompanyCode`) uses `x-user-id` to:
1. Look up the user in the Users table
2. Extract their CompanyCode
3. Add `WHERE CompanyCode = @companyCode` to all data queries

## How to Test

### Step 1: Login as Company 1 (DCPSP)
1. Open browser (or incognito window #1)
2. Go to: https://purple-sky-0964fd410.3.azurestaticapps.net
3. **Important**: You need to login using SQL credentials, not Microsoft auth
4. Open browser console and check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('sqlUser'))
   ```
5. Verify you see DCPSP user data with `companyCode: "DCPSP"`

### Step 2: Create Test Data for DCPSP
1. Go to Tickets tab
2. Create a new ticket with title "DCPSP Test Ticket"
3. Note the ticket ID

### Step 3: Login as Company 2 (Your New Company)
1. Open a different browser (or incognito window #2)
2. Go to: https://purple-sky-0964fd410.3.azurestaticapps.net
3. Login with the admin credentials you created for the second company
4. Check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('sqlUser'))
   ```
5. Verify `companyCode` is NOT "DCPSP"

### Step 4: Verify Data Isolation
1. Go to Tickets tab
2. You should NOT see "DCPSP Test Ticket"
3. Create a ticket with title "Company 2 Test Ticket"
4. Note the ticket ID

### Step 5: Cross-Check Isolation
1. Switch back to Company 1 browser/window
2. Refresh tickets
3. You should see "DCPSP Test Ticket"
4. You should NOT see "Company 2 Test Ticket"

### Step 6: Check Azure Logs
Monitor backend logs to verify isolation is working:
```powershell
az webapp log tail --name field-service-api --resource-group customer-portal_group --provider application
```

Look for these log messages:
- `🔒 Data isolation: User XXX restricted to company: YYY`
- Should see different company codes for different users
- Should NOT see warnings about "No user ID in request headers"

## Current Login Issue
The app is still using Microsoft MSAL authentication by default. You have two options:

### Option A: Use Browser Console to Manually Login
```javascript
// In browser console:
const response = await fetch('https://field-service-api.azurewebsites.net/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_admin_username',
    password: 'your_password'
  })
});
const userData = await response.json();
localStorage.setItem('sqlUser', JSON.stringify(userData));
location.reload();
```

### Option B: Update App.tsx to Show SQL Login Page
Add SqlLoginPage as the default login method instead of Microsoft MSAL.

## Expected Behavior After Fix
- ✅ Each user only sees data for their CompanyCode
- ✅ New tickets automatically tagged with user's CompanyCode  
- ✅ Users cannot access tickets from other companies
- ✅ Backend logs show "Data isolation" messages for each request
- ✅ No warnings about missing user ID in headers

## Debugging Tips
1. Check browser console for user data
2. Check Azure logs for CompanyCode isolation messages
3. Verify x-user-id header is being sent (Network tab in DevTools)
4. Verify backend middleware is extracting CompanyCode
5. Check SQL database directly to see CompanyCode values

## SQL Query to Verify Data
```sql
-- See all users and their companies
SELECT ID, Username, CompanyCode, Role FROM Users;

-- See all tickets and their companies  
SELECT TicketID, Title, CompanyCode FROM Tickets;

-- Verify isolation is working
SELECT 
  u.Username,
  u.CompanyCode AS UserCompany,
  t.TicketID,
  t.Title,
  t.CompanyCode AS TicketCompany
FROM Users u
LEFT JOIN Tickets t ON t.CompanyCode = u.CompanyCode
ORDER BY u.CompanyCode, u.Username;
```
