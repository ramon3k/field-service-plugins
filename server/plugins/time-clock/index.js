// Time Clock Plugin for Field Service Management System
// Allows technicians to clock in/out and track work hours

class TimeClockPlugin {
  constructor({ id, name, version, config, companyCode, pool }) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.config = config;
    this.companyCode = companyCode;
    this.pool = pool;
  }

  /**
   * Initialize plugin
   */
  async initialize() {
    console.log(`🕐 Time Clock Plugin v${this.version} initialized for ${this.companyCode}`);
  }

  /**
   * Cleanup when plugin is unloaded
   */
  async cleanup() {
    console.log(`🕐 Time Clock Plugin cleanup for ${this.companyCode}`);
  }

  /**
   * Define API routes for this plugin
   */
  routes = [
    {
      method: 'POST',
      path: '/clock-in',
      handler: this.clockIn.bind(this),
      description: 'Clock in a technician'
    },
    {
      method: 'POST',
      path: '/clock-out',
      handler: this.clockOut.bind(this),
      description: 'Clock out a technician'
    },
    {
      method: 'GET',
      path: '/status/:technicianId',
      handler: this.getStatus.bind(this),
      description: 'Get current clock status for a technician'
    },
    {
      method: 'GET',
      path: '/entries',
      handler: this.getEntries.bind(this),
      description: 'Get time clock entries with optional filters'
    },
    {
      method: 'POST',
      path: '/break-start',
      handler: this.startBreak.bind(this),
      description: 'Start a break period'
    },
    {
      method: 'POST',
      path: '/break-end',
      handler: this.endBreak.bind(this),
      description: 'End a break period'
    }
  ];

  /**
   * Define hooks this plugin listens to
   */
  hooks = {
    'ticket.completed': async (data) => {
      // Auto-suggest clock out when ticket is completed
      console.log(`🕐 Ticket ${data.ticketId} completed - technician may want to clock out`);
      return data;
    }
  };

  /**
   * Clock In Handler
   */
  async clockIn(req, res) {
    try {
      const { technicianId, technicianName, location, notes, ticketId } = req.body;
      const companyCode = req.headers['x-company-code'] || this.companyCode;

      if (!technicianId) {
        return res.status(400).json({ error: 'Technician ID required' });
      }

      // Check if technician is already clocked in for this ticket (if ticketId provided)
      if (ticketId) {
        const existingTicketEntry = await this.pool.request()
          .input('companyCode', companyCode)
          .input('technicianId', technicianId)
          .input('ticketId', ticketId)
          .query(`
            SELECT TOP 1 EntryID, ClockInTime
            FROM TimeClockEntries
            WHERE CompanyCode = @companyCode 
              AND TechnicianID = @technicianId
              AND TicketID = @ticketId
              AND ClockOutTime IS NULL
              AND Status = 'Active'
            ORDER BY ClockInTime DESC
          `);

        if (existingTicketEntry.recordset.length > 0) {
          return res.status(400).json({ 
            error: 'Already clocked in to this ticket',
            existingEntry: existingTicketEntry.recordset[0]
          });
        }
      } else {
        // Check if technician is already clocked in (general check)
        const existingEntry = await this.pool.request()
          .input('companyCode', companyCode)
          .input('technicianId', technicianId)
          .query(`
            SELECT TOP 1 EntryID, ClockInTime, TicketID
            FROM TimeClockEntries
            WHERE CompanyCode = @companyCode 
              AND TechnicianID = @technicianId
              AND ClockOutTime IS NULL
              AND Status = 'Active'
            ORDER BY ClockInTime DESC
          `);

        if (existingEntry.recordset.length > 0) {
          return res.status(400).json({ 
            error: 'Already clocked in',
            existingEntry: existingEntry.recordset[0]
          });
        }
      }

      // Create new clock in entry
      const result = await this.pool.request()
        .input('companyCode', companyCode)
        .input('technicianId', technicianId)
        .input('technicianName', technicianName || technicianId)
        .input('location', location || null)
        .input('notes', notes || null)
        .input('ticketId', ticketId || null)
        .query(`
          INSERT INTO TimeClockEntries 
            (EntryID, CompanyCode, TechnicianID, TechnicianName, ClockInTime, Location, Notes, TicketID, Status)
          OUTPUT INSERTED.*
          VALUES 
            (NEWID(), @companyCode, @technicianId, @technicianName, GETUTCDATE(), @location, @notes, @ticketId, 'Active')
        `);

      const entry = result.recordset[0];

      console.log(`🕐 ✅ ${technicianName} clocked in at ${entry.ClockInTime}`);

      // Log activity
      try {
        await this.pool.request()
          .input('id', require('crypto').randomUUID())
          .input('userId', technicianId)
          .input('username', technicianName)
          .input('action', 'Clock In')
          .input('details', ticketId ? `Clocked in to ticket ${ticketId}` : 'Clocked in')
          .input('companyCode', companyCode)
          .query(`
            INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode)
            VALUES (@id, @userId, @username, @action, @details, GETUTCDATE(), @companyCode)
          `);
      } catch (logErr) {
        console.warn('Failed to log clock-in activity:', logErr.message);
      }

      res.json({
        success: true,
        message: 'Clocked in successfully',
        entry: {
          entryId: entry.EntryID,
          technicianId: entry.TechnicianID,
          technicianName: entry.TechnicianName,
          clockInTime: entry.ClockInTime,
          location: entry.Location
        }
      });

    } catch (error) {
      console.error('❌ Clock in error:', error);
      res.status(500).json({ error: 'Failed to clock in' });
    }
  }

  /**
   * Clock Out Handler
   */
  async clockOut(req, res) {
    try {
      const { technicianId, notes } = req.body;
      const companyCode = req.headers['x-company-code'] || this.companyCode;

      if (!technicianId) {
        return res.status(400).json({ error: 'Technician ID required' });
      }

      // Find active clock in entry
      const activeEntry = await this.pool.request()
        .input('companyCode', companyCode)
        .input('technicianId', technicianId)
        .query(`
          SELECT TOP 1 
            EntryID, 
            CONVERT(VARCHAR(33), ClockInTime, 127) + 'Z' as ClockInTime,
            TechnicianName,
            TicketID
          FROM TimeClockEntries
          WHERE CompanyCode = @companyCode 
            AND TechnicianID = @technicianId
            AND ClockOutTime IS NULL
            AND Status = 'Active'
          ORDER BY ClockInTime DESC
        `);

      if (activeEntry.recordset.length === 0) {
        return res.status(400).json({ error: 'No active clock in found' });
      }

      const entry = activeEntry.recordset[0];
      const clockOutTime = new Date();
      const clockInTime = new Date(entry.ClockInTime); // Already has 'Z' from query
      const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert ms to hours

      // Update entry with clock out time
      await this.pool.request()
        .input('entryId', entry.EntryID)
        .input('clockOutTime', clockOutTime)
        .input('totalHours', totalHours.toFixed(2))
        .input('notes', notes || null)
        .query(`
          UPDATE TimeClockEntries
          SET 
            ClockOutTime = @clockOutTime,
            TotalHours = @totalHours,
            Notes = CASE WHEN @notes IS NOT NULL THEN @notes ELSE Notes END,
            Status = 'Completed',
            UpdatedAt = GETUTCDATE()
          WHERE EntryID = @entryId
        `);

      console.log(`🕐 ✅ ${entry.TechnicianName} clocked out - Total hours: ${totalHours.toFixed(2)}`);

      // Log activity
      try {
        const details = entry.TicketID 
          ? `Clocked out from ticket ${entry.TicketID} - Total hours: ${totalHours.toFixed(2)}`
          : `Clocked out - Total hours: ${totalHours.toFixed(2)}`;
          
        await this.pool.request()
          .input('id', require('crypto').randomUUID())
          .input('userId', technicianId)
          .input('username', entry.TechnicianName)
          .input('action', 'Clock Out')
          .input('details', details)
          .input('companyCode', companyCode)
          .query(`
            INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode)
            VALUES (@id, @userId, @username, @action, @details, GETUTCDATE(), @companyCode)
          `);
      } catch (logErr) {
        console.warn('Failed to log clock-out activity:', logErr.message);
      }

      // Add note to ticket if TicketID exists
      if (entry.TicketID) {
        try {
          const noteId = require('crypto').randomUUID();
          const clockInDate = clockInTime.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
          });
          const clockInTimeStr = clockInTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          const clockOutTimeStr = clockOutTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          const noteText = `Time Clock Summary:\nDate: ${clockInDate}\nTime In: ${clockInTimeStr}\nTime Out: ${clockOutTimeStr}\nTotal Hours: ${totalHours.toFixed(2)}`;
          
          await this.pool.request()
            .input('noteId', noteId)
            .input('ticketId', entry.TicketID)
            .input('note', noteText)
            .input('createdBy', entry.TechnicianName)
            .input('createdAt', clockOutTime)
            .query(`
              INSERT INTO CoordinatorNotes (NoteID, TicketID, Note, CreatedBy, CreatedAt)
              VALUES (@noteId, @ticketId, @note, @createdBy, @createdAt)
            `);
          
          console.log(`📝 Added time clock note to ticket ${entry.TicketID}`);
        } catch (noteErr) {
          console.warn('Failed to add ticket note:', noteErr.message);
          // Don't fail the clock-out if note creation fails
        }
      }

      res.json({
        success: true,
        message: 'Clocked out successfully',
        entry: {
          entryId: entry.EntryID,
          technicianId: technicianId,
          technicianName: entry.TechnicianName,
          clockInTime: entry.ClockInTime,
          clockOutTime: clockOutTime,
          totalHours: parseFloat(totalHours.toFixed(2))
        }
      });

    } catch (error) {
      console.error('❌ Clock out error:', error);
      res.status(500).json({ error: 'Failed to clock out' });
    }
  }

  /**
   * Get Clock Status
   */
  async getStatus(req, res) {
    try {
      const { technicianId } = req.params;
      const { ticketId } = req.query;
      const companyCode = req.headers['x-company-code'] || this.companyCode;

      let query = `
        SELECT TOP 1 
          EntryID,
          TechnicianID,
          TechnicianName,
          CONVERT(VARCHAR(33), ClockInTime, 127) + 'Z' as ClockInTime,
          CONVERT(VARCHAR(33), ClockOutTime, 127) + 'Z' as ClockOutTime,
          TotalHours,
          Location,
          TicketID,
          Status
        FROM TimeClockEntries
        WHERE CompanyCode = @companyCode 
          AND TechnicianID = @technicianId`;

      if (ticketId) {
        query += ` AND TicketID = @ticketId`;
      }

      query += ` ORDER BY ClockInTime DESC`;

      const request = this.pool.request()
        .input('companyCode', companyCode)
        .input('technicianId', technicianId);

      if (ticketId) {
        request.input('ticketId', ticketId);
      }

      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return res.json({
          isClockedIn: false,
          message: 'No time clock entries found'
        });
      }

      const entry = result.recordset[0];
      const isClockedIn = entry.ClockOutTime === null && entry.Status === 'Active';

      res.json({
        isClockedIn,
        currentEntry: isClockedIn ? {
          entryId: entry.EntryID,
          technicianId: entry.TechnicianID,
          technicianName: entry.TechnicianName,
          clockInTime: entry.ClockInTime,
          location: entry.Location,
          ticketId: entry.TicketID,
          hoursElapsed: ((new Date() - new Date(entry.ClockInTime)) / (1000 * 60 * 60)).toFixed(2)
        } : null,
        lastEntry: !isClockedIn ? {
          clockInTime: entry.ClockInTime,
          clockOutTime: entry.ClockOutTime,
          totalHours: entry.TotalHours,
          ticketId: entry.TicketID
        } : null
      });

    } catch (error) {
      console.error('❌ Get status error:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  /**
   * Get Time Clock Entries
   */
  async getEntries(req, res) {
    try {
      const companyCode = req.headers['x-company-code'] || this.companyCode;
      const { technicianId, startDate, endDate, status } = req.query;

      let query = `
        SELECT 
          EntryID,
          TechnicianID,
          TechnicianName,
          ClockInTime,
          ClockOutTime,
          TotalHours,
          Location,
          Notes,
          Status,
          CreatedAt
        FROM TimeClockEntries
        WHERE CompanyCode = @companyCode
      `;

      const request = this.pool.request().input('companyCode', companyCode);

      if (technicianId) {
        query += ' AND TechnicianID = @technicianId';
        request.input('technicianId', technicianId);
      }

      if (startDate) {
        query += ' AND ClockInTime >= @startDate';
        request.input('startDate', startDate);
      }

      if (endDate) {
        query += ' AND ClockInTime <= @endDate';
        request.input('endDate', endDate);
      }

      if (status) {
        query += ' AND Status = @status';
        request.input('status', status);
      }

      query += ' ORDER BY ClockInTime DESC';

      const result = await request.query(query);

      res.json({
        success: true,
        count: result.recordset.length,
        entries: result.recordset
      });

    } catch (error) {
      console.error('❌ Get entries error:', error);
      res.status(500).json({ error: 'Failed to get entries' });
    }
  }

  /**
   * Start Break
   */
  async startBreak(req, res) {
    try {
      const { technicianId, breakType, notes } = req.body;
      const companyCode = req.headers['x-company-code'] || this.companyCode;

      // Find active entry
      const activeEntry = await this.pool.request()
        .input('companyCode', companyCode)
        .input('technicianId', technicianId)
        .query(`
          SELECT TOP 1 EntryID
          FROM TimeClockEntries
          WHERE CompanyCode = @companyCode 
            AND TechnicianID = @technicianId
            AND ClockOutTime IS NULL
            AND Status = 'Active'
        `);

      if (activeEntry.recordset.length === 0) {
        return res.status(400).json({ error: 'Must be clocked in to take a break' });
      }

      const entryId = activeEntry.recordset[0].EntryID;

      // Create break record
      const result = await this.pool.request()
        .input('entryId', entryId)
        .input('breakType', breakType || 'Short')
        .input('notes', notes || null)
        .query(`
          INSERT INTO TimeClockBreaks (BreakID, EntryID, BreakType, BreakStartTime, Notes)
          OUTPUT INSERTED.*
          VALUES (NEWID(), @entryId, @breakType, GETDATE(), @notes)
        `);

      res.json({
        success: true,
        message: 'Break started',
        break: result.recordset[0]
      });

    } catch (error) {
      console.error('❌ Start break error:', error);
      res.status(500).json({ error: 'Failed to start break' });
    }
  }

  /**
   * End Break
   */
  async endBreak(req, res) {
    try {
      const { technicianId } = req.body;
      const companyCode = req.headers['x-company-code'] || this.companyCode;

      // Find active break
      const activeBreak = await this.pool.request()
        .input('companyCode', companyCode)
        .input('technicianId', technicianId)
        .query(`
          SELECT TOP 1 b.BreakID, b.BreakStartTime
          FROM TimeClockBreaks b
          INNER JOIN TimeClockEntries e ON b.EntryID = e.EntryID
          WHERE e.CompanyCode = @companyCode
            AND e.TechnicianID = @technicianId
            AND b.BreakEndTime IS NULL
          ORDER BY b.BreakStartTime DESC
        `);

      if (activeBreak.recordset.length === 0) {
        return res.status(400).json({ error: 'No active break found' });
      }

      const breakRecord = activeBreak.recordset[0];
      const breakEndTime = new Date();
      const breakStartTime = new Date(breakRecord.BreakStartTime);
      const durationMinutes = Math.round((breakEndTime - breakStartTime) / (1000 * 60));

      // Update break record
      await this.pool.request()
        .input('breakId', breakRecord.BreakID)
        .input('breakEndTime', breakEndTime)
        .input('duration', durationMinutes)
        .query(`
          UPDATE TimeClockBreaks
          SET BreakEndTime = @breakEndTime, BreakDuration = @duration
          WHERE BreakID = @breakId
        `);

      res.json({
        success: true,
        message: 'Break ended',
        duration: durationMinutes
      });

    } catch (error) {
      console.error('❌ End break error:', error);
      res.status(500).json({ error: 'Failed to end break' });
    }
  }
}

module.exports = TimeClockPlugin;
