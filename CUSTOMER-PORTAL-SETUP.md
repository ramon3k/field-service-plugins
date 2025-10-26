# Customer Service Portal Setup Guide

## Overview
This customer service portal allows your clients to log in and submit service requests for their managed sites. It's a separate interface from the admin application.

## Features
- ✅ Customer authentication with username/password
- ✅ Site selection dropdown for customers with multiple locations
- ✅ Professional service request form with categories and priorities
- ✅ Contact information capture
- ✅ Scheduling preferences
- ✅ Automatic ticket creation in your system
- ✅ Success confirmation with ticket ID

## Quick Setup

### 1. Database Setup
Run the customer portal database setup script:

```sql
-- Run this in SQL Server Management Studio or your preferred SQL tool
sqlcmd -S your-server -d your-database -i database/setup-customer-users.sql
```

Or execute the script manually from `database/setup-customer-users.sql`

This adds customer users to your existing `users` table instead of creating a separate table.

### 2. Server Configuration
The customer portal routes are automatically included when you start your server:

```bash
cd server
npm start
```

The customer portal API will be available at `/api/customer/*`

### 3. Start the Development Server
```bash
npm run dev
```

## Accessing the Customer Portal

### Development Mode
- Admin Interface: http://localhost:5173/
- **Customer Portal**: http://localhost:5173/customer-portal.html

### Production Mode
After building and deploying:
- Admin Interface: https://yoursite.com/
- **Customer Portal**: https://yoursite.com/customer-portal.html

## Test Credentials

The setup script creates sample customer users for testing:

| Company Code | Username | Password | Customer | Description |
|--------------|----------|----------|----------|-------------|
| `DEMO` | `demo.customer` | `password123` | Demo Corporation | For testing in demo tenant |
| `DEMO` | `acme.portal` | `password123` | ACME Corp | ACME customer sites |
| `DEMO` | `techflow.portal` | `password123` | TechFlow Solutions | TechFlow customer sites |
| `DEMO` | `global.portal` | `password123` | Global Manufacturing | Global customer sites |

**⚠️ IMPORTANT: All customers log into the same company code as your service company!**

## Customer Workflow

1. **Company Code Entry**: Customer enters your service company code (e.g., "DEMO")
2. **Login**: Customer enters their username and password
3. **Site Selection**: Customer sees all sites for their company they manage
4. **Service Request**: Customer clicks "Request Service" for a specific site
5. **Form Completion**: Customer fills out detailed service request form
6. **Submission**: System creates ticket and provides confirmation with ticket ID
7. **Tracking**: Ticket appears in your admin system for assignment and processing

## Integration with Existing System

The customer portal:
- ✅ Creates tickets in your existing `tickets` table
- ✅ Logs activities in your `activity_log` table  
- ✅ Uses your existing customer and site data
- ✅ Respects your SLA and priority rules
- ✅ Integrates seamlessly with your admin workflows

## Customization

### Adding New Customer Users
```sql
INSERT INTO customer_users (CustomerID, Username, PasswordHash, Email, FullName, IsActive, CanSubmitRequests)
VALUES ('CUSTOMER_ID', 'username', '$2b$10$...', 'email@example.com', 'Full Name', 1, 1);
```

Use bcrypt to hash passwords. Online tools available or use:
```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('password', 10);
console.log(hash);
```

### Styling and Branding
- Modify `src/components/CustomerLogin.css` for login page styling
- Modify `src/components/CustomerPortalApp.css` for main portal styling
- Modify `src/components/ServiceRequestModal.css` for service request form styling

### Categories and Options
Edit `src/components/ServiceRequestModal.tsx` to customize:
- Service categories
- Urgency levels  
- Time slot options
- Required fields

## Deployment

### Build for Production
```bash
npm run build
```

This creates two HTML files:
- `dist/index.html` - Admin interface
- `dist/customer-portal.html` - Customer portal

### Web Server Configuration

#### Apache (.htaccess)
```apache
# Customer Portal routing
RewriteRule ^customer-portal/?$ customer-portal.html [L]
RewriteRule ^customer/?$ customer-portal.html [L]

# API routing
RewriteRule ^api/(.*)$ http://localhost:5001/api/$1 [P,L]
```

#### Nginx
```nginx
# Customer Portal routing
location /customer-portal {
    try_files /customer-portal.html =404;
}

location /customer {
    try_files /customer-portal.html =404;
}

# API proxying
location /api/ {
    proxy_pass http://localhost:5001/api/;
}
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Password Policy**: Implement strong password requirements
3. **Rate Limiting**: Add rate limiting to login endpoints
4. **Session Management**: Configure secure JWT settings
5. **CORS**: Update CORS settings for your domain
6. **Database Security**: Use least-privilege database accounts

## Support and Troubleshooting

### Common Issues

**Customer can't log in**
- Check username exists in `customer_users` table
- Verify customer is active (`IsActive = 1`)
- Check password hash matches

**No sites showing**
- Verify customer has sites in `sites` table
- Check customer name matches exactly between `customers` and `sites` tables

**Service requests not creating tickets**
- Check database connection
- Verify `tickets` table permissions
- Check server logs for errors

### Database Queries for Troubleshooting

```sql
-- View customer portal access
SELECT * FROM vw_customer_portal_access;

-- Check customer's sites
SELECT s.Site, s.Customer, s.Address 
FROM sites s 
INNER JOIN customers c ON s.Customer = c.Name 
WHERE c.CustomerID = 'ACME';

-- View recent service requests
SELECT * FROM tickets 
WHERE RequestedBy IS NOT NULL 
ORDER BY CreatedAt DESC;
```

## Next Steps

1. ✅ **Test the portal** with sample credentials
2. ⚠️ **Set up real customer accounts** with proper passwords
3. 🎨 **Customize styling** to match your brand
4. 📧 **Configure email notifications** for new service requests
5. 📱 **Test mobile responsiveness** 
6. 🚀 **Deploy to production**

The customer portal is now ready to give your clients a professional self-service experience!