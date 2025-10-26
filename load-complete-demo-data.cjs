const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');

const config = {
  server: 'customer-portal-sql-server.database.windows.net',
  database: 'FieldServiceDB-DEMO',
  authentication: {
    type: 'default',
    options: {
      userName: 'sqladmin',
      password: 'CustomerPortal2025!'
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function loadDemoData() {
  console.log('🚀 Loading comprehensive demo data into FieldServiceDB-DEMO...\n');
  
  const pool = await sql.connect(config);
  const now = new Date();
  
  try {
    // ================================================================
    // 1. USERS (skipping - already exist)
    // ================================================================
    console.log('👥 Skipping users (already exist)...');
    
    // ================================================================
    // 2. VENDORS (10 vendors coast to coast)
    // ================================================================
    console.log('\n🏢 Creating 10 vendors...');
    
    const vendors = [
      { id: uuidv4(), name: 'Coast Guard Security', contact: 'Tom Anderson', phone: '555-0101', email: 'tom@coastguard.com', address: '123 Pacific Ave, Seattle, WA 98101' },
      { id: uuidv4(), name: 'Bay Area Alarms', contact: 'Lisa Wong', phone: '555-0102', email: 'lisa@bayalarms.com', address: '456 Market St, San Francisco, CA 94102' },
      { id: uuidv4(), name: 'Desert Security Systems', contact: 'Carlos Martinez', phone: '555-0103', email: 'carlos@desertsec.com', address: '789 Sunset Blvd, Phoenix, AZ 85001' },
      { id: uuidv4(), name: 'Rocky Mountain Protection', contact: 'Sarah Miller', phone: '555-0104', email: 'sarah@rockymtn.com', address: '321 Main St, Denver, CO 80202' },
      { id: uuidv4(), name: 'Lone Star Security', contact: 'Bob Johnson', phone: '555-0105', email: 'bob@lonestar.com', address: '654 Energy Plaza, Houston, TX 77002' },
      { id: uuidv4(), name: 'Midwest Safe & Sound', contact: 'Jennifer Davis', phone: '555-0106', email: 'jen@mwsafe.com', address: '987 Commerce Dr, Chicago, IL 60601' },
      { id: uuidv4(), name: 'Southern Shield Services', contact: 'Michael Brown', phone: '555-0107', email: 'mike@southshield.com', address: '147 Peachtree St, Atlanta, GA 30303' },
      { id: uuidv4(), name: 'Sunshine State Security', contact: 'Maria Garcia', phone: '555-0108', email: 'maria@sunshinesec.com', address: '258 Ocean Dr, Miami, FL 33139' },
      { id: uuidv4(), name: 'Northeast Alarm Co', contact: 'David Cohen', phone: '555-0109', email: 'david@nealarm.com', address: '369 Broadway, New York, NY 10013' },
      { id: uuidv4(), name: 'Capital Security Group', contact: 'Amanda Wilson', phone: '555-0110', email: 'amanda@capitsec.com', address: '741 K Street NW, Washington, DC 20001' }
    ];
    
    for (const vendor of vendors) {
      await pool.request()
        .input('id', sql.NVarChar, vendor.id)
        .input('name', sql.NVarChar, vendor.name)
        .input('contact', sql.NVarChar, vendor.contact)
        .input('phone', sql.NVarChar, vendor.phone)
        .input('email', sql.NVarChar, vendor.email)
        .input('serviceAreas', sql.NVarChar, vendor.address)
        .input('createdAt', sql.DateTime2, now)
        .query(`
          INSERT INTO Vendors (VendorID, Name, Contact, Phone, Email, ServiceAreas, CompanyCode, CreatedAt)
          VALUES (@id, @name, @contact, @phone, @email, @serviceAreas, 'DEMO', @createdAt)
        `);
    }
    console.log('  ✅ Created 10 vendors coast to coast');
    
    // ================================================================
    // 3. CUSTOMERS (10 customers across USA)
    // ================================================================
    console.log('\n🏢 Creating 10 customers...');
    
    const customers = [
      { id: 'CUST-DEMO-001', name: 'Pacific Northwest Retail', contact: 'James Lee', email: 'james@pnwretail.com', phone: '555-1001', address: '1000 Pike Place, Seattle, WA 98101', notes: 'Major retail chain' },
      { id: 'CUST-DEMO-002', name: 'Silicon Valley Tech Campus', contact: 'Emma Thompson', email: 'emma@svtech.com', phone: '555-1002', address: '2000 Innovation Dr, San Jose, CA 95110', notes: 'Tech headquarters' },
      { id: 'CUST-DEMO-003', name: 'Southwest Medical Center', contact: 'Dr. Robert Garcia', email: 'robert@swmedical.com', phone: '555-1003', address: '3000 Healthcare Blvd, Phoenix, AZ 85001', notes: 'Hospital complex' },
      { id: 'CUST-DEMO-004', name: 'Rocky Mountain Resort', contact: 'Jennifer White', email: 'jen@rmresort.com', phone: '555-1004', address: '4000 Mountain View, Denver, CO 80202', notes: 'Luxury resort' },
      { id: 'CUST-DEMO-005', name: 'Texas Energy Corporation', contact: 'William Davis', email: 'will@txenergy.com', phone: '555-1005', address: '5000 Oil Plaza, Houston, TX 77002', notes: 'Energy company HQ' },
      { id: 'CUST-DEMO-006', name: 'Chicago Financial Tower', contact: 'Patricia Moore', email: 'pat@chifinance.com', phone: '555-1006', address: '6000 LaSalle St, Chicago, IL 60601', notes: 'High-rise offices' },
      { id: 'CUST-DEMO-007', name: 'Atlanta Convention Center', contact: 'Richard Taylor', email: 'rick@atlconv.com', phone: '555-1007', address: '7000 Peachtree Rd, Atlanta, GA 30303', notes: 'Event venue' },
      { id: 'CUST-DEMO-008', name: 'Miami Beach Hotels', contact: 'Linda Martinez', email: 'linda@miamibeach.com', phone: '555-1008', address: '8000 Collins Ave, Miami Beach, FL 33139', notes: 'Hotel chain' },
      { id: 'CUST-DEMO-009', name: 'Manhattan Office Complex', contact: 'Charles Anderson', email: 'charles@manhattan.com', phone: '555-1009', address: '9000 5th Avenue, New York, NY 10022', notes: 'Commercial building' },
      { id: 'CUST-DEMO-010', name: 'Capitol District Properties', contact: 'Susan Jackson', email: 'susan@capdistrict.com', phone: '555-1010', address: '1001 Pennsylvania Ave, Washington, DC 20004', notes: 'Government contractor' }
    ];
    
    for (const customer of customers) {
      await pool.request()
        .input('id', sql.NVarChar, customer.id)
        .input('name', sql.NVarChar, customer.name)
        .input('contact', sql.NVarChar, customer.contact)
        .input('email', sql.NVarChar, customer.email)
        .input('phone', sql.NVarChar, customer.phone)
        .input('address', sql.NVarChar, customer.address)
        .input('notes', sql.NVarChar, customer.notes)
        .query(`
          INSERT INTO Customers (CustomerID, Name, Contact, Email, Phone, Address, Notes, CompanyCode)
          VALUES (@id, @name, @contact, @email, @phone, @address, @notes, 'DEMO')
        `);
    }
    console.log('  ✅ Created 10 customers');
    
    // ================================================================
    // 4. SITES (10 sites - one per customer)
    // ================================================================
    console.log('\n📍 Creating 10 sites with geolocation...');
    
    const sites = [
      { id: 'SITE-DEMO-001', customerId: 'CUST-DEMO-001', customer: 'Pacific Northwest Retail', name: 'Seattle Main Store', address: '1000 Pike Place, Seattle, WA 98101', contact: 'Store Manager', phone: '555-1001', geo: '47.6097,-122.3331' },
      { id: 'SITE-DEMO-002', customerId: 'CUST-DEMO-002', customer: 'Silicon Valley Tech Campus', name: 'San Jose HQ Building A', address: '2000 Innovation Dr, San Jose, CA 95110', contact: 'Facility Manager', phone: '555-1002', geo: '37.3352,-121.8933' },
      { id: 'SITE-DEMO-003', customerId: 'CUST-DEMO-003', customer: 'Southwest Medical Center', name: 'Phoenix Main Hospital', address: '3000 Healthcare Blvd, Phoenix, AZ 85001', contact: 'Security Director', phone: '555-1003', geo: '33.4484,-112.0740' },
      { id: 'SITE-DEMO-004', customerId: 'CUST-DEMO-004', customer: 'Rocky Mountain Resort', name: 'Denver Resort Main Lodge', address: '4000 Mountain View, Denver, CO 80202', contact: 'Resort Manager', phone: '555-1004', geo: '39.7392,-104.9903' },
      { id: 'SITE-DEMO-005', customerId: 'CUST-DEMO-005', customer: 'Texas Energy Corporation', name: 'Houston Energy Tower', address: '5000 Oil Plaza, Houston, TX 77002', contact: 'Building Manager', phone: '555-1005', geo: '29.7604,-95.3698' },
      { id: 'SITE-DEMO-006', customerId: 'CUST-DEMO-006', customer: 'Chicago Financial Tower', name: 'Chicago Tower 1', address: '6000 LaSalle St, Chicago, IL 60601', contact: 'Property Manager', phone: '555-1006', geo: '41.8781,-87.6298' },
      { id: 'SITE-DEMO-007', customerId: 'CUST-DEMO-007', customer: 'Atlanta Convention Center', name: 'Atlanta Main Hall', address: '7000 Peachtree Rd, Atlanta, GA 30303', contact: 'Event Coordinator', phone: '555-1007', geo: '33.7490,-84.3880' },
      { id: 'SITE-DEMO-008', customerId: 'CUST-DEMO-008', customer: 'Miami Beach Hotels', name: 'Miami Beach Grand Hotel', address: '8000 Collins Ave, Miami Beach, FL 33139', contact: 'Hotel Manager', phone: '555-1008', geo: '25.7907,-80.1300' },
      { id: 'SITE-DEMO-009', customerId: 'CUST-DEMO-009', customer: 'Manhattan Office Complex', name: 'Manhattan Tower', address: '9000 5th Avenue, New York, NY 10022', contact: 'Building Super', phone: '555-1009', geo: '40.7128,-74.0060' },
      { id: 'SITE-DEMO-010', customerId: 'CUST-DEMO-010', customer: 'Capitol District Properties', name: 'DC Federal Building', address: '1001 Pennsylvania Ave, Washington, DC 20004', contact: 'Facilities Director', phone: '555-1010', geo: '38.9072,-77.0369' }
    ];
    
    for (const site of sites) {
      await pool.request()
        .input('id', sql.NVarChar, site.id)
        .input('customerId', sql.NVarChar, site.customerId)
        .input('customer', sql.NVarChar, site.customer)
        .input('name', sql.NVarChar, site.name)
        .input('address', sql.NVarChar, site.address)
        .input('contact', sql.NVarChar, site.contact)
        .input('phone', sql.NVarChar, site.phone)
        .input('geo', sql.NVarChar, site.geo)
        .query(`
          INSERT INTO Sites (SiteID, CustomerID, Customer, Name, Address, Contact, Phone, GeoLocation, CompanyCode)
          VALUES (@id, @customerId, @customer, @name, @address, @contact, @phone, @geo, 'DEMO')
        `);
    }
    console.log('  ✅ Created 10 sites with geolocation');
    
    // ================================================================
    // 5. LICENSES (10 licenses - one per site)
    // ================================================================
    console.log('\n📜 Creating 10 licenses...');
    
    const licenses = [
      { id: 'LIC-DEMO-001', customer: 'Pacific Northwest Retail', site: 'Seattle Main Store', software: 'Fire Alarm System Pro', version: '3.2', key: 'FA-2025-SEA-001', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-002', customer: 'Silicon Valley Tech Campus', site: 'San Jose HQ Building A', software: 'Access Control Enterprise', version: '5.1', key: 'AC-2025-SJ-002', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-003', customer: 'Southwest Medical Center', site: 'Phoenix Main Hospital', software: 'Medical Facility Security Suite', version: '4.0', key: 'MFS-2025-PHX-003', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-004', customer: 'Rocky Mountain Resort', site: 'Denver Resort Main Lodge', software: 'Hospitality Security System', version: '2.8', key: 'HSS-2025-DEN-004', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-005', customer: 'Texas Energy Corporation', site: 'Houston Energy Tower', software: 'Industrial Access Control', version: '6.2', key: 'IAC-2025-HOU-005', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-006', customer: 'Chicago Financial Tower', site: 'Chicago Tower 1', software: 'Financial Security Suite', version: '7.0', key: 'FSS-2025-CHI-006', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-007', customer: 'Atlanta Convention Center', site: 'Atlanta Main Hall', software: 'Event Venue Security', version: '3.5', key: 'EVS-2025-ATL-007', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-008', customer: 'Miami Beach Hotels', site: 'Miami Beach Grand Hotel', software: 'Hotel Security Management', version: '4.3', key: 'HSM-2025-MIA-008', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-009', customer: 'Manhattan Office Complex', site: 'Manhattan Tower', software: 'Commercial Building Security', version: '5.5', key: 'CBS-2025-NYC-009', expiry: '2026-12-31' },
      { id: 'LIC-DEMO-010', customer: 'Capitol District Properties', site: 'DC Federal Building', software: 'Government Grade Security', version: '8.0', key: 'GGS-2025-DC-010', expiry: '2026-12-31' }
    ];
    
    for (const license of licenses) {
      await pool.request()
        .input('id', sql.NVarChar, license.id)
        .input('customer', sql.NVarChar, license.customer)
        .input('site', sql.NVarChar, license.site)
        .input('software', sql.NVarChar, license.software)
        .input('version', sql.NVarChar, license.version)
        .input('key', sql.NVarChar, license.key)
        .input('expiry', sql.Date, license.expiry)
        .input('createdAt', sql.DateTime2, now)
        .input('updatedAt', sql.DateTime2, now)
        .query(`
          INSERT INTO Licenses (LicenseID, Customer, Site, SoftwareName, SoftwareVersion, LicenseKey, ExpirationDate, CompanyCode, CreatedAt, UpdatedAt)
          VALUES (@id, @customer, @site, @software, @version, @key, @expiry, 'DEMO', @createdAt, @updatedAt)
        `);
    }
    console.log('  ✅ Created 10 licenses');
    
    // ================================================================
    // 6. TICKETS (10 tickets - proper naming format)
    // ================================================================
    console.log('\n🎫 Creating 10 tickets with proper naming (TKT-2025-10-XXX)...');
    
    const tickets = [
      { id: 'TKT-2025-10-001', title: 'Fire Alarm System Annual Inspection', status: 'New', priority: 'High', customer: 'Pacific Northwest Retail', site: 'Seattle Main Store', category: 'Inspection', description: 'Annual fire alarm system inspection required', assignedTo: 'demo-tech', geo: '47.6097,-122.3331', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-002', title: 'Access Card Reader Malfunction', status: 'In-Progress', priority: 'High', customer: 'Silicon Valley Tech Campus', site: 'San Jose HQ Building A', category: 'Repair', description: 'Card reader on Building A entrance not functioning', assignedTo: 'demo-tech', geo: '37.3352,-121.8933', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-003', title: 'Security Camera Lens Cleaning', status: 'New', priority: 'Normal', customer: 'Southwest Medical Center', site: 'Phoenix Main Hospital', category: 'Maintenance', description: 'Quarterly camera maintenance and cleaning', assignedTo: 'demo-tech', geo: '33.4484,-112.0740', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-004', title: 'Intrusion Detection System Upgrade', status: 'New', priority: 'Normal', customer: 'Rocky Mountain Resort', site: 'Denver Resort Main Lodge', category: 'Installation', description: 'Upgrade to latest IDS firmware', assignedTo: 'demo-tech', geo: '39.7392,-104.9903', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-005', title: 'Emergency Exit Alarm Testing', status: 'Scheduled', priority: 'High', customer: 'Texas Energy Corporation', site: 'Houston Energy Tower', category: 'Testing', description: 'Quarterly emergency exit alarm test', assignedTo: 'demo-tech', geo: '29.7604,-95.3698', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-006', title: 'Surveillance System Backup Restoration', status: 'New', priority: 'Normal', customer: 'Chicago Financial Tower', site: 'Chicago Tower 1', category: 'Maintenance', description: 'Restore surveillance system from backup', assignedTo: 'demo-tech', geo: '41.8781,-87.6298', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-007', title: 'Motion Sensor Calibration', status: 'New', priority: 'Normal', customer: 'Atlanta Convention Center', site: 'Atlanta Main Hall', category: 'Maintenance', description: 'Recalibrate motion sensors in main hall', assignedTo: 'demo-tech', geo: '33.7490,-84.3880', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-008', title: 'Panic Button Installation', status: 'Scheduled', priority: 'High', customer: 'Miami Beach Hotels', site: 'Miami Beach Grand Hotel', category: 'Installation', description: 'Install panic buttons at front desk', assignedTo: 'demo-tech', geo: '25.7907,-80.1300', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-009', title: 'Badge Printer Repair', status: 'In-Progress', priority: 'Normal', customer: 'Manhattan Office Complex', site: 'Manhattan Tower', category: 'Repair', description: 'Badge printer jamming frequently', assignedTo: 'demo-tech', geo: '40.7128,-74.0060', owner: 'demo-coordinator' },
      { id: 'TKT-2025-10-010', title: 'Security System Integration', status: 'New', priority: 'High', customer: 'Capitol District Properties', site: 'DC Federal Building', category: 'Installation', description: 'Integrate new security system with building automation', assignedTo: 'demo-tech', geo: '38.9072,-77.0369', owner: 'demo-coordinator' }
    ];
    
    for (const ticket of tickets) {
      await pool.request()
        .input('id', sql.NVarChar, ticket.id)
        .input('title', sql.NVarChar, ticket.title)
        .input('status', sql.NVarChar, ticket.status)
        .input('priority', sql.NVarChar, ticket.priority)
        .input('customer', sql.NVarChar, ticket.customer)
        .input('site', sql.NVarChar, ticket.site)
        .input('category', sql.NVarChar, ticket.category)
        .input('description', sql.NVarChar, ticket.description)
        .input('assignedTo', sql.NVarChar, ticket.assignedTo)
        .input('geo', sql.NVarChar, ticket.geo)
        .input('owner', sql.NVarChar, ticket.owner)
        .input('createdAt', sql.DateTime2, now)
        .query(`
          INSERT INTO Tickets (TicketID, Title, Status, Priority, Customer, Site, Category, Description, AssignedTo, GeoLocation, Owner, CompanyCode, CreatedAt)
          VALUES (@id, @title, @status, @priority, @customer, @site, @category, @description, @assignedTo, @geo, @owner, 'DEMO', @createdAt)
        `);
    }
    console.log('  ✅ Created 10 tickets (TKT-2025-10-001 through TKT-2025-10-010)');
    
    console.log('\n✅ DEMO DATA LOADED SUCCESSFULLY!');
    console.log('================================================');
    console.log('📊 Summary:');
    console.log('  - 3 Users (already existed)');
    console.log('  - 10 Vendors (coast to coast) ✅ NEW');
    console.log('  - 10 Customers ✅ NEW');
    console.log('  - 10 Sites (with geolocation) ✅ NEW');
    console.log('  - 10 Licenses ✅ NEW');
    console.log('  - 10 Tickets (proper TKT-YYYY-MM-NNN format) ✅ NEW');
    console.log('\n🔐 Login Credentials:');
    console.log('  Username: demo-admin');
    console.log('  Password: demo123');
    console.log('  Company Code: DEMO');
    console.log('\n🗺️  Geographic Coverage:');
    console.log('  - Seattle, WA');
    console.log('  - San Jose, CA');
    console.log('  - Phoenix, AZ');
    console.log('  - Denver, CO');
    console.log('  - Houston, TX');
    console.log('  - Chicago, IL');
    console.log('  - Atlanta, GA');
    console.log('  - Miami, FL');
    console.log('  - New York, NY');
    console.log('  - Washington, DC');
    
  } catch (err) {
    console.error('❌ Error loading demo data:', err.message);
    throw err;
  } finally {
    await pool.close();
  }
}

loadDemoData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
