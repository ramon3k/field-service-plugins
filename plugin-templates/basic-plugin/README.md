# My Plugin

**Version:** 1.0.0  
**Author:** Your Name  
**Category:** Productivity

## Description

A brief description of what this plugin does and why it's useful.

## Features

- ✅ Feature 1: Description
- ✅ Feature 2: Description
- ✅ Feature 3: Description

## Installation

1. Download the plugin ZIP file
2. Navigate to **Settings → Plugins** in the Field Service app
3. Click **📤 Upload Plugin**
4. Select the ZIP file
5. Click **Install**
6. Enable the plugin for your company

## Usage

### API Endpoints

#### GET /api/plugins/my-plugin/hello

Returns a hello message with plugin info.

**Response:**
```json
{
  "success": true,
  "message": "Hello from DCPSP!",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "plugin": {
    "name": "my-plugin",
    "version": "1.0.0"
  }
}
```

#### POST /api/plugins/my-plugin/data

Creates a new data record.

**Request Body:**
```json
{
  "name": "Example",
  "value": "Some value"
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid-here",
  "message": "Data created successfully"
}
```

#### GET /api/plugins/my-plugin/data

Retrieves all data records for the current company.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "ID": "uuid-1",
      "Name": "Example",
      "Value": "Some value",
      "CreatedAt": "2025-10-27T12:00:00.000Z"
    }
  ]
}
```

## Database Schema

This plugin creates the following table:

```sql
CREATE TABLE MyPluginData (
  ID UNIQUEIDENTIFIER PRIMARY KEY,
  CompanyCode NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Value NVARCHAR(MAX),
  CreatedAt DATETIME DEFAULT GETUTCDATE(),
  UpdatedAt DATETIME
);
```

## Configuration

No additional configuration required.

## Troubleshooting

### Plugin not loading

1. Check server logs for errors
2. Verify plugin is enabled in Plugin Manager
3. Click "🔄 Reload Plugins" button

### Routes returning 403

The plugin may be disabled. Enable it in the Plugin Manager and click "Reload Plugins".

### Database errors

Ensure the plugin has been installed (install hook executed successfully).

## Support

For issues or questions, contact your system administrator.

## License

MIT License - See LICENSE file for details

## Changelog

### Version 1.0.0 (2025-10-27)
- Initial release
- Basic CRUD operations
- Database table creation
