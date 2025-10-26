// src/components/TechnicianInterface.tsx
import React, { useState, useMemo } from 'react'
import type { Ticket, AuthUser } from '../types'
import { authService } from '../services/AuthService'
import AttachmentUpload from './AttachmentUpload'

type Props = {
  tickets: Ticket[]
  currentUser: AuthUser | null
  onTicketUpdate: (ticket: Ticket) => Promise<void>
  onLogout: () => void
}

export default function TechnicianInterface({ tickets, currentUser, onTicketUpdate, onLogout }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  console.log('TechnicianInterface: currentUser:', currentUser)
  console.log('TechnicianInterface: tickets received:', tickets.length, tickets)

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentUser) return
    
    const newPassword = prompt('Enter your new password:')
    if (!newPassword) return
    
    const confirmPassword = prompt('Confirm your new password:')
    if (!confirmPassword) return
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long!')
      return
    }
    
    try {
      await authService.changePassword(currentUser.id, newPassword)
      alert('Password changed successfully!')
    } catch (error) {
      alert(`Failed to change password: ${error}`)
    }
  }

  // Filter tickets assigned to current technician
  const assignedTickets = useMemo(() => {
    console.log('TechnicianInterface: assignedTickets useMemo - currentUser:', currentUser)
    console.log('TechnicianInterface: assignedTickets useMemo - tickets:', tickets.length)
    
    if (!currentUser) {
      console.log('TechnicianInterface: No current user, returning empty array')
      return []
    }
    
    // For technician users, the backend already filters tickets, so return all tickets
    // For other roles, apply frontend filtering as fallback
    if (currentUser.role === 'Technician') {
      console.log('TechnicianInterface: User is Technician, filtering out closed tickets')
      // Filter out closed tickets, but keep completed tickets so notes can be added
      const filtered = tickets.filter(ticket => ticket.Status !== 'Closed')
      console.log('TechnicianInterface: Showing', filtered.length, 'tickets (excluding closed)')
      return filtered
    }
    
    console.log('TechnicianInterface: User is not Technician, applying frontend filtering')
    const filtered = tickets.filter(ticket => {
      // Filter out closed tickets
      if (ticket.Status === 'Closed') return false
      
      // Check if ticket is assigned to current user by name or username
      const assignedTo = ticket.AssignedTo?.toLowerCase() || ''
      const userName = currentUser.fullName?.toLowerCase() || ''
      const username = currentUser.username?.toLowerCase() || ''
      
      return assignedTo.includes(userName) || assignedTo.includes(username)
    })
    console.log('TechnicianInterface: Filtered tickets:', filtered.length)
    return filtered
  }, [tickets, currentUser])

  console.log('TechnicianInterface: Final assignedTickets:', assignedTickets.length, assignedTickets)

  // Stats for technician dashboard
  const stats = useMemo(() => {
    const total = assignedTickets.length
    const newTickets = assignedTickets.filter(t => t.Status === 'New').length
    const scheduled = assignedTickets.filter(t => t.Status === 'Scheduled').length
    const inProgress = assignedTickets.filter(t => t.Status === 'In-Progress').length
    const complete = assignedTickets.filter(t => t.Status === 'Complete').length
    const overdue = assignedTickets.filter(t => {
      if (!t.SLA_Due) return false
      return new Date(t.SLA_Due) < new Date() && !['Complete', 'Closed'].includes(t.Status || '')
    }).length

    return { total, newTickets, scheduled, inProgress, complete, overdue }
  }, [assignedTickets])

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowEditModal(true)
  }

  const handleCloseModal = () => {
    setShowEditModal(false)
    setSelectedTicket(null)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#ff4444'
      case 'High': return '#ff8800'
      case 'Normal': return '#4CAF50'
      case 'Low': return '#2196F3'
      default: return '#666'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#ffab00'
      case 'Scheduled': return '#2196F3'
      case 'In-Progress': return '#ff9800'
      case 'On-Hold': return '#9e9e9e'
      case 'Complete': return '#4CAF50'
      default: return '#666'
    }
  }

  return (
    <div style={{ padding: '20px', background: '#0f1419', minHeight: '100vh' }}>
      {/* Technician Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '28px', fontWeight: '700' }}>
            🔧 Technician Dashboard
          </h1>
          <p style={{ margin: 0, color: '#8892b0', fontSize: '16px' }}>
            Welcome back, {currentUser?.fullName} - Your assigned tickets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleChangePassword}
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976D2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2196F3'
            }}
          >
            🔐 Change Password
          </button>
          <button
            onClick={onLogout}
            style={{
              background: '#ff5470',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e63946'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff5470'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{
          background: '#17263f',
          border: '1px solid #2d3748',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#8892b0', marginBottom: '8px', fontWeight: '600' }}>📋 Total Assigned</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>{stats.total}</div>
        </div>
        <div style={{
          background: '#17263f',
          border: '1px solid #2d3748',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#8892b0', marginBottom: '8px', fontWeight: '600' }}>🆕 New</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffab00' }}>{stats.newTickets}</div>
        </div>
        <div style={{
          background: '#17263f',
          border: '1px solid #2d3748',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#8892b0', marginBottom: '8px', fontWeight: '600' }}>📅 Scheduled</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{stats.scheduled}</div>
        </div>
        <div style={{
          background: '#17263f',
          border: '1px solid #2d3748',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#8892b0', marginBottom: '8px', fontWeight: '600' }}>🔄 In Progress</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{stats.inProgress}</div>
        </div>
        <div style={{
          background: '#17263f',
          border: '1px solid #2d3748',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#8892b0', marginBottom: '8px', fontWeight: '600' }}>✅ Complete</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.complete}</div>
        </div>
        {stats.overdue > 0 && (
          <div style={{
            background: '#3a1f1f',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#ff9999', marginBottom: '8px', fontWeight: '600' }}>⚠️ Overdue</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4444' }}>{stats.overdue}</div>
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div style={{
        background: '#1a2332',
        border: '1px solid #2d3748',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d3748',
          background: '#17263f'
        }}>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
            📝 My Assigned Tickets ({assignedTickets.length})
          </h2>
        </div>

        {assignedTickets.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#8892b0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No tickets assigned</div>
            <div style={{ fontSize: '14px' }}>Check back later for new assignments</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {assignedTickets.map(ticket => (
              <div
                key={ticket.TicketID}
                onClick={() => handleTicketClick(ticket)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #2d3748',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#233547'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                      {ticket.Title}
                    </h3>
                    <div style={{ color: '#8892b0', fontSize: '14px' }}>
                      {ticket.TicketID} • {ticket.Customer} • {ticket.Site}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      background: getPriorityColor(ticket.Priority),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {ticket.Priority}
                    </span>
                    <span style={{
                      background: getStatusColor(ticket.Status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {ticket.Status}
                    </span>
                  </div>
                </div>
                
                <div style={{ color: '#8892b0', fontSize: '13px', marginBottom: '8px' }}>
                  {ticket.Description?.substring(0, 150)}{ticket.Description?.length > 150 ? '...' : ''}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                  <div>
                    📅 Scheduled: {formatDate(ticket.ScheduledStart)}
                  </div>
                  {ticket.SLA_Due && (
                    <div style={{ color: new Date(ticket.SLA_Due) < new Date() ? '#ff4444' : '#64748b' }}>
                      ⏰ Due: {formatDate(ticket.SLA_Due)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technician Edit Modal */}
      {showEditModal && selectedTicket && (
        <TechnicianEditModal
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={handleCloseModal}
          onSave={onTicketUpdate}
        />
      )}
    </div>
  )
}

// Technician-specific edit modal with limited fields
function TechnicianEditModal({ ticket, currentUser, onClose, onSave }: {
  ticket: Ticket
  currentUser: AuthUser | null
  onClose: () => void
  onSave: (ticket: Ticket) => Promise<void>
}) {
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket)
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [activeTab, setActiveTab] = useState<'status' | 'notes' | 'attachments'>('status')

  const handleFieldChange = (field: keyof Ticket, value: string) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addNote = () => {
    if (!newNote.trim()) return
    
    const note = {
      NoteID: Date.now().toString(),
      CoordinatorName: currentUser?.fullName || 'Technician',
      Timestamp: new Date().toISOString(),
      Note: newNote.trim()
    }

    setEditedTicket(prev => ({
      ...prev,
      CoordinatorNotes: [...(prev.CoordinatorNotes || []), note]
    }))
    
    setNewNote('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Create audit trail for technician changes
      const auditEntries: import('../types').AuditEntry[] = []
      const changedFields = ['Status', 'Resolution', 'CoordinatorNotes']
      
      changedFields.forEach(field => {
        if (field === 'CoordinatorNotes') {
          const oldNotes = ticket.CoordinatorNotes?.length || 0
          const newNotes = editedTicket.CoordinatorNotes?.length || 0
          if (newNotes > oldNotes) {
            auditEntries.push({
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              user: currentUser?.fullName || 'Technician',
              action: 'Added technician note',
              field: 'Notes',
              oldValue: '',
              newValue: editedTicket.CoordinatorNotes?.[newNotes - 1]?.Note || ''
            })
          }
        } else if (editedTicket[field as keyof Ticket] !== ticket[field as keyof Ticket]) {
          auditEntries.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user: currentUser?.fullName || 'Technician',
            action: 'Updated field',
            field,
            oldValue: ticket[field as keyof Ticket] as string || '',
            newValue: editedTicket[field as keyof Ticket] as string || ''
          })
        }
      })

      const updatedTicket: Ticket = {
        ...editedTicket,
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a2332',
        border: '1px solid #2d3748',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2d3748',
          background: '#17263f'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '20px', fontWeight: '600' }}>
            🔧 Update Ticket - {ticket.TicketID}
          </h2>
          <p style={{ margin: 0, color: '#8892b0', fontSize: '14px' }}>
            {ticket.Title}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #2d3748',
          background: '#1a2332'
        }}>
          <button
            onClick={() => setActiveTab('status')}
            style={{
              background: activeTab === 'status' ? '#17263f' : 'transparent',
              border: 'none',
              color: activeTab === 'status' ? '#ffffff' : '#8892b0',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📊 Status & Work
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            style={{
              background: activeTab === 'notes' ? '#17263f' : 'transparent',
              border: 'none',
              color: activeTab === 'notes' ? '#ffffff' : '#8892b0',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📝 Notes
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            style={{
              background: activeTab === 'attachments' ? '#17263f' : 'transparent',
              border: 'none',
              color: activeTab === 'attachments' ? '#ffffff' : '#8892b0',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📎 Photos/Documents
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          flex: 1,
          overflow: 'auto'
        }}>
          {activeTab === 'status' && (
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Status */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ffffff' }}>
                  Status *
                </label>
                <select 
                  value={editedTicket.Status} 
                  onChange={(e) => handleFieldChange('Status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#0f1419',
                    color: '#ffffff'
                  }}
                >
                  <option value="New">New</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="On-Hold">On Hold</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>

              {/* Resolution */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ffffff' }}>
                  Work Performed / Resolution Notes
                </label>
                <textarea 
                  value={editedTicket.Resolution || ''} 
                  onChange={(e) => handleFieldChange('Resolution', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    minHeight: '120px',
                    fontSize: '14px',
                    background: '#0f1419',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                  placeholder="Describe work performed, parts used, next steps, or resolution details..."
                />
              </div>

              {/* Ticket Info (Read-only) */}
              <div style={{
                background: '#0f1419',
                border: '1px solid #2d3748',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '16px' }}>📋 Ticket Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <strong style={{ color: '#8892b0' }}>Customer:</strong> <span style={{ color: '#ffffff' }}>{ticket.Customer}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#8892b0' }}>Site:</strong> <span style={{ color: '#ffffff' }}>{ticket.Site}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#8892b0' }}>Priority:</strong> <span style={{ color: '#ffffff' }}>{ticket.Priority}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#8892b0' }}>Category:</strong> <span style={{ color: '#ffffff' }}>{ticket.Category}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#8892b0' }}>Description:</strong> 
                    <div style={{ color: '#ffffff', marginTop: '4px' }}>{ticket.Description}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {/* Add New Note */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ffffff' }}>
                  Add Technician Note
                </label>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    minHeight: '80px',
                    fontSize: '14px',
                    background: '#0f1419',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                  placeholder="Add notes about progress, issues, or next steps..."
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  style={{
                    marginTop: '8px',
                    background: newNote.trim() ? '#4CAF50' : '#2d3748',
                    color: newNote.trim() ? 'white' : '#8892b0',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: newNote.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Note
                </button>
              </div>

              {/* Existing Notes */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: '#ffffff', fontSize: '16px' }}>📝 Ticket Notes</h3>
                {editedTicket.CoordinatorNotes && editedTicket.CoordinatorNotes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {editedTicket.CoordinatorNotes.map(note => (
                      <div
                        key={note.NoteID}
                        style={{
                          background: '#0f1419',
                          border: '1px solid #2d3748',
                          borderRadius: '6px',
                          padding: '12px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          fontSize: '13px',
                          color: '#8892b0'
                        }}>
                          <span>👤 {note.CoordinatorName}</span>
                          <span>{new Date(note.Timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '14px' }}>
                          {note.Note}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#8892b0',
                    padding: '20px',
                    fontSize: '14px'
                  }}>
                    No notes yet. Add the first note above.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <AttachmentUpload
                ticketId={ticket.TicketID}
                onUploadComplete={() => {
                  // Optionally refresh ticket data here
                  console.log('Attachment uploaded successfully')
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #2d3748',
          background: '#17263f',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid #2d3748',
              color: '#8892b0',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#4CAF50',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}