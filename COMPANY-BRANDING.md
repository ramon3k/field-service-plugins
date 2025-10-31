# Company Branding Feature

## Overview
Implemented dynamic company branding that displays each company's name throughout the application based on the logged-in user's CompanyCode.

## Implementation Details

### Backend Changes (server/api.cjs)

**Login Endpoint Enhancement:**
- Modified `/api/auth/login` to fetch company information from the Companies table
- Returns `companyName`, `companyDisplayName` in login response
- Uses `DisplayName` for branding (falls back to `CompanyName`, then `CompanyCode`)

```javascript
// Fetch company information for branding
let companyName = user.CompanyCode; // Fallback to code
let companyDisplayName = user.CompanyCode;

try {
  const companyResult = await pool.request()
    .input('companyCode', sql.VarChar, user.CompanyCode)
    .query('SELECT CompanyName, DisplayName FROM Companies WHERE CompanyCode = @companyCode AND IsActive = 1');
  
  if (companyResult.recordset.length > 0) {
    const company = companyResult.recordset[0];
    companyName = company.CompanyName || user.CompanyCode;
    companyDisplayName = company.DisplayName || company.CompanyName || user.CompanyCode;
  }
} catch (companyErr) {
  console.warn('Could not fetch company details (non-critical):', companyErr.message);
}

// Return user data with branding info
const userData = {
  id: user.ID,
  username: user.Username,
  email: user.Email,
  fullName: user.FullName,
  role: user.Role,
  permissions: user.Permissions,
  vendor: user.Vendor,
  companyCode: user.CompanyCode,
  companyName: companyName,
  companyDisplayName: companyDisplayName
};
```

### Frontend Changes

**1. App.tsx:**
- Added `companyDisplayName` state (default: 'DCPSP Field Service')
- Updated login handler to extract and set company branding from user data
- Added `useEffect` to dynamically update page title (browser tab)
- Replaced hardcoded "DCPSP Field Service" with `{companyDisplayName}` in header
- Pass `companyDisplayName` to TicketEditModal component

**2. TicketEditModal.tsx:**
- Added `companyName` prop (optional, defaults to 'DCPSP')
- Passes company name to PrintableServiceTicket component

**3. PrintableServiceTicket.tsx:**
- Added `companyName` prop (optional, defaults to 'DCPSP')
- Replaced hardcoded "DCPSP" in print header with `${companyName}`

**4. index.html:**
- Changed default title from "DCPSP Field Service" to generic "Field Service Management"
- Actual title set dynamically on login

## User Experience

### Before Login:
- Browser tab: "Field Service Management"
- No company branding visible

### After Login:
- Browser tab: "[Company Display Name]"
- Application header: "🔧 [Company Display Name]"
- Printed tickets header: "[Company Display Name]"

## Examples

### DCPSP Company:
- Login as: admin/abc123
- Displays: "DCPSP Field Services" (from Companies.DisplayName)
- Printed tickets show: "DCPSP Field Services"

### New Company (e.g., ABC Integrators):
- Create company with DisplayName: "ABC Integrators"
- Users from that company see: "ABC Integrators"
- Their printed tickets show: "ABC Integrators"

## Benefits

1. **White-Label Capability:** Each company gets branded experience
2. **Professional Appearance:** Clients see their own company name
3. **Print-Ready:** Tickets print with correct company branding
4. **Dynamic Updates:** Change company DisplayName in database, all users see update immediately
5. **Multi-Tenant Ready:** Perfect for SaaS deployment with multiple companies

## Database Requirements

The Companies table must exist with:
- `CompanyCode` (VARCHAR, unique)
- `CompanyName` (NVARCHAR)
- `DisplayName` (NVARCHAR) - Used for branding
- `IsActive` (BIT)

## Testing

1. Login as DCPSP admin → Should see "DCPSP Field Services"
2. Create new company: "KIT Field Services"
3. Create user with CompanyCode "KIT"
4. Login as KIT user → Should see "KIT Field Services"
5. Print a ticket → Header shows "KIT Field Services"
6. Check browser tab → Shows "KIT Field Services"

## Deployment Status

- ✅ Backend code ready (needs deployment to Azure App Service)
- ✅ Frontend built and deployed to Azure Static Web Apps
- ✅ Feature live at: https://purple-sky-0964fd410.3.azurestaticapps.net

## Next Steps

1. Deploy updated `server/api.cjs` to Azure App Service
2. Test login with DCPSP account
3. Add test company and verify branding works
4. Document for end users
