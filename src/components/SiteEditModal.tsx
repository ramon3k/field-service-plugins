import React, { useState, useEffect } from 'react'
import { Site, Customer } from '../types'

interface SiteEditModalProps {
  site: Site | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
  onSave: (site: Site) => Promise<void>
  onDelete: (siteId: string, siteName: string) => Promise<void>
}

export function SiteEditModal({ site, customers, isOpen, onClose, onSave, onDelete }: SiteEditModalProps) {
  const [editForm, setEditForm] = useState<Site | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (site && isOpen) {
      setEditForm({ ...site })
    }
  }, [site, isOpen])

  function updateEditForm<K extends keyof Site>(key: K, value: any) {
    if (editForm) {
      setEditForm(prev => prev ? { ...prev, [key]: value } : null)
    }
  }

  async function handleSave() {
    if (!editForm) return
    
    try {
      setIsSaving(true)
      await onSave(editForm)
      onClose()
    } catch (error) {
      console.error('Error saving site:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!editForm?.SiteID) return
    
    if (!confirm(`Are you sure you want to delete site "${editForm.Site}" for ${editForm.Customer}? This action cannot be undone and may affect related tickets and licenses.`)) {
      return
    }
    
    try {
      setIsDeleting(true)
      await onDelete(editForm.SiteID, editForm.Site)
      onClose()
    } catch (error) {
      console.error('Error deleting site:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !editForm) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Site</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="grid">
            <div className="col-12">
              <label>Site ID</label>
              <input 
                type="text" 
                value={editForm.SiteID} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            
            <div className="col-6">
              <label>Customer *</label>
              <select 
                required
                value={editForm.Customer} 
                onChange={e => updateEditForm('Customer', e.target.value)}
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.CustomerID} value={c.Name}>{c.Name}</option>)}
              </select>
            </div>
            
            <div className="col-6">
              <label>Site Name *</label>
              <input 
                required
                value={editForm.Site || ''} 
                onChange={e => updateEditForm('Site', e.target.value)} 
                placeholder="Enter site name" 
              />
            </div>
            
            <div className="col-6">
              <label>Contact Name</label>
              <input 
                value={editForm.ContactName || ''} 
                onChange={e => updateEditForm('ContactName', e.target.value)} 
                placeholder="Site contact person" 
              />
            </div>
            
            <div className="col-6">
              <label>Phone</label>
              <input 
                type="tel"
                value={editForm.ContactPhone || ''} 
                onChange={e => updateEditForm('ContactPhone', e.target.value)} 
                placeholder="(555) 123-4567" 
              />
            </div>
            
            <div className="col-12">
              <label>Address</label>
              <textarea 
                value={editForm.Address || ''} 
                onChange={e => updateEditForm('Address', e.target.value)} 
                placeholder="Street address, city, state, zip"
                rows={3}
              />
            </div>
            
            <div className="col-12">
              <label>GeoLocation (Latitude, Longitude)</label>
              <input 
                type="text"
                value={editForm.GeoLocation || ''} 
                onChange={e => updateEditForm('GeoLocation', e.target.value)} 
                placeholder="40.7128,-74.0060" 
              />
              <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Format: latitude,longitude (e.g., 40.7128,-74.0060)
              </small>
            </div>
            
            <div className="col-12">
              <label>Notes</label>
              <textarea 
                value={editForm.Notes || ''} 
                onChange={e => updateEditForm('Notes', e.target.value)} 
                placeholder="Additional notes about this site..."
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={handleDelete} 
            className="btn" 
            style={{ backgroundColor: '#dc3545' }}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? 'Deleting...' : 'Delete Site'}
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn" style={{ backgroundColor: '#666' }}>
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="btn"
              disabled={isSaving || isDeleting || !editForm.Customer || !editForm.Site}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}