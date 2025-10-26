import React, { useState, useEffect } from 'react'
import { Customer } from '../types'

interface CustomerEditModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSave: (customer: Customer) => Promise<void>
  onDelete: (customerId: string, customerName: string) => Promise<void>
}

export function CustomerEditModal({ customer, isOpen, onClose, onSave, onDelete }: CustomerEditModalProps) {
  const [editForm, setEditForm] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (customer && isOpen) {
      setEditForm({ ...customer })
    }
  }, [customer, isOpen])

  function updateEditForm<K extends keyof Customer>(key: K, value: any) {
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
      console.error('Error saving customer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!editForm) return
    
    if (!confirm(`Are you sure you want to delete customer "${editForm.Name}"? This action cannot be undone and may affect related tickets and licenses.`)) {
      return
    }
    
    try {
      setIsDeleting(true)
      await onDelete(editForm.CustomerID!, editForm.Name!)
      onClose()
    } catch (error) {
      console.error('Error deleting customer:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !editForm) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Customer</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="grid">
            <div className="col-12">
              <label>Customer ID</label>
              <input 
                type="text" 
                value={editForm.CustomerID} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            
            <div className="col-12">
              <label>Customer Name *</label>
              <input 
                required
                value={editForm.Name || ''} 
                onChange={e => updateEditForm('Name', e.target.value)} 
                placeholder="Enter customer name" 
              />
            </div>
            
            <div className="col-6">
              <label>Contact Name</label>
              <input 
                value={editForm.Contact || ''} 
                onChange={e => updateEditForm('Contact', e.target.value)} 
                placeholder="Primary contact person" 
              />
            </div>
            
            <div className="col-6">
              <label>Phone</label>
              <input 
                type="tel"
                value={editForm.Phone || ''} 
                onChange={e => updateEditForm('Phone', e.target.value)} 
                placeholder="(555) 123-4567" 
              />
            </div>
            
            <div className="col-12">
              <label>Email</label>
              <input 
                type="email"
                value={editForm.Email || ''} 
                onChange={e => updateEditForm('Email', e.target.value)} 
                placeholder="contact@company.com" 
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
              <label>Notes</label>
              <textarea 
                value={editForm.Notes || ''} 
                onChange={e => updateEditForm('Notes', e.target.value)} 
                placeholder="Additional notes about this customer..."
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
            {isDeleting ? 'Deleting...' : 'Delete Customer'}
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn" style={{ backgroundColor: '#666' }}>
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="btn"
              disabled={isSaving || isDeleting || !editForm.Name}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}