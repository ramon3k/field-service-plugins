import React, { useEffect, useState } from 'react'
import { vendorApiService } from '../VendorApiService'
import { siteApiService } from '../SiteApiService'
import type { Vendor, Site } from '../types'
import VendorEditModal from './VendorEditModal'

type VendorFilters = {
  search: string
  status: string
  specialty: string
  compliance: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<VendorFilters>({
    search: '',
    status: 'All',
    specialty: 'All',
    compliance: 'All'
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [vendorsData, sitesData] = await Promise.all([
        vendorApiService.getVendors(), 
        siteApiService.getSites()
      ])
      setVendors(vendorsData)
      setSites(sitesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function startAddNew() {
    const newVendor: Vendor = {
      VendorID: '',
      Name: '',
      Contact: '',
      Phone: '',
      Email: '',
      ServiceAreas: [],
      Specialties: [],
      CitiesServed: '',
      Rating: 5,
      Notes: '',
      VendorStatus: 'Active',
      StateLicenseNumber: '',
      StateLicenseExpiration: '',
      COIProvider: '',
      COIPolicyNumber: '',
      COIExpiration: '',
      Certifications: '',
      ComplianceNotes: ''
    }
    setEditingVendor(newVendor)
    setIsEditModalOpen(true)
  }

  function startEdit(vendor: Vendor) {
    setEditingVendor(vendor)
    setIsEditModalOpen(true)
  }

  async function saveEdit(vendor: Vendor) {
    try {
      if (!vendor.VendorID || vendor.VendorID === '') {
        // Creating new vendor
        console.log('VendorsPage.saveEdit: Creating new vendor:', vendor.Name)
        await vendorApiService.createVendor(vendor)
      } else {
        // Updating existing vendor
        console.log('VendorsPage.saveEdit: Updating vendor:', vendor.VendorID)
        await vendorApiService.updateVendor(vendor.VendorID, vendor)
      }
      refresh()
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('VendorsPage.saveEdit: Error saving vendor:', error)
      alert('Error saving vendor: ' + (error as Error).message)
      throw error
    }
  }

  async function deleteVendor(vendorID: string) {
    try {
      await vendorApiService.deleteVendor(vendorID)
      refresh()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      alert('Failed to delete vendor')
    }
  }

  function getComplianceStatus(vendor: Vendor): 'Compliant' | 'Expiring Soon' | 'Non-Compliant' {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    let hasStateLicense = false
    let hasCOI = false
    let stateLicenseValid = false
    let coiValid = false

    // Check state license
    if (vendor.StateLicenseNumber && vendor.StateLicenseExpiration) {
      hasStateLicense = true
      const licenseExp = new Date(vendor.StateLicenseExpiration)
      stateLicenseValid = licenseExp > now
      if (licenseExp <= thirtyDaysFromNow && licenseExp > now) {
        return 'Expiring Soon'
      }
    }

    // Check COI
    if (vendor.COIProvider && vendor.COIExpiration) {
      hasCOI = true
      const coiExp = new Date(vendor.COIExpiration)
      coiValid = coiExp > now
      if (coiExp <= thirtyDaysFromNow && coiExp > now) {
        return 'Expiring Soon'
      }
    }

    // Determine overall status
    if (hasStateLicense && hasCOI && stateLicenseValid && coiValid) {
      return 'Compliant'
    } else if (!hasStateLicense && !hasCOI) {
      return 'Compliant' // No compliance tracking set up yet
    } else {
      return 'Non-Compliant'
    }
  }

  function getComplianceColor(status: string): string {
    switch (status) {
      case 'Compliant': return '#28a745'
      case 'Expiring Soon': return '#ffc107'
      case 'Non-Compliant': return '#dc3545'
      default: return '#6c757d'
    }
  }

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesSearch = 
        vendor.Name?.toLowerCase().includes(search) ||
        vendor.Contact?.toLowerCase().includes(search) ||
        vendor.Phone?.toLowerCase().includes(search) ||
        vendor.Email?.toLowerCase().includes(search) ||
        vendor.CitiesServed?.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.status !== 'All' && vendor.VendorStatus !== filters.status) {
      return false
    }

    // Specialty filter
    if (filters.specialty !== 'All') {
      const specialties = vendor.Specialties || []
      if (!specialties.includes(filters.specialty)) {
        return false
      }
    }

    // Compliance filter
    if (filters.compliance !== 'All') {
      const complianceStatus = getComplianceStatus(vendor)
      if (complianceStatus !== filters.compliance) {
        return false
      }
    }

    return true
  })

  // Get unique specialties for filter
  const allSpecialties = [...new Set(vendors.flatMap(v => v.Specialties || []))].sort()

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <div className="title">
          Vendors {loading && <span className="muted">Loading…</span>}
        </div>
        <button onClick={startAddNew} className="btn primary" style={{backgroundColor: '#28a745'}}>
          + Add New Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="row" style={{gap: 8, marginBottom: 12}}>
        <div style={{flex: '1 1 200px'}}>
          <label>Search</label>
          <input
            type="search"
            placeholder="Search vendors..."
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <div style={{flex: '0 0 150px'}}>
          <label>Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div style={{flex: '0 0 180px'}}>
          <label>Specialty</label>
          <select value={filters.specialty} onChange={e => setFilters({...filters, specialty: e.target.value})}>
            <option value="All">All Specialties</option>
            {allSpecialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div style={{flex: '0 0 160px'}}>
          <label>Compliance</label>
          <select value={filters.compliance} onChange={e => setFilters({...filters, compliance: e.target.value})}>
            <option value="All">All</option>
            <option value="Compliant">Compliant</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Non-Compliant">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Vendors List */}
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #2a3a5f', textAlign: 'left'}}>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Vendor</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Contact</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Specialties</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Rating</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Compliance</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Status</th>
              <th style={{padding: '12px 8px', color: '#9fb3ff'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => {
              const complianceStatus = getComplianceStatus(vendor)
              return (
                <tr key={vendor.VendorID} style={{borderBottom: '1px solid #1a2540'}}>
                  <td style={{padding: '12px 8px'}}>
                    <div style={{fontWeight: 600}}>{vendor.Name}</div>
                    <div className="muted" style={{fontSize: 12}}>{vendor.CitiesServed || 'No cities listed'}</div>
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <div style={{fontSize: 13}}>{vendor.Contact || '-'}</div>
                    <div className="muted" style={{fontSize: 12}}>{vendor.Phone || '-'}</div>
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <div style={{fontSize: 13}}>
                      {vendor.Specialties && vendor.Specialties.length > 0 
                        ? vendor.Specialties.slice(0, 2).join(', ') + (vendor.Specialties.length > 2 ? '...' : '')
                        : '-'}
                    </div>
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <span style={{color: '#ffc107'}}>★</span> {vendor.Rating || 5}
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: getComplianceColor(complianceStatus) + '20',
                      color: getComplianceColor(complianceStatus),
                      border: `1px solid ${getComplianceColor(complianceStatus)}`
                    }}>
                      {complianceStatus}
                    </span>
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: vendor.VendorStatus === 'Active' ? '#28a74520' : '#6c757d20',
                      color: vendor.VendorStatus === 'Active' ? '#28a745' : '#6c757d'
                    }}>
                      {vendor.VendorStatus || 'Active'}
                    </span>
                  </td>
                  <td style={{padding: '12px 8px'}}>
                    <button 
                      onClick={() => startEdit(vendor)}
                      className="btn"
                      style={{padding: '6px 12px', fontSize: 13}}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredVendors.length === 0 && !loading && (
          <div className="muted" style={{textAlign: 'center', padding: 40}}>
            {filters.search || filters.status !== 'All' || filters.specialty !== 'All' || filters.compliance !== 'All'
              ? 'No vendors match your filters'
              : 'No vendors yet. Click "+ Add New Vendor" to get started.'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <VendorEditModal
          vendor={editingVendor}
          sites={sites}
          onSave={saveEdit}
          onDelete={deleteVendor}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  )
}