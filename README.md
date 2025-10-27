# Field Service Management System

**A comprehensive, modern field service management solution with extensible plugin architecture.**

Version: 2.0.0  
Last Updated: October 27, 2025

---

## 🚀 Features

### Core Functionality
- ✅ **Ticket Management** - Create, assign, track, and complete service tickets
- ✅ **Customer Management** - Manage customer profiles, sites, and assets
- ✅ **Technician Portal** - Mobile-friendly interface for field technicians
- ✅ **Parts & Inventory** - Track parts usage and inventory levels
- ✅ **Reporting & Analytics** - Comprehensive dashboards and reports
- ✅ **Multi-Tenant Support** - Isolated data for multiple companies
- ✅ **Activity Logging** - Complete audit trail of all system activities

### Plugin System 🔌
- ✅ **Hot-Reload Plugins** - Enable/disable features without server restart
- ✅ **Custom Ticket Tabs** - Extend ticket modal with custom functionality
- ✅ **Custom Reports** - Add analytics and data visualization
- ✅ **API Extensions** - Add new endpoints and business logic
- ✅ **ZIP Upload** - Install plugins via web UI (no database knowledge required)
- ✅ **Lifecycle Hooks** - Install, uninstall, enable, disable events

### Included Plugins
- ⏰ **Time Clock** - Track technician time per ticket with clock in/out functionality
  - Ticket-specific time tracking
  - Time summaries with technician breakdown
  - Comprehensive time reports
  - Historical data preservation

---

## 📋 Quick Start

### Prerequisites
- Node.js 16+ installed
- SQL Server Express or SQL Server
- Windows (for SQL Server Windows Authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd field-service-plugins
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure database**
   
   Edit `server/config.json` with your SQL Server details:
   ```json
   {
     "server": "localhost\\SQLEXPRESS",
     "database": "FieldServiceDB",
     "options": {
       "trustedConnection": true
     }
   }
   ```

4. **Initialize database**
   ```bash
   sqlcmd -S localhost\SQLEXPRESS -i server/database/schema.sql
   ```

5. **Start the development server**
   
   **Frontend (Vite):**
   ```bash
   npm run dev
   ```
   
   **Backend (API):**
   ```bash
   cd server
   node api.cjs
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 🏗️ Project Structure

```
field-service-plugins/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── TicketEditModal.tsx  # Ticket editing with plugin tabs
│   │   ├── ReportsPage.tsx      # Reports with plugin sections
│   │   └── PluginManagerPage.tsx # Plugin management UI
│   ├── pages/                    # Page components
│   └── App.tsx                   # Main application
│
├── server/                       # Backend API server
│   ├── api.cjs                   # Main API server
│   ├── plugin-manager.js         # Plugin lifecycle management
│   ├── routes/                   # API route handlers
│   │   └── plugin-routes.js      # Plugin management endpoints
│   ├── plugins/                  # Installed plugins
│   │   └── time-clock/           # Time Clock plugin (example)
│   ├── database/                 # Database schemas
│   └── config.json               # Server configuration
│
├── plugin-templates/             # Plugin starter templates
│   └── basic-plugin/             # Basic plugin template
│
├── docs/                         # Documentation
│   └── PLUGIN-DEVELOPMENT-GUIDE.md  # Complete plugin dev guide
│
├── PLUGIN-UPLOAD-SYSTEM.md       # Plugin upload system docs
├── PLUGIN-PACKAGE-SPEC.md        # Plugin packaging specs
└── README.md                     # This file
```

---

## 🔌 Plugin Development

### Creating Your First Plugin

The easiest way to start is with the template:

1. **Copy the template**
   ```bash
   cp -r plugin-templates/basic-plugin my-new-plugin
   cd my-new-plugin
   ```

2. **Customize the plugin**
   - Edit `index.js` - Add your routes and logic
   - Edit `package.json` - Update metadata
   - Edit `README.md` - Document your plugin

3. **Package the plugin**
   ```bash
   zip -r my-new-plugin.zip .
   ```

4. **Upload via Plugin Manager**
   - Navigate to Settings → Plugins
   - Click "📤 Upload Plugin"
   - Select your ZIP file
   - Click "Install"
   - Enable the plugin
   - Click "🔄 Reload Plugins"

### Complete Guide

For comprehensive plugin development documentation, see:
- **[Plugin Development Guide](docs/PLUGIN-DEVELOPMENT-GUIDE.md)** - Full API reference
- **[Plugin Upload System](PLUGIN-UPLOAD-SYSTEM.md)** - Upload system architecture
- **[Plugin Package Spec](PLUGIN-PACKAGE-SPEC.md)** - Packaging requirements

### Reference Implementation

Study the **Time Clock plugin** (`server/plugins/time-clock/`) for a complete working example showing:
- API routes with database access
- Ticket tab integration
- Report components
- Lifecycle hooks (install/uninstall)
- Frontend components

---

## 🗄️ Database Schema

### Core Tables
- `Tickets` - Service ticket records
- `Customers` - Customer profiles
- `Sites` - Customer site locations
- `Assets` - Equipment and assets
- `Parts` - Inventory and parts
- `Users` - System users
- `ActivityLog` - Audit trail

### Plugin Tables
- `GlobalPlugins` - Registered plugins
- `TenantPluginInstallations` - Company-specific plugin config
- `PluginUploads` - ZIP upload tracking

### Plugin Data Tables
- Created by plugins during installation
- Always include `CompanyCode` for multi-tenant isolation
- Use `UNIQUEIDENTIFIER` for primary keys

---

## 🔐 Security

### Authentication
- Session-based authentication
- Company code isolation (`x-company-code` header)
- User ID tracking (`x-user-id` header)

### Data Isolation
- All database queries filtered by `CompanyCode`
- Plugins enforce tenant isolation
- Activity logging for audit compliance

### Plugin Security
- Plugins checked for enable/disable status before route access
- Parameterized queries prevent SQL injection
- Input validation required for all endpoints

---

## 🚀 Deployment

### Production Setup

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Configure for production**
   - Update `server/config.json` with production database
   - Set environment variables:
     ```bash
     NODE_ENV=production
     PORT=5000
     ```

3. **Start the API server**
   ```bash
   cd server
   node api.cjs
   ```

4. **Serve the frontend**
   - Use a web server (IIS, Nginx, Apache) to serve the `dist/` folder
   - Configure reverse proxy to backend API

### Deployment Guides
- **[Azure Deployment](AZURE-DEPLOYMENT-GUIDE.md)** - Deploy to Azure
- **[API Hosting](API-HOSTING-GUIDE.md)** - API server setup
- **[Frontend Hosting](FRONTEND-HOSTING-OPTIONS.md)** - Frontend deployment options

---

## 📊 Plugin Manager

### Features
- Upload plugins via ZIP file (no SQL required!)
- Enable/disable plugins per company
- Hot-reload without server restart
- View installed plugins
- Install/uninstall with one click

### Usage

1. **Access Plugin Manager**
   - Login as admin
   - Navigate to Settings → Plugins

2. **Upload a Plugin**
   - Click "📤 Upload Plugin"
   - Select ZIP file
   - Wait for upload confirmation

3. **Install Plugin**
   - Find plugin in list
   - Click "Install"
   - Plugin installs and creates database tables

4. **Enable/Disable**
   - Toggle the enable/disable button
   - Click "🔄 Reload Plugins" to apply changes
   - No server restart needed!

5. **Uninstall Plugin**
   - Click "Uninstall"
   - Plugin cleans up data
   - Files removed from system

---

## 🧪 Testing

### Manual Testing
```bash
# Test API endpoints
curl http://localhost:5000/api/tickets

# Test plugin endpoints
curl http://localhost:5000/api/plugins/time-clock/status/admin_001
```

### Plugin Testing
1. Install plugin via Plugin Manager
2. Check server logs for errors
3. Test each API endpoint with cURL
4. Verify frontend components render
5. Test enable/disable functionality
6. Confirm data isolation (multi-tenant)

---

## 📝 API Reference

### Core Endpoints
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `GET /api/customers` - List customers
- `GET /api/parts` - List parts

### Plugin Endpoints
- `GET /api/plugins` - List available plugins
- `GET /api/plugins/installed` - List installed plugins
- `POST /api/plugins/:id/enable` - Enable plugin
- `POST /api/plugins/:id/disable` - Disable plugin
- `POST /api/plugins/reload` - Reload all plugins (no restart!)
- `POST /api/plugins/upload` - Upload plugin ZIP

### Plugin-Specific Routes
- `/api/plugins/{plugin-name}/*` - Routes defined by plugin

---

## 🛠️ Troubleshooting

### Common Issues

**Plugin not loading**
- Check server logs for errors
- Verify ZIP structure (index.js and package.json at root)
- Ensure plugin is enabled in Plugin Manager

**Routes return 403 Forbidden**
- Plugin is disabled - enable it in Plugin Manager
- Click "🔄 Reload Plugins" after enabling

**Database errors**
- Verify connection string in `server/config.json`
- Check SQL Server service is running
- Ensure database exists and schema is initialized

**Frontend not connecting to API**
- Verify API server is running on port 5000
- Check CORS configuration
- Update `.env` file with correct `VITE_API_URL`

### Debug Mode

Enable detailed logging:
```javascript
// server/api.cjs
console.log('🔍 Debug mode enabled');
```

---

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

Plugin Exception: Plugins that interact solely via the documented plugin APIs
are not considered derivative works and may be licensed independently. See
`LICENSE.txt` for full terms.

---

## 🤝 Contributing

This is a proprietary field service management system. For plugin development:

1. Use the plugin template in `plugin-templates/basic-plugin/`
2. Follow the [Plugin Development Guide](docs/PLUGIN-DEVELOPMENT-GUIDE.md)
3. Test thoroughly before distribution
4. Document your plugin with a detailed README

---

## 📞 Support

For questions or issues:
- Review the documentation in `/docs`
- Check the Time Clock plugin for reference implementation
- Contact your system administrator

---

## 🎯 Roadmap

### Completed ✅
- Plugin system with hot-reload
- ZIP upload functionality
- Time Clock plugin
- Multi-tenant support
- Activity logging

### In Progress 🚧
- Additional plugin templates
- Plugin marketplace
- Enhanced reporting

### Planned 📋
- Mobile app
- Real-time notifications
- Advanced scheduling
- Integration APIs

---

**Built with ❤️ for field service teams**