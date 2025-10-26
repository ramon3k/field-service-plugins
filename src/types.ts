export type Ticket = {
  TicketID: string
  Title: string
  Status: 'New' | 'Scheduled' | 'In-Progress' | 'On-Hold' | 'Complete' | 'Closed' | string
  Priority: 'Low'|'Normal'|'High'|'Critical'|string
  Customer: string
  Site: string
  AssetIDs?: string // Comma-separated Asset IDs affected by this ticket
  LicenseIDs?: string // Comma-separated License IDs affected by this ticket
  Category: string
  Description: string
  ScheduledStart: string
  ScheduledEnd: string
  AssignedTo: string
  Owner?: string // Coordinator responsible for this ticket
  SLA_Due: string
  Resolution: string
  ClosedBy: string
  ClosedDate: string
  GeoLocation: string
  Tags: string
  CreatedAt: string
  UpdatedAt: string
  CoordinatorNotes?: CoordinatorNote[]
  AuditTrail?: AuditEntry[]
}

export type AuditEntry = {
  id: string
  timestamp: string
  user: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  notes?: string
}

export type CoordinatorNote = {
  NoteID: string
  CoordinatorName: string
  Timestamp: string
  Note: string
}

export type Vendor = {
  VendorID: string
  Name: string
  Contact: string
  Phone: string
  Email: string
  ServiceAreas: string[]
  Specialties: string[]
  CitiesServed?: string
  Rating: number
  ServicesTexas?: boolean
  Notes: string
  CreatedAt?: string
  // Vendor Compliance Tracking
  VendorStatus?: 'Active' | 'Inactive' | 'Suspended' | string
  StateLicenseNumber?: string
  StateLicenseExpiration?: string
  COIProvider?: string
  COIPolicyNumber?: string
  COIExpiration?: string
  Certifications?: string
  ComplianceNotes?: string
}

export type Customer = {
  CustomerID?: string
  Customer?: string // Legacy field name for compatibility
  Name?: string
  Contact?: string
  ContactEmail?: string
  ContactPhone?: string
  Phone?: string
  Email?: string
  Address?: string
  BillingAddress?: string
  AccountNumber?: string
  PrimaryContact?: string
  Industry?: string
  AccountManager?: string
  Notes?: string
  CreatedAt?: string
  UpdatedAt?: string
}

export type Asset = {
  AssetID: string
  Customer: string
  Site: string
  Type: string
  Make?: string
  Model?: string
  Serial?: string
  SerialNumber?: string // Legacy field name for compatibility
  Location?: string
  Status?: string
  PurchaseDate?: string
  InstallDate?: string
  InstalledAt?: string
  WarrantyExpiration?: string
  WarrantyExpires?: string
  WarrantyEnd?: string
  LastService?: string
  IPAddress?: string
  Notes?: string
  CreatedAt?: string
  UpdatedAt?: string
}

export type Site = {
  SiteID?: string
  CustomerID?: string
  Customer: string
  Site: string
  Address?: string
  ContactName?: string
  ContactPhone?: string
  SiteType?: string
  GeoLocation?: string
  City?: string
  State?: string
  PostalCode?: string
  Country?: string
  TimeZone?: string
  Latitude?: string
  Longitude?: string
  Notes?: string
  CreatedAt?: string
  UpdatedAt?: string
}

export type License = {
  LicenseID: string
  Customer: string
  Site: string
  SoftwareName: string
  SoftwareVersion: string
  LicenseType: 'Perpetual' | 'Subscription' | 'Term' | 'Trial' | string
  LicenseKey?: string
  LicenseCount: number // Number of seats/installations
  UsedCount?: number // Number of seats currently in use
  ExpirationDate?: string // License expiration date
  ServicePlan?: string // Software service plan (e.g., 'Standard Support', 'Premium Support', 'Enterprise')
  ServicePlanExpiration?: string // Service plan expiration date
  Vendor: string // Software vendor/publisher
  PurchaseDate?: string
  PurchasePrice?: number
  RenewalDate?: string
  RenewalPrice?: number
  ContactEmail?: string // Vendor contact for renewals
  Status: 'Active' | 'Expired' | 'Expiring Soon' | 'Inactive' | string
  InstallationPath?: string
  LastUpdated?: string // When software was last updated
  ComplianceNotes?: string
  Notes?: string
  CreatedAt?: string
  UpdatedAt?: string
}

export type UserRole = 'SystemAdmin' | 'Admin' | 'Coordinator' | 'Technician'

export type User = {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  vendor?: string // Vendor/Company name for technicians
  passwordHash?: string // Optional - for demo purposes
  isActive: boolean
  createdAt: string
  permissions?: string[]
}

export type LoginCredentials = {
  username: string
  password: string
}

export type AuthUser = {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  permissions?: string[]
  // Multi-tenant fields
  tenantId?: string
  tenantCode?: string
  companyCode?: string
  companyName?: string
  companyDisplayName?: string
  subscriptionTier?: string
  maxUsers?: number
  isSystemAdmin?: boolean
  isTenantAdmin?: boolean
}

export type ActivityLog = {
  id: string
  userId: string
  username: string
  action: string
  details: string
  timestamp: string
  userTimezone?: string
  ipAddress?: string
  userAgent?: string
}

export type Attachment = {
  AttachmentID: string
  TicketID: string
  OriginalFileName: string
  FileType: string
  FileSize: number
  UploadedAt: string
  UploadedByName?: string
  Description?: string
}
