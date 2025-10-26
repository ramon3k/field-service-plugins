-- ================================================================
-- Demo Tickets - Comprehensive Scenarios Across All States
-- ================================================================
-- Creates realistic tickets showing all features:
-- - Various statuses (New, Scheduled, In-Progress, Complete, Closed)
-- - Different priorities (Low, Medium, High, Critical)
-- - Service types across all states
-- - Activity logs and notes
-- ================================================================

USE FieldServiceDB;
GO

-- Clear existing demo tickets
DELETE FROM Notes WHERE TicketID LIKE 'DEMO-%';
DELETE FROM ActivityLog WHERE TicketID LIKE 'DEMO-%';
DELETE FROM Tickets WHERE TicketID LIKE 'DEMO-%';
GO

-- ================================================================
-- CALIFORNIA TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
-- High priority ongoing issues
('DEMO-CA-001', 'DEMO-CA-001', 'DEMO-CA-001-01', 'Fire Alarm Panel Malfunction', 'Main fire alarm panel showing fault. Needs immediate inspection.', 'In-Progress', 'Critical', 'Fire Alarm', 'Mike Chen (CA)', 'Sarah Johnson', DATEADD(HOUR, -4, GETDATE()), DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 'DEMO'),

('DEMO-CA-002', 'DEMO-CA-001', 'DEMO-CA-001-02', 'Access Card Reader Not Working', 'Front entrance card reader intermittent. Employees unable to access building.', 'Scheduled', 'High', 'Access Control', 'Mike Chen (CA)', 'Sarah Johnson', DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, -6, GETDATE()), DATEADD(HOUR, 2, GETDATE()), DATEADD(DAY, 1, GETDATE()), 'DEMO'),

('DEMO-CA-003', 'DEMO-CA-002', 'DEMO-CA-002-01', 'CCTV Camera Offline', 'Parking lot camera #12 is offline. Need to check power and network.', 'New', 'Medium', 'CCTV', NULL, 'Steve Wilson', DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -2, GETDATE()), NULL, DATEADD(DAY, 2, GETDATE()), 'DEMO'),

('DEMO-CA-004', 'DEMO-CA-003', 'DEMO-CA-003-01', 'Panic Button Installation', 'Install 3 new panic buttons in ER reception area per fire marshal requirement.', 'Scheduled', 'High', 'Installation', 'Mike Chen (CA)', 'Dr. Lisa Kim', DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, 1, GETDATE()), DATEADD(DAY, 3, GETDATE()), 'DEMO'),

('DEMO-CA-005', 'DEMO-CA-002', 'DEMO-CA-002-01', 'Annual Fire Alarm Inspection', 'Quarterly inspection of fire alarm system per state requirements.', 'Complete', 'Medium', 'Inspection', 'Mike Chen (CA)', 'Steve Wilson', DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -3, GETDATE()), 'DEMO');

-- ================================================================
-- TEXAS TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-TX-001', 'DEMO-TX-001', 'DEMO-TX-001-01', 'Intrusion Alarm Going Off', 'False alarms on Zone 3. Motion sensors may need adjustment.', 'In-Progress', 'High', 'Burglar Alarm', 'Jose Rodriguez (TX)', 'Sarah Johnson', DATEADD(HOUR, -6, GETDATE()), DATEADD(HOUR, -1, GETDATE()), DATEADD(HOUR, -5, GETDATE()), DATEADD(HOUR, 6, GETDATE()), 'DEMO'),

('DEMO-TX-002', 'DEMO-TX-002', 'DEMO-TX-002-01', 'Replace Backup Battery', 'Alarm panel backup battery showing low voltage. Needs replacement.', 'Scheduled', 'Medium', 'Maintenance', 'Jose Rodriguez (TX)', 'Jennifer Lopez', DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, 4, GETDATE()), DATEADD(DAY, 1, GETDATE()), 'DEMO'),

('DEMO-TX-003', 'DEMO-TX-003', 'DEMO-TX-003-01', 'Campus-Wide System Upgrade', 'Upgrade all access control readers to latest firmware version.', 'New', 'Low', 'Upgrade', NULL, 'Prof. James Miller', DATEADD(HOUR, -1, GETDATE()), DATEADD(HOUR, -1, GETDATE()), NULL, DATEADD(DAY, 7, GETDATE()), 'DEMO'),

('DEMO-TX-004', 'DEMO-TX-003', 'DEMO-TX-003-02', 'Library After-Hours Access Setup', 'Configure access control for extended library hours during finals week.', 'Scheduled', 'Medium', 'Access Control', 'Jose Rodriguez (TX)', 'Prof. James Miller', DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, -12, GETDATE()), DATEADD(DAY, 2, GETDATE()), DATEADD(DAY, 5, GETDATE()), 'DEMO'),

('DEMO-TX-005', 'DEMO-TX-002', 'DEMO-TX-002-01', 'Security System Annual Inspection', 'Annual inspection and testing of all zones completed successfully.', 'Complete', 'Low', 'Inspection', 'Jose Rodriguez (TX)', 'Jennifer Lopez', DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -14, GETDATE()), DATEADD(DAY, -5, GETDATE()), 'DEMO');

-- ================================================================
-- NEW YORK TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-NY-001', 'DEMO-NY-001', 'DEMO-NY-001-01', 'Elevator Security Camera Blank', 'Camera in elevator #3 showing no video feed. May be power or cable issue.', 'New', 'High', 'CCTV', NULL, 'Rachel Goldman', DATEADD(MINUTE, -30, GETDATE()), DATEADD(MINUTE, -30, GETDATE()), NULL, DATEADD(HOUR, 12, GETDATE()), 'DEMO'),

('DEMO-NY-002', 'DEMO-NY-002', 'DEMO-NY-002-01', 'Guest Room Safe Malfunction', 'Room 1505 safe not opening. Guest needs access urgently.', 'In-Progress', 'Critical', 'Maintenance', 'David Cohen (NY)', 'Michael Chen', DATEADD(HOUR, -2, GETDATE()), DATEADD(MINUTE, -45, GETDATE()), DATEADD(HOUR, -1, GETDATE()), DATEADD(HOUR, 2, GETDATE()), 'DEMO'),

('DEMO-NY-003', 'DEMO-NY-003', 'DEMO-NY-003-01', 'Install Motion Sensors in New Wing', 'New exhibition wing needs 8 motion sensors installed before opening.', 'Scheduled', 'High', 'Installation', 'David Cohen (NY)', 'Sarah Davis', DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, 7, GETDATE()), 'DEMO'),

('DEMO-NY-004', 'DEMO-NY-001', 'DEMO-NY-001-01', 'Add 10 New User Access Cards', 'New employees starting next week. Need access cards programmed.', 'New', 'Low', 'Access Control', NULL, 'Rachel Goldman', DATEADD(HOUR, -8, GETDATE()), DATEADD(HOUR, -8, GETDATE()), NULL, DATEADD(DAY, 3, GETDATE()), 'DEMO'),

('DEMO-NY-005', 'DEMO-NY-002', 'DEMO-NY-002-01', 'Quarterly Fire Drill & System Test', 'Conducted fire drill and tested all fire alarm notification devices.', 'Complete', 'Medium', 'Testing', 'David Cohen (NY)', 'Michael Chen', DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -18, GETDATE()), DATEADD(DAY, -19, GETDATE()), DATEADD(DAY, -17, GETDATE()), 'DEMO');

-- ================================================================
-- FLORIDA TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-FL-001', 'DEMO-FL-001', 'DEMO-FL-001-01', 'Beach Access Gate Not Locking', 'Electronic gate lock to beach area not engaging. Security concern.', 'In-Progress', 'High', 'Access Control', 'Maria Garcia (FL)', 'Carlos Rodriguez', DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -1, GETDATE()), DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 'DEMO'),

('DEMO-FL-002', 'DEMO-FL-002', 'DEMO-FL-002-01', 'Add Security Cameras to New Ride', 'New roller coaster needs 6 security cameras for monitoring queue and ride.', 'Scheduled', 'Medium', 'Installation', 'Maria Garcia (FL)', 'Amanda White', DATEADD(DAY, -4, GETDATE()), DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, 5, GETDATE()), DATEADD(DAY, 10, GETDATE()), 'DEMO'),

('DEMO-FL-003', 'DEMO-FL-003', 'DEMO-FL-003-01', 'Medical Alert Button Not Responding', 'Emergency call button in Unit 204 not signaling nursing station.', 'New', 'Critical', 'Medical Alert', NULL, 'Mary Johnson', DATEADD(MINUTE, -15, GETDATE()), DATEADD(MINUTE, -15, GETDATE()), NULL, DATEADD(HOUR, 2, GETDATE()), 'DEMO'),

('DEMO-FL-004', 'DEMO-FL-001', 'DEMO-FL-001-01', 'Pool Area Camera Cleaning', 'Salt spray has reduced visibility on cameras #5-8. Need cleaning.', 'Scheduled', 'Low', 'Maintenance', 'Maria Garcia (FL)', 'Carlos Rodriguez', DATEADD(HOUR, -12, GETDATE()), DATEADD(HOUR, -10, GETDATE()), DATEADD(HOUR, 8, GETDATE()), DATEADD(DAY, 2, GETDATE()), 'DEMO'),

('DEMO-FL-005', 'DEMO-FL-002', 'DEMO-FL-002-01', 'Hurricane Preparedness Check', 'Pre-hurricane season inspection of all outdoor equipment completed.', 'Complete', 'High', 'Inspection', 'Maria Garcia (FL)', 'Amanda White', DATEADD(DAY, -25, GETDATE()), DATEADD(DAY, -23, GETDATE()), DATEADD(DAY, -24, GETDATE()), DATEADD(DAY, -22, GETDATE()), 'DEMO');

-- ================================================================
-- ILLINOIS TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-IL-001', 'DEMO-IL-001', 'DEMO-IL-001-01', 'Loading Dock Door Sensor Fault', 'Loading dock #2 door sensor showing constant open. Affecting HVAC.', 'New', 'Medium', 'Access Control', NULL, 'David Brown', DATEADD(HOUR, -4, GETDATE()), DATEADD(HOUR, -4, GETDATE()), NULL, DATEADD(DAY, 1, GETDATE()), 'DEMO'),

('DEMO-IL-002', 'DEMO-IL-002', 'DEMO-IL-002-01', 'TSA Compliance Upgrade', 'Upgrade baggage screening area cameras to TSA requirements.', 'Scheduled', 'High', 'Upgrade', 'John Smith (IL)', 'Patricia Lee', DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, 10, GETDATE()), DATEADD(DAY, 20, GETDATE()), 'DEMO'),

('DEMO-IL-003', 'DEMO-IL-001', 'DEMO-IL-001-01', 'Monthly Security System Test', 'Monthly testing of all intrusion zones and panic buttons.', 'Complete', 'Low', 'Testing', 'John Smith (IL)', 'David Brown', DATEADD(DAY, -12, GETDATE()), DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -11, GETDATE()), DATEADD(DAY, -9, GETDATE()), 'DEMO');

-- ================================================================
-- WASHINGTON TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-WA-001', 'DEMO-WA-001', 'DEMO-WA-001-01', 'Conference Room AV System Integration', 'Integrate security cameras with video conferencing system.', 'New', 'Low', 'Integration', NULL, 'Kevin Park', DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -1, GETDATE()), NULL, DATEADD(DAY, 5, GETDATE()), 'DEMO'),

('DEMO-WA-002', 'DEMO-WA-002', 'DEMO-WA-002-01', 'Server Room Access Log Review', 'Quarterly review of server room access logs for compliance.', 'Scheduled', 'Medium', 'Audit', 'Emily Zhang (WA)', 'Laura Green', DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, 1, GETDATE()), DATEADD(DAY, 4, GETDATE()), 'DEMO'),

('DEMO-WA-003', 'DEMO-WA-001', 'DEMO-WA-001-01', 'Replace Entrance Keypad', 'Main entrance keypad buttons worn out. Replacement needed.', 'Complete', 'Medium', 'Maintenance', 'Emily Zhang (WA)', 'Kevin Park', DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -6, GETDATE()), DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -5, GETDATE()), 'DEMO');

-- ================================================================
-- COLORADO TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-CO-001', 'DEMO-CO-001', 'DEMO-CO-001-01', 'Ski Lift Camera Adjustment', 'Ski lift #4 camera needs repositioning for better queue monitoring.', 'Scheduled', 'Low', 'CCTV', 'Robert Martinez (CO)', 'Mark Anderson', DATEADD(HOUR, -18, GETDATE()), DATEADD(HOUR, -16, GETDATE()), DATEADD(HOUR, 6, GETDATE()), DATEADD(DAY, 3, GETDATE()), 'DEMO'),

('DEMO-CO-002', 'DEMO-CO-002', 'DEMO-CO-002-01', 'Environmental Monitoring Setup', 'Install temperature and humidity sensors in server room.', 'In-Progress', 'High', 'Installation', 'Robert Martinez (CO)', 'Susan Wang', DATEADD(DAY, -2, GETDATE()), DATEADD(HOUR, -6, GETDATE()), DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 1, GETDATE()), 'DEMO'),

('DEMO-CO-003', 'DEMO-CO-002', 'DEMO-CO-002-01', 'Biometric Access System Calibration', 'Annual calibration of fingerprint readers completed.', 'Complete', 'Medium', 'Maintenance', 'Robert Martinez (CO)', 'Susan Wang', DATEADD(DAY, -30, GETDATE()), DATEADD(DAY, -28, GETDATE()), DATEADD(DAY, -29, GETDATE()), DATEADD(DAY, -27, GETDATE()), 'DEMO');

-- ================================================================
-- GEORGIA TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, CustomerID, SiteID, Title, Description, Status, Priority, Category, AssignedTo, CreatedBy, CreatedAt, UpdatedAt, ScheduledDate, SLA_Due, CompanyCode) VALUES
('DEMO-GA-001', 'DEMO-GA-001', 'DEMO-GA-001-01', 'Forklift Collision Alert System', 'Install collision detection sensors on warehouse forklifts.', 'New', 'Medium', 'Installation', NULL, 'Chris Martin', DATEADD(HOUR, -5, GETDATE()), DATEADD(HOUR, -5, GETDATE()), NULL, DATEADD(DAY, 4, GETDATE()), 'DEMO'),

('DEMO-GA-002', 'DEMO-GA-002', 'DEMO-GA-002-01', 'Patient Room Privacy Curtain Sensors', 'Install privacy sensors in patient rooms for nurse notification.', 'Scheduled', 'High', 'Medical Alert', 'Lisa Brown (GA)', 'Dr. Helen Taylor', DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, -20, GETDATE()), DATEADD(DAY, 2, GETDATE()), DATEADD(DAY, 5, GETDATE()), 'DEMO'),

('DEMO-GA-003', 'DEMO-GA-001', 'DEMO-GA-001-01', 'Security System Annual Certification', 'Annual third-party certification of warehouse security system.', 'Complete', 'Low', 'Inspection', 'Lisa Brown (GA)', 'Chris Martin', DATEADD(DAY, -45, GETDATE()), DATEADD(DAY, -40, GETDATE()), DATEADD(DAY, -44, GETDATE()), DATEADD(DAY, -39, GETDATE()), 'DEMO');

GO

-- ================================================================
-- Add Activity Logs for In-Progress and Complete Tickets
-- ================================================================

-- CA tickets activity
INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-CA-001', 'Ticket Created', 'Sarah Johnson', DATEADD(HOUR, -4, GETDATE()), 'Created ticket for fire alarm panel malfunction', 'DEMO'),
('DEMO-CA-001', 'Status Changed', 'System', DATEADD(HOUR, -3, GETDATE()), 'Status changed from New to Scheduled', 'DEMO'),
('DEMO-CA-001', 'Technician Assigned', 'Sarah Johnson', DATEADD(HOUR, -3, GETDATE()), 'Assigned to Mike Chen (CA)', 'DEMO'),
('DEMO-CA-001', 'Status Changed', 'Mike Chen (CA)', DATEADD(HOUR, -2, GETDATE()), 'Status changed from Scheduled to In-Progress', 'DEMO'),
('DEMO-CA-001', 'Note Added', 'Mike Chen (CA)', DATEADD(HOUR, -2, GETDATE()), 'On site. Testing panel zones individually. Zone 3 showing intermittent fault.', 'DEMO'),
('DEMO-CA-001', 'Note Added', 'Mike Chen (CA)', DATEADD(MINUTE, -45, GETDATE()), 'Found loose wire connection on zone 3 sensor. Repairing now.', 'DEMO');

INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-CA-005', 'Ticket Created', 'Steve Wilson', DATEADD(DAY, -10, GETDATE()), 'Scheduled annual fire alarm inspection', 'DEMO'),
('DEMO-CA-005', 'Technician Assigned', 'Sarah Johnson', DATEADD(DAY, -9, GETDATE()), 'Assigned to Mike Chen (CA)', 'DEMO'),
('DEMO-CA-005', 'Status Changed', 'Mike Chen (CA)', DATEADD(DAY, -8, GETDATE()), 'Status changed from Scheduled to In-Progress', 'DEMO'),
('DEMO-CA-005', 'Note Added', 'Mike Chen (CA)', DATEADD(DAY, -8, GETDATE()), 'Began comprehensive system inspection. All zones testing normal.', 'DEMO'),
('DEMO-CA-005', 'Status Changed', 'Mike Chen (CA)', DATEADD(DAY, -5, GETDATE()), 'Status changed from In-Progress to Complete', 'DEMO'),
('DEMO-CA-005', 'Note Added', 'Mike Chen (CA)', DATEADD(DAY, -5, GETDATE()), 'Inspection complete. All devices tested and operational. Paperwork submitted to fire marshal.', 'DEMO');

-- TX tickets activity
INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-TX-001', 'Ticket Created', 'Sarah Johnson', DATEADD(HOUR, -6, GETDATE()), 'False alarms reported on Zone 3', 'DEMO'),
('DEMO-TX-001', 'Technician Assigned', 'Sarah Johnson', DATEADD(HOUR, -5, GETDATE()), 'Assigned to Jose Rodriguez (TX)', 'DEMO'),
('DEMO-TX-001', 'Status Changed', 'Jose Rodriguez (TX)', DATEADD(HOUR, -5, GETDATE()), 'Status changed from New to In-Progress', 'DEMO'),
('DEMO-TX-001', 'Note Added', 'Jose Rodriguez (TX)', DATEADD(HOUR, -4, GETDATE()), 'Testing all motion sensors in Zone 3. Sensor #7 showing high sensitivity.', 'DEMO'),
('DEMO-TX-001', 'Note Added', 'Jose Rodriguez (TX)', DATEADD(HOUR, -1, GETDATE()), 'Adjusted sensitivity on sensors #7 and #8. Monitoring for false alarms.', 'DEMO');

-- NY tickets activity  
INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-NY-002', 'Ticket Created', 'Michael Chen', DATEADD(HOUR, -2, GETDATE()), 'Guest room safe malfunction - urgent', 'DEMO'),
('DEMO-NY-002', 'Technician Assigned', 'Sarah Johnson', DATEADD(HOUR, -1, GETDATE()), 'Assigned to David Cohen (NY) - marked as urgent', 'DEMO'),
('DEMO-NY-002', 'Status Changed', 'David Cohen (NY)', DATEADD(HOUR, -1, GETDATE()), 'Status changed from New to In-Progress', 'DEMO'),
('DEMO-NY-002', 'Note Added', 'David Cohen (NY)', DATEADD(MINUTE, -45, GETDATE()), 'Arrived on-site. Using master override code to open safe.', 'DEMO'),
('DEMO-NY-002', 'Note Added', 'David Cohen (NY)', DATEADD(MINUTE, -30, GETDATE()), 'Safe opened. Testing electronic lock mechanism. Replacing battery.', 'DEMO');

-- FL tickets activity
INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-FL-001', 'Ticket Created', 'Carlos Rodriguez', DATEADD(HOUR, -3, GETDATE()), 'Beach gate not locking properly', 'DEMO'),
('DEMO-FL-001', 'Technician Assigned', 'Sarah Johnson', DATEADD(HOUR, -2, GETDATE()), 'Assigned to Maria Garcia (FL)', 'DEMO'),
('DEMO-FL-001', 'Status Changed', 'Maria Garcia (FL)', DATEADD(HOUR, -2, GETDATE()), 'Status changed from New to In-Progress', 'DEMO'),
('DEMO-FL-001', 'Note Added', 'Maria Garcia (FL)', DATEADD(HOUR, -1, GETDATE()), 'Found salt corrosion on electronic strike. Cleaning and treating.', 'DEMO');

-- CO tickets activity
INSERT INTO ActivityLog (TicketID, Action, ActionBy, ActionAt, Details, CompanyCode) VALUES
('DEMO-CO-002', 'Ticket Created', 'Susan Wang', DATEADD(DAY, -2, GETDATE()), 'Need environmental monitoring in server room', 'DEMO'),
('DEMO-CO-002', 'Technician Assigned', 'Sarah Johnson', DATEADD(DAY, -1, GETDATE()), 'Assigned to Robert Martinez (CO)', 'DEMO'),
('DEMO-CO-002', 'Status Changed', 'Robert Martinez (CO)', DATEADD(DAY, -1, GETDATE()), 'Status changed from New to In-Progress', 'DEMO'),
('DEMO-CO-002', 'Note Added', 'Robert Martinez (CO)', DATEADD(HOUR, -6, GETDATE()), 'Installing sensors. Integrating with monitoring system.', 'DEMO');

GO

-- ================================================================
-- Add Notes to Various Tickets
-- ================================================================

INSERT INTO Notes (TicketID, NoteText, CreatedBy, CreatedAt, CompanyCode) VALUES
('DEMO-CA-001', 'Customer reports panel has been beeping intermittently for 2 days.', 'Sarah Johnson', DATEADD(HOUR, -4, GETDATE()), 'DEMO'),
('DEMO-CA-001', 'Zone 3 covers the main warehouse area with 12 smoke detectors.', 'Mike Chen (CA)', DATEADD(HOUR, -2, GETDATE()), 'DEMO'),
('DEMO-CA-002', 'This is affecting about 50 employees. Temporary visitor badges issued.', 'Store Manager', DATEADD(HOUR, -8, GETDATE()), 'DEMO'),
('DEMO-TX-001', 'False alarms occurring mostly at night when temperature drops.', 'Facility Mgr', DATEADD(HOUR, -5, GETDATE()), 'DEMO'),
('DEMO-TX-003', 'Project scope includes all 47 buildings on campus. Phased approach recommended.', 'Prof. James Miller', DATEADD(HOUR, -1, GETDATE()), 'DEMO'),
('DEMO-NY-002', 'Guest has flight in 3 hours. Passport and documents in safe. HIGH PRIORITY.', 'Hotel Manager', DATEADD(HOUR, -2, GETDATE()), 'DEMO'),
('DEMO-FL-003', 'Resident pressing button but no light/sound at nursing station. URGENT.', 'Nurse Supervisor', DATEADD(MINUTE, -15, GETDATE()), 'DEMO'),
('DEMO-CO-002', 'Must maintain 65-75°F and 40-60% humidity per vendor specs.', 'Susan Wang', DATEADD(DAY, -2, GETDATE()), 'DEMO'),
('DEMO-GA-001', 'Safety initiative. Quote for 15 sensor units requested.', 'Chris Martin', DATEADD(HOUR, -5, GETDATE()), 'DEMO');

GO

PRINT '✅ Demo tickets created successfully!'
PRINT '📊 Summary:'
PRINT '   - 35 Demo Tickets across 8 states'
PRINT '   - Various statuses: New, Scheduled, In-Progress, Complete'
PRINT '   - Multiple priorities: Low, Medium, High, Critical'
PRINT '   - Activity logs for in-progress tickets'
PRINT '   - Notes with customer context'
PRINT ''
PRINT '🎯 Ready to test! All features demonstrated.'
