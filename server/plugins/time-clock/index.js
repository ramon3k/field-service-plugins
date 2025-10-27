/**
 * Time Clock Plugin
 * 
 * Provides time tracking functionality for technicians:
 * - Clock in/out for individual tickets
 * - Per-ticket time tracking
 * - Automatic note generation on clock-out
 * - Comprehensive reporting (tech summary and ticket summary)
 * - Activity logging integration
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  name: 'time-clock',
  version: '1.0.0',
  
  /**
   * API Routes
   * Mounted at /api/plugins/time-clock/*
   */
  routes: [
    {
      method: 'GET',
      path: '/status/:technicianId',
      handler: async (req, res) => {
        const { technicianId } = req.params;
        const { ticketId } = req.query;
        const pool = req.pool || req.app.locals.pool;

        if (!pool) {
          console.error('❌ Pool not available in /status endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        try {
          let query = `
            SELECT TOP 1
              EntryID,
              TechnicianID,
              TicketID,
              ClockInTime,
              ClockOutTime
            FROM TimeClockEntries
            WHERE TechnicianID = @technicianId
              AND ClockOutTime IS NULL
          `;

          const params = { technicianId };

          if (ticketId) {
            query += ` AND TicketID = @ticketId`;
            params.ticketId = ticketId;
          }

          query += ` ORDER BY ClockInTime DESC`;

          const request = pool.request();
          Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
          });

          const result = await request.query(query);
          const currentEntry = result.recordset[0] || null;

          // Get last completed entry
          const lastEntryResult = await pool.request()
            .input('technicianId', technicianId)
            .query(`
              SELECT TOP 1
                EntryID,
                TechnicianID,
                TicketID,
                ClockInTime,
                ClockOutTime,
                DATEDIFF(MINUTE, ClockInTime, ClockOutTime) as TotalMinutes
              FROM TimeClockEntries
              WHERE TechnicianID = @technicianId
                AND ClockOutTime IS NOT NULL
              ORDER BY ClockOutTime DESC
            `);

          const lastEntry = lastEntryResult.recordset[0] || null;

          res.json({
            isClockedIn: !!currentEntry,
            currentEntry,
            lastEntry
          });
        } catch (error) {
          console.error('Error fetching time clock status:', error);
          res.status(500).json({ error: 'Failed to fetch status' });
        }
      }
    },
    {
      method: 'POST',
      path: '/clock-in',
      handler: async (req, res) => {
        const { technicianId, technicianName, ticketId } = req.body;
        const pool = req.pool || req.app.locals.pool;

        console.log('🔵 Clock-in request:', { technicianId, technicianName, ticketId });

        if (!pool) {
          console.error('❌ Pool not available in /clock-in endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        if (!technicianId || !ticketId) {
          console.error('❌ Missing required fields:', { technicianId, ticketId });
          return res.status(400).json({ error: 'Missing technicianId or ticketId' });
        }

        try {
          // Get technician name from Users table if not provided
          let finalTechnicianName = technicianName;
          if (!finalTechnicianName) {
            const userResult = await pool.request()
              .input('technicianId', technicianId)
              .query(`SELECT FullName FROM Users WHERE ID = @technicianId`);
            
            if (userResult.recordset.length > 0) {
              finalTechnicianName = userResult.recordset[0].FullName;
            } else {
              finalTechnicianName = technicianId; // Fallback to ID
            }
          }

          console.log('🔵 Using technician name:', finalTechnicianName);

          // Check if already clocked in for this ticket
          console.log('🔵 About to execute CHECK query with:', { technicianId, ticketId });
          const checkQuery = `
              SELECT EntryID FROM TimeClockEntries
              WHERE TechnicianID = @technicianId
                AND TicketID = @ticketId
                AND ClockOutTime IS NULL
            `;
          console.log('🔵 CHECK query:', checkQuery);
          const checkResult = await pool.request()
            .input('technicianId', technicianId)
            .input('ticketId', ticketId)
            .query(checkQuery);
          console.log('🔵 CHECK query succeeded, rows:', checkResult.recordset.length);

          if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Already clocked in for this ticket' });
          }

          // Clock in
          console.log('🔵 About to execute INSERT query');
          const insertQuery = `
              INSERT INTO TimeClockEntries (CompanyCode, TechnicianID, TechnicianName, TicketID, ClockInTime, Status)
              OUTPUT INSERTED.*
              VALUES ('DCPSP', @technicianId, @technicianName, @ticketId, GETUTCDATE(), 'Active')
            `;
          console.log('🔵 INSERT query:', insertQuery);
          console.log('🔵 INSERT params:', { technicianId, technicianName: finalTechnicianName, ticketId });
          const result = await pool.request()
            .input('technicianId', technicianId)
            .input('technicianName', finalTechnicianName)
            .input('ticketId', ticketId)
            .query(insertQuery);
          console.log('🔵 INSERT succeeded');

          const entry = result.recordset[0];

          // Log activity - ActivityLog table schema: ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent
          await pool.request()
            .input('id', uuidv4())
            .input('userId', technicianId)
            .input('username', finalTechnicianName)
            .input('action', 'Clocked In')
            .input('details', `${finalTechnicianName} clocked in to ticket ${ticketId}`)
            .input('timestamp', new Date())
            .input('companyCode', 'DCPSP')
            .input('ipAddress', '')
            .input('userAgent', '')
            .query(`
              INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent)
              VALUES (@id, @userId, @username, @action, @details, @timestamp, @companyCode, @ipAddress, @userAgent)
            `);

          res.json({ entry });
        } catch (error) {
          console.error('Error clocking in:', error);
          res.status(500).json({ error: 'Failed to clock in' });
        }
      }
    },
    {
      method: 'POST',
      path: '/clock-out',
      handler: async (req, res) => {
        const { technicianId, ticketId } = req.body;
        const pool = req.pool || req.app.locals.pool;

        if (!pool) {
          console.error('❌ Pool not available in /clock-out endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        try {
          // Get current entry for this ticket
          const currentResult = await pool.request()
            .input('technicianId', technicianId)
            .input('ticketId', ticketId)
            .query(`
              SELECT * FROM TimeClockEntries
              WHERE TechnicianID = @technicianId
                AND TicketID = @ticketId
                AND ClockOutTime IS NULL
            `);

          if (currentResult.recordset.length === 0) {
            return res.status(400).json({ error: 'No active clock-in found for this ticket' });
          }

          const entry = currentResult.recordset[0];

          // Clock out
          const result = await pool.request()
            .input('entryId', entry.EntryID)
            .query(`
              UPDATE TimeClockEntries
              SET 
                ClockOutTime = GETUTCDATE(),
                TotalHours = CAST(DATEDIFF(MINUTE, ClockInTime, GETUTCDATE()) AS DECIMAL(10,2)) / 60.0,
                Status = 'Completed'
              OUTPUT INSERTED.*
              WHERE EntryID = @entryId
            `);

          const updatedEntry = result.recordset[0];

          // Calculate minutes for display
          const totalMinutes = Math.round((updatedEntry.TotalHours || 0) * 60);

          // Format times for note
          const clockInTime = new Date(updatedEntry.ClockInTime).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          const clockOutTime = new Date(updatedEntry.ClockOutTime).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          // Create automatic note in CoordinatorNotes table
          const noteText = `⏰ Time Summary for ${updatedEntry.TechnicianName}:\nClock In: ${clockInTime}\nClock Out: ${clockOutTime}\nTotal Time: ${duration}`;
          const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          await pool.request()
            .input('noteId', noteId)
            .input('ticketId', ticketId)
            .input('note', noteText)
            .input('createdBy', technicianId)
            .query(`
              INSERT INTO CoordinatorNotes (NoteID, TicketID, Note, CreatedBy, CreatedAt)
              VALUES (@noteId, @ticketId, @note, @createdBy, GETUTCDATE())
            `);

          // Log activity - ActivityLog table schema: ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent
          await pool.request()
            .input('id', uuidv4())
            .input('userId', technicianId)
            .input('username', updatedEntry.TechnicianName)
            .input('action', 'Clocked Out')
            .input('details', `${updatedEntry.TechnicianName} clocked out from ticket ${ticketId} - ${duration}`)
            .input('timestamp', new Date())
            .input('companyCode', 'DCPSP')
            .input('ipAddress', '')
            .input('userAgent', '')
            .query(`
              INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, CompanyCode, IPAddress, UserAgent)
              VALUES (@id, @userId, @username, @action, @details, @timestamp, @companyCode, @ipAddress, @userAgent)
            `);

          res.json({ entry: updatedEntry });
        } catch (error) {
          console.error('Error clocking out:', error);
          res.status(500).json({ error: 'Failed to clock out' });
        }
      }
    },
    {
      method: 'GET',
      path: '/ticket-summary/:ticketId',
      handler: async (req, res) => {
        const { ticketId } = req.params;
        const pool = req.pool || req.app.locals.pool;

        if (!pool) {
          console.error('❌ Pool not available in /ticket-summary endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        try {
          // Get overall totals for this ticket (including active entries)
          const totalsResult = await pool.request()
            .input('ticketId', ticketId)
            .query(`
              SELECT
                SUM(
                  CASE 
                    WHEN ClockOutTime IS NULL THEN DATEDIFF(MINUTE, ClockInTime, GETUTCDATE())
                    ELSE ISNULL(TotalHours, 0) * 60
                  END
                ) as TotalMinutes,
                COUNT(*) as Entries
              FROM TimeClockEntries
              WHERE TicketID = @ticketId
            `);

          // Get per-technician breakdown (completed sessions only)
          const breakdownResult = await pool.request()
            .input('ticketId', ticketId)
            .query(`
              SELECT
                TechnicianID,
                TechnicianName,
                SUM(ISNULL(TotalHours, 0) * 60) as TotalMinutes,
                COUNT(*) as SessionCount
              FROM TimeClockEntries
              WHERE TicketID = @ticketId
                AND ClockOutTime IS NOT NULL
              GROUP BY TechnicianID, TechnicianName
              ORDER BY TotalMinutes DESC
            `);

          const totals = totalsResult.recordset[0] || { TotalMinutes: 0, Entries: 0 };

          res.json({
            totalMinutes: totals.TotalMinutes || 0,
            entries: totals.Entries || 0,
            breakdown: breakdownResult.recordset
          });
        } catch (error) {
          console.error('Error fetching ticket summary:', error);
          res.status(500).json({ error: 'Failed to fetch ticket summary' });
        }
      }
    },
    {
      method: 'GET',
      path: '/report',
      handler: async (req, res) => {
        const { startDate, endDate } = req.query;
        const pool = req.pool || req.app.locals.pool;

        if (!pool) {
          console.error('❌ Pool not available in /report endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        try {
          let dateFilter = '';
          
          if (startDate && endDate) {
            dateFilter = `AND tce.ClockInTime >= '${startDate}' AND tce.ClockInTime <= '${endDate} 23:59:59'`;
          } else if (startDate) {
            dateFilter = `AND tce.ClockInTime >= '${startDate}'`;
          } else if (endDate) {
            dateFilter = `AND tce.ClockInTime <= '${endDate} 23:59:59'`;
          }

          const result = await pool.request()
            .query(`
              SELECT
                tce.EntryID,
                tce.TechnicianID,
                u.FullName as TechnicianName,
                tce.TicketID,
                t.Title as TicketTitle,
                tce.ClockInTime,
                tce.ClockOutTime,
                CAST(ISNULL(tce.TotalHours, 0) * 60 AS INT) as DurationMinutes,
                tce.CompanyCode
              FROM TimeClockEntries tce
              LEFT JOIN Users u ON tce.TechnicianID = u.ID
              LEFT JOIN Tickets t ON tce.TicketID = t.TicketID
              WHERE 1=1
                ${dateFilter}
              ORDER BY tce.ClockInTime DESC
            `);

          res.json({ entries: result.recordset });
        } catch (error) {
          console.error('Error generating report:', error);
          res.status(500).json({ error: 'Failed to generate report' });
        }
      }
    },
    {
      method: 'GET',
      path: '/ticket-report',
      handler: async (req, res) => {
        const { timeFilter = 'all' } = req.query;
        const pool = req.pool || req.app.locals.pool;

        if (!pool) {
          console.error('❌ Pool not available in /ticket-report endpoint');
          return res.status(500).json({ error: 'Database connection not available' });
        }

        try {
          console.log('🔍 Ticket Report Query - Starting...');
          console.log('   Time Filter:', timeFilter);

          let dateFilter = '';
          
          if (timeFilter !== 'all') {
            const now = new Date();
            let startDate;
            
            switch (timeFilter) {
              case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
              case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            }
            
            if (startDate) {
              dateFilter = `AND tce.ClockInTime >= '${startDate.toISOString()}'`;
              console.log('   Date Filter:', dateFilter);
            }
          }

          const query = `
            SELECT
              tce.TicketID,
              t.Description as TicketDescription,
              t.Status as TicketStatus,
              t.Priority as TicketPriority,
              COUNT(DISTINCT tce.TechnicianID) as TechnicianCount,
              SUM(ISNULL(tce.TotalHours, 0) * 60) as TotalMinutes,
              MIN(tce.ClockInTime) as FirstClockIn,
              MAX(tce.ClockOutTime) as LastClockOut
            FROM TimeClockEntries tce
            LEFT JOIN Tickets t ON tce.TicketID = t.TicketID
            WHERE tce.ClockOutTime IS NOT NULL
              ${dateFilter}
            GROUP BY tce.TicketID, t.Description, t.Status, t.Priority
            ORDER BY TotalMinutes DESC
          `;

          console.log('   Query:', query);

          const result = await pool.request()
            .query(query);

          console.log('✅ Ticket Report Query - Complete');
          console.log('   Rows Returned:', result.recordset.length);

          if (result.recordset.length > 0) {
            console.log('   Sample Row:', result.recordset[0]);
          }

          res.json({ report: result.recordset });
        } catch (error) {
          console.error('❌ Error generating ticket report:', error);
          console.error('   Error Details:', error.message);
          console.error('   Stack:', error.stack);
          res.status(500).json({ 
            error: 'Failed to generate ticket report',
            details: error.message 
          });
        }
      }
    }
  ],
  
  /**
   * Ticket Tabs
   * Adds a "Time Clock" tab to ticket modals
   */
  ticketTabs: [
    {
      id: 'timeclock',
      label: 'Time Clock',
      icon: '⏰',
      componentId: 'ticket-time-clock',
      roles: ['Technician', 'SystemAdmin']
    }
  ],
  
  /**
   * Report Component
   * Adds Time Clock Report to Reports page
   */
  reportComponent: {
    componentId: 'time-clock-report',
    label: 'Time Clock Report',
    icon: '⏰'
  },
  
  /**
   * Lifecycle Hooks
   */
  hooks: {
    /**
     * Called when plugin is installed for a tenant
     */
    onInstall: async (tenantId, pool) => {
      console.log(`⏰ Time Clock Plugin: Installing for tenant ${tenantId}`);
      
      try {
        // Create TimeClockEntries table
        await pool.request()
          .query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeClockEntries')
            BEGIN
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
              
              CREATE INDEX IX_TimeClockEntries_CompanyCode ON TimeClockEntries(companyCode);
              CREATE INDEX IX_TimeClockEntries_TechnicianId ON TimeClockEntries(technicianId);
              CREATE INDEX IX_TimeClockEntries_TicketId ON TimeClockEntries(ticketId);
              CREATE INDEX IX_TimeClockEntries_ClockInTime ON TimeClockEntries(clockInTime);
            END
          `);
        
        console.log(`✅ Time Clock Plugin: Tables created for ${tenantId}`);
      } catch (error) {
        console.error(`❌ Time Clock Plugin: Error during installation:`, error);
        throw error;
      }
    },
    
    /**
     * Called when plugin is uninstalled for a tenant
     */
    onUninstall: async (tenantId, pool) => {
      console.log(`⏰ Time Clock Plugin: Uninstalling for tenant ${tenantId}`);
      
      try {
        // Clean up data for this tenant
        await pool.request()
          .input('companyCode', tenantId)
          .query(`
            DELETE FROM TimeClockEntries WHERE companyCode = @companyCode;
          `);
        
        console.log(`✅ Time Clock Plugin: Data cleaned up for ${tenantId}`);
      } catch (error) {
        console.error(`❌ Time Clock Plugin: Error during uninstallation:`, error);
        throw error;
      }
    },
    
    /**
     * Called when plugin is enabled for a tenant
     */
    onEnable: async (tenantId, pool) => {
      console.log(`✅ Time Clock Plugin: Enabled for tenant ${tenantId}`);
    },
    
    /**
     * Called when plugin is disabled for a tenant
     */
    onDisable: async (tenantId, pool) => {
      console.log(`⏸️ Time Clock Plugin: Disabled for tenant ${tenantId}`);
    }
  }
};
