# Demo Mode UI Integration Guide

## Overview
The `DemoModeSwitcher` component provides an intuitive UI for switching between production and demo environments.

## Features
- **Visual Demo Banner**: Prominent warning banner when in demo mode
- **Floating Switcher Button**: Always accessible from any page
- **Multiple Demo Scenarios**: General, HVAC-focused, Security-focused
- **Persistent Selection**: Stores choice in localStorage
- **Auto-reload**: Automatically refreshes data when switching environments

---

## Quick Start

### 1. Add to Your App

#### Option A: Add to Main Layout (Recommended)
```tsx
// src/App.tsx or your main layout component
import DemoModeSwitcher from './components/DemoModeSwitcher'

function App() {
  return (
    <>
      <DemoModeSwitcher />
      {/* Your existing app content */}
    </>
  )
}
```

#### Option B: Add to Header
```tsx
// src/components/Header.tsx
import DemoModeSwitcher from './DemoModeSwitcher'

export default function Header() {
  return (
    <header>
      <DemoModeSwitcher />
      {/* Your navigation, logo, etc. */}
    </header>
  )
}
```

### 2. Update API Calls

Modify your API utility to include the company code in all requests:

```tsx
// src/api-json.ts (or your API file)
import { getCompanyCode } from './components/DemoModeSwitcher'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Helper to add company code to URLs
function buildUrl(endpoint: string): string {
  const companyCode = getCompanyCode()
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  url.searchParams.set('company', companyCode)
  return url.toString()
}

// Example: Update your API functions
export async function listTickets() {
  const response = await fetch(buildUrl('/api/tickets'))
  if (!response.ok) throw new Error('Failed to fetch tickets')
  return response.json()
}

export async function listCustomers() {
  const response = await fetch(buildUrl('/api/customers'))
  if (!response.ok) throw new Error('Failed to fetch customers')
  return response.json()
}

// For POST/PUT/DELETE requests
export async function createTicket(data: any) {
  const response = await fetch(buildUrl('/api/tickets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create ticket')
  return response.json()
}
```

---

## Alternative: Header-Based Approach

If you prefer using headers instead of query parameters:

```tsx
// src/api-json.ts
import { getCompanyCode } from './components/DemoModeSwitcher'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Company-Code': getCompanyCode()
  }
}

export async function listTickets() {
  const response = await fetch(`${API_BASE_URL}/api/tickets`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Failed to fetch tickets')
  return response.json()
}

export async function createTicket(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create ticket')
  return response.json()
}
```

---

## Usage Scenarios

### 1. **Sales Demonstrations**
Share a demo link with potential clients:
- URL: `https://yourdomain.com/login?company=DEMO`
- Login: `demo` / `demo123`
- Shows 15 diverse tickets, 8 customers nationwide, all features populated
- Zero risk to production data

### 2. **Customer Onboarding**
Use demo mode to train new customers:
```bash
# Customer can explore without affecting their real data
# Switch to demo → Learn features → Switch back to production
```

### 3. **Development Testing**
Test new features against consistent demo data:
```bash
# Switch to demo mode
# Test your changes
# Verify without polluting production
```

### 4. **Industry-Specific Demos**
Show targeted scenarios:
- **HVAC Demo**: HVAC service tickets, maintenance schedules
- **Security Demo**: Alarm systems, access control, camera installations

---

## Demo Data Included

### Users (9 total)
- **Admin**: demo/demo123
- **Coordinator**: coordinator/demo123  
- **Technicians**: tech1-tech5 / demo123
- **Vendors**: vendor1-vendor2 / demo123

### Customers (8 nationwide)
- California, New York, Colorado, Texas, Washington, Illinois, Georgia, Florida
- Retail, Healthcare, Manufacturing, Education, Hospitality

### Tickets (15 spanning all states)
- **New** (4): Fire alarm errors, inspections, critical issues
- **Scheduled** (2): Maintenance, installations
- **In-Progress** (2): Active repairs
- **On-Hold** (2): Awaiting approval/parts
- **Complete** (3): Finished work
- Plus overdue and critical tickets

### Sites (14 locations)
- Multi-location customers
- Full contact details
- Various facility types

### Licenses (10 types)
- Fire alarm monitoring
- Security system monitoring
- Access control
- Some expired/expiring for testing

---

## Customization

### Change Default Environment
```tsx
// src/components/DemoModeSwitcher.tsx
const [companyCode, setCompanyCode] = useState<string>(
  localStorage.getItem('companyCode') || 'DEMO' // Changed from 'DCPSP'
)
```

### Add Custom Demo Scenarios
```tsx
// In DemoModeSwitcher.tsx
const COMPANY_CODES = {
  PRODUCTION: 'DCPSP',
  DEMO: 'DEMO',
  DEMO_HVAC: 'DEMO-HVAC',
  DEMO_SECURITY: 'DEMO-SECURITY',
  DEMO_CUSTOM: 'DEMO-CUSTOM' // Add your custom scenario
}

// Then add a button in the menu panel:
<button
  onClick={() => handleSwitch(COMPANY_CODES.DEMO_CUSTOM)}
  className={`${styles.envButton} ${companyCode === COMPANY_CODES.DEMO_CUSTOM ? `${styles.custom} ${styles.active}` : styles.inactive}`}
>
  🎯 Custom Demo
</button>
```

### Customize Banner Appearance
Edit `src/components/DemoModeSwitcher.module.css`:
```css
.demoBanner {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  color: #your-text-color;
  /* ... other styles */
}
```

---

## Testing

### Local Testing
1. Start your backend: `npm start` in `server/` folder
2. Start your frontend: `npm run dev`
3. Click the floating button (bottom-right)
4. Select "General Demo"
5. Verify URL shows `?company=DEMO`
6. Check network tab - requests should include company parameter
7. Verify data changes (15 demo tickets should appear)

### Production Testing
After deploying:
```bash
# Test production
curl "https://your-api.azurewebsites.net/api/tickets?company=DCPSP"

# Test demo
curl "https://your-api.azurewebsites.net/api/tickets?company=DEMO"

# Verify response header
curl -I "https://your-api.azurewebsites.net/api/tickets?company=DEMO"
# Should see: X-Tenant-Code: DEMO
```

---

## Troubleshooting

### Demo Mode Not Working
1. **Check localStorage**: Open DevTools → Application → Local Storage
   - Should see `companyCode: DEMO`
2. **Verify API calls**: Open DevTools → Network tab
   - Check if `?company=DEMO` is appended to URLs
   - Or check if `X-Company-Code: DEMO` header is present
3. **Check middleware**: Ensure `tenant-middleware.js` is integrated in `api.js`
4. **Verify tenant registry**: Query database:
   ```sql
   SELECT * FROM TenantRegistry.dbo.Tenants WHERE CompanyCode = 'DEMO'
   ```

### Data Not Switching
- **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Clear cache**: DevTools → Network → Disable cache
- **Check API response**: Verify `X-Tenant-Code` header matches selected company

### Floating Button Not Appearing
- **z-index conflict**: Check if other elements have higher z-index
- **Position conflict**: Ensure no fixed elements blocking bottom-right corner
- **Import issue**: Verify `DemoModeSwitcher` is properly imported and rendered

---

## Best Practices

### 1. **Always Use Helper Function**
```tsx
// ✅ Good - Uses getCompanyCode() helper
import { getCompanyCode } from './components/DemoModeSwitcher'
const url = `/api/tickets?company=${getCompanyCode()}`

// ❌ Bad - Hardcoded or missing company code
const url = '/api/tickets'
```

### 2. **Centralize API Logic**
Create a single API utility file that handles all requests with company code:
```tsx
// src/utils/api.ts
export const api = {
  get: (endpoint: string) => fetch(buildUrl(endpoint)),
  post: (endpoint: string, data: any) => fetch(buildUrl(endpoint), {...}),
  // ... etc
}
```

### 3. **Handle Demo Mode in UI**
Show visual indicators when in demo mode:
```tsx
const companyCode = getCompanyCode()
const isDemo = companyCode !== 'DCPSP'

return (
  <div>
    {isDemo && <p style={{ color: 'orange' }}>⚠️ Viewing demo data</p>}
    {/* Your content */}
  </div>
)
```

### 4. **Disable Destructive Actions in Demo**
```tsx
const isDemo = getCompanyCode() !== 'DCPSP'

async function deleteTicket(id: number) {
  if (isDemo) {
    alert('Cannot delete tickets in demo mode')
    return
  }
  // Proceed with deletion
}
```

---

## Next Steps

1. ✅ **Install Component**: Add `<DemoModeSwitcher />` to your app
2. ✅ **Update API Calls**: Modify `api-json.ts` to use `getCompanyCode()`
3. ⏳ **Run SQL Scripts**: Set up demo databases (see `MULTI-TENANT-SETUP.md`)
4. ⏳ **Integrate Middleware**: Update `api.js` (see `MULTI-TENANT-SETUP.md`)
5. ⏳ **Test Locally**: Switch modes and verify data changes
6. ⏳ **Deploy**: Push changes to Azure
7. ⏳ **Share Demo Link**: Send to potential clients!

---

## Support

### Demo Login Credentials
- **Username**: `demo`
- **Password**: `demo123`

### Available Demo Environments
- `DEMO` - General demo with diverse scenarios
- `DEMO-HVAC` - HVAC-focused service scenarios
- `DEMO-SECURITY` - Security system scenarios
- `DCPSP` - Production environment (default)

### Documentation
- Full setup guide: `MULTI-TENANT-SETUP.md`
- Architecture details: See tenant-connection-manager.js and tenant-middleware.js
- Demo data details: `database/populate-demo-data.sql`

---

**You're all set!** 🚀 The demo switcher provides a seamless way to showcase your application to potential clients without affecting production data.
