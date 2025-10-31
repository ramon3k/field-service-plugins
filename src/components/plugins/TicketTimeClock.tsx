// src/components/plugins/TicketTimeClock.tsx
import React, { useState, useEffect } from 'react'

interface TimeClockEntry {
  EntryID: string
  TechnicianID: string
  TicketID: string
  ClockInTime: string
  ClockOutTime: string | null
  CompanyCode?: string
  TechnicianName?: string
  Status?: string
  TotalHours?: number
}

interface TicketTimeClockProps {
  ticketId: string
  technicianId: string  // Actually the logged-in user ID
  companyCode: string
  onUpdate?: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

interface TechnicianBreakdown {
  TechnicianID: string
  TechnicianName: string
  TotalMinutes: number
  SessionCount: number
}

interface TicketSummary {
  totalMinutes: number
  entries: number
  breakdown: TechnicianBreakdown[]
}

export default function TicketTimeClock({ ticketId, technicianId, companyCode, onUpdate }: TicketTimeClockProps) {
  const [clockedIn, setClockedIn] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<TimeClockEntry | null>(null)
  const [summary, setSummary] = useState<TicketSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Use technicianId as userId (it's the logged-in user who can clock into any ticket)
  const userId = technicianId

  console.log('🔍 TicketTimeClock component mounted/updated')
  console.log('🔍 Props received:', { ticketId, technicianId, companyCode })
  console.log('🔍 userId derived from technicianId:', userId)
  console.log('🔍 userId type:', typeof userId)

  // Don't allow clocking in if ticket hasn't been saved yet
  if (!ticketId || ticketId.startsWith('TKT-TEMP-')) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#8892b0', backgroundColor: '#0d1117', borderRadius: '8px', margin: '20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏰</div>
        <div style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 600, color: '#c9d1d9' }}>Time Clock Unavailable</div>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          Please save the ticket first before clocking in.<br />
          <span style={{ fontSize: '12px', color: '#8892b0', marginTop: '8px', display: 'inline-block' }}>
            (The ticket needs a valid ID to track time entries)
          </span>
        </div>
      </div>
    )
  }
  console.log('🔍 userId is empty?', userId === '' || userId === undefined || userId === null)

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { userId, ticketId })
    if (userId && ticketId) {
      console.log('✅ Both userId and ticketId present, fetching data...')
      fetchStatus()
      fetchSummary()
    } else {
      // If we don't have userId or ticketId, stop loading
      console.warn('⚠️ Cannot load time clock - missing userId or ticketId:', { userId, ticketId })
      setLoading(false)
    }
  }, [ticketId, userId])

  const fetchStatus = async () => {
    if (!userId || !ticketId) {
      console.error('Missing userId or ticketId:', { userId, ticketId })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE}/plugins/time-clock/status/${userId}?ticketId=${ticketId}`,
        {
          headers: {
            'x-company-code': companyCode,
            'x-user-id': userId
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Backend returns 'isClockedIn', not 'clockedIn'
      if (data.isClockedIn && data.currentEntry) {
        setClockedIn(true)
        setCurrentEntry(data.currentEntry)
      } else {
        setClockedIn(false)
        setCurrentEntry(null)
      }
    } catch (error) {
      console.error('Error fetching clock status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/plugins/time-clock/ticket-summary/${ticketId}`,
        {
          headers: {
            'x-company-code': companyCode,
            'x-user-id': technicianId
          }
        }
      )
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Error fetching ticket summary:', error)
    }
  }

  const handleClockIn = async () => {
    if (!userId || !ticketId) {
      alert('Missing user ID or ticket ID')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/plugins/time-clock/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-code': companyCode,
          'x-user-id': userId
        },
        body: JSON.stringify({
          technicianId: userId,
          ticketId: ticketId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to clock in')
        return
      }

      await fetchStatus()
      await fetchSummary()
      onUpdate?.()
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    if (!currentEntry) return
    if (!userId || !ticketId) {
      alert('Missing user ID or ticket ID')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/plugins/time-clock/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-code': companyCode,
          'x-user-id': userId
        },
        body: JSON.stringify({
          technicianId: userId,
          ticketId: ticketId,
          entryId: currentEntry.EntryID
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to clock out')
        return
      }

      await fetchStatus()
      await fetchSummary()
      onUpdate?.()
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Failed to clock out')
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  if (!userId) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: '600' }}>⚠️ User ID Not Available</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Please log out and log back in to use the time clock.</p>
        </div>
      </div>
    )
  }

  if (!ticketId) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: '600' }}>⚠️ Ticket ID Not Available</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Cannot load time clock for this ticket.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⏰ Time Clock
      </h3>

      {/* Current Status */}
      <div style={{
        padding: '16px',
        background: clockedIn ? '#dcfce7' : '#f3f4f6',
        border: `2px solid ${clockedIn ? '#16a34a' : '#d1d5db'}`,
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
              Status: {clockedIn ? '🟢 Clocked In' : '⚪ Not Clocked In'}
            </div>
            {clockedIn && currentEntry && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Since {formatTime(currentEntry.ClockInTime)}
              </div>
            )}
          </div>
          <div>
            {clockedIn ? (
              <button
                onClick={handleClockOut}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clock Out
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                style={{
                  padding: '10px 20px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clock In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Summary */}
      {summary && summary.entries > 0 && (
        <div style={{
          padding: '16px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            Ticket Time Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: summary.breakdown?.length > 0 ? '16px' : '0' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Total Time
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {formatDuration(summary.totalMinutes)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Clock Entries
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {summary.entries}
              </div>
            </div>
          </div>

          {/* Technician Breakdown */}
          {summary.breakdown && summary.breakdown.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                Time by Technician
              </div>
              {summary.breakdown.map((tech) => (
                <div key={tech.TechnicianID} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {tech.TechnicianName}
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                      ({tech.SessionCount} {tech.SessionCount === 1 ? 'session' : 'sessions'})
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {formatDuration(tech.TotalMinutes)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
