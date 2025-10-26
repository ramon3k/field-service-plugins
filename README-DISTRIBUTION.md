# Field Service Management System
## Complete Business Solution for Service Companies

### 🎯 Overview
This Field Service Management System is a comprehensive solution designed for service-based companies to manage customers, sites, technicians, service tickets, and assets. Built with modern web technologies, it provides real-time tracking, user management, and detailed reporting capabilities.

### ✨ Key Features
- **Customer & Site Management** - Track all customer locations and contact information
- **Service Ticket Management** - Create, assign, and track service requests
- **Technician Management** - Manage field technicians and contractor vendors
- **Asset Tracking** - Monitor equipment, warranties, and maintenance schedules
- **User Role Management** - Admin, Coordinator, and Technician access levels
- **Activity Logging** - Complete audit trail of all system activities
- **CSV Export** - Export data for reporting and analysis
- **Real-time Dashboard** - Live updates and status tracking
- **Mobile-Friendly** - Works on tablets and mobile devices

---

## 🚀 Quick Start Guide

### System Requirements
- **Operating System**: Windows 10/11 or Windows Server 2019+
- **Database**: SQL Server Express 2019+ (included in setup)
- **Runtime**: Node.js 18+ (will be installed automatically)
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Hardware**: 4GB RAM minimum, 8GB recommended
- **Storage**: 5GB free space for application and database

### Installation Steps

#### 1. Download and Extract
```
1. Extract the FieldServiceSystem-v1.0.zip file to your desired location
2. Example: C:\Programs\FieldServiceSystem\
```

#### 2. Run the Installer
```batch
1. Right-click on "SETUP.bat" and select "Run as Administrator"
2. Follow the on-screen prompts
3. The installer will:
   - Install SQL Server Express (if not present)
   - Install Node.js dependencies
   - Create the database
   - Configure the application
```

#### 3. First-Time Login
```
1. Open your web browser
2. Navigate to: http://localhost:5000
3. Login with default admin credentials:
   - Username: admin
   - Password: admin123
4. IMPORTANT: Change the admin password immediately after login
```

---

## 🔧 Configuration

### Company Setup
After first login, configure your company information:

1. **Company Details**
   - Navigate to Settings → Company Profile
   - Update company name, contact information
   - Upload your company logo
   
2. **User Management**
   - Add your staff members (Admin → User Management)
   - Assign appropriate roles (Admin, Coordinator, Technician)
   - Set up vendor/contractor accounts

3. **Initial Data Setup**
   - Import your customers (CSV template provided)
   - Add customer sites and locations
   - Set up your asset inventory
   - Configure service categories

### Database Configuration
The system uses SQL Server Express by default. Configuration file location:
```
server\.env
```

Default database settings:
```
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=FieldServiceDB
DB_USER=(Windows Authentication)
```

---

## 👥 User Roles & Permissions

### Administrator
- Full system access
- User management
- Company configuration
- System settings
- All reports and exports

### Coordinator
- View all tickets and customers
- Assign tickets to technicians
- Create and edit customer information
- Generate reports
- Monitor technician activity

### Technician
- View assigned tickets
- Update ticket status and notes
- View customer and site information
- Upload photos and documents
- Clock in/out for service calls

---

## 📊 Using the System

### Customer Management
1. **Add New Customers**
   - Navigate to "Customers" tab
   - Click "Add Customer"
   - Fill in company details and contact information

2. **Manage Customer Sites**
   - Select a customer
   - Add multiple service locations
   - Include GPS coordinates for routing

### Service Ticket Workflow
1. **Create Service Request**
   - Customers call in or submit online requests
   - Coordinator creates ticket in system
   - Assigns priority and category

2. **Assign Technician**
   - Select available technician
   - Consider location and expertise
   - System sends notification

3. **Field Service**
   - Technician receives assignment
   - Updates status (En Route, On Site, Complete)
   - Adds notes and photos
   - Records time and materials used

4. **Completion & Billing**
   - Technician marks complete
   - Coordinator reviews work
   - Generate service report
   - Export to billing system

### Asset Management
- Track equipment at customer sites
- Monitor warranty expiration dates
- Schedule preventive maintenance
- Maintain service history

---

## 🔒 Security & Backup

### Security Features
- **User Authentication** - Secure login with password encryption
- **Role-Based Access** - Users only see permitted information
- **Activity Logging** - Complete audit trail of all actions
- **Session Management** - Automatic timeout for security
- **Data Encryption** - Sensitive data encrypted in database

### Backup Procedures
1. **Automatic Backups**
   - Daily database backups at 2:00 AM
   - Stored in: `C:\FieldServiceBackups\`
   - 30-day retention policy

2. **Manual Backup**
   ```batch
   # Run this command as Administrator
   cd C:\Programs\FieldServiceSystem\scripts\
   backup-database.bat
   ```

3. **Restore from Backup**
   ```batch
   cd C:\Programs\FieldServiceSystem\scripts\
   restore-database.bat [backup-file-name]
   ```

---

## 📱 Mobile Access

### Tablet/Mobile Usage
- Fully responsive design works on tablets and smartphones
- Technicians can use tablets in the field
- Touch-friendly interface
- Works offline with sync when connected

### Recommended Devices
- **Tablets**: iPad, Surface, Android tablets (10" screen minimum)
- **Phones**: iPhone, Samsung Galaxy, Google Pixel
- **Rugged Options**: Panasonic Toughbook, Getac tablets

---

## 🛠 Troubleshooting

### Common Issues

#### "Cannot connect to database"
```
1. Check if SQL Server Express service is running
2. Windows Services → SQL Server (SQLEXPRESS) → Start
3. Verify Windows Firewall allows SQL Server
4. Check connection string in server\.env file
```

#### "Application won't start"
```
1. Ensure Node.js is installed: node --version
2. Check if port 5000 is available
3. Run: cd server && npm install
4. Check Windows Event Viewer for errors
```

#### "Users can't login"
```
1. Verify database connectivity
2. Check user account status in User Management
3. Clear browser cache and cookies
4. Reset password if needed
```

### Performance Optimization
- **Regular Database Maintenance**: Run monthly cleanup scripts
- **Monitor Disk Space**: Ensure adequate free space for logs
- **Update Browsers**: Keep browsers updated for best performance
- **Network**: Stable internet connection for cloud sync features

---

## 📞 Support & Training

### Getting Help
- **Documentation**: Complete user manuals in `/docs` folder
- **Video Tutorials**: Available at [your-support-website]
- **Email Support**: support@yourcompany.com
- **Phone Support**: 1-800-XXX-XXXX (Business hours)

### Training Options
1. **Self-Service**
   - User manual and video tutorials
   - Sample data for practice
   - Online knowledge base

2. **Remote Training**
   - 2-hour setup and configuration session
   - User training for all roles
   - Best practices guidance

3. **On-Site Training**
   - Full day implementation workshop
   - Custom workflow setup
   - Staff training for all users

### Support Tiers
- **Basic**: Email support, documentation access
- **Professional**: Phone support, priority response
- **Enterprise**: Dedicated support manager, custom features

---

## 🔄 Updates & Maintenance

### Software Updates
- Automatic update notifications
- Download updates from customer portal
- Backup recommended before applying updates
- Release notes provided with each update

### System Maintenance
- **Daily**: Automatic database cleanup
- **Weekly**: Review system logs
- **Monthly**: Performance optimization
- **Quarterly**: Full system backup verification

---

## 📋 Customization Options

### Branding
- Replace company logo
- Customize color scheme
- Modify email templates
- Custom report headers

### Workflow Customization
- Add custom fields to tickets
- Create custom service categories
- Modify user roles and permissions
- Integration with existing systems

### Advanced Features (Available)
- API integration with accounting software
- Mobile app development
- Custom reporting dashboards
- Multi-location management
- Advanced analytics and insights

---

## 📄 License & Legal

### Software License
This software is licensed for use by the purchasing organization. See LICENSE.txt for complete terms.

### Data Ownership
- Your company owns all data entered into the system
- Data export tools available at any time
- No vendor lock-in policies

### Compliance
- Suitable for most business compliance requirements
- GDPR-friendly data handling
- SOC 2 Type II hosting available (cloud option)

---

## 📚 Additional Resources

### File Locations
```
Application Files: C:\Programs\FieldServiceSystem\
Database Files: C:\SQL\Data\FieldServiceDB\
Backup Files: C:\FieldServiceBackups\
Log Files: C:\Programs\FieldServiceSystem\logs\
```

### Important Files
- `server\.env` - Configuration settings
- `docs\user-manual.pdf` - Complete user guide
- `docs\admin-guide.pdf` - Administrator instructions
- `scripts\backup-database.bat` - Manual backup script
- `scripts\reset-admin-password.bat` - Emergency admin reset

### Default Ports
- Web Application: http://localhost:5000
- Database: localhost\SQLEXPRESS (Windows Auth)
- API Endpoints: http://localhost:5000/api/

---

## 🆘 Emergency Procedures

### Reset Admin Password
```batch
1. Open Command Prompt as Administrator
2. cd C:\Programs\FieldServiceSystem\scripts\
3. run: reset-admin-password.bat
4. Follow prompts to set new password
```

### Database Recovery
```batch
1. Stop the application
2. Restore from backup using restore-database.bat
3. Restart application
4. Verify data integrity
```

### Complete Reinstall
```batch
1. Backup your database first!
2. Uninstall via Control Panel
3. Delete installation directory
4. Run SETUP.bat again
5. Restore database from backup
```

---

**Installation Support**: If you encounter any issues during setup, please contact our support team at support@yourcompany.com or call 1-800-XXX-XXXX.

**Version**: 1.0  
**Last Updated**: October 2025  
**Next Recommended Update Check**: 3 months from installation