// src/services/SharePointService.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { Ticket, Customer, Site, Asset } from '../types';

export class SharePointService {
  private graphClient: Client;
  private siteId: string;
  
  // Updated list IDs from your SharePoint site
  private readonly listIds = {
    tickets: '068264b8-5afd-494a-9968-465047a02325',
    sites: 'c337c181-d714-4c98-8198-9f2e913d1d21', 
    customers: '9786b9fc-d1f5-4aa5-b157-8c6e187f7b2e',
    assets: '78b2fb13-068e-419d-a1f1-17b5e564152a'
  };

  constructor(graphClient: Client, siteId: string) {
    this.graphClient = graphClient;
    this.siteId = siteId;
  }

  // ===== TICKETS =====
  async getTickets(): Promise<Ticket[]> {
    console.log('SharePointService.getTickets: Starting...');
    try {
      console.log('SharePointService.getTickets: Making API call to site:', this.siteId);
      console.log('SharePointService.getTickets: List ID:', this.listIds.tickets);
      
      // First, let's check what columns are available in the list
      const columnsResponse = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.tickets}/columns`)
        .get();
      
      console.log('SharePointService.getTickets: Available columns in SharePoint list:');
      columnsResponse.value.forEach((col: any) => {
        console.log(`  - ${col.name} (${col.displayName}) - Type: ${col.columnType || col.type}`);
      });
      
      // Use the correct API format for SharePoint list items
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.tickets}/items`)
        .expand('fields')
        .get();

      console.log('SharePointService.getTickets: API response:', response);
      const tickets = response.value.map((item: any) => this.mapSharePointTicketToTicket(item.fields));
      console.log('SharePointService.getTickets: Mapped', tickets.length, 'tickets');
      return tickets;
    } catch (error) {
      console.error('SharePointService.getTickets: Error fetching tickets from SharePoint:', error);
      throw error; // Re-throw to trigger fallback in api.ts
    }
  }

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    console.log('SharePointService.createTicket: Starting with ticket data:', ticket);
    console.log('SharePointService.createTicket: Ticket fields breakdown:', {
      Title: ticket.Title,
      TicketID: ticket.TicketID,
      Status: ticket.Status,
      Priority: ticket.Priority,
      Customer: ticket.Customer,
      Site: ticket.Site,
      Description: ticket.Description
    });
    try {
      // Create all fields at once in the initial POST request
      const sharePointFields: any = {};
      
      // Required fields
      if (ticket.Title && ticket.Title.trim()) {
        sharePointFields.Title = ticket.Title.trim();
      } else {
        sharePointFields.Title = ticket.TicketID || 'New Ticket';
      }
      
      // Add TicketID
      if (ticket.TicketID && ticket.TicketID.trim()) {
        sharePointFields.TicketID = ticket.TicketID.trim();
      } else {
        const timestamp = Date.now();
        sharePointFields.TicketID = `TKT-${timestamp}`;
      }
      
      // Add choice fields - these need to be strings, not arrays for creation
      if (ticket.Status && ['New', 'Assigned', 'In Progress', 'Complete', 'Closed'].includes(ticket.Status)) {
        sharePointFields.Status = ticket.Status;
        console.log('SharePointService.createTicket: Adding Status field:', sharePointFields.Status);
      } else {
        sharePointFields.Status = 'New'; // Default value
      }
      
      if (ticket.Priority && ['Low', 'Normal', 'High', 'Critical'].includes(ticket.Priority)) {
        sharePointFields.Priority = ticket.Priority;
        console.log('SharePointService.createTicket: Adding Priority field:', sharePointFields.Priority);
      } else {
        sharePointFields.Priority = 'Normal'; // Default value
      }
      
      // Add text fields
      if (ticket.Customer && ticket.Customer.trim()) {
        sharePointFields.Customer = ticket.Customer.trim();
        console.log('SharePointService.createTicket: Adding Customer field:', sharePointFields.Customer);
      }
      
      if (ticket.Site && ticket.Site.trim()) {
        sharePointFields.Site = ticket.Site.trim();
        console.log('SharePointService.createTicket: Adding Site field:', sharePointFields.Site);
      }
      
      if (ticket.Category && ticket.Category.trim()) {
        sharePointFields.Category = ticket.Category.trim();
        console.log('SharePointService.createTicket: Adding Category field:', sharePointFields.Category);
      }
      
      if (ticket.Description && ticket.Description.trim()) {
        sharePointFields.Description = ticket.Description.trim();
        console.log('SharePointService.createTicket: Adding Description field:', sharePointFields.Description);
      }
      
      if (ticket.AssignedTo && ticket.AssignedTo.trim()) {
        sharePointFields.AssignedTo = ticket.AssignedTo.trim();
        console.log('SharePointService.createTicket: Adding AssignedTo field:', sharePointFields.AssignedTo);
      }
      
      if (ticket.AssetIDs && ticket.AssetIDs.trim()) {
        sharePointFields.AssetIDs = ticket.AssetIDs.trim();
        console.log('SharePointService.createTicket: Adding AssetIDs field:', sharePointFields.AssetIDs);
      }
      
      console.log('SharePointService.createTicket: Creating ticket with all fields:', sharePointFields);
      
      // Create the ticket with all fields at once
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.tickets}/items`)
        .post({
          fields: sharePointFields
        });

      console.log('SharePointService.createTicket: SUCCESS - Ticket created with ID:', response.id);
      console.log('SharePointService.createTicket: Created ticket fields:', response.fields);
      
      return this.mapSharePointTicketToTicket(response.fields);
    } catch (error) {
      console.error('SharePointService.createTicket: Error creating ticket in SharePoint:', error);
      console.error('SharePointService.createTicket: Error details:', JSON.stringify(error, null, 2));
      throw error; // Re-throw to trigger fallback in api.ts
    }
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    console.log('SharePointService.updateTicket: Starting update for ticket:', ticketId);
    console.log('SharePointService.updateTicket: Updates requested:', updates);
    
    try {
      // First, find the SharePoint item by TicketID
      console.log('SharePointService.updateTicket: Searching for ticket with ID:', ticketId);
      const items = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.tickets}/items`)
        .filter(`fields/TicketID eq '${ticketId}'`)
        .expand('fields')
        .get();

      console.log('SharePointService.updateTicket: Search results:', items);

      if (items.value.length === 0) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      const itemId = items.value[0].id;
      console.log('SharePointService.updateTicket: Found SharePoint item ID:', itemId);
      
      const sharePointFields = this.mapTicketToSharePointFields(updates);
      console.log('SharePointService.updateTicket: Mapped SharePoint fields:', sharePointFields);

      console.log('SharePointService.updateTicket: Sending PATCH request to SharePoint...');
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.tickets}/items/${itemId}/fields`)
        .patch(sharePointFields);

      console.log('SharePointService.updateTicket: SharePoint response:', response);
      const updatedTicket = this.mapSharePointTicketToTicket(response);
      console.log('SharePointService.updateTicket: Mapped updated ticket:', updatedTicket);
      
      return updatedTicket;
    } catch (error) {
      console.error('SharePointService.updateTicket: Error updating ticket in SharePoint:', error);
      throw error;
    }
  }

  // ===== SITES =====
  async getSites(): Promise<Site[]> {
    try {
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.sites}/items`)
        .expand('fields')
        .get();

      return response.value.map((item: any) => this.mapSharePointSiteToSite(item.fields));
    } catch (error) {
      console.error('Error fetching sites from SharePoint:', error);
      return this.getFallbackSites();
    }
  }

  // ===== CUSTOMERS =====
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.customers}/items`)
        .expand('fields')
        .get();

      return response.value.map((item: any) => this.mapSharePointCustomerToCustomer(item.fields));
    } catch (error) {
      console.error('Error fetching customers from SharePoint:', error);
      return this.getFallbackCustomers();
    }
  }

  // ===== ASSETS =====
  async getAssets(): Promise<Asset[]> {
    try {
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listIds.assets}/items`)
        .expand('fields')
        .get();

      return response.value.map((item: any) => this.mapSharePointAssetToAsset(item.fields));
    } catch (error) {
      console.error('Error fetching assets from SharePoint:', error);
      return []; // Return empty array instead of calling missing fallback
    }
  }

  // ===== MAPPING FUNCTIONS =====
  private mapTicketToSharePointFields(ticket: Partial<Ticket>): any {
    console.log('SharePointService.mapTicketToSharePointFields: Input ticket:', ticket);
    
    // Map to SharePoint's actual column names (not field_1, field_2, etc.)
    const fields: any = {};
    
    // Core fields
    if (ticket.Title && ticket.Title.trim()) {
      fields.Title = ticket.Title.trim();
    }
    if (ticket.TicketID && ticket.TicketID.trim()) {
      fields.TicketID = ticket.TicketID.trim();
    }
    
    // Choice fields - use actual column names and send as strings (SharePoint will handle choice validation)
    if (ticket.Status && ['New', 'Assigned', 'In Progress', 'Complete', 'Closed'].includes(ticket.Status)) {
      fields.Status = ticket.Status;
      console.log('SharePointService.mapTicketToSharePointFields: Adding Status:', fields.Status);
    }
    
    if (ticket.Priority && ['Low', 'Normal', 'High', 'Critical'].includes(ticket.Priority)) {
      fields.Priority = ticket.Priority;
      console.log('SharePointService.mapTicketToSharePointFields: Adding Priority:', fields.Priority);
    }
    
    // Text fields
    if (ticket.Customer && ticket.Customer.trim()) {
      fields.Customer = ticket.Customer.trim();
      console.log('SharePointService.mapTicketToSharePointFields: Adding Customer:', fields.Customer);
    }
    
    if (ticket.Site && ticket.Site.trim()) {
      fields.Site = ticket.Site.trim();
      console.log('SharePointService.mapTicketToSharePointFields: Adding Site:', fields.Site);
    }
    
    if (ticket.Category && ticket.Category.trim()) {
      fields.Category = ticket.Category.trim();
      console.log('SharePointService.mapTicketToSharePointFields: Adding Category:', fields.Category);
    }
    
    if (ticket.Description && ticket.Description.trim()) {
      fields.Description = ticket.Description.trim();
      console.log('SharePointService.mapTicketToSharePointFields: Adding Description:', fields.Description);
    }
    
    if (ticket.AssignedTo && ticket.AssignedTo.trim()) {
      fields.AssignedTo = ticket.AssignedTo.trim();
    }
    
    if (ticket.AssetIDs && ticket.AssetIDs.trim()) {
      fields.AssetIDs = ticket.AssetIDs.trim();
    }
    
    if (ticket.Resolution && ticket.Resolution.trim()) {
      fields.Resolution = ticket.Resolution.trim();
    }
    
    if (ticket.ClosedBy && ticket.ClosedBy.trim()) {
      fields.ClosedBy = ticket.ClosedBy.trim();
    }
    
    if (ticket.GeoLocation && ticket.GeoLocation.trim()) {
      fields.GeoLocation = ticket.GeoLocation.trim();
    }
    
    if (ticket.Tags && ticket.Tags.trim()) {
      fields.Tags = ticket.Tags.trim();
    }
    
    // Date fields - validate and format properly
    if (ticket.ScheduledStart && ticket.ScheduledStart.trim()) {
      try {
        new Date(ticket.ScheduledStart); // Validate date
        fields.ScheduledStart = ticket.ScheduledStart;
      } catch (e) {
        console.warn('Invalid ScheduledStart date:', ticket.ScheduledStart);
      }
    }
    
    if (ticket.ScheduledEnd && ticket.ScheduledEnd.trim()) {
      try {
        new Date(ticket.ScheduledEnd); // Validate date
        fields.ScheduledEnd = ticket.ScheduledEnd;
      } catch (e) {
        console.warn('Invalid ScheduledEnd date:', ticket.ScheduledEnd);
      }
    }
    
    if (ticket.SLA_Due && ticket.SLA_Due.trim()) {
      try {
        new Date(ticket.SLA_Due); // Validate date
        fields.SLA_Due = ticket.SLA_Due;
      } catch (e) {
        console.warn('Invalid SLA_Due date:', ticket.SLA_Due);
      }
    }
    
    if (ticket.ClosedDate && ticket.ClosedDate.trim()) {
      try {
        new Date(ticket.ClosedDate); // Validate date
        fields.ClosedDate = ticket.ClosedDate;
      } catch (e) {
        console.warn('Invalid ClosedDate date:', ticket.ClosedDate);
      }
    }
    
    console.log('SharePointService.mapTicketToSharePointFields: Final mapped fields:', fields);
    return fields;
  }

  private mapSharePointTicketToTicket(fields: any): Ticket {
    console.log('SharePointService: Mapping fields from SharePoint:', JSON.stringify(fields, null, 2));
    console.log('SharePointService: Available field names:', Object.keys(fields));
    
    // Log each field value individually to debug
    console.log('SharePointService: Field values:');
    console.log('  Title:', fields.Title);
    console.log('  TicketID:', fields.TicketID);
    console.log('  Status:', fields.Status, '(type:', typeof fields.Status, ')');
    console.log('  Priority:', fields.Priority, '(type:', typeof fields.Priority, ')');
    console.log('  Customer:', fields.Customer);
    console.log('  Site:', fields.Site);
    console.log('  Category:', fields.Category);
    console.log('  Description:', fields.Description);
    console.log('  AssignedTo:', fields.AssignedTo);
    console.log('  AssetIDs:', fields.AssetIDs);
    console.log('  id (SharePoint ID):', fields.id);
    
    // Use TicketID field if available, otherwise fall back to SharePoint ID
    const ticketId = fields.TicketID || `SP-${fields.id}` || `TKT-${Date.now()}`;
    console.log('SharePointService: Using TicketID:', ticketId, 'from fields.TicketID:', fields.TicketID, 'fields.id:', fields.id);
    
    // Handle choice fields properly - they can be strings or arrays
    const extractChoiceValue = (value: any): string => {
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : '';
      }
      return value || '';
    };
    
    const mappedTicket = {
      TicketID: ticketId,
      Title: fields.Title || '', // Use Title field for the actual title/description
      Status: extractChoiceValue(fields.Status) || 'New',
      Priority: extractChoiceValue(fields.Priority) || 'Normal',
      Customer: fields.Customer || '',
      Site: fields.Site || '',
      AssetIDs: fields.AssetIDs || fields.AssetID || '', // Handle both possible names
      Category: fields.Category || '',
      Description: fields.Description || '',
      ScheduledStart: fields.ScheduledStart || '',
      ScheduledEnd: fields.ScheduledEnd || '',
      AssignedTo: fields.AssignedTo || '',
      SLA_Due: fields.SLA_Due || fields.SLADue || fields.DueDate || '', // Handle multiple possible names
      Resolution: fields.Resolution || '',
      ClosedBy: fields.ClosedBy || '',
      ClosedDate: fields.ClosedDate || '',
      GeoLocation: fields.GeoLocation || '',
      Tags: fields.Tags || '',
      CreatedAt: fields.Created || new Date().toISOString(),
      UpdatedAt: fields.Modified || new Date().toISOString(),
      CoordinatorNotes: fields.CoordinatorNotes ? [fields.CoordinatorNotes] : []
    };
    
    console.log('SharePointService: Final mapped ticket:', JSON.stringify(mappedTicket, null, 2));
    return mappedTicket;
  }

  private mapSharePointSiteToSite(fields: any): Site {
    return {
      Customer: fields.Customer || '',
      Site: fields.Title || '',
      Address: fields.Address || '',
      City: fields.City || '',
      State: fields.State || '',
      PostalCode: fields.ZipCode || '',
      Country: 'USA',
      TimeZone: 'CST',
      Latitude: fields.Latitude ? fields.Latitude.toString() : '',
      Longitude: fields.Longitude ? fields.Longitude.toString() : '',
      Notes: fields.Notes || '',
      CreatedAt: fields.Created || new Date().toISOString(),
      UpdatedAt: fields.Modified || new Date().toISOString()
    };
  }

  private mapSharePointCustomerToCustomer(fields: any): Customer {
    return {
      Customer: fields.Title || '',
      AccountNumber: fields.AccountNumber || '',
      PrimaryContact: fields.ContactName || '',
      Email: fields.ContactEmail || '',
      Phone: fields.ContactPhone || '',
      BillingAddress: fields.Address || '',
      Notes: fields.Notes || '',
      CreatedAt: fields.Created || new Date().toISOString(),
      UpdatedAt: fields.Modified || new Date().toISOString()
    };
  }

  private mapSharePointAssetToAsset(fields: any): Asset {
    return {
      AssetID: fields.AssetID || '',
      Customer: fields.Customer || '',
      Site: fields.Site || '',
      Type: fields.AssetType || '',
      Make: fields.Brand || '',
      Model: fields.Model || '',
      Serial: fields.SerialNumber || '',
      InstalledAt: fields.InstallDate || '',
      LastService: fields.LastService || '',
      WarrantyEnd: fields.WarrantyExpiry || '',
      Notes: fields.Notes || '',
      CreatedAt: fields.Created || new Date().toISOString(),
      UpdatedAt: fields.Modified || new Date().toISOString()
    };
  }

  // ===== FALLBACK DATA =====
  private async getFallbackTickets(): Promise<Ticket[]> {
    // Return existing mock data as fallback
    const response = await fetch('/data.json');
    const data = await response.json();
    return data.tickets || [];
  }

  private getFallbackSites(): Site[] {
    return [
      {
        Customer: 'DCPSP',
        Site: 'Main Data Center',
        Address: '123 Tech Drive',
        City: 'Austin',
        State: 'TX',
        PostalCode: '78701',
        Country: 'USA',
        TimeZone: 'CST',
        Latitude: '30.2672',
        Longitude: '-97.7431',
        Notes: 'Primary data center facility',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }
    ];
  }

  private getFallbackCustomers(): Customer[] {
    return [
      {
        Customer: 'Acme Corporation',
        AccountNumber: 'ACM001',
        PrimaryContact: 'Jane Doe',
        Phone: '555-123-4567',
        Email: 'jane.doe@acme.com',
        BillingAddress: '456 Business Blvd, Dallas, TX 75201',
        Notes: 'Primary customer account',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }
    ];
  }

  // ===== LIST CREATION HELPER =====
  async createListsIfNotExist(): Promise<void> {
    try {
      // Check and create Tickets list
      await this.createTicketsList(this.siteId);
      
      // Check and create Sites list
      await this.createSitesList(this.siteId);
      
      // Check and create Customers list
      await this.createCustomersList(this.siteId);
      
      console.log('SharePoint lists verified/created successfully');
    } catch (error) {
      console.error('Error creating SharePoint lists:', error);
    }
  }

  private async createTicketsList(siteId: string): Promise<void> {
    try {
      // Check if list exists
      await this.graphClient.api(`/sites/${siteId}/lists/Tickets`).get();
    } catch (error) {
      // List doesn't exist, create it
      const listDefinition = {
        displayName: 'Tickets',
        columns: [
          { name: 'TicketID', text: {} },
          { name: 'Status', choice: { choices: ['New', 'Assigned', 'In Progress', 'Complete', 'Closed'] } },
          { name: 'Priority', choice: { choices: ['Low', 'Normal', 'High', 'Critical'] } },
          { name: 'Customer', text: {} },
          { name: 'Site', text: {} },
          { name: 'AssetIDs', text: {} },
          { name: 'Category', text: {} },
          { name: 'Description', text: {} },
          { name: 'ScheduledStart', dateTime: {} },
          { name: 'ScheduledEnd', dateTime: {} },
          { name: 'AssignedTo', text: {} },
          { name: 'SLA_Due', dateTime: {} },
          { name: 'Resolution', text: {} },
          { name: 'ClosedBy', text: {} },
          { name: 'ClosedDate', dateTime: {} },
          { name: 'GeoLocation', text: {} },
          { name: 'Tags', text: {} }
        ],
        list: {
          template: 'genericList'
        }
      };
      
      await this.graphClient.api(`/sites/${siteId}/lists`).post(listDefinition);
    }
  }

  private async createSitesList(siteId: string): Promise<void> {
    try {
      await this.graphClient.api(`/sites/${siteId}/lists/Sites`).get();
    } catch (error) {
      const listDefinition = {
        displayName: 'Sites',
        columns: [
          { name: 'Address', text: {} },
          { name: 'City', text: {} },
          { name: 'State', text: {} },
          { name: 'ZipCode', text: {} },
          { name: 'Latitude', number: {} },
          { name: 'Longitude', number: {} },
          { name: 'ContactName', text: {} },
          { name: 'ContactPhone', text: {} },
          { name: 'ContactEmail', text: {} }
        ],
        list: {
          template: 'genericList'
        }
      };
      
      await this.graphClient.api(`/sites/${siteId}/lists`).post(listDefinition);
    }
  }

  private async createCustomersList(siteId: string): Promise<void> {
    try {
      await this.graphClient.api(`/sites/${siteId}/lists/Customers`).get();
    } catch (error) {
      const listDefinition = {
        displayName: 'Customers',
        columns: [
          { name: 'ContactName', text: {} },
          { name: 'ContactPhone', text: {} },
          { name: 'ContactEmail', text: {} },
          { name: 'Address', text: {} },
          { name: 'City', text: {} },
          { name: 'State', text: {} },
          { name: 'ZipCode', text: {} }
        ],
        list: {
          template: 'genericList'
        }
      };
      
      await this.graphClient.api(`/sites/${siteId}/lists`).post(listDefinition);
    }
  }
}