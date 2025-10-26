# Installers Directory

This directory should contain the prerequisite installers for offline installation:

## Required Files:

### SQL Server Express 2019
- **Filename**: `SQLEXPR_x64_ENU.exe`
- **Download URL**: https://download.microsoft.com/download/7/c/1/7c14e92e-bdcb-4f89-b7cf-93543e7112d1/SQLEXPR_x64_ENU.exe
- **Size**: ~270 MB
- **Purpose**: Database engine for the application

### Node.js LTS
- **Filename**: `node-v18.18.0-x64.msi`
- **Download URL**: https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
- **Size**: ~28 MB
- **Purpose**: JavaScript runtime for the server application

## Download Instructions:

### Option 1: Automatic Download
The SETUP.bat installer will automatically download these files if they're not present. This requires an internet connection during installation.

### Option 2: Manual Download (Recommended for Distribution)
1. Download both files from the URLs above
2. Place them in this `installers` directory
3. This allows offline installation at customer sites

## File Verification:

After downloading, verify the files:
- `SQLEXPR_x64_ENU.exe` should be approximately 270 MB
- `node-v18.18.0-x64.msi` should be approximately 28 MB

## License Notes:
- SQL Server Express: Free edition from Microsoft
- Node.js: Open source, MIT License

Both are freely redistributable with your application package.

## Alternative Versions:
If you need different versions, update the filenames and URLs in `SETUP.bat` accordingly.

---

**For Distribution Package**: Include both installer files to enable complete offline installation at customer sites.