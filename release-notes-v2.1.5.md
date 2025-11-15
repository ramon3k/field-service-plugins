## What's New in v2.1.5

### 🔧 Critical Fixes
- **Node.js 20 Requirement**: Updated to Node.js v20 LTS to support latest Azure packages
  - SETUP.bat now installs Node.js v20.18.0 instead of v18.18.0
  - Fixes EBADENGINE errors during npm install
  - Added explicit engine requirement in package.json

- **PowerShell Execution Policy**: SETUP.bat now automatically configures PowerShell
  - Fixes "scripts are disabled on this system" errors
  - Enables npm commands to run without manual configuration
  - Includes troubleshooting documentation if auto-config fails

### 🎨 UI Improvements
- **Better Text Contrast**: Fixed hard-to-read grey text on white backgrounds
  - Plugin Manager: Darker text for descriptions and version info
  - Reports Page: Improved readability for metric card titles
  - All text now meets accessibility standards

### 📚 Documentation Updates
- **Plugin Developer Guide**: Complete rewrite based on actual working plugins
  - Added Quick Start section with minimum required files
  - Documented component naming convention (PascalCase.tsx → kebab-case-page)
  - Detailed lifecycle hooks with working examples
  - Complete TrackerPlugin example with all files
  - Packaging, troubleshooting, and best practices sections

- **Installation Guides**: Enhanced troubleshooting sections
  - Added fix for EBADENGINE errors
  - Added fix for PowerShell script execution errors
  - Updated Node.js version references

### ⚠️ Breaking Changes
- **Node.js 20+ Required**: Systems with Node.js v18 or earlier must upgrade
  - Download: https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
  - SETUP.bat handles this automatically for fresh installs

### 📦 Installation
1. Download **field-service-plugins-v2.1.5.zip**
2. Extract to C:\field-service-plugins-main\
3. Right-click **SETUP.bat** → Run as administrator
4. Follow the interactive wizard

### 🔄 Upgrading from v2.1.4
If you already have v2.1.4 installed:
1. Check your Node.js version: `node --version`
2. If v18 or earlier, upgrade to Node.js v20: https://nodejs.org/
3. Pull latest code or download new release
4. Run `npm install` to update dependencies

---

**Full Changelog**: https://github.com/ramon3k/field-service-plugins/compare/v2.1.4...v2.1.5
