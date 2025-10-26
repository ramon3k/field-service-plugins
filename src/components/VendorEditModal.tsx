import React, { useState, useEffect } from 'react'
import type { Vendor, Site } from '../types'

type VendorEditModalProps = {
  vendor: Vendor | null
  sites: Site[]
  onSave: (vendor: Vendor) => void
  onDelete?: (vendorID: string) => void
  onClose: () => void
}

export default function VendorEditModal({ vendor, sites, onSave, onDelete, onClose }: VendorEditModalProps) {
  const [editForm, setEditForm] = useState<Vendor>(vendor || {
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
  } as Vendor)
  
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    if (vendor) {
      setEditForm(vendor)
    }
  }, [vendor])
  
  const isNewVendor = !editForm.VendorID || editForm.VendorID === ''
  
  function updateEditForm<K extends keyof Vendor>(key: K, value: Vendor[K]) {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }
  
  const handleServiceAreaToggle = (siteKey: string, checked: boolean) => {
    const currentAreas = editForm.ServiceAreas || []
    if (checked) {
      if (!currentAreas.includes(siteKey)) {
        updateEditForm('ServiceAreas', [...currentAreas, siteKey])
      }
    } else {
      updateEditForm('ServiceAreas', currentAreas.filter(area => area !== siteKey))
    }
  }

  const handleSpecialtyToggle = (specialty: string, checked: boolean) => {
    const currentSpecialties = editForm.Specialties || []
    if (checked) {
      if (!currentSpecialties.includes(specialty)) {
        updateEditForm('Specialties', [...currentSpecialties, specialty])
      }
    } else {
      updateEditForm('Specialties', currentSpecialties.filter(s => s !== specialty))
    }
  }
  
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.Name) {
      alert('Vendor name is required')
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(editForm)
      onClose()
    } catch (error) {
      console.error('Error saving vendor:', error)
      alert('Failed to save vendor')
    } finally {
      setIsSaving(false)
    }
  }
  
  async function handleDelete() {
    if (!editForm.VendorID) return
    if (!confirm(`Delete vendor "${editForm.Name}"?`)) return
    
    try {
      if (onDelete) {
        await onDelete(editForm.VendorID)
      }
      onClose()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      alert('Failed to delete vendor')
    }
  }
  
  const specialtyOptions = ['Access Control', 'Video Management', 'Intrusion Alarm', 'Fire Safety', 'Network Infrastructure', 'IT Services', 'HVAC', 'Electrical', 'Plumbing']
  
  // Group sites by customer
  const sitesByCustomer = sites.reduce((acc, site) => {
    const customer = site.Customer || 'Unknown'
    if (!acc[customer]) acc[customer] = []
    acc[customer].push(site)
    return acc
  }, {} as Record<string, Site[]>)
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 900, maxHeight: '90vh', overflowY: 'auto'}}>
        <div className="modal-header">
          <h3>{isNewVendor ? 'Add New Vendor' : 'Edit Vendor'}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="row">
              {/* Basic Information */}
              {!isNewVendor && (
                <div className="col-6">
                  <label>Vendor ID</label>
                  <input value={editForm.VendorID} disabled />
                </div>
              )}
              
              <div className={isNewVendor ? "col-6" : "col-6"}>
                <label>Vendor Status</label>
                <select value={editForm.VendorStatus || 'Active'} onChange={e => updateEditForm('VendorStatus', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              
              <div className="col-6">
                <label>Company Name *</label>
                <input 
                  required 
                  value={editForm.Name || ''} 
                  onChange={e => updateEditForm('Name', e.target.value)} 
                  placeholder="ABC Security Solutions"
                />
              </div>
              
              <div className="col-6">
                <label>Primary Contact</label>
                <input 
                  value={editForm.Contact || ''} 
                  onChange={e => updateEditForm('Contact', e.target.value)} 
                  placeholder="John Smith"
                />
              </div>
              
              <div className="col-6">
                <label>Phone</label>
                <input 
                  value={editForm.Phone || ''} 
                  onChange={e => updateEditForm('Phone', e.target.value)} 
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="col-6">
                <label>Email</label>
                <input 
                  type="email"
                  value={editForm.Email || ''} 
                  onChange={e => updateEditForm('Email', e.target.value)} 
                  placeholder="contact@vendor.com"
                />
              </div>
              
              <div className="col-12">
                <label>Cities Served</label>
                <input 
                  value={editForm.CitiesServed || ''} 
                  onChange={e => updateEditForm('CitiesServed', e.target.value)}
                  placeholder="Austin, Dallas, Houston, San Antonio"
                />
              </div>
              
              <div className="col-6">
                <label>Rating (1-5)</label>
                <select value={editForm.Rating || 5} onChange={e => updateEditForm('Rating', parseInt(e.target.value))}>
                  <option value={1}>1 Star - Poor</option>
                  <option value={2}>2 Stars - Fair</option>
                  <option value={3}>3 Stars - Good</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={5}>5 Stars - Excellent</option>
                </select>
              </div>
              
              {/* Compliance Tracking Section */}
              <div className="col-12" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #2a3a5f' }}>
                <strong style={{ color: '#9fb3ff', fontSize: '16px' }}>📋 Vendor Compliance Tracking</strong>
              </div>
              
              <div className="col-6">
                <label>State License Number</label>
                <input 
                  value={editForm.StateLicenseNumber || ''} 
                  onChange={e => updateEditForm('StateLicenseNumber', e.target.value)} 
                  placeholder="TX-12345"
                />
              </div>
              
              <div className="col-6">
                <label>State License Expiration</label>
                <input 
                  type="date"
                  value={editForm.StateLicenseExpiration ? editForm.StateLicenseExpiration.split('T')[0] : ''} 
                  onChange={e => updateEditForm('StateLicenseExpiration', e.target.value)} 
                />
              </div>
              
              <div className="col-6">
                <label>COI Provider (Insurance Company)</label>
                <input 
                  value={editForm.COIProvider || ''} 
                  onChange={e => updateEditForm('COIProvider', e.target.value)} 
                  placeholder="State Farm, Allstate, etc."
                />
              </div>
              
              <div className="col-6">
                <label>COI Policy Number</label>
                <input 
                  value={editForm.COIPolicyNumber || ''} 
                  onChange={e => updateEditForm('COIPolicyNumber', e.target.value)} 
                  placeholder="POL-123456"
                />
              </div>
              
              <div className="col-6">
                <label>COI Expiration Date</label>
                <input 
                  type="date"
                  value={editForm.COIExpiration ? editForm.COIExpiration.split('T')[0] : ''} 
                  onChange={e => updateEditForm('COIExpiration', e.target.value)} 
                />
              </div>
              
              <div className="col-6">
                <label>Certifications</label>
                <input 
                  value={editForm.Certifications || ''} 
                  onChange={e => updateEditForm('Certifications', e.target.value)} 
                  placeholder="NICET, ASIS, etc."
                />
              </div>
              
              <div className="col-12">
                <label>Compliance Notes</label>
                <textarea 
                  value={editForm.ComplianceNotes || ''} 
                  onChange={e => updateEditForm('ComplianceNotes', e.target.value)} 
                  placeholder="Additional compliance information, renewal dates, special requirements..."
                  rows={2}
                />
              </div>
              
              {/* Service Specialties */}
              <div className="col-12" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2a3a5f' }}>
                <label>Service Specialties</label>
                <div className="row" style={{gap: 12, marginTop: 8}}>
                  {specialtyOptions.map(specialty => (
                    <label key={specialty} style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 'auto', marginRight: 16}}>
                      <input 
                        type="checkbox" 
                        checked={(editForm.Specialties || []).includes(specialty)}
                        onChange={e => handleSpecialtyToggle(specialty, e.target.checked)}
                      />
                      <span style={{fontSize: 13}}>{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Service Areas */}
              <div className="col-12" style={{ marginTop: '16px' }}>
                <label>Sites They Can Service</label>
                <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #243252', borderRadius: 8, padding: 12, marginTop: 8}}>
                  {Object.keys(sitesByCustomer).length > 0 ? (
                    Object.entries(sitesByCustomer).map(([customer, customerSites]) => (
                      <div key={customer} style={{marginBottom: 16}}>
                        <div style={{fontWeight: 600, marginBottom: 8, color: '#9fb3ff', fontSize: 14}}>
                          {customer} ({customerSites.length} {customerSites.length === 1 ? 'site' : 'sites'})
                        </div>
                        <div className="row">
                          {customerSites.map(site => {
                            const siteKey = `${site.Customer} - ${site.Site}`
                            return (
                              <div key={site.SiteID || siteKey} className="col-6">
                                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12}}>
                                  <input 
                                    type="checkbox" 
                                    checked={(editForm.ServiceAreas || []).includes(siteKey)}
                                    onChange={e => handleServiceAreaToggle(siteKey, e.target.checked)}
                                  />
                                  <div>
                                    <div style={{fontWeight: 500}}>{site.Site}</div>
                                    <div className="muted">{site.Address || 'No address'}</div>
                                  </div>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="muted" style={{textAlign: 'center', padding: 16}}>
                      No sites available
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-12">
                <label>General Notes</label>
                <textarea 
                  value={editForm.Notes || ''} 
                  onChange={e => updateEditForm('Notes', e.target.value)} 
                  placeholder="Additional notes about this vendor..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            {!isNewVendor && onDelete && (
              <button 
                type="button" 
                onClick={handleDelete} 
                className="btn"
                style={{ 
                  backgroundColor: '#dc3545', 
                  marginRight: 'auto' 
                }}
              >
                Delete Vendor
              </button>
            )}
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={onClose} className="btn" style={{ backgroundColor: '#666' }}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn primary"
                disabled={isSaving}
              >
                {isSaving ? (isNewVendor ? 'Creating...' : 'Saving...') : (isNewVendor ? 'Create Vendor' : 'Save Changes')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
