# Creating the Example Plugin ZIP

This directory contains the source files for the Example Plugin.

## Files

- `plugin.json` - Plugin metadata
- `index.js` - Plugin code
- `README.md` - Plugin documentation

## Creating the ZIP File

### Windows

1. Select all three files:
   - `plugin.json`
   - `index.js`
   - `README.md`

2. Right-click on the selected files
3. Choose **Send to** → **Compressed (zipped) folder**
4. Rename to `example-plugin.zip`

### macOS

1. Select all three files
2. Right-click → **Compress Items**
3. Rename to `example-plugin.zip`

### Command Line

```bash
# From this directory
zip -r example-plugin.zip plugin.json index.js README.md
```

## Uploading

1. Log in as System Admin
2. Go to **Plugins** tab
3. Click **📦 Upload Plugin**
4. Select `example-plugin.zip`
5. Click **Upload**
6. Restart the server
7. Click **Install**

## Testing

After installation, test the plugin:

```bash
# Check status
curl http://localhost:5000/api/plugins/example-plugin/status

# Get data
curl -H "x-company-code: DCPSP" http://localhost:5000/api/plugins/example-plugin/data
```

You should see responses from the plugin endpoints.

## Using as a Template

This example plugin demonstrates all core plugin features:

- REST API routes
- Ticket tabs
- Report components
- Lifecycle hooks
- Database operations

Copy and modify these files to create your own plugin!

See [PLUGIN-DEVELOPMENT-GUIDE.md](../PLUGIN-DEVELOPMENT-GUIDE.md) for full API documentation.
