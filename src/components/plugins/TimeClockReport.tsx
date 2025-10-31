// src/components/plugins/TimeClockReport.tsx
import React, { useState, useEffect } from 'react'

interface TimeClockReportEntry {
  TechnicianID: string
  TechnicianName: string
  TicketID: string
  TicketTitle: string
  ClockInTime: string
  ClockOutTime: string | null
  DurationMinutes: number | null
}

interface TimeClockReportProps {
  companyCode: string
  userId: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export default function TimeClockReport({ companyCode, userId }: TimeClockReportProps) {
  const [entries, setEntries] = useState<TimeClockReportEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${API_BASE}/plugins/time-clock/report?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'x-company-code': companyCode,
            'x-user-id': userId
          }
        }
      )
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching time clock report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number | null): string => {
    if (minutes === null) return 'In Progress'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const totalHours = entries.reduce((sum, entry) => {
    return sum + (entry.DurationMinutes || 0)
  }, 0) / 60

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>
            ⏰ Time Clock Report
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Technician time tracking entries
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{
        padding: '16px',
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Entries</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{entries.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Hours</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{totalHours.toFixed(1)}h</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active Sessions</div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>
              {entries.filter(e => !e.ClockOutTime).length}
            </div>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading report...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No time clock entries found for the selected date range
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Technician
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Ticket
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Clock In
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Clock Out
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                >
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {entry.TechnicianName}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    <div style={{ fontWeight: '500' }}>{entry.TicketID}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.TicketTitle}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {formatDateTime(entry.ClockInTime)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                    {entry.ClockOutTime ? formatDateTime(entry.ClockOutTime) : (
                      <span style={{ color: '#16a34a', fontWeight: '500' }}>🟢 Active</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#111827', textAlign: 'right', fontWeight: '500' }}>
                    {formatDuration(entry.DurationMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
