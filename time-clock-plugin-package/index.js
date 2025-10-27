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
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
          let query = `
            SELECT TOP 1
              id,
              technicianId,
              ticketId,
              clockInTime,
              clockOutTime,
              companyCode
            FROM TimeClockEntries
            WHERE companyCode = @companyCode
              AND technicianId = @technicianId
              AND clockOutTime IS NULL
          `;

          const params = { companyCode, technicianId };

          if (ticketId) {
            query += ` AND ticketId = @ticketId`;
            params.ticketId = ticketId;
          }

          query += ` ORDER BY clockInTime DESC`;

          const request = pool.request();
          Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
          });

          const result = await request.query(query);
          const currentEntry = result.recordset[0] || null;

          // Get last completed entry
          const lastEntryResult = await pool.request()
            .input('companyCode', companyCode)
            .input('technicianId', technicianId)
            .query(`
              SELECT TOP 1
                id,
                technicianId,
                ticketId,
                clockInTime,
                clockOutTime,
                totalMinutes,
                companyCode
              FROM TimeClockEntries
              WHERE companyCode = @companyCode
                AND technicianId = @technicianId
                AND clockOutTime IS NOT NULL
              ORDER BY clockOutTime DESC
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
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
          // Check if already clocked in for this ticket
          const checkResult = await pool.request()
            .input('companyCode', companyCode)
            .input('technicianId', technicianId)
            .input('ticketId', ticketId)
            .query(`
              SELECT id FROM TimeClockEntries
              WHERE companyCode = @companyCode
                AND technicianId = @technicianId
                AND ticketId = @ticketId
                AND clockOutTime IS NULL
            `);

          if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Already clocked in for this ticket' });
          }

          // Clock in
          const result = await pool.request()
            .input('companyCode', companyCode)
            .input('technicianId', technicianId)
            .input('technicianName', technicianName)
            .input('ticketId', ticketId)
            .query(`
              INSERT INTO TimeClockEntries (companyCode, technicianId, technicianName, ticketId, clockInTime)
              OUTPUT INSERTED.*
              VALUES (@companyCode, @technicianId, @technicianName, @ticketId, GETUTCDATE())
            `);

          const entry = result.recordset[0];

          // Log activity
          await pool.request()
            .input('companyCode', companyCode)
            .input('userId', technicianId)
            .input('ticketId', ticketId)
            .input('action', 'Clocked In')
            .input('details', `${technicianName} clocked in`)
            .query(`
              INSERT INTO ActivityLog (CompanyCode, UserID, TicketID, Action, Details, Timestamp)
              VALUES (@companyCode, @userId, @ticketId, @action, @details, GETUTCDATE())
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
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
          // Get current entry for this ticket
          const currentResult = await pool.request()
            .input('companyCode', companyCode)
            .input('technicianId', technicianId)
            .input('ticketId', ticketId)
            .query(`
              SELECT * FROM TimeClockEntries
              WHERE companyCode = @companyCode
                AND technicianId = @technicianId
                AND ticketId = @ticketId
                AND clockOutTime IS NULL
            `);

          if (currentResult.recordset.length === 0) {
            return res.status(400).json({ error: 'No active clock-in found for this ticket' });
          }

          const entry = currentResult.recordset[0];

          // Clock out
          const result = await pool.request()
            .input('id', entry.id)
            .query(`
              UPDATE TimeClockEntries
              SET 
                clockOutTime = GETUTCDATE(),
                totalMinutes = DATEDIFF(MINUTE, clockInTime, GETUTCDATE())
              OUTPUT INSERTED.*
              WHERE id = @id
            `);

          const updatedEntry = result.recordset[0];

          // Format times for note
          const clockInTime = new Date(updatedEntry.clockInTime).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          const clockOutTime = new Date(updatedEntry.clockOutTime).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          const hours = Math.floor(updatedEntry.totalMinutes / 60);
          const minutes = updatedEntry.totalMinutes % 60;
          const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          // Create automatic note
          const noteText = `⏰ Time Summary for ${updatedEntry.technicianName}:\nClock In: ${clockInTime}\nClock Out: ${clockOutTime}\nTotal Time: ${duration}`;

          await pool.request()
            .input('ticketId', ticketId)
            .input('companyCode', companyCode)
            .input('userId', technicianId)
            .input('noteText', noteText)
            .query(`
              INSERT INTO CoordinatorNotes (TicketID, CompanyCode, UserID, NoteText, CreatedAt)
              VALUES (@ticketId, @companyCode, @userId, @noteText, GETUTCDATE())
            `);

          // Log activity
          await pool.request()
            .input('companyCode', companyCode)
            .input('userId', technicianId)
            .input('ticketId', ticketId)
            .input('action', 'Clocked Out')
            .input('details', `${updatedEntry.technicianName} clocked out - ${duration}`)
            .query(`
              INSERT INTO ActivityLog (CompanyCode, UserID, TicketID, Action, Details, Timestamp)
              VALUES (@companyCode, @userId, @ticketId, @action, @details, GETUTCDATE())
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
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
          const result = await pool.request()
            .input('companyCode', companyCode)
            .input('ticketId', ticketId)
            .query(`
              SELECT
                technicianId,
                technicianName,
                SUM(ISNULL(totalMinutes, 0)) as totalMinutes,
                COUNT(*) as sessionCount
              FROM TimeClockEntries
              WHERE companyCode = @companyCode
                AND ticketId = @ticketId
                AND clockOutTime IS NOT NULL
              GROUP BY technicianId, technicianName
              ORDER BY technicianName
            `);

          res.json({ summary: result.recordset });
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
        const { timeFilter = 'all' } = req.query;
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
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
              dateFilter = `AND clockInTime >= '${startDate.toISOString()}'`;
            }
          }

          const result = await pool.request()
            .input('companyCode', companyCode)
            .query(`
              SELECT
                technicianId,
                technicianName,
                COUNT(*) as totalSessions,
                SUM(ISNULL(totalMinutes, 0)) as totalMinutes,
                MIN(clockInTime) as firstClockIn,
                MAX(clockOutTime) as lastClockOut
              FROM TimeClockEntries
              WHERE companyCode = @companyCode
                AND clockOutTime IS NOT NULL
                ${dateFilter}
              GROUP BY technicianId, technicianName
              ORDER BY totalMinutes DESC
            `);

          res.json({ report: result.recordset });
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
        const companyCode = req.headers['x-company-code'] || 'DCPSP';
        const pool = req.app.locals.pool;

        try {
          console.log('🔍 Ticket Report Query - Starting...');
          console.log('   Company Code:', companyCode);
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
              dateFilter = `AND tce.clockInTime >= '${startDate.toISOString()}'`;
              console.log('   Date Filter:', dateFilter);
            }
          }

          const query = `
            SELECT
              tce.ticketId,
              t.Description as ticketDescription,
              t.Status as ticketStatus,
              t.Priority as ticketPriority,
              COUNT(DISTINCT tce.technicianId) as technicianCount,
              SUM(ISNULL(tce.totalMinutes, 0)) as totalMinutes,
              MIN(tce.clockInTime) as firstClockIn,
              MAX(tce.clockOutTime) as lastClockOut
            FROM TimeClockEntries tce
            LEFT JOIN Tickets t ON tce.ticketId = t.TicketID AND tce.companyCode = t.CompanyCode
            WHERE tce.companyCode = @companyCode
              AND tce.clockOutTime IS NOT NULL
              ${dateFilter}
            GROUP BY tce.ticketId, t.Description, t.Status, t.Priority
            ORDER BY totalMinutes DESC
          `;

          console.log('   Query:', query);

          const result = await pool.request()
            .input('companyCode', companyCode)
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
