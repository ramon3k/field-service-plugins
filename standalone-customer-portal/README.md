# Customer Service Request Portal 🎯

**Standalone web-hostable customer service request submission form**

## What Is This?

A separate, lightweight Node.js application that allows customers to submit service requests without logging in. Connects to your main Field Service Management database.

Perfect for:
- ✅ Public website integration
- ✅ Customer self-service portals
- ✅ Separate subdomain hosting (support.yourdomain.com)
- ✅ Embedded in existing websites

## Quick Start (5 Minutes)

### 1. Install
```bash
npm install
```

### 2. Configure
Copy `.env.example` to `.env` and edit your database settings:
```env
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=FieldServiceDB
COMPANY_CODE=KIT
```

### 3. Run
```bash
npm start
```

### 4. Test
Open browser: **http://localhost:3000**

## What You Get

- 📝 **Beautiful submission form** - Professional, responsive design
- 🔒 **Secure API** - Validates input, prevents SQL injection
- 🗄️ **Database integration** - Stores requests in your FieldServiceDB
- 🌐 **CORS enabled** - Can be hosted on separate domain
- 📊 **Activity logging** - Tracks all submissions
- 🏢 **Multi-tenant** - CompanyCode support built-in

## Features

### Customer Form (`public/index.html`)
- Name, email, phone (required)
- Company/site name and address (optional)
- Priority selection (Low/Medium/High/Critical)
- Detailed issue description
- Real-time validation
- Success confirmation with reference ID
- Mobile-responsive design

### API Server (`server.js`)
- Public POST endpoint: `/api/service-requests/submit`
- Health check endpoint: `/health`
- Database connection pooling
- CORS configuration
- Error handling and logging
- Input validation
- IP address and user agent tracking

## Deployment Options

Choose your hosting platform:

| Platform | Best For | Difficulty |
|----------|----------|------------|
| **Azure App Service** | Cloud hosting with auto-SSL | Easy |
| **Windows IIS** | On-premises Windows Server | Medium |
| **Shared Hosting** | Budget-friendly | Medium |
| **AWS/Heroku** | Enterprise cloud | Easy |

📖 **Full deployment guide:** See [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

## Files

```
standalone-customer-portal/
├── server.js              # Node.js API server
├── package.json           # Dependencies
├── .env                   # Your configuration
├── .env.example           # Configuration template
├── web.config             # IIS hosting config
├── public/
│   └── index.html         # Customer submission form
└── README-DEPLOYMENT.md   # Detailed deployment guide
```

## Security

✅ **Limited database permissions** - Portal user only has INSERT access to ServiceRequests  
✅ **Input validation** - Email format, required fields, XSS prevention  
✅ **CORS restrictions** - Configure allowed domains  
✅ **HTTPS ready** - Works with SSL certificates  
✅ **Rate limiting** - Can add to prevent spam (see deployment guide)  

## Configuration (.env)

```env
# Database
DB_SERVER=localhost\SQLEXPRESS    # Your SQL Server
DB_NAME=FieldServiceDB            # Your database name
DB_USER=                          # Leave empty for Windows Auth
DB_PASSWORD=                      # Leave empty for Windows Auth
DB_ENCRYPT=false                  # Set to true for Azure SQL

# Company
COMPANY_CODE=KIT                  # Your company code

# Server
PORT=3000                         # Web server port

# Security
ALLOWED_ORIGINS=*                 # In production: https://yourdomain.com
```

## Database Requirements

This portal uses your existing Field Service database tables:
- ✅ `ServiceRequests` - Where requests are stored
- ✅ `ActivityLog` - Tracks submission activity
- ✅ `Users` - References system user (system_001)

**Note:** If you installed the main Field Service app using SETUP.bat, these tables already exist with CompanyCode support.

## Customization

### Change Branding
Edit `public/index.html`:
- Update title and heading
- Change gradient colors (CSS)
- Add your logo
- Modify form fields

### Add Email Notifications
Install nodemailer:
```bash
npm install nodemailer
```

Add to `server.js` after successful submission:
```javascript
const nodemailer = require('nodemailer');
// Send confirmation email to customer
```

### Add reCAPTCHA
Prevent spam by adding Google reCAPTCHA to the form.

### Analytics
Add Google Analytics or Microsoft Clarity to track submissions.

## API Endpoints

### POST `/api/service-requests/submit`
Submit a new service request (public, no auth required)

**Request Body:**
```json
{
  "CustomerName": "John Doe",
  "ContactEmail": "john@example.com",
  "ContactPhone": "(555) 123-4567",
  "SiteName": "Acme Corp - Main Office",
  "Address": "123 Main St, City, State",
  "Priority": "Medium",
  "IssueDescription": "Printer not working..."
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "REQ-1729123456-abc123def",
  "message": "Your service request has been submitted successfully..."
}
```

### GET `/health`
Check if server and database are running

**Response:**
```json
{
  "status": "ok",
  "service": "Customer Service Request Portal",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "database": "connected"
}
```

## Testing

### Local Testing
```bash
npm start
# Open http://localhost:3000
# Fill out form and submit
# Check ServiceRequests table in database
```

### Production Testing
```bash
curl https://your-domain.com/health
curl -X POST https://your-domain.com/api/service-requests/submit \
  -H "Content-Type: application/json" \
  -d '{"CustomerName":"Test","ContactEmail":"test@example.com","IssueDescription":"Test request"}'
```

## Monitoring Submissions

Check database for new requests:
```sql
SELECT TOP 10 * 
FROM ServiceRequests 
WHERE Status = 'New'
ORDER BY SubmittedAt DESC
```

View activity log:
```sql
SELECT TOP 10 *
FROM ActivityLog
WHERE Action = 'Service Request Submitted'
ORDER BY Timestamp DESC
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database connection not available" | Check .env file, verify SQL Server is running |
| CORS errors | Update ALLOWED_ORIGINS in .env |
| Form won't submit | Check browser console, verify API URL |
| "Cannot find module" | Run `npm install` |

## Support

📖 **Detailed deployment guide:** [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)  
🔧 **Main app documentation:** See parent directory README.md  
💬 **Questions?** Check troubleshooting section above  

## License

MIT License - Free to use and modify

---

**Built for Knight Industries Field Service Management System**  
Version 1.0.0 | October 2025
