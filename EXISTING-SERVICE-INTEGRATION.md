# Integration with Your Existing Azure App Service

## 🎯 Perfect Solution: Add to Your Existing Service

Since you already have an Azure App Service running license activation APIs, you can simply **add the field service API as a new module**. This gives you:

✅ **Zero additional hosting costs**  
✅ **Unified management** of all your APIs  
✅ **Shared infrastructure** and monitoring  
✅ **Same domain** for all services  

## 🔧 Simple Integration Steps

### Step 1: Add Field Service Module to Your Existing App

```javascript
// your-existing-app.js (main server file)
const express = require('express');
const app = express();

// Your existing routes
app.use('/api/licenses', require('./routes/licenses'));
app.use('/api/activation', require('./routes/activation'));

// Add field service routes (NEW)
app.use('/api/field-service', require('./routes/field-service'));

// Optional: Serve field service frontend
app.use('/field-service', express.static('field-service-dist'));

app.listen(process.env.PORT || 8080);
```

### Step 2: Copy the Field Service Module

```bash
# In your existing app directory:
mkdir routes
cp field-service-routes-clean.js routes/field-service.js

# Install additional dependencies:
npm install bcrypt mssql
```

### Step 3: Update Your Frontend API Configuration

```javascript
// Update your React app's API base URL:
const API_BASE_URL = 'https://your-existing-app.azurewebsites.net/api/field-service';

// Your existing license API remains:
// https://your-existing-app.azurewebsites.net/api/licenses
// https://your-existing-app.azurewebsites.net/api/activation

// New field service API:
// https://your-existing-app.azurewebsites.net/api/field-service/tenant/register
// https://your-existing-app.azurewebsites.net/api/field-service/auth/login
// https://your-existing-app.azurewebsites.net/api/field-service/customers
```

## 🗂️ Suggested Directory Structure

```
your-existing-app/
├── routes/
│   ├── licenses.js         (existing)
│   ├── activation.js       (existing)
│   └── field-service.js    (new)
├── middleware/
│   ├── auth.js            (existing - can be shared)
│   └── cors.js            (existing)
├── package.json
├── app.js                 (main server file)
└── field-service-dist/    (optional: built React app)
```

## 🔗 API Endpoints After Integration

### Your Existing APIs (unchanged):
```
GET  /api/licenses/validate
POST /api/licenses/activate
GET  /api/activation/status
...etc
```

### New Field Service APIs:
```
POST /api/field-service/tenant/register
GET  /api/field-service/tenant/validate/:code
POST /api/field-service/auth/login
GET  /api/field-service/customers
POST /api/field-service/customers
GET  /api/field-service/tickets
...etc
```

## 🔒 Shared Authentication (Optional Enhancement)

You can optionally create shared authentication middleware:

```javascript
// middleware/unified-auth.js
const jwt = require('jsonwebtoken');

const unifiedAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Route-specific validation
    if (req.path.startsWith('/api/field-service')) {
      // Field service needs tenant context
      if (!decoded.tenantCode) {
        return res.status(401).json({ error: 'Tenant context required' });
      }
      req.tenantCode = decoded.tenantCode;
    } else if (req.path.startsWith('/api/licenses')) {
      // License API validation
      if (!decoded.licenseKey) {
        return res.status(401).json({ error: 'License key required' });
      }
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = unifiedAuth;
```

## 🎯 Benefits of This Approach

### Cost Savings
- **$0 additional hosting** (use existing App Service)
- **Shared SSL certificate**
- **Unified monitoring and logging**

### Management Benefits
- **Single deployment** for all APIs
- **Shared environment variables**
- **Unified backup and scaling**
- **One domain to manage**

### Technical Benefits
- **Code reuse** between services
- **Shared middleware** (auth, CORS, etc.)
- **Consistent API patterns**

## 🚀 Deployment Process

### Option 1: Manual Upload
1. Copy `field-service-routes-clean.js` to your app
2. Update your main server file
3. Deploy through Azure Portal or VS Code

### Option 2: Git Deployment
1. Add field service files to your repository
2. Push to trigger automatic deployment
3. Azure pulls and deploys automatically

### Option 3: CI/CD Pipeline
1. Add field service build to your pipeline
2. Include React build step for frontend
3. Deploy both APIs and frontend together

## 📊 Example Integration Result

```
Your Azure App Service (yourapp.azurewebsites.net)
├── /api/licenses/*              (existing)
├── /api/activation/*            (existing)
├── /api/field-service/*         (new)
└── /field-service/*             (optional frontend)

Field Service URLs:
- Registration: yourapp.azurewebsites.net/field-service/
- API Health: yourapp.azurewebsites.net/api/field-service/health
- Customer API: yourapp.azurewebsites.net/api/field-service/customers
```

## 🔧 Quick Integration Script

```powershell
# Run this in your existing app directory:
mkdir routes
copy field-service-routes-clean.js routes\field-service.js

# Add to package.json dependencies:
npm install bcrypt mssql

# Update your main app.js file with the field service route
```

This approach lets you leverage your existing infrastructure while adding powerful multi-tenant field service capabilities with **zero additional hosting costs**!

Would you like me to help you integrate this into your existing App Service structure?