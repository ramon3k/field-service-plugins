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
