# Time Clock Plugin

Track technician time in/out for service tickets with automatic note generation and comprehensive reporting.

## Features

### ⏰ Time Tracking
- Clock in/out for individual tickets
- Per-ticket time isolation (clock in to multiple tickets simultaneously)
- Automatic calculation of total time spent
- Timezone-aware time recording (UTC storage, local display)

### 📝 Automatic Documentation
- Auto-generates coordinator notes on clock-out
- Includes clock in/out times and total duration
- Creates activity log entries for audit trail

### 📊 Comprehensive Reporting
- **Technician Summary Report**: Total hours per technician
- **Ticket Summary Report**: Time spent per ticket
- Time filter options: Today, This Week, This Month, All Time
- CSV export capability
- Expandable detail views

### 🎯 Ticket Modal Integration
- Time Clock tab in ticket modals
- Real-time clock status display
- Per-ticket time summary showing all technicians who worked on the ticket
- Clock in/out buttons with visual feedback

## Installation

### Via Plugin Manager (Recommended)

1. Log in as **System Admin**
2. Navigate to **Plugins** tab
3. Click **📦 Upload Plugin** button
4. Select `time-clock-plugin.zip`
5. Click **Upload**
6. **Restart the server**
7. Return to **Plugins** tab
8. Find "Technician Time Clock"
9. Click **Install** button

### Manual Installation (Advanced)

```sql
INSERT INTO GlobalPlugins (name, displayName, version, description, author, category, status, isOfficial)
VALUES ('time-clock', 'Technician Time Clock', '1.0.0', 
        'Track technician time in/out for tickets', 'DCPSP', 'time-tracking', 'active', 1);
```

Then copy files to `server/plugins/time-clock/` and restart server.

## API Endpoints

All endpoints are mounted at `/api/plugins/time-clock/`

### GET /status/:technicianId
Get current clock status for a technician.

**Query Parameters:**
- `ticketId` (optional) - Filter by specific ticket

**Response:**
```json
{
  "isClockedIn": true,
  "currentEntry": {
    "id": 1,
    "technicianId": "user123",
    "ticketId": "TKT-001",
    "clockInTime": "2024-01-15T10:30:00.000Z",
    "clockOutTime": null
  },
  "lastEntry": {
    "id": 2,
    "totalMinutes": 120,
    "clockOutTime": "2024-01-15T08:30:00.000Z"
  }
}
```

### POST /clock-in
Clock in for a ticket.

**Request Body:**
```json
{
  "technicianId": "user123",
  "technicianName": "John Doe",
  "ticketId": "TKT-001"
}
```

**Response:**
```json
{
  "entry": {
    "id": 1,
    "technicianId": "user123",
    "ticketId": "TKT-001",
    "clockInTime": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /clock-out
Clock out from a ticket.

**Request Body:**
```json
{
  "technicianId": "user123",
  "ticketId": "TKT-001"
}
```

**Response:**
```json
{
  "entry": {
    "id": 1,
    "technicianId": "user123",
    "ticketId": "TKT-001",
    "clockInTime": "2024-01-15T10:30:00.000Z",
    "clockOutTime": "2024-01-15T12:30:00.000Z",
    "totalMinutes": 120
  }
}
```

**Side Effects:**
- Creates automatic coordinator note with time summary
- Creates activity log entry

### GET /ticket-summary/:ticketId
Get time summary for all technicians who worked on a ticket.

**Response:**
```json
{
  "summary": [
    {
      "technicianId": "user123",
      "technicianName": "John Doe",
      "totalMinutes": 240,
      "sessionCount": 2
    }
  ]
}
```

### GET /report
Get technician time summary report.

**Query Parameters:**
- `timeFilter` - Options: `all`, `today`, `week`, `month`

**Response:**
```json
{
  "report": [
    {
      "technicianId": "user123",
      "technicianName": "John Doe",
      "totalSessions": 10,
      "totalMinutes": 1200,
      "firstClockIn": "2024-01-01T08:00:00.000Z",
      "lastClockOut": "2024-01-15T17:00:00.000Z"
    }
  ]
}
```

### GET /ticket-report
Get ticket time summary report.

**Query Parameters:**
- `timeFilter` - Options: `all`, `today`, `week`, `month`

**Response:**
```json
{
  "report": [
    {
      "ticketId": "TKT-001",
      "ticketDescription": "Fix printer",
      "ticketStatus": "Complete",
      "ticketPriority": "Medium",
      "technicianCount": 2,
      "totalMinutes": 360,
      "firstClockIn": "2024-01-15T08:00:00.000Z",
      "lastClockOut": "2024-01-15T14:00:00.000Z"
    }
  ]
}
```

## Database Schema

### TimeClockEntries Table

```sql
CREATE TABLE TimeClockEntries (
  id INT IDENTITY PRIMARY KEY,
  companyCode NVARCHAR(50) NOT NULL,
  technicianId NVARCHAR(100) NOT NULL,
  technicianName NVARCHAR(200),
  ticketId NVARCHAR(50),
  clockInTime DATETIME NOT NULL,
  clockOutTime DATETIME,
  totalMinutes INT,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  CONSTRAINT FK_TimeClockEntries_Tickets FOREIGN KEY (ticketId, companyCode)
    REFERENCES Tickets(TicketID, CompanyCode) ON DELETE CASCADE
);
```

**Indexes:**
- `IX_TimeClockEntries_CompanyCode` - Fast company filtering
- `IX_TimeClockEntries_TechnicianId` - Fast technician lookups
- `IX_TimeClockEntries_TicketId` - Fast ticket summaries
- `IX_TimeClockEntries_ClockInTime` - Time-based queries

## Frontend Integration

The plugin automatically adds UI components when installed:

### Ticket Modal Tab

A "Time Clock" tab appears in ticket modals showing:
- Current clock status (In/Out)
- Clock in/out buttons
- Time summary for the ticket
- List of all technicians and their total time

### Reports Page

A "Time Clock Report" appears in the Reports page with:
- Technician time summary (expandable)
- Ticket time summary (expandable)
- Time filter dropdown
- CSV export buttons

## Automatic Features

### Activity Logging
Every clock in/out creates an activity log entry:
- **Clock In**: "John Doe clocked in"
- **Clock Out**: "John Doe clocked out - 2h 30m"

### Coordinator Notes
On clock-out, an automatic note is created:
```
⏰ Time Summary for John Doe:
Clock In: 10:30 AM
Clock Out: 12:30 PM
Total Time: 2h 0m
```

## Multi-Tenant Support

- All data is isolated by `companyCode`
- Foreign key constraints ensure data integrity
- Automatic cleanup on uninstall (tenant-specific)

## Permissions

- **Technicians**: Can view Time Clock tab, clock in/out for their own tickets
- **System Admin**: Can view all time clock data and reports

## Troubleshooting

### "No active clock-in found"
- Technician is trying to clock out without clocking in first
- Or they clocked in for a different ticket

### Time Clock tab not appearing
- Plugin not installed for this company
- User role doesn't have permission (must be Technician or SystemAdmin)
- Server needs restart after installation

### Times showing in wrong timezone
- Times are stored in UTC
- Display should auto-convert to local timezone
- Check browser timezone settings

### Report data is blank
- No completed time entries (all still clocked in)
- Time filter too restrictive (try "All Time")
- Check that tickets exist in Tickets table (JOIN dependency)

## Best Practices

1. **Always clock out**: Ensures accurate time tracking
2. **Per-ticket tracking**: Clock in separately for each ticket
3. **Review reports regularly**: Monitor technician time allocation
4. **Export data**: Use CSV export for payroll integration

## Version History

- **1.0.0** (2024-01-15): Initial release
  - Clock in/out functionality
  - Per-ticket time tracking
  - Automatic note generation
  - Technician and ticket reports
  - CSV export
  - Activity logging

## Support

For issues or feature requests, contact DCPSP support.

## License

Copyright DCPSP. All rights reserved.
