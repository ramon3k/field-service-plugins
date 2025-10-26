-- Populate Demo Database with Realistic Sample Data
-- This creates a complete demo environment for showcasing features

USE FieldServiceDB_Demo;
GO

-- Clear existing data
DELETE FROM Notes;
DELETE FROM ActivityLog;
DELETE FROM Tickets;
DELETE FROM Licenses;
DELETE FROM Sites;
DELETE FROM Customers;
DELETE FROM Users;
GO

-- Insert Demo Users (all with password: demo123)
-- Password is base64 encoded: ZGVtbzEyMw==
INSERT INTO Users (Username, PasswordHash, FullName, Email, PhoneNumber, Role, Vendor, IsActive, LastLogin) VALUES
('admin', 'ZGVtbzEyMw==', 'Demo Admin', 'admin@democorp.com', '555-0100', 'Admin', NULL, 1, DATEADD(MINUTE, -15, GETDATE())),
('coordinator', 'ZGVtbzEyMw==', 'Sarah Johnson', 'sarah@democorp.com', '555-0101', 'Coordinator', NULL, 1, DATEADD(HOUR, -2, GETDATE())),
('tech1', 'ZGVtbzEyMw==', 'Mike Smith', 'mike@democorp.com', '555-0102', 'Technician', 'ACME Services', 1, DATEADD(HOUR, -1, GETDATE())),
('tech2', 'ZGVtbzEyMw==', 'Jennifer Lee', 'jennifer@democorp.com', '555-0103', 'Technician', 'TechPro Inc', 1, DATEADD(HOUR, -3, GETDATE())),
('tech3', 'ZGVtbzEyMw==', 'Robert Garcia', 'robert@democorp.com', '555-0104', 'Technician', 'ACME Services', 1, DATEADD(HOUR, -5, GETDATE())),
('tech4', 'ZGVtbzEyMw==', 'Emily Chen', 'emily@democorp.com', '555-0105', 'Technician', 'TechPro Inc', 1, DATEADD(DAY, -1, GETDATE())),
('tech5', 'ZGVtbzEyMw==', 'David Martinez', 'david@democorp.com', '555-0106', 'Technician', 'SecureTech LLC', 1, DATEADD(DAY, -1, GETDATE())),
('vendor1', 'ZGVtbzEyMw==', 'John Wilson (ACME)', 'john@acmeservices.com', '555-0200', 'Vendor', 'ACME Services', 1, DATEADD(HOUR, -6, GETDATE())),
('vendor2', 'ZGVtbzEyMw==', 'Lisa Brown (TechPro)', 'lisa@techpro.com', '555-0201', 'Vendor', 'TechPro Inc', 1, DATEADD(DAY, -2, GETDATE()));

-- Insert Demo Customers (nationwide spread)
INSERT INTO Customers (CustomerID, Name, ContactName, Email, Phone, Address, City, State, ZipCode, Status, Notes) VALUES
('CUST-001', 'Sunshine Retail Chain', 'Tom Anderson', 'tom@sunshineretail.com', '555-1001', '123 Main Street', 'Los Angeles', 'CA', '90001', 'Active', 'VIP customer - 24 locations'),
('CUST-002', 'Metro Office Complex', 'Maria Rodriguez', 'maria@metrooffice.com', '555-1002', '456 Broadway Ave', 'New York', 'NY', '10001', 'Active', 'High-rise with advanced security'),
('CUST-003', 'Mountain View Hospital', 'Dr. James Peterson', 'jpeterson@mvhospital.org', '555-1003', '789 Health Drive', 'Denver', 'CO', '80201', 'Active', 'Healthcare facility - strict protocols'),
('CUST-004', 'TechStart Hub', 'Rachel Kim', 'rachel@techstart.io', '555-1004', '321 Innovation Blvd', 'Austin', 'TX', '78701', 'Active', 'Tech incubator with 50+ startups'),
('CUST-005', 'Coastal Manufacturing', 'Bob Thompson', 'bob@coastalmfg.com', '555-1005', '654 Industrial Way', 'Seattle', 'WA', '98101', 'Active', 'Large warehouse facility'),
('CUST-006', 'Downtown Hotel Group', 'Amanda White', 'amanda@downtownhotels.com', '555-1006', '987 Hospitality Lane', 'Chicago', 'IL', '60601', 'Active', '5-star hotel chain'),
('CUST-007', 'Green Valley Schools', 'Principal Susan Davis', 'sdavis@gvschools.edu', '555-1007', '147 Education Road', 'Atlanta', 'GA', '30301', 'Active', 'School district - 8 campuses'),
('CUST-008', 'Premier Shopping Mall', 'Kevin Martinez', 'kevin@premiermall.com', '555-1008', '258 Commerce Center', 'Miami', 'FL', '33101', 'Active', 'Large retail complex');

-- Insert Demo Sites (multiple per customer)
INSERT INTO Sites (SiteID, CustomerID, Name, Address, City, State, ZipCode, ContactName, ContactPhone, ContactEmail) VALUES
-- Sunshine Retail locations
('SITE-001', 'CUST-001', 'Sunshine LA Downtown', '123 Main Street', 'Los Angeles', 'CA', '90001', 'Store Manager', '555-1101', 'downtown@sunshineretail.com'),
('SITE-002', 'CUST-001', 'Sunshine Pasadena', '456 Colorado Blvd', 'Pasadena', 'CA', '91101', 'Store Manager', '555-1102', 'pasadena@sunshineretail.com'),
('SITE-003', 'CUST-001', 'Sunshine Santa Monica', '789 Ocean Ave', 'Santa Monica', 'CA', '90401', 'Store Manager', '555-1103', 'santamonica@sunshineretail.com'),

-- Metro Office buildings
('SITE-004', 'CUST-002', 'Metro Tower A', '456 Broadway Ave Tower A', 'New York', 'NY', '10001', 'Building Manager', '555-1201', 'towera@metrooffice.com'),
('SITE-005', 'CUST-002', 'Metro Tower B', '456 Broadway Ave Tower B', 'New York', 'NY', '10001', 'Building Manager', '555-1202', 'towerb@metrooffice.com'),

-- Hospital campuses
('SITE-006', 'CUST-003', 'Main Hospital Campus', '789 Health Drive', 'Denver', 'CO', '80201', 'Facilities Manager', '555-1301', 'facilities@mvhospital.org'),
('SITE-007', 'CUST-003', 'Emergency Care Center', '790 Health Drive', 'Denver', 'CO', '80201', 'ER Supervisor', '555-1302', 'emergency@mvhospital.org'),

-- TechStart locations
('SITE-008', 'CUST-004', 'TechStart Main Building', '321 Innovation Blvd', 'Austin', 'TX', '78701', 'Facility Coordinator', '555-1401', 'facilities@techstart.io'),

-- Coastal Manufacturing
('SITE-009', 'CUST-005', 'Warehouse North', '654 Industrial Way North', 'Seattle', 'WA', '98101', 'Operations Manager', '555-1501', 'north@coastalmfg.com'),
('SITE-010', 'CUST-005', 'Warehouse South', '655 Industrial Way South', 'Seattle', 'WA', '98101', 'Operations Manager', '555-1502', 'south@coastalmfg.com'),

-- Hotels
('SITE-011', 'CUST-006', 'Downtown Hotel Chicago', '987 Hospitality Lane', 'Chicago', 'IL', '60601', 'General Manager', '555-1601', 'chicago@downtownhotels.com'),

-- Schools
('SITE-012', 'CUST-007', 'Green Valley Elementary', '147 Education Road', 'Atlanta', 'GA', '30301', 'Principal', '555-1701', 'elementary@gvschools.edu'),
('SITE-013', 'CUST-007', 'Green Valley High School', '148 Education Road', 'Atlanta', 'GA', '30301', 'Principal', '555-1702', 'highschool@gvschools.edu'),

-- Shopping Mall
('SITE-014', 'CUST-008', 'Premier Mall Main Entrance', '258 Commerce Center', 'Miami', 'FL', '33101', 'Security Director', '555-1801', 'security@premiermall.com');

-- Insert Demo Licenses (various types, some expiring soon)
INSERT INTO Licenses (LicenseID, CustomerID, SiteID, LicenseType, LicenseNumber, IssuingAuthority, IssueDate, ExpirationDate, Status) VALUES
('LIC-001', 'CUST-001', 'SITE-001', 'Fire Alarm', 'FA-2024-1001', 'CA State Fire Marshal', '2024-01-15', '2025-01-15', 'Active'),
('LIC-002', 'CUST-001', 'SITE-002', 'Fire Alarm', 'FA-2024-1002', 'CA State Fire Marshal', '2024-02-20', '2025-02-20', 'Active'),
('LIC-003', 'CUST-002', 'SITE-004', 'Security System', 'SEC-2024-2001', 'NY Security Licensing Board', '2024-03-10', '2025-03-10', 'Active'),
('LIC-004', 'CUST-002', 'SITE-005', 'Security System', 'SEC-2024-2002', 'NY Security Licensing Board', '2024-03-10', '2025-03-10', 'Active'),
('LIC-005', 'CUST-003', 'SITE-006', 'Fire Suppression', 'FS-2024-3001', 'CO Fire Prevention Division', '2023-12-01', '2024-12-01', 'Expired'),
('LIC-006', 'CUST-003', 'SITE-007', 'Fire Alarm', 'FA-2024-3002', 'CO Fire Prevention Division', '2024-06-15', '2025-06-15', 'Active'),
('LIC-007', 'CUST-004', 'SITE-008', 'Access Control', 'AC-2024-4001', 'TX Dept of Public Safety', '2024-01-20', '2025-11-15', 'Expiring Soon'),
('LIC-008', 'CUST-005', 'SITE-009', 'Fire Alarm', 'FA-2024-5001', 'WA State Fire Marshal', '2024-04-10', '2025-04-10', 'Active'),
('LIC-009', 'CUST-006', 'SITE-011', 'Fire Suppression', 'FS-2024-6001', 'IL Fire Safety Board', '2024-05-20', '2025-05-20', 'Active'),
('LIC-010', 'CUST-007', 'SITE-012', 'Fire Alarm', 'FA-2024-7001', 'GA Safety Commission', '2024-08-15', '2025-08-15', 'Active');

-- Insert Demo Tickets (variety of statuses, priorities, dates)
DECLARE @Now DATETIME2 = GETDATE();

INSERT INTO Tickets (TicketID, Title, Description, Customer, Site, LicenseIDs, Priority, Status, AssignedTo, Owner, Category, ScheduledStart, ScheduledEnd, SLA_Due, Tags, Resolution, CreatedAt, UpdatedAt) VALUES
-- New tickets (just came in)
('TKT-2025-10-001', 'Fire alarm panel displaying error code', 'Customer reports Error Code E-402 on main panel. System still functioning but needs inspection.', 'Sunshine Retail Chain', 'Sunshine LA Downtown', 'LIC-001', 'High', 'New', NULL, 'Sarah Johnson', 'Fire Safety', NULL, NULL, DATEADD(HOUR, 4, @Now), 'urgent,fire-alarm', NULL, DATEADD(HOUR, -2, @Now), DATEADD(HOUR, -2, @Now)),

('TKT-2025-10-002', 'Annual inspection due', 'Annual fire alarm inspection required per licensing requirements.', 'Metro Office Complex', 'Metro Tower A', 'LIC-003', 'Normal', 'New', NULL, 'Sarah Johnson', 'Inspection', NULL, NULL, DATEADD(DAY, 30, @Now), 'inspection,scheduled', NULL, DATEADD(DAY, -1, @Now), DATEADD(DAY, -1, @Now)),

('TKT-2025-10-003', 'Door access card reader not working', 'North entrance card reader intermittently failing. Employees unable to enter.', 'TechStart Hub', 'TechStart Main Building', 'LIC-007', 'Critical', 'New', NULL, 'Sarah Johnson', 'Access Control', NULL, NULL, DATEADD(HOUR, 2, @Now), 'urgent,access-control', NULL, DATEADD(MINUTE, -30, @Now), DATEADD(MINUTE, -30, @Now)),

-- Scheduled tickets
('TKT-2025-10-004', 'Quarterly maintenance - Fire suppression', 'Scheduled quarterly maintenance for fire suppression system.', 'Downtown Hotel Group', 'Downtown Hotel Chicago', 'LIC-009', 'Normal', 'Scheduled', 'Mike Smith', 'Sarah Johnson', 'Maintenance', DATEADD(DAY, 2, @Now), DATEADD(DAY, 2, DATEADD(HOUR, 3, @Now)), DATEADD(DAY, 2, @Now), 'maintenance,scheduled', NULL, DATEADD(DAY, -5, @Now), DATEADD(DAY, -3, @Now)),

('TKT-2025-10-005', 'Install new security cameras', 'Install 4 new security cameras in parking area as per contract upgrade.', 'Coastal Manufacturing', 'Warehouse North', NULL, 'Normal', 'Scheduled', 'Jennifer Lee', 'Sarah Johnson', 'Installation', DATEADD(DAY, 1, @Now), DATEADD(DAY, 1, DATEADD(HOUR, 4, @Now)), DATEADD(DAY, 3, @Now), 'installation,cameras', NULL, DATEADD(DAY, -7, @Now), DATEADD(DAY, -2, @Now)),

-- In-Progress tickets
('TKT-2025-10-006', 'Replace faulty smoke detectors', 'Replace 3 smoke detectors in hallways that failed self-test.', 'Green Valley Schools', 'Green Valley Elementary', 'LIC-010', 'High', 'In-Progress', 'Robert Garcia', 'Sarah Johnson', 'Fire Safety', DATEADD(HOUR, -2, @Now), DATEADD(HOUR, 2, @Now), DATEADD(DAY, 1, @Now), 'in-progress,fire-alarm', NULL, DATEADD(DAY, -2, @Now), DATEADD(HOUR, -3, @Now)),

('TKT-2025-10-007', 'Emergency exit door alarm malfunctioning', 'Exit door alarm sounds randomly. Investigating possible wiring issue.', 'Premier Shopping Mall', 'Premier Mall Main Entrance', NULL, 'High', 'In-Progress', 'Mike Smith', 'Sarah Johnson', 'Fire Safety', DATEADD(HOUR, -1, @Now), DATEADD(HOUR, 3, @Now), DATEADD(HOUR, 6, @Now), 'in-progress,urgent', NULL, DATEADD(HOUR, -4, @Now), DATEADD(HOUR, -1, @Now)),

-- On-Hold tickets
('TKT-2025-10-008', 'Upgrade access control system', 'Awaiting customer approval for upgraded access control panels.', 'Sunshine Retail Chain', 'Sunshine Pasadena', NULL, 'Low', 'On-Hold', 'Emily Chen', 'Sarah Johnson', 'Access Control', NULL, NULL, DATEADD(DAY, 14, @Now), 'on-hold,waiting-approval', NULL, DATEADD(DAY, -10, @Now), DATEADD(DAY, -3, @Now)),

('TKT-2025-10-009', 'Replace control panel - parts on order', 'Control panel replacement. Waiting for parts to arrive (ETA 3 days).', 'Mountain View Hospital', 'Emergency Care Center', 'LIC-006', 'High', 'On-Hold', 'David Martinez', 'Sarah Johnson', 'Fire Safety', NULL, NULL, DATEADD(DAY, 5, @Now), 'on-hold,parts-ordered', NULL, DATEADD(DAY, -8, @Now), DATEADD(DAY, -1, @Now)),

-- Complete tickets
('TKT-2025-10-010', 'Battery replacement in alarm panel', 'Replaced backup battery in fire alarm control panel. System tested successfully.', 'Metro Office Complex', 'Metro Tower B', 'LIC-004', 'Normal', 'Complete', 'Jennifer Lee', 'Sarah Johnson', 'Maintenance', DATEADD(DAY, -2, @Now), DATEADD(DAY, -2, DATEADD(HOUR, 2, @Now)), DATEADD(DAY, -1, @Now), 'complete,maintenance', 'Battery replaced. System tested and verified operational. No further issues found.', DATEADD(DAY, -3, @Now), DATEADD(DAY, -2, @Now)),

('TKT-2025-10-011', 'Install surveillance system', 'Installed 8 camera surveillance system in warehouse facility.', 'Coastal Manufacturing', 'Warehouse South', NULL, 'Normal', 'Complete', 'Mike Smith', 'Sarah Johnson', 'Installation', DATEADD(DAY, -5, @Now), DATEADD(DAY, -5, DATEADD(HOUR, 6, @Now)), DATEADD(DAY, -3, @Now), 'complete,installation', 'Installation complete. Customer trained on system operation. Documentation provided.', DATEADD(DAY, -10, @Now), DATEADD(DAY, -5, @Now)),

('TKT-2025-10-012', 'Quarterly inspection', 'Completed quarterly fire alarm inspection. All systems operational.', 'Sunshine Retail Chain', 'Sunshine Santa Monica', 'LIC-003', 'Normal', 'Complete', 'Robert Garcia', 'Sarah Johnson', 'Inspection', DATEADD(DAY, -7, @Now), DATEADD(DAY, -7, DATEADD(HOUR, 3, @Now)), DATEADD(DAY, -6, @Now), 'complete,inspection', 'All 24 zones tested. Two detectors cleaned. System operational. Next inspection due in 90 days.', DATEADD(DAY, -14, @Now), DATEADD(DAY, -7, @Now)),

-- Overdue ticket (past SLA)
('TKT-2025-10-013', 'Security camera offline', 'Camera #7 in loading dock area not recording. May be power or network issue.', 'TechStart Hub', 'TechStart Main Building', NULL, 'High', 'New', NULL, 'Sarah Johnson', 'Video Management', NULL, NULL, DATEADD(DAY, -2, @Now), 'overdue,urgent', NULL, DATEADD(DAY, -3, @Now), DATEADD(DAY, -3, @Now)),

-- Critical ticket with tight SLA
('TKT-2025-10-014', 'Fire alarm system offline - URGENT', 'Main fire alarm panel completely offline. Building occupants at risk. IMMEDIATE RESPONSE REQUIRED.', 'Green Valley Schools', 'Green Valley High School', NULL, 'Critical', 'New', NULL, 'Sarah Johnson', 'Fire Safety', NULL, NULL, DATEADD(HOUR, 1, @Now), 'critical,emergency,fire-alarm', NULL, DATEADD(MINUTE, -15, @Now), DATEADD(MINUTE, -15, @Now)),

-- More variety
('TKT-2025-10-015', 'License renewal required', 'Fire alarm license expiring in 30 days. Need to schedule inspection.', 'Mountain View Hospital', 'Main Hospital Campus', 'LIC-005', 'High', 'Scheduled', 'Emily Chen', 'Sarah Johnson', 'Inspection', DATEADD(DAY, 5, @Now), DATEADD(DAY, 5, DATEADD(HOUR, 3, @Now)), DATEADD(DAY, 7, @Now), 'inspection,license-renewal', NULL, DATEADD(DAY, -15, @Now), DATEADD(DAY, -5, @Now));

-- Insert Notes for some tickets
INSERT INTO Notes (TicketID, NoteText, CreatedBy, CreatedAt) VALUES
('TKT-2025-10-006', 'Arrived on site. Customer showing me to the hallway locations. Three detectors confirmed faulty in self-test.', 'Robert Garcia', DATEADD(HOUR, -2, @Now)),
('TKT-2025-10-006', 'Detectors replaced. Running system test now. Should be complete in 20 minutes.', 'Robert Garcia', DATEADD(HOUR, -1, @Now)),

('TKT-2025-10-007', 'Checked wiring at door frame. Found loose connection at alarm contact. Tightening now.', 'Mike Smith', DATEADD(HOUR, -30, @Now)),
('TKT-2025-10-007', 'Connection secured but alarm still intermittent. May need to replace the contact switch. Will check inventory.', 'Mike Smith', DATEADD(MINUTE, -45, @Now)),

('TKT-2025-10-010', 'Battery tested at 8.2V - below spec of 12V. Replacement needed.', 'Jennifer Lee', DATEADD(DAY, -2, @Now)),
('TKT-2025-10-010', 'New battery installed. System reading 13.8V. Running full panel test.', 'Jennifer Lee', DATEADD(DAY, -2, DATEADD(HOUR, 1, @Now))),
('TKT-2025-10-010', 'All zones tested successfully. Panel shows all green. Job complete.', 'Jennifer Lee', DATEADD(DAY, -2, DATEADD(HOUR, 2, @Now))),

('TKT-2025-10-011', 'Cameras installed. Running cabling to NVR. Customer wants to review camera angles.', 'Mike Smith', DATEADD(DAY, -5, @Now)),
('TKT-2025-10-011', 'Customer approved all angles. Configuring recording schedules per their requirements.', 'Mike Smith', DATEADD(DAY, -5, DATEADD(HOUR, 3, @Now))),

('TKT-2025-10-008', 'Sent quote to customer for upgraded system. Awaiting response.', 'Emily Chen', DATEADD(DAY, -5, @Now)),
('TKT-2025-10-008', 'Customer requested additional options. Preparing revised quote.', 'Sarah Johnson', DATEADD(DAY, -3, @Now)),

('TKT-2025-10-009', 'Confirmed panel is faulty. Ordered replacement part #CP-3000-BLU. ETA 3 business days.', 'David Martinez', DATEADD(DAY, -2, @Now)),

('TKT-2025-10-013', 'Attempted to reach site contact. Left voicemail. Will try again tomorrow.', 'Sarah Johnson', DATEADD(DAY, -2, @Now));

-- Insert Activity Log entries (recent activities)
INSERT INTO ActivityLog (ID, UserID, Username, Action, Details, Timestamp, IPAddress, UserAgent) VALUES
(NEWID(), 1, 'admin', 'Login', 'User logged in: Demo Admin (Admin)', DATEADD(MINUTE, -15, @Now), '192.168.1.100', 'Mozilla/5.0 Demo Browser'),
(NEWID(), 2, 'coordinator', 'Login', 'User logged in: Sarah Johnson (Coordinator)', DATEADD(HOUR, -2, @Now), '192.168.1.101', 'Mozilla/5.0 Demo Browser'),
(NEWID(), 3, 'tech1', 'Login', 'User logged in: Mike Smith (Technician)', DATEADD(HOUR, -1, @Now), '10.0.0.50', 'Mozilla/5.0 Mobile Demo'),

(NEWID(), 2, 'coordinator', 'Ticket Created', 'Created ticket TKT-2025-10-001: Fire alarm panel displaying error code', DATEADD(HOUR, -2, @Now), '192.168.1.101', NULL),
(NEWID(), 2, 'coordinator', 'Ticket Created', 'Created ticket TKT-2025-10-003: Door access card reader not working', DATEADD(MINUTE, -30, @Now), '192.168.1.101', NULL),
(NEWID(), 2, 'coordinator', 'Ticket Created', 'Created ticket TKT-2025-10-014: Fire alarm system offline - URGENT', DATEADD(MINUTE, -15, @Now), '192.168.1.101', NULL),

(NEWID(), 2, 'coordinator', 'Ticket Updated', 'Updated ticket TKT-2025-10-006: Status changed from Scheduled to In-Progress', DATEADD(HOUR, -3, @Now), '192.168.1.101', NULL),
(NEWID(), 4, 'tech2', 'Ticket Updated', 'Updated ticket TKT-2025-10-010: Status changed from In-Progress to Complete', DATEADD(DAY, -2, @Now), '10.0.0.51', NULL),

(NEWID(), 3, 'tech1', 'Site Created', 'Created site: Premier Mall Main Entrance (Customer: Premier Shopping Mall)', DATEADD(DAY, -7, @Now), '10.0.0.50', NULL),
(NEWID(), 2, 'coordinator', 'Customer Created', 'Created customer: Premier Shopping Mall (CUST-008)', DATEADD(DAY, -8, @Now), '192.168.1.101', NULL),

(NEWID(), 5, 'tech3', 'Service Request Dismissed', 'Dismissed service request: Routine inspection (Priority: Low)', DATEADD(HOUR, -4, @Now), '10.0.0.52', NULL);

PRINT '✅ Demo database populated with sample data';
PRINT '📊 Summary:';
PRINT '   - Users: 9 (admin, coordinator, 5 techs, 2 vendors)';
PRINT '   - Customers: 8 across different states';
PRINT '   - Sites: 14 locations';
PRINT '   - Licenses: 10 (including expired and expiring)';
PRINT '   - Tickets: 15 in various states';
PRINT '   - Notes: Multiple tech notes on tickets';
PRINT '   - Activity Log: Recent activities';
PRINT '';
PRINT '🔐 Demo Login Credentials:';
PRINT '   Username: demo (any role) | Password: demo123';
PRINT '   Or use: admin, coordinator, tech1, tech2, etc.';
GO
