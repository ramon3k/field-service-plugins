import React, { useState, useMemo } from 'react'
import type { Ticket, AuthUser } from '../types'

interface DispatchCalendarProps {
  tickets: Ticket[]
  currentUser: AuthUser | null
  onTicketSelect?: (ticket: Ticket) => void
}

type ViewType = 'day' | 'week' | 'month'

export default function DispatchCalendar({ tickets, currentUser, onTicketSelect }: DispatchCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')

  // Filter tickets based on user role
  const filteredTickets = useMemo(() => {
    if (!currentUser) return []
    
    if (currentUser.role === 'Technician') {
      return tickets.filter(ticket => 
        ticket.AssignedTo === currentUser.fullName || 
        ticket.AssignedTo === currentUser.username
      )
    }
    return tickets // Admin and Coordinator see all tickets
  }, [tickets, currentUser])

  // Filter tickets that have scheduled dates
  const scheduledTickets = useMemo(() => {
    return filteredTickets.filter(ticket => 
      ticket.ScheduledStart && 
      ticket.ScheduledStart !== '' && 
      ticket.Status !== 'Closed' && 
      ticket.Status !== 'Complete'
    )
  }, [filteredTickets])

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get date range for current view
  const getViewDates = () => {
    if (view === 'day') {
      return [new Date(currentDate)]
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - day) // Start on Sunday
      
      const dates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        dates.push(date)
      }
      return dates
    } else if (view === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const startOfCalendar = new Date(startOfMonth)
      startOfCalendar.setDate(startOfCalendar.getDate() - startOfMonth.getDay())
      
      const dates = []
      const current = new Date(startOfCalendar)
      while (current <= endOfMonth || dates.length < 42) { // 6 weeks max
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
        if (current.getDay() === 0 && current > endOfMonth) break
      }
      return dates
    }
    return []
  }

  // Get tickets for a specific date
  const getTicketsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return scheduledTickets.filter(ticket => {
      const scheduledDate = new Date(ticket.ScheduledStart).toISOString().split('T')[0]
      return scheduledDate === dateStr
    })
  }

  // Format display title based on view
  const getDisplayTitle = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } else if (view === 'week') {
      const dates = getViewDates()
      const start = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const end = dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${start} - ${end}`
    } else if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }
    return ''
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#007bff'
      case 'Scheduled': return '#28a745'
      case 'In-Progress': return '#ffc107'
      case 'On-Hold': return '#dc3545'
      default: return '#6c757d'
    }
  }

  // Render ticket card
  const renderTicketCard = (ticket: Ticket, isCompact = false) => {
    const scheduledTime = ticket.ScheduledStart ? 
      new Date(ticket.ScheduledStart).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }) : ''

    return (
      <div 
        key={ticket.TicketID}
        className="calendar-ticket"
        style={{
          backgroundColor: getStatusColor(ticket.Status),
          color: 'white',
          padding: isCompact ? '2px 4px' : '4px 6px',
          margin: '1px 0',
          borderRadius: '3px',
          fontSize: isCompact ? '10px' : '11px',
          cursor: 'pointer',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        onClick={() => onTicketSelect?.(ticket)}
        title={`${ticket.TicketID} - ${ticket.Title}\nSite: ${ticket.Site}\nTechnician: ${ticket.AssignedTo}\nStatus: ${ticket.Status}`}
      >
        {isCompact ? (
          <div>{ticket.TicketID}</div>
        ) : (
          <div>
            <div style={{ fontWeight: 'bold' }}>{scheduledTime} - {ticket.TicketID}</div>
            <div style={{ fontSize: '10px' }}>{ticket.Site}</div>
            <div style={{ fontSize: '9px' }}>{ticket.AssignedTo}</div>
          </div>
        )}
      </div>
    )
  }

  const viewDates = getViewDates()

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: 0 }}>Dispatch Calendar</h2>
        
        {/* View Controls */}
        <div className="calendar-navigation">
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['day', 'week', 'month'] as ViewType[]).map(viewType => (
              <button
                key={viewType}
                className={view === viewType ? 'primary' : 'ghost'}
                onClick={() => setView(viewType)}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="ghost" onClick={navigatePrevious}>‹</button>
            <button className="ghost" onClick={goToToday} style={{ fontSize: '12px' }}>Today</button>
            <button className="ghost" onClick={navigateNext}>›</button>
          </div>
          
          <div style={{ fontWeight: 'bold', minWidth: '200px', textAlign: 'center' }}>
            {getDisplayTitle()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '15px', 
        fontSize: '12px',
        flexWrap: 'wrap'
      }}>
        {['New', 'Scheduled', 'In-Progress', 'On-Hold'].map(status => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: getStatusColor(status),
              borderRadius: '2px'
            }} />
            <span>{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {view === 'day' && (
        <div style={{ border: '1px solid #2b416a', borderRadius: '4px', backgroundColor: '#111a2b' }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#1d375a', 
            color: '#e5ecff',
            borderBottom: '1px solid #2b416a',
            fontWeight: 'bold'
          }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ padding: '10px', minHeight: '400px' }}>
            {getTicketsForDate(currentDate).map(ticket => renderTicketCard(ticket, false))}
            {getTicketsForDate(currentDate).length === 0 && (
              <div style={{ color: '#8892a6', fontStyle: 'italic' }}>No scheduled tickets for this day</div>
            )}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', border: '1px solid #2b416a', backgroundColor: '#0b1220' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ 
              padding: '8px', 
              backgroundColor: '#1d375a', 
              color: '#e5ecff',
              fontWeight: 'bold', 
              textAlign: 'center',
              borderRight: '1px solid #2b416a'
            }}>
              {day}
            </div>
          ))}
          {viewDates.map(date => {
            const dayTickets = getTicketsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div key={date.toISOString()} style={{ 
                minHeight: '120px', 
                padding: '4px', 
                backgroundColor: isToday ? '#2b2321' : '#111a2b',
                color: '#e5ecff',
                borderRight: '1px solid #2b416a',
                borderBottom: '1px solid #2b416a'
              }}>
                <div style={{ 
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isToday ? '#ffc78a' : '#e5ecff',
                  marginBottom: '4px',
                  fontSize: '12px'
                }}>
                  {date.getDate()}
                </div>
                {dayTickets.map(ticket => renderTicketCard(ticket, true))}
              </div>
            )
          })}
        </div>
      )}

      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', border: '1px solid #2b416a', backgroundColor: '#0b1220' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ 
              padding: '8px', 
              backgroundColor: '#1d375a', 
              color: '#e5ecff',
              fontWeight: 'bold', 
              textAlign: 'center',
              borderRight: '1px solid #2b416a'
            }}>
              {day}
            </div>
          ))}
          {viewDates.map(date => {
            const dayTickets = getTicketsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            return (
              <div key={date.toISOString()} style={{ 
                minHeight: '80px', 
                padding: '2px', 
                backgroundColor: isToday ? '#2b2321' : isCurrentMonth ? '#111a2b' : '#0c1426',
                color: isCurrentMonth ? '#e5ecff' : '#8892a6',
                borderRight: '1px solid #2b416a',
                borderBottom: '1px solid #2b416a',
                opacity: isCurrentMonth ? 1 : 0.6
              }}>
                <div style={{ 
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isToday ? '#ffc78a' : isCurrentMonth ? '#e5ecff' : '#8892a6',
                  marginBottom: '2px',
                  fontSize: '11px'
                }}>
                  {date.getDate()}
                </div>
                {dayTickets.map(ticket => renderTicketCard(ticket, true))}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#111a2b', 
        border: '1px solid #2b416a',
        borderRadius: '4px',
        color: '#e5ecff',
        fontSize: '12px'
      }}>
        <strong>Summary:</strong> {scheduledTickets.length} scheduled tickets
        {currentUser?.role === 'Technician' && ` assigned to ${currentUser.fullName}`}
      </div>
    </div>
  )
}