// src/components/TicketEditModal.tsx
import React, { useState, useEffect } from 'react'
import { authService } from '../services/AuthService'
import { sqlApiService } from '../services/SqlApiService'
import DatePicker from './DatePicker'
import PrintableServiceTicket from './PrintableServiceTicket'
import AttachmentUpload from './AttachmentUpload'
import AttachmentList from './AttachmentList'
import type { Ticket, AuditEntry, CoordinatorNote, User } from '../types'

function sanitizeTicket(ticket: Ticket): Ticket {
  const sanitized: Ticket = { ...ticket }
  const stringFields: (keyof Ticket)[] = [
    'TicketID',
    'Title',
    'Status',
    'Priority',
    'Customer',
    'Site',
    'AssetIDs',
    'LicenseIDs',
    'Category',
    'Description',
    'ScheduledStart',
    'ScheduledEnd',
    'AssignedTo',
    'Owner',
    'SLA_Due',
    'Resolution',
    'ClosedBy',
    'ClosedDate',
    'GeoLocation',
    'Tags',
    'CreatedAt',
    'UpdatedAt'
  ]

  stringFields.forEach((field) => {
    const value = sanitized[field]
    if (value === null || value === undefined) {
      (sanitized as Record<string, unknown>)[field as string] = ''
    }
  })

  sanitized.CoordinatorNotes = ticket.CoordinatorNotes ? [...ticket.CoordinatorNotes] : []
  sanitized.AuditTrail = ticket.AuditTrail ? [...ticket.AuditTrail] : []

  return sanitized
}

type Props = {
  ticket: Ticket
  onClose: () => void
  onSave: (ticket: Ticket) => Promise<void>
  readonly?: boolean
  companyName?: string // Optional company name for print branding
}

export default function TicketEditModal({ ticket, onClose, onSave, readonly = false, companyName = 'Field Service' }: Props) {
  const [editedTicket, setEditedTicket] = useState<Ticket>(() => sanitizeTicket(ticket))
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history' | 'attachments'>('details')
  const [customers, setCustomers] = useState<string[]>([])
  const [allSites, setAllSites] = useState<any[]>([])
  const [filteredSites, setFilteredSites] = useState<string[]>([])
  const [assets, setAssets] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [attachmentRefresh, setAttachmentRefresh] = useState(0)

  useEffect(() => {
    setEditedTicket(sanitizeTicket(ticket))
    loadDropdownData()
  }, [ticket])

  useEffect(() => {
    // Filter sites when customer changes
    if (editedTicket.Customer) {
      const customerSites = allSites
        .filter(site => site.Customer === editedTicket.Customer)
        .map(site => site.Site)
      setFilteredSites(customerSites)
    } else {
      setFilteredSites([])
    }
  }, [editedTicket.Customer, allSites])

  const loadDropdownData = async () => {
    try {
      const [customerData, siteData, userData] = await Promise.all([
        sqlApiService.getCustomers(),
        sqlApiService.getSites(),
        sqlApiService.getUsers()
      ])

      const customerNames = (Array.isArray(customerData) ? customerData : [])
        .map((customer: any) => customer.Name || customer.Customer || customer.name || customer.customer)
        .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
        .sort((a, b) => a.localeCompare(b))
      const uniqueCustomerNames = [...new Set(customerNames)]

      let uniqueAssets: string[] = []
      try {
        const assetsResponse = await fetch('/data.json')
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json()
          if (Array.isArray(assetsData?.assets)) {
            const assetsArray = assetsData.assets as any[]
            const assetIds = assetsArray.reduce((acc: string[], asset: any) => {
              const rawId = asset?.AssetID || asset?.assetId || asset?.id
              if (typeof rawId === 'string') {
                const trimmed = rawId.trim()
                if (trimmed.length > 0) {
                  acc.push(trimmed)
                }
              }
              return acc
            }, [] as string[])

            uniqueAssets = [...new Set(assetIds)]
          }
        }
      } catch (assetError) {
        console.warn('TicketEditModal: Skipping asset preload due to error', assetError)
      }

      const siteList = Array.isArray(siteData) ? siteData : []
      const activeUsers = (Array.isArray(userData) ? userData : []).filter((user) => user.isActive)

  setCustomers(uniqueCustomerNames)
      setAllSites(siteList)
      setAssets(uniqueAssets)
      setUsers(activeUsers)
    } catch (error) {
      console.error('Failed to load dropdown data:', error)
      setCustomers([])
      setAllSites([])
      setAssets([])
      setUsers([])
    }
  }

  // Filter users for different dropdown roles
  const coordinatorsAndAdmins = users.filter(user => 
    user.isActive && (user.role === 'Coordinator' || user.role === 'Admin')
  )
  
  const technicians = users.filter(user => 
    user.isActive && user.role === 'Technician'
  )

  const createAuditEntry = (field: string, oldValue: any, newValue: any): AuditEntry => {
    const currentUser = authService.getCurrentUser()
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || 'Unknown User',
      action: 'Field Updated',
      field,
      oldValue: oldValue?.toString() || '',
      newValue: newValue?.toString() || '',
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Validate Resolution requirement for Closed status
      if (editedTicket.Status === 'Closed' && (!editedTicket.Resolution || editedTicket.Resolution.trim() === '')) {
        alert('A Resolution note is required before closing a ticket. Please provide a resolution description.')
        setLoading(false)
        return
      }

      // Auto-populate ClosedBy and ClosedDate when status changes to Closed
      let finalTicket = { ...editedTicket }
      if (editedTicket.Status === 'Closed' && ticket.Status !== 'Closed') {
        const currentUser = authService.getCurrentUser()
        finalTicket.ClosedBy = currentUser?.fullName || 'Unknown User'
        finalTicket.ClosedDate = new Date().toISOString()
      }
      
      // Create audit trail for changes
      const auditEntries: AuditEntry[] = []
      Object.keys(finalTicket).forEach((key) => {
        const field = key as keyof Ticket
        if (field !== 'AuditTrail' && field !== 'UpdatedAt' && field !== 'CoordinatorNotes' && finalTicket[field] !== ticket[field]) {
          auditEntries.push(createAuditEntry(field, ticket[field], finalTicket[field]))
        }
      })

      const updatedTicket: Ticket = {
        ...finalTicket,
        UpdatedAt: new Date().toISOString(),
        AuditTrail: [...(ticket.AuditTrail || []), ...auditEntries]
      }

      await onSave(updatedTicket)
      onClose()
    } catch (error) {
      console.error('Failed to save ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate SLA Due date based on Priority
  const calculateSLADue = (priority: string, fromDate: Date = new Date()): string => {
    const slaHours = {
      'Critical': 4,
      'High': 8,
      'Normal': 24,
      'Low': 72
    }
    
    const hours = slaHours[priority as keyof typeof slaHours] || 24
    const dueDate = new Date(fromDate)
    dueDate.setHours(dueDate.getHours() + hours)
    
    return dueDate.toISOString().slice(0, 16) // Format for datetime-local
  }

  const handleFieldChange = (field: keyof Ticket, value: string) => {
    setEditedTicket(prev => {
      const updated = {
        ...prev,
        [field]: value
      }
      
      // Clear site if customer changes
      if (field === 'Customer' && value !== prev.Customer) {
        updated.Site = ''
      }
      
      // Auto-populate GeoLocation when Site changes
      if (field === 'Site' && value) {
        const selectedSite = allSites.find(site => 
          site.Customer === prev.Customer && site.Site === value
        )
        
        if (selectedSite) {
          // Always update GeoLocation, even if it's empty (to clear previous values)
          updated.GeoLocation = selectedSite.GeoLocation || ''
        }
      }
      
      // Auto-calculate SLA Due when Priority changes
      if (field === 'Priority') {
        const baseDate = prev.ScheduledStart ? new Date(prev.ScheduledStart) : new Date()
        updated.SLA_Due = calculateSLADue(value, baseDate)
      }
      
      // Auto-calculate SLA Due when Scheduled Start changes and Priority is set
      if (field === 'ScheduledStart' && prev.Priority) {
        updated.SLA_Due = calculateSLADue(prev.Priority, new Date(value))
      }
      
      return updated
    })
  }

  const addNote = () => {
    if (!newNote.trim()) return
    
    const currentUser = authService.getCurrentUser()
    const note: CoordinatorNote = {
      NoteID: Date.now().toString(),
      CoordinatorName: currentUser?.fullName || 'Unknown User',
      Timestamp: new Date().toISOString(),
      Note: newNote.trim()
    }

    // Create audit entry for note addition
    const auditEntry = createAuditEntry('Note Added', '', `Added by ${note.CoordinatorName}: ${note.Note.substring(0, 50)}${note.Note.length > 50 ? '...' : ''}`)

    setEditedTicket(prev => ({
      ...prev,
      CoordinatorNotes: [...(prev.CoordinatorNotes || []), note],
      AuditTrail: [...(prev.AuditTrail || []), auditEntry]
    }))
    setNewNote('')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '95%',
        maxWidth: '900px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>
              {readonly ? '📋 Ticket History' : 'Edit Ticket'}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#4a5568', fontSize: '0.875rem' }}>
              Ticket ID: {editedTicket.TicketID}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              color: '#4a5568',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          {(['details', 'notes', 'attachments', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#3b82f6' : '#4a5568',
                fontWeight: activeTab === tab ? '500' : 'normal',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={editedTicket.Title ?? ''}
                  onChange={(e) => handleFieldChange('Title', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Customer */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Customer *
                </label>
                <select 
                  value={editedTicket.Customer ?? ''} 
                  onChange={(e) => handleFieldChange('Customer', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>

              {/* Site */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Site *
                </label>
                <select 
                  value={editedTicket.Site ?? ''} 
                  onChange={(e) => handleFieldChange('Site', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Site</option>
                  {filteredSites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Category *
                </label>
                <select 
                  value={editedTicket.Category ?? ''} 
                  onChange={(e) => handleFieldChange('Category', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Access Control">Access Control</option>
                  <option value="Video Management">Video Management</option>
                  <option value="Intrusion Alarm">Intrusion Alarm</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Network">Network</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Priority *
                </label>
                <select 
                  value={editedTicket.Priority ?? ''} 
                  onChange={(e) => handleFieldChange('Priority', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Status *
                </label>
                <select 
                  value={editedTicket.Status ?? ''} 
                  onChange={(e) => handleFieldChange('Status', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="New">New</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="On-Hold">On Hold</option>
                  <option value="Complete">Complete</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Owner (Coordinator) *
                </label>
                <select
                  value={editedTicket.Owner || ''}
                  onChange={(e) => handleFieldChange('Owner', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Owner</option>
                  {coordinatorsAndAdmins.map((user) => (
                    <option key={user.id} value={user.username}>
                      {user.fullName} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Assigned To
                </label>
                <select
                  value={editedTicket.AssignedTo ?? ''}
                  onChange={(e) => handleFieldChange('AssignedTo', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">— Select Technician —</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.fullName}>
                      {tech.fullName} {tech.vendor ? `(${tech.vendor})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* License IDs */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  License IDs
                </label>
                <input
                  type="text"
                  value={editedTicket.LicenseIDs ?? ''}
                  onChange={(e) => handleFieldChange('LicenseIDs', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Comma-separated license IDs"
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Tags
                </label>
                <input
                  type="text"
                  value={editedTicket.Tags ?? ''}
                  onChange={(e) => handleFieldChange('Tags', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Comma-separated tags"
                />
              </div>

              {/* Scheduled Start */}
              <div>
                <DatePicker
                  label="Scheduled Start"
                  value={editedTicket.ScheduledStart ?? ''}
                  onChange={(value) => handleFieldChange('ScheduledStart', value)}
                  placeholder="Select start date and time"
                  disabled={readonly}
                />
              </div>

              {/* Scheduled End */}
              <div>
                <DatePicker
                  label="Scheduled End"
                  value={editedTicket.ScheduledEnd ?? ''}
                  onChange={(value) => handleFieldChange('ScheduledEnd', value)}
                  placeholder="Select end date and time"
                  disabled={readonly}
                />
              </div>

              {/* SLA Due */}
              <div>
                <DatePicker
                  label="SLA Due"
                  value={editedTicket.SLA_Due ?? ''}
                  onChange={(value) => handleFieldChange('SLA_Due', value)}
                  placeholder="Select SLA due date and time"
                  disabled={readonly}
                />
              </div>

              {/* GeoLocation */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Geo Location
                </label>
                <input
                  type="text"
                  value={editedTicket.GeoLocation ?? ''}
                  onChange={(e) => handleFieldChange('GeoLocation', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Latitude,Longitude"
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Description *
                </label>
                <textarea 
                  value={editedTicket.Description || ''} 
                  onChange={(e) => handleFieldChange('Description', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    minHeight: '100px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Describe the issue or work to be performed..."
                />
              </div>

              {/* Resolution */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Resolution
                </label>
                <textarea 
                  value={editedTicket.Resolution || ''} 
                  onChange={(e) => handleFieldChange('Resolution', e.target.value)}
                  disabled={readonly}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    minHeight: '80px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter resolution details or work performed..."
                />
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {/* Add New Note */}
              {!readonly && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Add Note
                  </label>
                  <textarea 
                    value={newNote} 
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      minHeight: '80px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                    placeholder="Add a note or update..."
                  />
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                      opacity: newNote.trim() ? 1 : 0.5
                    }}
                  >
                    Add Note
                  </button>
                </div>
              )}

              {/* Existing Notes */}
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Notes History</h4>
                {editedTicket.CoordinatorNotes && editedTicket.CoordinatorNotes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {editedTicket.CoordinatorNotes.map((note) => (
                      <div key={note.NoteID} style={{
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#374151' }}>{note.CoordinatorName}</strong>
                          <span style={{ color: '#4a5568', fontSize: '0.875rem' }}>
                            {new Date(note.Timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#4b5563' }}>{note.Note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#4a5568', fontStyle: 'italic' }}>No notes yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Audit Trail</h4>
              {editedTicket.AuditTrail && editedTicket.AuditTrail.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editedTicket.AuditTrail.map((entry) => (
                    <div key={entry.id} style={{
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#374151' }}>{entry.action}</strong>
                        <span style={{ color: '#4a5568', fontSize: '0.875rem' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        <p style={{ margin: '0.25rem 0' }}>User: {entry.user}</p>
                        {entry.field && (
                          <p style={{ margin: '0.25rem 0' }}>
                            Field: <strong>{entry.field}</strong>
                          </p>
                        )}
                        {entry.oldValue !== undefined && entry.newValue !== undefined && (
                          <p style={{ margin: '0.25rem 0' }}>
                            Changed from "{entry.oldValue}" to "{entry.newValue}"
                          </p>
                        )}
                        {entry.notes && <p style={{ margin: '0.25rem 0' }}>Notes: {entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#4a5568', fontStyle: 'italic' }}>No audit trail entries yet</p>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#374151' }}>File Attachments</h4>
              
              {!readonly && (
                <div style={{ marginBottom: '2rem' }}>
                  <AttachmentUpload 
                    ticketId={ticket.TicketID}
                    onUploadComplete={() => setAttachmentRefresh(prev => prev + 1)}
                  />
                </div>
              )}

              <AttachmentList 
                ticketId={ticket.TicketID}
                refreshTrigger={attachmentRefresh}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          padding: '1.5rem 2rem'
        }}>
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #059669',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#059669',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            🖨️ Print Ticket
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {readonly ? 'Close' : 'Cancel'}
          </button>
          {!readonly && (
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <PrintableServiceTicket
          ticket={editedTicket}
          onClose={() => setShowPrintModal(false)}
          companyName={companyName}
        />
      )}
    </div>
  )
}