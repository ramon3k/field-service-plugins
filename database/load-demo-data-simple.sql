-- ================================================================
-- Demo Data for FieldServiceDB-DEMO
-- Simplified to match actual schema
-- ================================================================

USE [FieldServiceDB-DEMO];
GO

-- Clear existing data in correct order (respecting foreign keys)
DELETE FROM CoordinatorNotes;
DELETE FROM AuditTrail;
DELETE FROM Tickets;
DELETE FROM Assets;
DELETE FROM Sites;
DELETE FROM Customers;
DELETE FROM ActivityLog;  -- Delete ActivityLog before Users
DELETE FROM Users;
GO

-- ================================================================
-- DEMO USERS (password: demo123)
-- ================================================================

INSERT INTO Users (ID, Username, PasswordHash, FullName, Email, Role, IsActive) VALUES
('demo-admin-001', 'demo-admin', 'ZGVtbzEyMw==', 'Demo Administrator', 'admin@democorp.com', 'Admin', 1),
('demo-coord-001', 'demo-coordinator', 'ZGVtbzEyMw==', 'Sarah Johnson', 'sarah@democorp.com', 'Coordinator', 1),
('demo-tech-ca-001', 'demo-tech-ca', 'ZGVtbzEyMw==', 'Mike Chen (CA)', 'mike@democorp.com', 'Technician', 1),
('demo-tech-tx-001', 'demo-tech-tx', 'ZGVtbzEyMw==', 'Jose Rodriguez (TX)', 'jose@democorp.com', 'Technician', 1),
('demo-tech-ny-001', 'demo-tech-ny', 'ZGVtbzEyMw==', 'David Cohen (NY)', 'david@democorp.com', 'Technician', 1),
('demo-tech-fl-001', 'demo-tech-fl', 'ZGVtbzEyMw==', 'Maria Garcia (FL)', 'maria@democorp.com', 'Technician', 1),
('demo-tech-il-001', 'demo-tech-il', 'ZGVtbzEyMw==', 'John Smith (IL)', 'john@democorp.com', 'Technician', 1),
('demo-tech-wa-001', 'demo-tech-wa', 'ZGVtbzEyMw==', 'Emily Zhang (WA)', 'emily@democorp.com', 'Technician', 1);
GO

-- ================================================================
-- DEMO CUSTOMERS
-- ================================================================

INSERT INTO Customers (CustomerID, Name, Contact, Email, Phone, Address, Notes) VALUES
-- California
('DEMO-CA-001', 'CA Retail Chain', 'Tom Anderson', 'tom@caretail.com', '555-1001', '123 Hollywood Blvd, Los Angeles, CA 90028', '15 locations across California'),
('DEMO-CA-002', 'CA Tech Campus', 'Steve Wilson', 'steve@catech.com', '555-1002', '456 Silicon Valley Dr, San Jose, CA 95110', 'Large tech campus'),

-- Texas
('DEMO-TX-001', 'TX Oil & Gas HQ', 'Bob Thompson', 'bob@txoilgas.com', '555-2001', '100 Energy Plaza, Houston, TX 77002', 'Industrial facility'),
('DEMO-TX-002', 'TX Shopping Mall', 'Jennifer Lopez', 'jen@txmall.com', '555-2002', '200 Retail Parkway, Dallas, TX 75201', 'Shopping complex'),

-- New York
('DEMO-NY-001', 'NY Financial Tower', 'Rachel Goldman', 'rachel@nyfinance.com', '555-3001', '1 Wall Street, New York, NY 10005', 'High-rise office'),
('DEMO-NY-002', 'NY Hotel Group', 'Michael Chen', 'michael@nyhotels.com', '555-3002', '500 Broadway, New York, NY 10012', '5-star hotels'),

-- Florida
('DEMO-FL-001', 'FL Resort Hotels', 'Carlos Rodriguez', 'carlos@flresorts.com', '555-4001', '1000 Ocean Drive, Miami Beach, FL 33139', 'Beach resorts'),
('DEMO-FL-002', 'FL Theme Parks', 'Amanda White', 'amanda@flparks.com', '555-4002', '2000 Adventure Way, Orlando, FL 32819', 'Entertainment venue'),

-- Illinois
('DEMO-IL-001', 'IL Manufacturing', 'David Brown', 'david@ilmfg.com', '555-5001', '100 Industrial Ave, Chicago, IL 60601', 'Production facility'),

-- Washington
('DEMO-WA-001', 'WA Tech Hub', 'Kevin Park', 'kevin@wastartup.com', '555-6001', '100 Innovation Blvd, Seattle, WA 98101', 'Tech incubator');
GO

-- ================================================================
-- DEMO SITES
-- ================================================================

INSERT INTO Sites (SiteID, CustomerID, Name, Address, Contact, Phone, GeoLocation, Notes) VALUES
-- California
('DEMO-CA-001-01', 'DEMO-CA-001', 'CA Retail - LA Downtown', '123 Hollywood Blvd, Los Angeles, CA 90028', 'Store Manager', '555-1101', '34.0928,-118.3287', 'Main location'),
('DEMO-CA-002-01', 'DEMO-CA-002', 'CA Tech - Main Campus', '456 Silicon Valley Dr, San Jose, CA 95110', 'Facilities', '555-1201', '37.3382,-121.8863', 'HQ'),

-- Texas
('DEMO-TX-001-01', 'DEMO-TX-001', 'TX Oil & Gas - Tower A', '100 Energy Plaza, Houston, TX 77002', 'Facility Mgr', '555-2101', '29.7604,-95.3698', 'Office tower'),
('DEMO-TX-002-01', 'DEMO-TX-002', 'TX Mall - Main', '200 Retail Parkway, Dallas, TX 75201', 'Mall Manager', '555-2201', '32.7767,-96.7970', 'Mall'),

-- New York
('DEMO-NY-001-01', 'DEMO-NY-001', 'NY Tower - Main', '1 Wall Street, New York, NY 10005', 'Building Mgr', '555-3101', '40.7074,-74.0113', 'Financial district'),
('DEMO-NY-002-01', 'DEMO-NY-002', 'NY Hotel - Broadway', '500 Broadway, New York, NY 10012', 'Hotel Manager', '555-3201', '40.7209,-73.9987', 'Hotel'),

-- Florida
('DEMO-FL-001-01', 'DEMO-FL-001', 'FL Resort - Main', '1000 Ocean Drive, Miami Beach, FL 33139', 'Resort Mgr', '555-4101', '25.7817,-80.1300', 'Resort'),
('DEMO-FL-002-01', 'DEMO-FL-002', 'FL Parks - Main', '2000 Adventure Way, Orlando, FL 32819', 'Park Mgr', '555-4201', '28.3772,-81.5707', 'Theme park'),

-- Illinois
('DEMO-IL-001-01', 'DEMO-IL-001', 'IL Plant - Main', '100 Industrial Ave, Chicago, IL 60601', 'Plant Mgr', '555-5101', '41.8781,-87.6298', 'Factory'),

-- Washington
('DEMO-WA-001-01', 'DEMO-WA-001', 'WA Hub - Main', '100 Innovation Blvd, Seattle, WA 98101', 'Director', '555-6101', '47.6062,-122.3321', 'Incubator');
GO

-- ================================================================
-- DEMO TICKETS
-- ================================================================

INSERT INTO Tickets (TicketID, Title, Status, Priority, Customer, Site, Category, Description, AssignedTo, GeoLocation) VALUES
-- California Tickets
('DEMO-CA-001', 'Fire Alarm System Maintenance', 'New', 'Normal', 'CA Retail Chain', 'CA Retail - LA Downtown', 'Maintenance', 'Annual inspection and testing required', NULL, '34.0928,-118.3287'),
('DEMO-CA-002', 'Access Control Panel Repair', 'Scheduled', 'High', 'CA Tech Campus', 'CA Tech - Main Campus', 'Repair', 'Door 3A not responding to access cards', 'Mike Chen (CA)', '37.3382,-121.8863'),
('DEMO-CA-003', 'Security Camera Installation', 'In-Progress', 'Normal', 'CA Retail Chain', 'CA Retail - LA Downtown', 'Installation', 'Install 4 new cameras in parking lot', 'Mike Chen (CA)', '34.0928,-118.3287'),

-- Texas Tickets
('DEMO-TX-001', 'Burglar Alarm Battery Replacement', 'Complete', 'Normal', 'TX Oil & Gas HQ', 'TX Oil & Gas - Tower A', 'Maintenance', 'Replace backup batteries in control panel', 'Jose Rodriguez (TX)', '29.7604,-95.3698'),
('DEMO-TX-002', 'Fire Suppression System Inspection', 'Scheduled', 'High', 'TX Shopping Mall', 'TX Mall - Main', 'Inspection', 'Quarterly inspection required', 'Jose Rodriguez (TX)', '32.7767,-96.7970'),
('DEMO-TX-003', 'Panic Button Installation', 'New', 'Critical', 'TX Shopping Mall', 'TX Mall - Main', 'Installation', 'Install panic buttons at all exits', NULL, '32.7767,-96.7970'),

-- New York Tickets
('DEMO-NY-001', 'Access Control System Upgrade', 'In-Progress', 'High', 'NY Financial Tower', 'NY Tower - Main', 'Upgrade', 'Upgrade to latest firmware version', 'David Cohen (NY)', '40.7074,-74.0113'),
('DEMO-NY-002', 'Security Audit', 'Scheduled', 'Normal', 'NY Hotel Group', 'NY Hotel - Broadway', 'Inspection', 'Annual security system audit', 'David Cohen (NY)', '40.7209,-73.9987'),
('DEMO-NY-003', 'Fire Alarm False Trigger', 'Complete', 'High', 'NY Financial Tower', 'NY Tower - Main', 'Repair', 'Investigate and fix false alarms', 'David Cohen (NY)', '40.7074,-74.0113'),

-- Florida Tickets
('DEMO-FL-001', 'Pool Area Security Cameras', 'New', 'Normal', 'FL Resort Hotels', 'FL Resort - Main', 'Installation', 'Install cameras around pool area', NULL, '25.7817,-80.1300'),
('DEMO-FL-002', 'Fire Alarm Panel Upgrade', 'Scheduled', 'High', 'FL Theme Parks', 'FL Parks - Main', 'Upgrade', 'Upgrade to addressable system', 'Maria Garcia (FL)', '28.3772,-81.5707'),
('DEMO-FL-003', 'Emergency Lighting Test', 'Complete', 'Normal', 'FL Resort Hotels', 'FL Resort - Main', 'Inspection', 'Monthly emergency light test', 'Maria Garcia (FL)', '25.7817,-80.1300'),

-- Illinois Tickets
('DEMO-IL-001', 'Industrial Alarm System', 'In-Progress', 'Critical', 'IL Manufacturing', 'IL Plant - Main', 'Installation', 'Install comprehensive alarm system', 'John Smith (IL)', '41.8781,-87.6298'),
('DEMO-IL-002', 'Access Control Expansion', 'Scheduled', 'Normal', 'IL Manufacturing', 'IL Plant - Main', 'Installation', 'Add access control to warehouse doors', 'John Smith (IL)', '41.8781,-87.6298'),

-- Washington Tickets
('DEMO-WA-001', 'Smart Lock Installation', 'New', 'Normal', 'WA Tech Hub', 'WA Hub - Main', 'Installation', 'Install smart locks on conference rooms', NULL, '47.6062,-122.3321'),
('DEMO-WA-002', 'Security System Integration', 'Scheduled', 'High', 'WA Tech Hub', 'WA Hub - Main', 'Upgrade', 'Integrate with building management system', 'Emily Zhang (WA)', '47.6062,-122.3321');
GO

-- ================================================================
-- DEMO AUDIT TRAIL (for completed tickets)
-- ================================================================

INSERT INTO AuditTrail (TicketID, AuditID, Timestamp, UserName, Action, Notes) VALUES
('DEMO-TX-001', 'audit-tx-001-01', '2025-10-15 09:00:00', 'Jose Rodriguez (TX)', 'Ticket Created', 'Battery replacement scheduled'),
('DEMO-TX-001', 'audit-tx-001-02', '2025-10-15 14:30:00', 'Jose Rodriguez (TX)', 'Status changed to In-Progress', 'Started work on site'),
('DEMO-TX-001', 'audit-tx-001-03', '2025-10-15 16:45:00', 'Jose Rodriguez (TX)', 'Status changed to Complete', 'All batteries replaced and tested'),

('DEMO-NY-003', 'audit-ny-003-01', '2025-10-12 11:00:00', 'David Cohen (NY)', 'Ticket Created', 'Customer reported false alarms'),
('DEMO-NY-003', 'audit-ny-003-02', '2025-10-12 13:00:00', 'David Cohen (NY)', 'Status changed to In-Progress', 'Investigating cause'),
('DEMO-NY-003', 'audit-ny-003-03', '2025-10-12 15:30:00', 'David Cohen (NY)', 'Status changed to Complete', 'Found and fixed faulty sensor'),

('DEMO-FL-003', 'audit-fl-003-01', '2025-10-18 10:00:00', 'Maria Garcia (FL)', 'Ticket Created', 'Monthly test scheduled'),
('DEMO-FL-003', 'audit-fl-003-02', '2025-10-18 11:00:00', 'Maria Garcia (FL)', 'Status changed to Complete', 'All lights tested and working');
GO

-- ================================================================
-- DEMO COORDINATOR NOTES
-- ================================================================

INSERT INTO CoordinatorNotes (TicketID, Note, CreatedBy) VALUES
('DEMO-CA-002', 'Customer requests work done after hours', 'demo-coordinator'),
('DEMO-TX-003', 'High priority - management approval obtained', 'demo-coordinator'),
('DEMO-NY-001', 'May require vendor assistance for firmware', 'demo-coordinator'),
('DEMO-IL-001', 'Large project - weekly status updates required', 'demo-coordinator');
GO

PRINT '✅ Demo data loaded successfully!';
PRINT '   - 8 Users created';
PRINT '   - 10 Customers created';
PRINT '   - 10 Sites created';
PRINT '   - 16 Tickets created';
PRINT '   - Activity logs and notes added';
PRINT '';
PRINT 'Login credentials:';
PRINT '   Username: demo-admin, Password: demo123';
PRINT '   Username: demo-coordinator, Password: demo123';
PRINT '   Username: demo-tech-ca, Password: demo123';
GO
