# Example Plugin

A simple demonstration plugin for the Field Service Management System.

## Features

- **Status Endpoint**: Check if the plugin is active
- **Data Endpoint**: Retrieve example data
- **Action Endpoint**: Process custom actions
- **Ticket Tab**: Adds an "Example" tab to ticket modals
- **Report Component**: Adds an example report to the Reports page
- **Database Table**: Creates `ExamplePluginData` table on installation

## Installation

### Via Plugin Manager (Recommended)

1. Create a ZIP file containing:
   - `index.js`
   - `plugin.json`
   - `README.md` (this file)

2. Upload via Plugin Manager:
   - Log in as System Admin
   - Navigate to **Plugins** tab
   - Click **📦 Upload Plugin**
   - Select `example-plugin.zip`
   - Click Upload

3. Restart the server

4. Install for your company:
   - Go to **Plugins** tab
   - Find "Example Plugin"
   - Click **Install**

### Manual Installation (Advanced)

1. Copy this folder to `server/plugins/example-plugin/`
2. Register in database:
   ```sql
   INSERT INTO GlobalPlugins (name, displayName, version, description, author, category, status, isOfficial)
   VALUES ('example-plugin', 'Example Plugin', '1.0.0', 'A simple example plugin', 'DCPSP', 'general', 'active', 0);
   ```
3. Restart server
4. Install via Plugin Manager UI

## API Endpoints

Once installed, the plugin provides these endpoints:

### GET /api/plugins/example-plugin/status
Returns the plugin status.

**Response:**
```json
{
  "status": "active",
  "message": "Example plugin is running!",
  "version": "1.0.0"
}
```

### GET /api/plugins/example-plugin/data
Returns example data for the current company.

**Headers:**
- `x-company-code`: Your company code (e.g., "DCPSP")

**Response:**
```json
{
  "companyCode": "DCPSP",
  "message": "This is example data from the plugin",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "items": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" },
    { "id": 3, "name": "Item 3" }
  ]
}
```

### POST /api/plugins/example-plugin/action
Process a custom action.

**Request Body:**
```json
{
  "action": "doSomething",
  "data": { "key": "value" }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action \"doSomething\" processed successfully",
  "receivedData": { "key": "value" }
}
```

## Database Schema

On installation, creates this table:

```sql
CREATE TABLE ExamplePluginData (
  id INT IDENTITY PRIMARY KEY,
  companyCode NVARCHAR(50) NOT NULL,
  itemName NVARCHAR(200),
  itemValue NVARCHAR(500),
  createdAt DATETIME DEFAULT GETUTCDATE(),
  createdBy NVARCHAR(100)
);

CREATE INDEX IX_ExamplePluginData_CompanyCode 
  ON ExamplePluginData(companyCode);
```

## Frontend Integration

### Ticket Tab

The plugin adds an "Example" tab to ticket modals. To implement the frontend component:

```tsx
// src/components/ExamplePluginTab.tsx
export function ExamplePluginTab({ ticketId }: { ticketId: number }) {
  return (
    <div>
      <h3>Example Plugin Tab</h3>
      <p>Ticket ID: {ticketId}</p>
      {/* Your custom UI here */}
    </div>
  );
}
```

Map in `TechnicianInterface.tsx`:
```tsx
const componentMap: Record<string, any> = {
  'example-plugin-tab': ExamplePluginTab
};
```

### Report Component

The plugin adds an "Example Report" to the Reports page. To implement:

```tsx
// src/components/ExamplePluginReport.tsx
export function ExamplePluginReport() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/plugins/example-plugin/data', {
      headers: { 'x-company-code': companyCode }
    })
      .then(r => r.json())
      .then(d => setData(d.items));
  }, []);
  
  return (
    <div>
      <h2>Example Report</h2>
      {/* Render your data */}
    </div>
  );
}
```

## Testing

Test the plugin endpoints:

```bash
# Check status
curl http://localhost:5000/api/plugins/example-plugin/status

# Get data
curl -H "x-company-code: DCPSP" http://localhost:5000/api/plugins/example-plugin/data

# Send action
curl -X POST http://localhost:5000/api/plugins/example-plugin/action \
  -H "Content-Type: application/json" \
  -d '{"action":"test","data":{"value":123}}'
```

## Lifecycle

- **onInstall**: Creates `ExamplePluginData` table
- **onUninstall**: Deletes all data for the company
- **onEnable**: Logs activation
- **onDisable**: Logs deactivation

## Troubleshooting

### Plugin not appearing in Plugin Manager
- Ensure plugin is uploaded/copied to `server/plugins/example-plugin/`
- Check database: `SELECT * FROM GlobalPlugins WHERE name = 'example-plugin'`
- Restart the server

### API endpoints return 404
- Verify plugin is installed: Check `TenantPluginInstallations` table
- Verify plugin is enabled: `isEnabled` should be 1
- Check server logs for plugin loading messages

### Database table not created
- Check SQL Server permissions
- Review server logs for installation errors
- Manually run the CREATE TABLE statement from `onInstall` hook

## Development

This plugin serves as a template for creating new plugins. Key concepts:

1. **Module Exports**: Plugin must export an object with `name`, `version`, and optional `routes`, `ticketTabs`, `reportComponent`, `hooks`

2. **API Routes**: Define endpoints that will be mounted at `/api/plugins/{plugin-name}/*`

3. **Tenant Isolation**: Always filter by `companyCode` header

4. **Lifecycle Hooks**: Use `onInstall`, `onUninstall`, `onEnable`, `onDisable` for setup/teardown

5. **Frontend Components**: Define `ticketTabs` and `reportComponent` metadata; implement React components separately

## License

Copyright DCPSP. All rights reserved.

## Version History

- **1.0.0** (2024-01-15): Initial release
  - Status, data, and action endpoints
  - Ticket tab integration
  - Report component
  - Database table creation
