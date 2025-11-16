## [2.1.7] - 2025-11-16

### Remote Access Fix
- **Fixed remote connections via Tailscale/VPN**
  - Changed all API base URLs from absolute (`http://localhost:5000/api`) to relative (`/api`)
  - Updated SqlApiService.ts and all component API calls
  - Enables Vite proxy to correctly route API requests from remote machines
  - Remote users can now access full application functionality over Tailscale
- Enhanced Vite configuration
  - Added environment variable support for API/WebSocket targets
  - Added Cache-Control headers to prevent stale data during remote development
  - Improved proxy configuration for better remote compatibility

### Notes
- WebSocket notifications (port 8081) require direct network access
- Remote users get all functionality except real-time push notifications
- Designed for local network use with optional Tailscale remote access

---
## [2.1.6] - 2025-11-14

### Technician Interface Enhancements
- Added navigation tab system to Technician dashboard
  - Technicians can now access plugins via main navigation tabs (not just in ticket details)
  - Tabs filtered by role - only shows plugins with 'Technician' in roles array or no role restrictions
  - Matches coordinator dashboard styling with clean, professional appearance
- Implemented dynamic plugin component loading in Technician interface
  - Plugin frontends now render properly when tabs are clicked
  - Uses PluginComponentRegistry for automatic component discovery
  - Fallback placeholders for missing components with helpful error messages

### UI Improvements
- Fixed text contrast in Plugin Manager page
  - Changed plugin metadata text from light gray (#4b5563) to dark gray (#1f2937) for better readability
  - Improved subtitle contrast (#6b7280)
  - Enhanced accessibility on white backgrounds

---
## [2.1.3] - 2025-10-27

### Plugin Example
- Time Clock plugin updated to v1.0.1 with MIT LICENSE, metadata (license + compatibility), and README adjusted. Releases will include the updated ZIP.

---
## [2.1.2] - 2025-10-27

### Packaging
- Release now attaches `time-clock-plugin.zip` as a separate asset in addition to the curated main app zip.

---
## [2.1.1] - 2025-10-27

### Packaging
- Curated release artifact: includes only main app (dist, api/server), plugin templates/examples, and docs. Excludes standalone customer portal and repo-only extras.

---
# Changelog

All notable changes to the Field Service Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2025-10-27

### Plugin-focused Release

This release finalizes the plugin-enabled distribution and production readiness.

### Added
- CORS configuration with ALLOWED_ORIGINS env var and credential support for secure cross-origin auth flows
- Distribution packaging updates to include plugin docs and template

### Changed
- API now trusts proxy in Azure App Service for proper cookie/security headers

### Fixed
- Addressed frontend CORS/login issues by moving from wildcard headers to strict cors middleware

---

## [2.0.0] - 2025-10-27

### 🎉 Major Release - Plugin System

This is a major release introducing a comprehensive plugin architecture that allows extending the system without modifying core code.

### Added

**Plugin System**
- ✨ Complete plugin architecture with lifecycle management
- ✨ Hot-reload plugins without server restart
- ✨ ZIP upload via Plugin Manager UI (no SQL knowledge required)
- ✨ Enable/disable plugins with instant effect using "Reload Plugins" button
- ✨ Plugin Manager page with visual interface
- ✨ Lifecycle hooks: `onInstall`, `onUninstall`, `onEnable`, `onDisable`
- ✨ Support for custom ticket tabs via plugins
- ✨ Support for custom report components via plugins
- ✨ API route extensions via plugins
- ✨ Plugin middleware for enable/disable enforcement

**Time Clock Plugin**
- ✨ Technician time tracking per ticket
- ✨ Clock in/out functionality
- ✨ Ticket time summaries with technician breakdown
- ✨ Comprehensive time reports
- ✨ Historical data preservation
- ✨ Multi-tenant support

**Developer Tools**
- ✨ Plugin Development Guide (comprehensive documentation)
- ✨ Basic plugin template in `plugin-templates/`
- ✨ Reference implementation (Time Clock plugin)
- ✨ File-based plugin architecture (no SDK required)
- ✨ Plugin Package Specification documentation
- ✨ Plugin Upload System documentation

**API Endpoints**
- `POST /api/plugins/reload` - Reload all plugins without restart
- `POST /api/plugins/upload` - Upload plugin ZIP file
- `POST /api/plugins/:id/install` - Install a plugin
- `POST /api/plugins/:id/uninstall` - Uninstall a plugin
- `POST /api/plugins/:id/enable` - Enable a plugin
- `POST /api/plugins/:id/disable` - Disable a plugin
- `GET /api/plugins` - List all available plugins
- `GET /api/plugins/installed` - List installed plugins
- Dynamic plugin routes: `/api/plugins/{plugin-name}/*`

**Database Tables**
- `GlobalPlugins` - Plugin registry
- `TenantPluginInstallations` - Company-specific plugin configuration
- `PluginUploads` - ZIP upload tracking
- `TimeClockEntries` - Time Clock plugin data

**Documentation**
- 📚 `docs/PLUGIN-DEVELOPMENT-GUIDE.md` - Complete plugin API reference
- 📚 `PLUGIN-UPLOAD-SYSTEM.md` - Upload system architecture
- 📚 `PLUGIN-PACKAGE-SPEC.md` - Packaging requirements
- 📚 `RELEASE-CHECKLIST.md` - Production release checklist
- 📚 Updated `README.md` with plugin system overview

### Fixed

- 🐛 Fixed GUID type mismatch in plugin enable/disable middleware
  - Issue: Middleware was comparing string plugin name against UNIQUEIDENTIFIER column
  - Solution: Two-step lookup (name→GUID→status check)
  - Error eliminated: "Conversion failed when converting from a character string to uniqueidentifier"

- 🐛 Fixed routes staying active when plugin disabled
  - Issue: Express routes cannot be dynamically removed
  - Solution: Added middleware to check enabled status before allowing access
  - Routes now properly return 403 Forbidden when plugin disabled

- 🐛 Fixed plugin code changes requiring server restart
  - Issue: Node.js module cache prevented hot-reload
  - Solution: Clear module cache on plugin reload
  - Result: Code changes picked up instantly via "Reload Plugins" button

- 🐛 Fixed SQL query errors in plugin middleware
  - Parameterized all queries
  - Added error handling and logging
  - Improved error messages for debugging

### Changed

- ⚡ Improved plugin loading performance with module cache management
- ⚡ Enhanced error messages for plugin operations
- ⚡ Updated Plugin Manager UI with reload button
- 🔄 Changed toggle message from "Please refresh the page" to "Click 'Reload Plugins' to apply changes"
- 📝 Restructured documentation for better organization

### Performance

- ⚡ Added database indexes for plugin lookup queries
- ⚡ Optimized plugin initialization process
- ⚡ Reduced server restart requirements (hot-reload)
- ⚡ Efficient module cache clearing

### Security

- 🔐 Plugin route protection middleware
- 🔐 Enable/disable status checked before route access
- 🔐 Parameterized queries throughout plugin system
- 🔐 Multi-tenant data isolation enforced
- 🔐 ZIP upload validation and sanitization

### Developer Experience

- 👨‍💻 No SDK required - file-based plugin architecture
- 👨‍💻 Plugin templates for quick start
- 👨‍💻 Complete working example (Time Clock)
- 👨‍💻 Hot-reload eliminates development friction
- 👨‍💻 Comprehensive API documentation

### Technical Details

**Plugin Lifecycle**:
```
Upload ZIP → Extract → Register in DB → onInstall Hook → 
Enable → Load into Memory → Register Routes → Active ✓
```

**Database Schema**:
- Plugin ID: UNIQUEIDENTIFIER (GUID)
- Plugin Name: VARCHAR (used in routes)
- Routes: `/api/plugins/{name}/*`
- Middleware: Name→GUID→Status lookup

**Module Management**:
- Plugin Manager class with loadedPlugins Map
- Module cache clearing for hot-reload
- Graceful error handling and recovery

---

## [1.0.0] - 2025-09-15

### Initial Release

**Core Features**
- ✅ Ticket Management
- ✅ Customer Management
- ✅ Technician Portal
- ✅ Parts & Inventory
- ✅ Reporting & Analytics
- ✅ Multi-Tenant Support
- ✅ Activity Logging

**Technology Stack**
- React + TypeScript + Vite (Frontend)
- Node.js + Express (Backend)
- SQL Server (Database)
- Windows Authentication

**Database Tables**
- Tickets, Customers, Sites, Assets
- Parts, Users, ActivityLog
- TenantLogin, Vendors

**Initial Documentation**
- Basic README
- Database schema
- API documentation

---

## Version Comparison

### 2.0.0 vs 1.0.0

**What's New in 2.0:**
- 🎉 **Plugin System** - Extend functionality without modifying core code
- 🎉 **Hot-Reload** - No server restarts for plugin changes
- 🎉 **ZIP Upload** - Install plugins via web UI
- 🎉 **Time Clock Plugin** - Complete reference implementation
- 🎉 **Developer Tools** - Templates, guides, and examples

**Migration Notes:**
- Fully backwards compatible with v1.0
- No breaking changes
- New database tables added (plugins only)
- Existing features unchanged

---

## Upcoming Releases

### [2.1.0] - Planned

**Features**
- Additional plugin templates
- Plugin marketplace
- Enhanced reporting
- Bulk operations

### [3.0.0] - Future

**Features**
- Mobile app
- Real-time notifications
- Advanced scheduling
- Integration APIs
- Webhook support

---

## Support

For questions about this release:
- Review the [Plugin Development Guide](docs/PLUGIN-DEVELOPMENT-GUIDE.md)
- Check the [Release Checklist](RELEASE-CHECKLIST.md)
- Study the Time Clock plugin reference implementation

---

**Legend:**
- ✨ Added
- 🐛 Fixed
- ⚡ Performance
- 🔐 Security
- 👨‍💻 Developer Experience
- 🔄 Changed
- 📚 Documentation
- ⚠️ Deprecated
- 🗑️ Removed
