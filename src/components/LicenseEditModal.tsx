import React, { useState, useEffect } from 'react'
import { License, Customer, Site } from '../types'

interface LicenseEditModalProps {
  license: License | null
  customers: Customer[]
  sites: Site[]
  isOpen: boolean
  onClose: () => void
  onSave: (license: License) => Promise<void>
  onDelete: (licenseId: string, softwareName: string) => Promise<void>
}

export function LicenseEditModal({ license, customers, sites, isOpen, onClose, onSave, onDelete }: LicenseEditModalProps) {
  const [editForm, setEditForm] = useState<License | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (license && isOpen) {
      setEditForm({ ...license })
    }
  }, [license, isOpen])

  const filteredSites = sites.filter(s => !editForm?.Customer || s.Customer === editForm.Customer)

  function updateEditForm<K extends keyof License>(key: K, value: any) {
    if (editForm) {
      setEditForm(prev => prev ? { ...prev, [key]: value } : null)
      
      // Reset site if customer changes
      if (key === 'Customer') {
        setEditForm(prev => prev ? { ...prev, Site: '' } : null)
      }
    }
  }

  async function handleSave() {
    if (!editForm) return
    
    try {
      setIsSaving(true)
      await onSave(editForm)
      onClose()
    } catch (error) {
      console.error('Error saving license:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!editForm) return
    
    if (!confirm(`Are you sure you want to delete the license for "${editForm.SoftwareName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      setIsDeleting(true)
      await onDelete(editForm.LicenseID, editForm.SoftwareName)
      onClose()
    } catch (error) {
      console.error('Error deleting license:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !editForm) return null

  const isNewLicense = !editForm.LicenseID || editForm.LicenseID === ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{isNewLicense ? 'Add New License' : 'Edit License'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="grid">
            {!isNewLicense && (
              <div className="col-6">
                <label>License ID</label>
                <input 
                  type="text" 
                  value={editForm.LicenseID} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
            )}
            
            <div className={isNewLicense ? "col-12" : "col-6"}>
              <label>Status *</label>
              <select 
                required 
                value={editForm.Status || 'Active'} 
                onChange={e => updateEditForm('Status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div className="col-6">
              <label>Customer *</label>
              <select 
                required 
                value={editForm.Customer} 
                onChange={e => updateEditForm('Customer', e.target.value)}
                autoComplete="off"
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.CustomerID} value={c.Name}>{c.Name}</option>)}
              </select>
            </div>
            
            <div className="col-6">
              <label>Site *</label>
              <select 
                required 
                value={editForm.Site} 
                onChange={e => updateEditForm('Site', e.target.value)}
                autoComplete="off"
              >
                <option value="">— Select Site —</option>
                {filteredSites.map(s => <option key={s.Customer+'|'+s.Site} value={s.Site}>{s.Site}</option>)}
              </select>
            </div>
            
            <div className="col-6">
              <label>Software Name *</label>
              <input 
                required
                value={editForm.SoftwareName} 
                onChange={e => updateEditForm('SoftwareName', e.target.value)} 
                placeholder="Microsoft Office, Adobe CC, etc." 
              />
            </div>
            
            <div className="col-6">
              <label>Software Version</label>
              <input 
                value={editForm.SoftwareVersion || ''} 
                onChange={e => updateEditForm('SoftwareVersion', e.target.value)} 
                placeholder="2024, v12.1, etc." 
              />
            </div>
            
            <div className="col-4">
              <label>License Type *</label>
              <select 
                required 
                value={editForm.LicenseType} 
                onChange={e => updateEditForm('LicenseType', e.target.value)}
              >
                <option value="Subscription">Subscription</option>
                <option value="Perpetual">Perpetual</option>
                <option value="Term">Term</option>
                <option value="Trial">Trial</option>
              </select>
            </div>
            
            <div className="col-4">
              <label>License Count *</label>
              <input 
                type="number"
                min="1"
                required
                value={editForm.LicenseCount || 1} 
                onChange={e => updateEditForm('LicenseCount', parseInt(e.target.value) || 1)} 
              />
            </div>
            
            <div className="col-4">
              <label>Used Count</label>
              <input 
                type="number"
                min="0"
                value={editForm.UsedCount || 0} 
                onChange={e => updateEditForm('UsedCount', parseInt(e.target.value) || 0)} 
              />
            </div>
            
            <div className="col-6">
              <label>Expiration Date</label>
              <input 
                type="date"
                value={editForm.ExpirationDate ? editForm.ExpirationDate.split('T')[0] : ''} 
                onChange={e => updateEditForm('ExpirationDate', e.target.value)} 
              />
            </div>
            
            <div className="col-6">
              <label>Vendor</label>
              <input 
                value={editForm.Vendor || ''} 
                onChange={e => updateEditForm('Vendor', e.target.value)} 
                placeholder="Microsoft, Adobe, etc." 
              />
            </div>
            
            <div className="col-6">
              <label>Service Plan</label>
              <input 
                value={editForm.ServicePlan || ''} 
                onChange={e => updateEditForm('ServicePlan', e.target.value)} 
                placeholder="Standard Support, Premium, etc." 
              />
            </div>
            
            <div className="col-6">
              <label>Service Plan Expiration</label>
              <input 
                type="date"
                value={editForm.ServicePlanExpiration ? editForm.ServicePlanExpiration.split('T')[0] : ''} 
                onChange={e => updateEditForm('ServicePlanExpiration', e.target.value)} 
              />
            </div>
            
            <div className="col-12">
              <label>Notes</label>
              <textarea 
                value={editForm.Notes || ''} 
                onChange={e => updateEditForm('Notes', e.target.value)} 
                placeholder="Additional notes about this license..."
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          {!isNewLicense && (
            <button 
              onClick={handleDelete} 
              className="btn" 
              style={{ backgroundColor: '#dc3545' }}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? 'Deleting...' : 'Delete License'}
            </button>
          )}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn" style={{ backgroundColor: '#666' }}>
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="btn"
              disabled={isSaving || isDeleting || !editForm.Customer || !editForm.Site || !editForm.SoftwareName}
            >
              {isSaving ? (isNewLicense ? 'Creating...' : 'Saving...') : (isNewLicense ? 'Create License' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}