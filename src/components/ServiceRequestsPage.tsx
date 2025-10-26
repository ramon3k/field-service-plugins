import React, { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  const authToken = localStorage.getItem('authToken')
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  // Add user context headers for CompanyCode isolation
  const sqlUserStr = localStorage.getItem('sqlUser')
  if (sqlUserStr) {
    try {
      const sqlUser = JSON.parse(sqlUserStr)
      if (sqlUser.id) {
        headers['x-user-id'] = sqlUser.id
        headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
        headers['x-user-role'] = sqlUser.role || ''
      }
    } catch (e) {
      console.warn('Failed to parse sqlUser from localStorage')
    }
  }
  
  return headers
}

interface ServiceRequest {
  RequestID: string
  CustomerName: string
  ContactEmail: string
  ContactPhone: string
  SiteName: string
  Address: string
  IssueDescription: string
  Priority: string
  Status: string
  SubmittedAt: string
  ProcessedBy?: string
  ProcessedAt?: string
  ProcessedNote?: string
  TicketID?: string
}

interface ServiceRequestsPageProps {
  onLogout: () => void
  onCountChange: (count: number) => void // Callback to update count in parent
}

export default function ServiceRequestsPage({ onLogout, onCountChange }: ServiceRequestsPageProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('New')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [dismissNote, setDismissNote] = useState('')
  const [showDismissModal, setShowDismissModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Update parent with new request count whenever requests change
  useEffect(() => {
    const newCount = requests.filter(r => r.Status === 'New').length
    onCountChange(newCount)
  }, [requests, onCountChange])

  async function loadRequests() {
    try {
      const response = await fetch(`${API_BASE_URL}/service-requests?status=${statusFilter}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array
        if (Array.isArray(data)) {
          setRequests(data)
        } else {
          console.error('Invalid data format received:', data)
          setRequests([])
        }
      } else {
        console.error('Failed to load requests:', response.status, response.statusText)
        setRequests([])
      }
    } catch (error) {
      console.error('Error loading service requests:', error)
      setRequests([])
    }
  }

  useEffect(() => {
    loadRequests()
  }, [statusFilter])

  async function createTicket(request: ServiceRequest) {
    if (!confirm(`Create a ticket from this service request?\n\nCustomer: ${request.CustomerName}\nIssue: ${request.IssueDescription.substring(0, 100)}...`)) {
      return
    }

    setLoading(true)
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = getHeaders()
      headers['x-user-timezone'] = userTimezone
      
      const response = await fetch(`${API_BASE_URL}/service-requests/${request.RequestID}/create-ticket`, {
        method: 'POST',
        headers: headers
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✓ Ticket created successfully!\n\nTicket ID: ${result.ticketId}`)
        
        // Reload the requests list
        await loadRequests()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to create ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert(`Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function openDismissModal(request: ServiceRequest) {
    setSelectedRequest(request)
    setDismissNote('')
    setShowDismissModal(true)
  }

  async function dismissRequest() {
    if (!selectedRequest) return
    
    if (!dismissNote.trim()) {
      alert('Please provide a reason for dismissing this request')
      return
    }

    setLoading(true)
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = getHeaders()
      headers['x-user-timezone'] = userTimezone
      
      const response = await fetch(`${API_BASE_URL}/service-requests/${selectedRequest.RequestID}/dismiss`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ note: dismissNote })
      })
      
      if (response.ok) {
        setShowDismissModal(false)
        setSelectedRequest(null)
        setDismissNote('')
        loadRequests()
      } else {
        throw new Error('Failed to dismiss request')
      }
    } catch (error) {
      console.error('Error dismissing request:', error)
      alert('Failed to dismiss request')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'Critical': return '#e74c3c'
      case 'High': return '#e67e22'
      case 'Medium': return '#f39c12'
      case 'Low': return '#3498db'
      default: return '#95a5a6'
    }
  }

  const newRequestsCount = requests.filter(r => r.Status === 'New').length

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="title">Service Requests</div>
          {newRequestsCount > 0 && statusFilter === 'New' && (
            <div style={{ fontSize: 14, color: '#e74c3c', marginTop: 4 }}>
              {newRequestsCount} new request{newRequestsCount !== 1 ? 's' : ''} pending
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="btn">
            <option value="New">New ({requests.filter(r => r.Status === 'New').length})</option>
            <option value="Processed">Processed</option>
            <option value="Dismissed">Dismissed</option>
            <option value="All">All</option>
          </select>
          
          <button onClick={loadRequests} className="btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          {statusFilter === 'New' ? 'No new service requests' : `No ${statusFilter.toLowerCase()} requests`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(request => (
            <div 
              key={request.RequestID}
              style={{
                border: '1px solid #ddd',
                borderLeft: `4px solid ${getPriorityColor(request.Priority)}`,
                borderRadius: 4,
                padding: 16,
                backgroundColor: request.Status === 'New' ? '#fff9e6' : '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#222' }}>
                    {request.CustomerName}
                  </div>
                  <div style={{ fontSize: 12, color: '#555' }}>
                    {request.RequestID} · Submitted {formatDate(request.SubmittedAt)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: 4, 
                      fontSize: 12, 
                      fontWeight: 600,
                      backgroundColor: getPriorityColor(request.Priority),
                      color: 'white'
                    }}
                  >
                    {request.Priority}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, color: '#333' }}>
                  {request.ContactEmail && (
                    <div>
                      <strong style={{ color: '#000' }}>Email:</strong> {request.ContactEmail}
                    </div>
                  )}
                  {request.ContactPhone && (
                    <div>
                      <strong style={{ color: '#000' }}>Phone:</strong> {request.ContactPhone}
                    </div>
                  )}
                  {request.SiteName && (
                    <div>
                      <strong style={{ color: '#000' }}>Site:</strong> {request.SiteName}
                    </div>
                  )}
                  {request.Address && (
                    <div>
                      <strong style={{ color: '#000' }}>Address:</strong> {request.Address}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: '#000' }}>Issue Description:</strong>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  fontSize: 14,
                  color: '#212529',
                  lineHeight: '1.5'
                }}>
                  {request.IssueDescription}
                </div>
              </div>

              {request.Status !== 'New' && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  backgroundColor: request.Status === 'Processed' ? '#d4edda' : '#f8d7da',
                  borderRadius: 4,
                  fontSize: 13
                }}>
                  <strong>{request.Status === 'Processed' ? 'Processed' : 'Dismissed'}</strong> by {request.ProcessedBy} on {request.ProcessedAt && formatDate(request.ProcessedAt)}
                  {request.TicketID && (
                    <div style={{ marginTop: 4 }}>
                      <strong>Ticket Created:</strong> {request.TicketID}
                    </div>
                  )}
                  {request.ProcessedNote && (
                    <div style={{ marginTop: 4 }}>
                      <strong>Note:</strong> {request.ProcessedNote}
                    </div>
                  )}
                </div>
              )}

              {request.Status === 'New' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button 
                    onClick={() => createTicket(request)}
                    disabled={loading}
                    className="btn"
                    style={{ 
                      flex: 1,
                      backgroundColor: '#28a745',
                      color: 'white'
                    }}
                  >
                    🎫 Create Ticket
                  </button>
                  
                  <button 
                    onClick={() => openDismissModal(request)}
                    disabled={loading}
                    className="btn"
                    style={{ 
                      flex: 1,
                      backgroundColor: '#6c757d',
                      color: 'white'
                    }}
                  >
                    ❌ Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDismissModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Dismiss Service Request</h3>
              <button className="modal-close" onClick={() => setShowDismissModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>
                You are about to dismiss the service request from <strong>{selectedRequest.CustomerName}</strong>.
              </p>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Reason for dismissal (required):
                </label>
                <textarea
                  value={dismissNote}
                  onChange={e => setDismissNote(e.target.value)}
                  placeholder="e.g., Duplicate request, spam, not a service issue, etc."
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDismissModal(false)} 
                className="btn"
                style={{ backgroundColor: '#6c757d' }}
              >
                Cancel
              </button>
              <button 
                onClick={dismissRequest}
                disabled={loading || !dismissNote.trim()}
                className="btn"
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                {loading ? 'Dismissing...' : 'Dismiss Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
