# Quick Start Guide
## Get Your Field Service System Running in 30 Minutes

### 🚀 Express Installation

#### 1. Extract Files (2 minutes)
```
1. Extract FieldServiceSystem-v1.0.zip to C:\FieldService\
2. You should see folders: server, database, docs, scripts
```

#### 2. Run Setup (15 minutes)
```
1. Right-click SETUP.bat → "Run as Administrator"
2. Wait for installation to complete
3. Press any key when prompted to finish
```

#### 3. First Login (1 minute)
```
1. Open browser → http://localhost:5000
2. Login: admin / admin123
3. Click "Change Password" immediately
```

#### 4. Basic Setup (10 minutes)
```
1. Go to Settings → Company Profile
2. Enter your company name
3. Go to Users → Add your first coordinator/technician
4. Create your first customer in Customers tab
```

### ✅ You're Ready!
Your system is now running. Users can access it at **http://localhost:5000**

---

## 🎯 Essential First Steps

### Add Your First Customer
1. Click **"Customers"** tab
2. Click **"Add Customer"** button
3. Fill in company name and contact info
4. Click **"Save"**

### Add a Service Site
1. Select your customer
2. Click **"Add Site"** 
3. Enter location address
4. Save the site information

### Create Your First Service Ticket
1. Click **"Tickets"** tab
2. Click **"Create Ticket"**
3. Select customer and site
4. Enter service request details
5. Assign to a technician

### Add Team Members
1. Click **"Admin"** → **"User Management"**
2. Click **"Add New User"**
3. Choose role: Admin, Coordinator, or Technician
4. Enter their details and temporary password
5. Give them the login URL: http://localhost:5000

---

## 🔧 Common Settings

### Change Company Name
```
Settings → Company Profile → Update "Company Name"
```

### Add Company Logo
```
Settings → Company Profile → Upload Logo (JPG/PNG, max 2MB)
```

### Setup Backup Location
```
Default: C:\FieldServiceBackups\
Change in: server\.env file (DB_BACKUP_PATH)
```

### Configure Email Notifications (Optional)
```
Settings → Email Settings → Enter SMTP details
```

---

## 👥 User Quick Reference

### Admin Users Can:
- Manage all users and permissions
- View all customers and tickets
- Access system settings and reports
- Backup and restore data

### Coordinators Can:
- Create and assign service tickets
- Manage customers and sites
- View technician schedules
- Generate reports

### Technicians Can:
- View their assigned tickets
- Update ticket status and notes
- Access customer information
- Record time and materials

---

## 📱 Mobile Access Setup

### For Tablets/Phones:
1. Connect device to same network as server
2. Open browser on device
3. Go to: http://[SERVER-IP]:5000
4. Bookmark for easy access

### Find Your Server IP:
```
1. Open Command Prompt
2. Type: ipconfig
3. Look for IPv4 Address (usually 192.168.x.x)
```

---

## 🚨 Quick Troubleshooting

### Can't Access Website?
```
1. Check if application is running
2. Try: http://localhost:5000
3. Restart: scripts\restart-application.bat
```

### Database Issues?
```
1. Check SQL Server service is running
2. Run: services.msc → Start "SQL Server (SQLEXPRESS)"
3. If problems persist: scripts\reset-database.bat
```

### Forgot Admin Password?
```
1. Run: scripts\reset-admin-password.bat
2. Enter new password when prompted
3. Login with admin / [new-password]
```

---

## 📞 Need Help?

### Immediate Support
- **Email**: support@yourcompany.com
- **Phone**: 1-800-XXX-XXXX
- **Hours**: Monday-Friday, 8AM-6PM EST

### Self-Help Resources
- **Complete Manual**: docs\user-manual.pdf
- **Video Tutorials**: [your-support-website]
- **Knowledge Base**: [your-support-website]/kb

### Emergency After Hours
- **Critical Issues**: Call main number, press 1 for emergency
- **Email**: emergency@yourcompany.com
- **Response Time**: Within 2 hours

---

## 📊 Next Steps

### Week 1: Basic Operation
- [ ] All users created and trained
- [ ] Customer database populated
- [ ] First tickets created and processed
- [ ] Basic workflow established

### Week 2: Advanced Features
- [ ] Asset management setup
- [ ] Reporting and exports configured
- [ ] Mobile device access established
- [ ] Backup procedures tested

### Month 1: Optimization
- [ ] Custom fields added (if needed)
- [ ] Integrations setup (if applicable)
- [ ] Performance tuning
- [ ] Advanced user training

### Ongoing: Best Practices
- [ ] Weekly backup verification
- [ ] Monthly user review
- [ ] Quarterly system health check
- [ ] Annual license renewal

---

**🎉 Congratulations!** Your Field Service Management System is ready to help your business run more efficiently.

For the complete documentation, see **README-DISTRIBUTION.md** and the **docs** folder.

---

**Quick Reference Card**
```
Application URL: http://localhost:5000
Default Admin: admin / admin123 (CHANGE THIS!)
Installation Path: C:\FieldService\
Backup Location: C:\FieldServiceBackups\
Support: support@yourcompany.com
```