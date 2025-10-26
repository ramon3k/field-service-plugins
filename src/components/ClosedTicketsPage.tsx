import React, { useState, useMemo } from 'react'
import { Ticket } from '../types'
import { arrayToCSV, formatDateForCSV, formatPriorityForCSV, formatStatusForCSV } from '../utils/csvExport'

interface ClosedTicketsPageProps {
  tickets: Ticket[]
  onViewHistory?: (ticket: Ticket) => void
  onReopen?: (ticket: Ticket) => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatResolutionDuration(createdAt: string, closedAt: string): string {
  const created = new Date(createdAt)
  const closed = new Date(closedAt)
  const diffMs = closed.getTime() - created.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    const remainingHours = diffHours % 24
    return `${diffDays}d ${remainingHours}h`
  } else {
    return `${diffHours}h`
  }
}

function getPriorityColor(priority: string): string {
  const colors = {
    'Critical': '#ff4444',
    'High': '#ff8800',
    'Normal': '#3388ff',
    'Low': '#88cc88'
  }
  return colors[priority as keyof typeof colors] || '#666'
}

function getStatusColor(status: string): string {
  const colors = {
    'Complete': '#88cc88',
    'Closed': '#666666'
  }
  return colors[status as keyof typeof colors] || '#666'
}

export default function ClosedTicketsPage({ tickets, onViewHistory, onReopen }: ClosedTicketsPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'closedDate' | 'duration' | 'priority'>('closedDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Reopen modal state
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [ticketToReopen, setTicketToReopen] = useState<Ticket | null>(null)
  const [reopenReason, setReopenReason] = useState('')

  const closedTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.Status === 'Closed')
  }, [tickets])

  const filteredAndSortedTickets = useMemo(() => {
    let filtered = closedTickets.filter(ticket => {
      const matchesSearch = ticket.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.TicketID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.Site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.Customer.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || ticket.Status === statusFilter
      const matchesPriority = priorityFilter === 'all' || ticket.Priority === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })

    // Sort tickets
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'closedDate':
          comparison = new Date(a.ClosedDate || '').getTime() - new Date(b.ClosedDate || '').getTime()
          break
        case 'duration':
          const aDuration = new Date(a.ClosedDate || '').getTime() - new Date(a.CreatedAt).getTime()
          const bDuration = new Date(b.ClosedDate || '').getTime() - new Date(b.CreatedAt).getTime()
          comparison = aDuration - bDuration
          break
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Normal': 2, 'Low': 1 }
          comparison = (priorityOrder[a.Priority as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[b.Priority as keyof typeof priorityOrder] || 0)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [closedTickets, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder])

  const stats = useMemo(() => {
    const total = closedTickets.length
    const avgResolution = closedTickets.length > 0 ? closedTickets.reduce((sum, ticket) => {
      if (!ticket.ClosedDate) return sum
      const duration = new Date(ticket.ClosedDate).getTime() - new Date(ticket.CreatedAt).getTime()
      return sum + (duration / (1000 * 60 * 60)) // Convert to hours
    }, 0) / closedTickets.length : 0

    return { total, avgResolution }
  }, [closedTickets])

  const handleExportCSV = () => {
    const columns = [
      { key: 'TicketID' as keyof Ticket, label: 'Ticket ID' },
      { key: 'Title' as keyof Ticket, label: 'Title' },
      { key: 'Customer' as keyof Ticket, label: 'Customer' },
      { key: 'Site' as keyof Ticket, label: 'Site' },
      { key: 'Priority' as keyof Ticket, label: 'Priority' },
      { key: 'Status' as keyof Ticket, label: 'Status' },
      { key: 'CreatedAt' as keyof Ticket, label: 'Created At' },
      { key: 'ClosedDate' as keyof Ticket, label: 'Closed Date' },
      { key: 'ResolutionDuration' as keyof (Ticket & { ResolutionDuration: string }), label: 'Resolution Duration' },
      { key: 'AssignedTo' as keyof Ticket, label: 'Assigned To' },
      { key: 'Owner' as keyof Ticket, label: 'Owner' },
      { key: 'Category' as keyof Ticket, label: 'Category' },
      { key: 'Resolution' as keyof Ticket, label: 'Resolution' },
      { key: 'Description' as keyof Ticket, label: 'Description' }
    ]

    // Prepare data with formatted values and calculated resolution duration
    const exportData = filteredAndSortedTickets.map(ticket => ({
      ...ticket,
      Priority: formatPriorityForCSV(ticket.Priority || ''),
      Status: formatStatusForCSV(ticket.Status || ''),
      CreatedAt: formatDateForCSV(ticket.CreatedAt || ''),
      ClosedDate: formatDateForCSV(ticket.ClosedDate || ''),
      ResolutionDuration: ticket.ClosedDate ? formatResolutionDuration(ticket.CreatedAt, ticket.ClosedDate) : 'N/A'
    }))

    arrayToCSV(exportData, columns, 'closed-tickets')
  }

  const handleSort = (field: 'closedDate' | 'duration' | 'priority') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleReopenClick = (ticket: Ticket) => {
    setTicketToReopen(ticket)
    setShowReopenModal(true)
    setReopenReason('')
  }

  const handleReopenConfirm = () => {
    if (!reopenReason.trim()) {
      alert('Please provide a reason for reopening this ticket.')
      return
    }
    
    if (ticketToReopen && onReopen) {
      // Add the reason to the ticket object so the parent component can include it in audit trail
      const ticketWithReason = { ...ticketToReopen, reopenReason: reopenReason.trim() }
      onReopen(ticketWithReason)
    }
    
    setShowReopenModal(false)
    setTicketToReopen(null)
    setReopenReason('')
  }

  const handleReopenCancel = () => {
    setShowReopenModal(false)
    setTicketToReopen(null)
    setReopenReason('')
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', color: '#1a202c', fontSize: '28px', fontWeight: '700' }}>
          ✅ Closed Tickets
        </h1>
        <p style={{ margin: 0, color: '#2d3748', fontSize: '14px', fontWeight: '500' }}>
          Completed and closed service requests
        </p>
      </div>

      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#2d3748', marginBottom: '8px', fontWeight: '600' }}>� Total Closed</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c' }}>{stats.total}</div>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#2d3748', marginBottom: '8px', fontWeight: '600' }}>⏱️ Avg Resolution</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
            {stats.avgResolution > 0 ? `${Math.round(stats.avgResolution)}h` : '0h'}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          alignItems: 'end' 
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1a202c' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search tickets, sites, or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#333'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1a202c' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#333'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Complete">Complete</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1a202c' }}>
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#333'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1a202c' }}>
              Sort By
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Closed Date', value: 'closedDate' },
                { label: 'Duration', value: 'duration' },
                { label: 'Priority', value: 'priority' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value as 'closedDate' | 'duration' | 'priority')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: sortBy === option.value ? '#3388ff' : 'white',
                    color: sortBy === option.value ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {option.label}
                  {sortBy === option.value && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1a202c' }}>
              Export
            </label>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '8px 16px',
                border: '1px solid #22c55e',
                borderRadius: '4px',
                background: '#22c55e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: 'fit-content'
              }}
              title={`Export ${filteredAndSortedTickets.length} closed tickets to CSV`}
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>
        Showing {filteredAndSortedTickets.length} of {closedTickets.length} closed tickets
      </div>

      {/* Tickets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAndSortedTickets.map(ticket => (
          <div
            key={ticket.TicketID}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1a202c', fontSize: '16px', fontWeight: '700' }}>
                  {ticket.Title}
                </h3>
                <div style={{ fontSize: '13px', color: '#2d3748', fontWeight: '500' }}>
                  {ticket.TicketID} • {ticket.Customer} - {ticket.Site}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: getPriorityColor(ticket.Priority),
                  color: 'white'
                }}>
                  {ticket.Priority}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: getStatusColor(ticket.Status),
                  color: 'white'
                }}>
                  {ticket.Status}
                </span>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px', 
              fontSize: '13px',
              marginBottom: '12px',
              color: '#1a202c',
              fontWeight: '500'
            }}>
              <div>
                <strong>Closed:</strong> {ticket.ClosedDate ? formatDate(ticket.ClosedDate) : 'N/A'}
              </div>
              <div>
                <strong>Duration:</strong> {ticket.ClosedDate ? formatResolutionDuration(ticket.CreatedAt, ticket.ClosedDate) : 'N/A'}
              </div>
              <div>
                <strong>Closed By:</strong> {ticket.ClosedBy || 'N/A'}
              </div>
              <div>
                <strong>Category:</strong> {ticket.Category}
              </div>
            </div>

            {ticket.Resolution && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e9ecef', 
                borderRadius: '4px', 
                padding: '12px',
                fontSize: '13px'
              }}>
                <strong style={{ color: '#1a202c', marginBottom: '4px', display: 'block', fontWeight: '600' }}>Resolution:</strong>
                <div style={{ color: '#2d3748', lineHeight: '1.4', fontWeight: '500' }}>
                  {ticket.Resolution}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '12px', 
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              {onViewHistory && (
                <button
                  onClick={() => onViewHistory(ticket)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#495057'
                  }}
                >
                  📋 View History
                </button>
              )}
              {onReopen && (
                <button
                  onClick={() => handleReopenClick(ticket)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#155724'
                  }}
                >
                  🔄 Reopen
                </button>
              )}
            </div>
          </div>
        ))}
        
        {filteredAndSortedTickets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#555',
            fontSize: '16px'
          }}>
            {closedTickets.length === 0 
              ? '📭 No closed tickets yet'
              : '🔍 No tickets match your current filters'
            }
          </div>
        )}
      </div>

      {/* Reopen Confirmation Modal */}
      {showReopenModal && ticketToReopen && (
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
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1a202c', fontSize: '18px', fontWeight: '600' }}>
              🔄 Reopen Ticket
            </h3>
            
            <div style={{ marginBottom: '16px', color: '#2d3748', fontSize: '14px' }}>
              <strong>Ticket:</strong> {ticketToReopen.TicketID} - {ticketToReopen.Title}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1a202c', fontWeight: '600' }}>
                Reason for Reopening *
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Please provide a detailed reason for reopening this ticket..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>
                This reason will be added to the audit trail
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleReopenCancel}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReopenConfirm}
                disabled={!reopenReason.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: reopenReason.trim() ? '#059669' : '#a0aec0',
                  color: 'white',
                  cursor: reopenReason.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Reopen Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}