# Bug Fixes Summary

## Bug 1: Clock-in on Unsaved Ticket Creates Duplicate Entries

**Problem:**
- When clocking in on a new ticket (not saved yet), the system creates a clock-in entry
- When the ticket is re-opened, user has to clock in again
- This creates two active clock-ins but only one clock-out

**Root Cause:**
The TicketTimeClock plugin is passed `ticket.TicketID` which is empty for new tickets. The clock-in happens, but when the ticket is saved with a new TicketID, there's a mismatch.

**Solution:**
Prevent clocking in until the ticket is saved. Add validation in the TicketTimeClock component.

---

## Bug 2: Technicians Can See All Tickets

**Problem:**
- Every technician user can see every ticket
- Filtering by assigned technician isn't working

**Root Cause:**
The `/api/tickets` endpoint in `current-working-api.cjs` only filters by `CompanyCode`, not by user role or assignment:

```javascript
WHERE t.CompanyCode = @companyCode
ORDER BY t.CreatedAt DESC
```

The middleware attaches `req.userRole` and `req.userName`, but the tickets endpoint doesn't use them.

**Solution:**
Add role-based filtering to the tickets endpoint:
- If user role is 'Technician', filter by `AssignedTo` matching the user's name/username
- If user role is 'Admin' or 'Coordinator', show all tickets for the company

---

## Fixes to Implement

### Fix 1: Disable Clock-in for Unsaved Tickets

File: `src/components/plugins/TicketTimeClock.tsx`

Add check at the beginning of the component:

```tsx
// Don't allow clocking in if ticket hasn't been saved yet
if (!ticketId || ticketId.startsWith('TKT-TEMP-')) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#8892b0', backgroundColor: '#0d1117', borderRadius: '8px', margin: '20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏰</div>
      <div style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 600, color: '#c9d1d9' }}>Time Clock Unavailable</div>
      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
        Please save the ticket first before clocking in.<br />
        <span style={{ fontSize: '12px', color: '#8892b0', marginTop: '8px', display: 'inline-block' }}>
          (The ticket needs a valid ID to track time entries)
        </span>
      </div>
    </div>
  )
}
```

### Fix 2: Add Role-Based Filtering to Tickets API

File: `current-working-api.cjs`

Replace the tickets query section (around line 355-400):

```javascript
app.get('/api/tickets', async (req, res) => {
  try {
    const companyCode = req.userCompanyCode;
    const userRole = req.userRole;
    const userName = req.userName;
    
    if (!companyCode) {
      console.warn('⚠️ No CompanyCode found for tickets query');
      return res.status(403).json({ error: 'Company access required' });
    }
    
    let whereClause = 'WHERE t.CompanyCode = @companyCode';
    const request = pool.request().input('companyCode', sql.VarChar, companyCode);
    
    // Add role-based filtering for Technicians
    if (userRole === 'Technician' && userName) {
      whereClause += ' AND (t.AssignedTo = @userName OR t.AssignedTo LIKE @userNamePattern)';
      request.input('userName', sql.NVarChar, userName);
      request.input('userNamePattern', sql.NVarChar, `%${userName}%`);
    }
    
    const query = `
      SELECT 
        t.*,
        s.Contact AS SiteContact,
        s.Phone AS SitePhone,
        s.Address AS SiteAddress,
        u.fullName AS OwnerFullName,
        (
          SELECT cn.NoteID, cn.Note, cn.CreatedBy, 
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as CreatedAt,
                 FORMAT(cn.CreatedAt, 'yyyy-MM-ddTHH:mm:ss.fffZ') as Timestamp
          FROM CoordinatorNotes cn 
          WHERE cn.TicketID = t.TicketID
          ORDER BY cn.CreatedAt
          FOR JSON PATH
        ) as CoordinatorNotes,
        (
          SELECT at.AuditID as id, 
                 FORMAT(at.Timestamp, 'yyyy-MM-ddTHH:mm:ss.fffZ') as timestamp,
                 at.UserName as [user], 
                 at.Action as action, 
                 at.Field as field, 
                 at.OldValue as oldValue, 
                 at.NewValue as newValue, 
                 at.Notes as notes
          FROM AuditTrail at 
          WHERE at.TicketID = t.TicketID
          ORDER BY at.Timestamp
          FOR JSON PATH
        ) as AuditTrail
      FROM Tickets t
      LEFT JOIN Sites s ON t.Site = s.Name OR t.Site = s.SiteID
      LEFT JOIN Users u ON t.Owner = u.username OR t.Owner = u.fullName
      ${whereClause}
      ORDER BY t.CreatedAt DESC
    `;
    
    const result = await request.query(query);
    const rows = result.recordset;
    
    // Parse JSON fields
    const tickets = rows.map(ticket => ({
      ...ticket,
      Owner: ticket.Owner || '',
      OwnerFullName: ticket.OwnerFullName || ticket.Owner || '',
      CoordinatorNotes: ticket.CoordinatorNotes ? JSON.parse(ticket.CoordinatorNotes) : [],
      AuditTrail: ticket.AuditTrail ? JSON.parse(ticket.AuditTrail) : []
    }));
    
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});
```

## Testing

### Test Bug Fix 1:
1. Create a new ticket (don't save)
2. Try to click the Time Clock tab
3. Should see message: "Please save the ticket first before clocking in"
4. Save the ticket
5. Now Time Clock tab should work normally

### Test Bug Fix 2:
1. Log in as a Technician user
2. Check tickets list - should only see tickets assigned to that technician
3. Log in as Admin or Coordinator
4. Should see all tickets for the company
