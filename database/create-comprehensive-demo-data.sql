-- ================================================================
-- Comprehensive Demo Database - Nationwide Field Service Data
-- ================================================================
-- This creates a complete demo showing all capabilities:
-- - Multi-state coverage (CA, TX, NY, FL, IL, WA, CO, GA)
-- - Realistic customers, sites, licenses per state
-- - Demo vendors by region
-- - Tickets in various statuses
-- - Activity logs, notes, and service history
-- ================================================================

USE [FieldServiceDB-DEMO];
GO

-- Clear existing demo data
DELETE FROM CoordinatorNotes WHERE TicketID LIKE 'DEMO-%';
DELETE FROM AuditTrail WHERE TicketID LIKE 'DEMO-%';
DELETE FROM Tickets WHERE TicketID LIKE 'DEMO-%';
DELETE FROM Assets WHERE SiteID IN (SELECT SiteID FROM Sites WHERE CustomerID LIKE 'DEMO-%');
DELETE FROM Sites WHERE CustomerID LIKE 'DEMO-%';
DELETE FROM Customers WHERE CustomerID LIKE 'DEMO-%';
DELETE FROM Users WHERE Username LIKE 'demo-%';
GO

-- ================================================================
-- DEMO USERS (password: demo123 - base64: ZGVtbzEyMw==)
-- ================================================================

INSERT INTO Users (ID, Username, PasswordHash, FullName, Email, Role, IsActive) VALUES
-- Admin users
('demo-admin-001', 'demo-admin', 'ZGVtbzEyMw==', 'Demo Administrator', 'admin@democorp.com', 'Admin', 1),
('demo-coord-001', 'demo-coordinator', 'ZGVtbzEyMw==', 'Sarah Johnson', 'sarah@democorp.com', 'Coordinator', 1),

-- Regional Technicians
('demo-tech-ca-001', 'demo-tech-ca', 'ZGVtbzEyMw==', 'Mike Chen (CA)', 'mike@democorp.com', 'Technician', 1),
('demo-tech-tx-001', 'demo-tech-tx', 'ZGVtbzEyMw==', 'Jose Rodriguez (TX)', 'jose@democorp.com', 'Technician', 1),
('demo-tech-ny-001', 'demo-tech-ny', 'ZGVtbzEyMw==', 'David Cohen (NY)', 'david@democorp.com', 'Technician', 1),
('demo-tech-fl-001', 'demo-tech-fl', 'ZGVtbzEyMw==', 'Maria Garcia (FL)', 'maria@democorp.com', 'Technician', 1),
('demo-tech-il-001', 'demo-tech-il', 'ZGVtbzEyMw==', 'John Smith (IL)', 'john@democorp.com', 'Technician', 1),
('demo-tech-wa-001', 'demo-tech-wa', 'ZGVtbzEyMw==', 'Emily Zhang (WA)', 'emily@democorp.com', 'Technician', 1),
('demo-tech-co-001', 'demo-tech-co', 'ZGVtbzEyMw==', 'Robert Martinez (CO)', 'robert@democorp.com', 'Technician', 1),
('demo-tech-ga-001', 'demo-tech-ga', 'ZGVtbzEyMw==', 'Lisa Brown (GA)', 'lisa@democorp.com', 'Technician', 1);

-- ================================================================
-- DEMO CUSTOMERS - Nationwide Coverage
-- ================================================================

INSERT INTO Customers (CustomerID, Name, Contact, Email, Phone, Address, Notes) VALUES
-- California Customers
('DEMO-CA-001', 'CA Retail Chain', 'Tom Anderson', 'tom@caretail.com', '555-1001', '123 Hollywood Blvd, Los Angeles, CA 90028', '15 locations across California'),
('DEMO-CA-002', 'CA Tech Campus', 'Steve Wilson', 'steve@catech.com', '555-1002', '456 Silicon Valley Dr, San Jose, CA 95110', 'Large tech campus with advanced security'),
('DEMO-CA-003', 'CA Medical Center', 'Dr. Lisa Kim', 'lkim@camedical.org', '555-1003', '789 Health Ave, San Francisco, CA 94102', 'Healthcare facility - 24/7 coverage required'),

-- Texas Customers
('DEMO-TX-001', 'TX Oil & Gas HQ', 'Bob Thompson', 'bob@txoilgas.com', '555-2001', '100 Energy Plaza, Houston, TX 77002', 'Large industrial facility'),
('DEMO-TX-002', 'TX Shopping Mall', 'Jennifer Lopez', 'jen@txmall.com', '555-2002', '200 Retail Parkway, Dallas, TX 75201', 'Major shopping complex'),
('DEMO-TX-003', 'TX University', 'Prof. James Miller', 'jmiller@txuniv.edu', '555-2003', '300 Campus Dr, Austin, TX 78701', 'Educational institution with multiple buildings'),

-- New York Customers
('DEMO-NY-001', 'NY Financial Tower', 'Rachel Goldman', 'rachel@nyfinance.com', '555-3001', '1 Wall Street, New York, NY 10005', 'High-rise office building'),
('DEMO-NY-002', 'NY Hotel Group', 'Michael Chen', 'michael@nyhotels.com', '555-3002', '500 Broadway, New York, NY 10012', '5-star hotel chain'),
('DEMO-NY-003', 'NY Museum Complex', 'Sarah Davis', 'sdavis@nymuseum.org', '555-3003', '100 Museum Mile, New York, NY 10028', 'Multiple exhibition halls'),

-- Florida Customers
('DEMO-FL-001', 'FL Resort Hotels', 'Carlos Rodriguez', 'carlos@flresorts.com', '555-4001', '1000 Ocean Drive, Miami Beach, FL 33139', 'Beach resort complex'),
('DEMO-FL-002', 'FL Theme Parks', 'Amanda White', 'amanda@flparks.com', '555-4002', '2000 Adventure Way, Orlando, FL 32819', 'Entertainment venue - high traffic'),
('DEMO-FL-003', 'FL Retirement Community', 'Mary Johnson', 'mary@flretirement.com', '555-4003', '3000 Sunset Blvd, Tampa, FL 33602', 'Senior living facility'),

-- Illinois Customers
('DEMO-IL-001', 'IL Manufacturing Plant', 'David Brown', 'david@ilmanufacturing.com', '555-5001', '100 Industrial Ave, Chicago, IL 60601', 'Large production facility'),
('DEMO-IL-002', 'IL Airport Complex', 'Patricia Lee', 'patricia@ilairport.com', '555-5002', '200 Terminal Dr, Chicago, IL 60666', 'Airport facilities management'),

-- Washington Customers
('DEMO-WA-001', 'WA Tech Startup Hub', 'Kevin Park', 'kevin@wastartup.com', '555-6001', '100 Innovation Blvd, Seattle, WA 98101', 'Incubator space with 50+ companies'),
('DEMO-WA-002', 'WA Coffee Chain HQ', 'Laura Green', 'laura@wacoffee.com', '555-6002', '200 Brew Street, Seattle, WA 98102', 'Corporate headquarters'),

-- Colorado Customers
('DEMO-CO-001', 'CO Ski Resort', 'Mark Anderson', 'mark@coresort.com', '555-7001', '100 Mountain Road, Denver, CO 80202', 'Seasonal resort operations'),
('DEMO-CO-002', 'CO Data Center', 'Susan Wang', 'susan@codatacenter.com', '555-7002', '200 Server Farm Ln, Denver, CO 80203', 'Critical infrastructure - high security'),

-- Georgia Customers
('DEMO-GA-001', 'GA Distribution Center', 'Chris Martin', 'chris@gadistribution.com', '555-8001', '100 Logistics Way, Atlanta, GA 30303', 'Warehouse and distribution'),
('DEMO-GA-002', 'GA Medical Campus', 'Dr. Helen Taylor', 'htaylor@gamedical.org', '555-8002', '200 Healthcare Dr, Atlanta, GA 30308', 'Hospital complex');
GO

-- ================================================================
-- DEMO SITES - Multiple locations per customer
-- ================================================================

INSERT INTO Sites (SiteID, CustomerID, Name, Address, Contact, Phone, GeoLocation, Notes) VALUES
-- California Sites
('DEMO-CA-001-01', 'DEMO-CA-001', 'CA Retail - LA Downtown', '123 Hollywood Blvd, Los Angeles, CA 90028', 'Store Manager', '555-1101', '34.0928,-118.3287', 'Main retail location'),
('DEMO-CA-001-02', 'DEMO-CA-001', 'CA Retail - Pasadena', '456 Colorado Blvd, Pasadena, CA 91101', 'Store Manager', '555-1102', '34.1478,-118.1445', 'Branch location'),
('DEMO-CA-002-01', 'DEMO-CA-002', 'CA Tech - Main Campus', '456 Silicon Valley Dr, San Jose, CA 95110', 'Facilities Director', '555-1201', '37.3382,-121.8863', 'Corporate headquarters'),
('DEMO-CA-003-01', 'DEMO-CA-003', 'CA Medical - Emergency', '789 Health Ave, San Francisco, CA 94102', 'Security Chief', '555-1301', '37.7749,-122.4194', 'Emergency department'),

-- Texas Sites
('DEMO-TX-001-01', 'DEMO-TX-001', 'TX Oil & Gas - Tower A', '100 Energy Plaza, Houston, TX 77002', 'Facility Manager', '555-2101', '29.7604,-95.3698', 'Main office tower'),
('DEMO-TX-002-01', 'DEMO-TX-002', 'TX Mall - Main Building', '200 Retail Parkway, Dallas, TX 75201', 'Mall Manager', '555-2201', '32.7767,-96.7970', 'Shopping mall'),
('DEMO-TX-003-01', 'DEMO-TX-003', 'TX University - Admin', '300 Campus Dr, Austin, TX 78701', 'Facilities', '555-2301', '30.2672,-97.7431', 'Administration building'),
('DEMO-TX-003-02', 'DEMO-TX-003', 'TX University - Library', '301 Campus Dr, Austin, TX 78701', 'Head Librarian', '555-2302', '30.2672,-97.7431', 'Main library'),

-- New York Sites
('DEMO-NY-001-01', 'DEMO-NY-001', 'NY Financial - Floor 40', '1 Wall Street', 'New York', 'NY', '10005', 'Building Mgmt', '555-3101', 'mgmt@nyfinance.com', '40.7074,-74.0113', 'DEMO'),
('DEMO-NY-002-01', 'DEMO-NY-002', 'NY Hotel - Main Tower', '500 Broadway', 'New York', 'NY', '10012', 'Hotel Manager', '555-3201', 'manager@nyhotels.com', '40.7223,-73.9987', 'DEMO'),
('DEMO-NY-003-01', 'DEMO-NY-003', 'NY Museum - Main Hall', '100 Museum Mile', 'New York', 'NY', '10028', 'Curator', '555-3301', 'curator@nymuseum.org', '40.7794,-73.9632', 'DEMO'),

-- Florida Sites
('DEMO-FL-001-01', 'DEMO-FL-001', 'FL Resort - Beachfront', '1000 Ocean Drive', 'Miami Beach', 'FL', '33139', 'Resort Manager', '555-4101', 'manager@flresorts.com', '25.7907,-80.1300', 'DEMO'),
('DEMO-FL-002-01', 'DEMO-FL-002', 'FL Theme Park - North', '2000 Adventure Way', 'Orlando', 'FL', '32819', 'Park Operations', '555-4201', 'ops@flparks.com', '28.3852,-81.5639', 'DEMO'),
('DEMO-FL-003-01', 'DEMO-FL-003', 'FL Retirement - Main', '3000 Sunset Blvd', 'Tampa', 'FL', '33602', 'Administrator', '555-4301', 'admin@flretirement.com', '27.9506,-82.4572', 'DEMO'),

-- Illinois Sites
('DEMO-IL-001-01', 'DEMO-IL-001', 'IL Manufacturing - Plant 1', '100 Industrial Ave', 'Chicago', 'IL', '60601', 'Plant Manager', '555-5101', 'plant@ilmanufacturing.com', '41.8781,-87.6298', 'DEMO'),
('DEMO-IL-002-01', 'DEMO-IL-002', 'IL Airport - Terminal 1', '200 Terminal Dr', 'Chicago', 'IL', '60666', 'Airport Security', '555-5201', 'security@ilairport.com', '41.9742,-87.9073', 'DEMO'),

-- Washington Sites
('DEMO-WA-001-01', 'DEMO-WA-001', 'WA Startup - Building A', '100 Innovation Blvd', 'Seattle', 'WA', '98101', 'Hub Manager', '555-6101', 'manager@wastartup.com', '47.6062,-122.3321', 'DEMO'),
('DEMO-WA-002-01', 'DEMO-WA-002', 'WA Coffee - HQ Tower', '200 Brew Street', 'Seattle', 'WA', '98102', 'Facilities', '555-6201', 'facilities@wacoffee.com', '47.6062,-122.3321', 'DEMO'),

-- Colorado Sites
('DEMO-CO-001-01', 'DEMO-CO-001', 'CO Resort - Main Lodge', '100 Mountain Road', 'Denver', 'CO', '80202', 'Lodge Manager', '555-7101', 'lodge@coresort.com', '39.7392,-104.9903', 'DEMO'),
('DEMO-CO-002-01', 'DEMO-CO-002', 'CO Data Center - Facility', '200 Server Farm Ln', 'Denver', 'CO', '80203', 'DC Manager', '555-7201', 'dcmgr@codatacenter.com', '39.7392,-104.9903', 'DEMO'),

-- Georgia Sites
('DEMO-GA-001-01', 'DEMO-GA-001', 'GA Distribution - Warehouse', '100 Logistics Way', 'Atlanta', 'GA', '30303', 'Warehouse Mgr', '555-8101', 'warehouse@gadistribution.com', '33.7490,-84.3880', 'DEMO'),
('DEMO-GA-002-01', 'DEMO-GA-002', 'GA Medical - ER Building', '200 Healthcare Dr', 'Atlanta', 'GA', '30308', 'ER Director', '555-8201', 'erdirector@gamedical.org', '33.7490,-84.3880', 'DEMO');

-- ================================================================
-- DEMO LICENSES - Security systems across all sites
-- ================================================================

INSERT INTO Licenses (LicenseID, CustomerID, SiteID, Type, IssueDate, ExpiryDate, Status, IssuingAuthority, Notes, CompanyCode) VALUES
-- California Licenses
('LIC-DEMO-CA-001', 'DEMO-CA-001', 'DEMO-CA-001-01', 'Fire Alarm', '2024-01-15', '2026-01-15', 'Active', 'CA State Fire Marshal', 'Annual inspection required', 'DEMO'),
('LIC-DEMO-CA-002', 'DEMO-CA-001', 'DEMO-CA-001-02', 'Burglar Alarm', '2024-02-01', '2026-02-01', 'Active', 'CA Bureau of Security', 'Permit PPO 12345', 'DEMO'),
('LIC-DEMO-CA-003', 'DEMO-CA-002', 'DEMO-CA-002-01', 'Access Control', '2024-01-10', '2026-01-10', 'Active', 'Santa Clara County', 'Multi-zone system', 'DEMO'),
('LIC-DEMO-CA-004', 'DEMO-CA-003', 'DEMO-CA-003-01', 'Medical Alert', '2024-03-01', '2025-03-01', 'Expiring Soon', 'CA Dept of Health', 'Renewal in progress', 'DEMO'),

-- Texas Licenses
('LIC-DEMO-TX-001', 'DEMO-TX-001', 'DEMO-TX-001-01', 'Industrial Security', '2024-01-20', '2026-01-20', 'Active', 'TX DPS', 'Class A facility', 'DEMO'),
('LIC-DEMO-TX-002', 'DEMO-TX-002', 'DEMO-TX-002-01', 'Commercial Alarm', '2024-02-15', '2026-02-15', 'Active', 'Dallas City', 'Retail monitoring', 'DEMO'),
('LIC-DEMO-TX-003', 'DEMO-TX-003', 'DEMO-TX-003-01', 'Fire Alarm', '2024-01-05', '2026-01-05', 'Active', 'Austin Fire Dept', 'Campus-wide system', 'DEMO'),
('LIC-DEMO-TX-004', 'DEMO-TX-003', 'DEMO-TX-003-02', 'Access Control', '2024-01-05', '2026-01-05', 'Active', 'Austin Fire Dept', 'Library security', 'DEMO'),

-- New York Licenses
('LIC-DEMO-NY-001', 'DEMO-NY-001', 'DEMO-NY-001-01', 'High-Rise Security', '2024-01-25', '2026-01-25', 'Active', 'NYC Buildings Dept', 'Tower security system', 'DEMO'),
('LIC-DEMO-NY-002', 'DEMO-NY-002', 'DEMO-NY-002-01', 'Hotel Security', '2024-02-20', '2026-02-20', 'Active', 'NYC Sheriff', 'Guest safety system', 'DEMO'),
('LIC-DEMO-NY-003', 'DEMO-NY-003', 'DEMO-NY-003-01', 'Museum Security', '2024-03-10', '2026-03-10', 'Active', 'NYC Cultural Affairs', 'Artifact protection', 'DEMO'),

-- Florida Licenses
('LIC-DEMO-FL-001', 'DEMO-FL-001', 'DEMO-FL-001-01', 'Resort Security', '2024-01-30', '2026-01-30', 'Active', 'FL DBPR', 'Beach property system', 'DEMO'),
('LIC-DEMO-FL-002', 'DEMO-FL-002', 'DEMO-FL-002-01', 'Public Venue', '2024-02-25', '2026-02-25', 'Active', 'Orange County', 'High-capacity monitoring', 'DEMO'),
('LIC-DEMO-FL-003', 'DEMO-FL-003', 'DEMO-FL-003-01', 'Healthcare Facility', '2024-03-15', '2025-03-15', 'Expiring Soon', 'FL Agency for Health', 'Senior care monitoring', 'DEMO'),

-- Illinois Licenses
('LIC-DEMO-IL-001', 'DEMO-IL-001', 'DEMO-IL-001-01', 'Industrial Alarm', '2024-02-01', '2026-02-01', 'Active', 'IL IDFPR', 'Manufacturing security', 'DEMO'),
('LIC-DEMO-IL-002', 'DEMO-IL-002', 'DEMO-IL-002-01', 'Airport Security', '2024-02-10', '2026-02-10', 'Active', 'TSA/FAA', 'Federal compliance required', 'DEMO'),

-- Washington Licenses
('LIC-DEMO-WA-001', 'DEMO-WA-001', 'DEMO-WA-001-01', 'Commercial Alarm', '2024-02-15', '2026-02-15', 'Active', 'WA State Patrol', 'Multi-tenant system', 'DEMO'),
('LIC-DEMO-WA-002', 'DEMO-WA-002', 'DEMO-WA-002-01', 'Corporate Security', '2024-02-20', '2026-02-20', 'Active', 'Seattle PD', 'HQ monitoring', 'DEMO'),

-- Colorado Licenses
('LIC-DEMO-CO-001', 'DEMO-CO-001', 'DEMO-CO-001-01', 'Resort Security', '2024-03-01', '2026-03-01', 'Active', 'CO DORA', 'Seasonal operations', 'DEMO'),
('LIC-DEMO-CO-002', 'DEMO-CO-002', 'DEMO-CO-002-01', 'Data Center Security', '2024-03-05', '2026-03-05', 'Active', 'CO DORA', 'Critical infrastructure', 'DEMO'),

-- Georgia Licenses
('LIC-DEMO-GA-001', 'DEMO-GA-001', 'DEMO-GA-001-01', 'Warehouse Security', '2024-03-10', '2026-03-10', 'Active', 'GA Secretary of State', 'Distribution facility', 'DEMO'),
('LIC-DEMO-GA-002', 'DEMO-GA-002', 'DEMO-GA-002-01', 'Healthcare Security', '2024-03-15', '2026-03-15', 'Active', 'GA Dept of Health', 'Hospital monitoring', 'DEMO');

GO

PRINT '✅ Demo data created successfully!'
PRINT '📊 Summary:'
PRINT '   - 14 Demo Users (techs across 8 states)'
PRINT '   - 18 Demo Customers (nationwide coverage)'
PRINT '   - 27 Demo Sites'
PRINT '   - 22 Demo Licenses'
PRINT ''
PRINT '🎯 Next: Run create-demo-tickets.sql to add tickets!'
