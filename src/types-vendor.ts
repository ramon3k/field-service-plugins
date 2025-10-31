// Vendor Compliance Management Types

export type Vendor = {
  VendorID: string
  VendorName: string
  ContactName?: string
  ContactEmail?: string
  ContactPhone?: string
  Address?: string
  City?: string
  State?: string
  ZipCode?: string
  
  // State License Compliance
  StateLicenseNumber?: string
  StateLicenseExpiration?: string
  StateLicenseStatus?: 'Active' | 'Expired' | 'Expiring Soon' | 'Not Required'
  
  // Insurance Compliance
  COIProvider?: string
  COIPolicyNumber?: string
  COIExpiration?: string
  COIStatus?: 'Active' | 'Expired' | 'Expiring Soon' | 'Not Required'
  
  // Additional Certifications
  Certifications?: string // JSON or comma-separated list
  
  // Status and Notes
  VendorStatus: 'Active' | 'Inactive' | 'Suspended'
  ComplianceNotes?: string
  Notes?: string
  
  CreatedAt?: string
  UpdatedAt?: string
}

export type VendorFilters = {
  search: string
  state: string
  vendorStatus: string
  complianceStatus: 'All' | 'Compliant' | 'Expiring Soon' | 'Non-Compliant'
}
