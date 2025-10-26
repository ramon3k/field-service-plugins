import React, { useState, useMemo } from 'react'
import { Ticket, Site } from '../types'

interface ReportsPageProps {
  tickets: Ticket[]
  sites: Site[]
}

interface MetricCard {
  title: string
  value: string | number
  subtext?: string
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, subtext, color = '#333', trend }: MetricCard) {
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '📊'
  
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }}>
      <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
        {trendIcon} {title}
      </div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color,
        marginBottom: '4px' 
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '12px', color: '#333' }}>
          {subtext}
        </div>
      )}
    </div>
  )
}

function PriorityChart({ tickets }: { tickets: Ticket[] }) {
  const priorityData = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      acc[ticket.Priority] = (acc[ticket.Priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const priorities = ['Critical', 'High', 'Normal', 'Low']
    const colors = {
      'Critical': '#ff4444',
      'High': '#ff8800',
      'Normal': '#3388ff',
      'Low': '#88cc88'
    }

    return priorities.map(priority => ({
      name: priority,
      count: counts[priority] || 0,
      color: colors[priority as keyof typeof colors]
    }))
  }, [tickets])

  const total = priorityData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Priority Distribution</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {priorityData.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: item.color
            }}></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ minWidth: '60px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                {item.name}
              </span>
              <div style={{
                flex: 1,
                height: '20px',
                backgroundColor: '#f0f0f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                  backgroundColor: item.color,
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{ minWidth: '40px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusChart({ tickets }: { tickets: Ticket[] }) {
  const statusData = useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      acc[ticket.Status] = (acc[ticket.Status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statuses = ['New', 'Scheduled', 'In-Progress', 'Complete', 'Closed', 'Critical']
    const colors = {
      'New': '#666666',
      'Scheduled': '#3388ff',
      'In-Progress': '#ff8800',
      'Complete': '#88cc88',
      'Closed': '#888888',
      'Critical': '#ff4444'
    }

    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      count,
      color: colors[status as keyof typeof colors] || '#666'
    })).sort((a, b) => b.count - a.count)
  }, [tickets])

  const total = statusData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Status Distribution</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {statusData.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              backgroundColor: item.color
            }}></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ minWidth: '80px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                {item.name}
              </span>
              <div style={{
                flex: 1,
                height: '20px',
                backgroundColor: '#f0f0f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                  backgroundColor: item.color,
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <span style={{ minWidth: '40px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopSitesTable({ tickets }: { tickets: Ticket[] }) {
  const siteData = useMemo(() => {
    const siteCounts = tickets.reduce((acc, ticket) => {
      const key = `${ticket.Customer} - ${ticket.Site}`
      if (!acc[key]) {
        acc[key] = {
          customer: ticket.Customer,
          site: ticket.Site,
          total: 0,
          critical: 0,
          high: 0,
          open: 0
        }
      }
      acc[key].total++
      if (ticket.Priority === 'Critical') acc[key].critical++
      if (ticket.Priority === 'High') acc[key].high++
      if (!['Complete', 'Closed'].includes(ticket.Status)) acc[key].open++
      return acc
    }, {} as Record<string, any>)

    return Object.values(siteCounts)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)
  }, [tickets])

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      gridColumn: '1 / -1'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Top Sites by Ticket Volume</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Site</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Total</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Open</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>Critical</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>High</th>
            </tr>
          </thead>
          <tbody>
            {siteData.map((site: any, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 8px', fontSize: '13px', color: '#333' }}>{site.customer}</td>
                <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '500', color: '#333' }}>{site.site}</td>
                <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>{site.total}</td>
                <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'center', color: site.open > 0 ? '#ff8800' : '#666' }}>{site.open}</td>
                <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'center', color: site.critical > 0 ? '#ff4444' : '#666' }}>{site.critical}</td>
                <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'center', color: site.high > 0 ? '#ff8800' : '#666' }}>{site.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReportsPage({ tickets, sites }: ReportsPageProps) {
  const [timeFilter, setTimeFilter] = useState('all')

  const filteredTickets = useMemo(() => {
    if (timeFilter === 'all') return tickets
    
    const now = new Date()
    const filterDate = new Date()
    
    switch (timeFilter) {
      case '7d':
        filterDate.setDate(now.getDate() - 7)
        break
      case '30d':
        filterDate.setDate(now.getDate() - 30)
        break
      case '90d':
        filterDate.setDate(now.getDate() - 90)
        break
      default:
        return tickets
    }
    
    return tickets.filter(ticket => new Date(ticket.CreatedAt) >= filterDate)
  }, [tickets, timeFilter])

  const metrics = useMemo(() => {
    const total = filteredTickets.length
    const open = filteredTickets.filter(t => !['Complete', 'Closed'].includes(t.Status)).length
    const critical = filteredTickets.filter(t => t.Priority === 'Critical').length
    const overdue = filteredTickets.filter(t => new Date(t.SLA_Due) < new Date() && !['Complete', 'Closed'].includes(t.Status)).length
    const avgResolutionTime = calculateAvgResolutionTime(filteredTickets)
    const completed = filteredTickets.filter(t => ['Complete', 'Closed'].includes(t.Status)).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const criticalTrend: 'up' | 'down' | 'neutral' = critical > 0 ? 'up' : 'neutral'
    const overdueTrend: 'up' | 'down' | 'neutral' = overdue > 0 ? 'up' : 'down'  
    const completionTrend: 'up' | 'down' | 'neutral' = completionRate > 80 ? 'up' : 'neutral'

    return [
      { title: 'Total Tickets', value: total, color: '#333', trend: 'neutral' as const },
      { title: 'Open Tickets', value: open, color: '#ff8800', trend: 'up' as const },
      { title: 'Critical Issues', value: critical, color: '#ff4444', trend: criticalTrend },
      { title: 'Overdue', value: overdue, color: '#ff4444', trend: overdueTrend },
      { title: 'Avg Resolution', value: avgResolutionTime, subtext: 'hours', color: '#3388ff', trend: 'neutral' as const },
      { title: 'Completion Rate', value: `${completionRate}%`, color: '#88cc88', trend: completionTrend }
    ]
  }, [filteredTickets])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '28px' }}>
            📊 Reports & Analytics
          </h1>
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
            Performance metrics and insights for field service operations
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'All Time', value: 'all' },
            { label: 'Last 7 Days', value: '7d' },
            { label: 'Last 30 Days', value: '30d' },
            { label: 'Last 90 Days', value: '90d' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: timeFilter === filter.value ? '#3388ff' : 'white',
                color: timeFilter === filter.value ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <PriorityChart tickets={filteredTickets} />
        <StatusChart tickets={filteredTickets} />
      </div>

      {/* Sites Table */}
      <TopSitesTable tickets={filteredTickets} />
    </div>
  )
}

function calculateAvgResolutionTime(tickets: Ticket[]): string {
  const closedTickets = tickets.filter(t => t.ClosedDate && t.CreatedAt)
  
  if (closedTickets.length === 0) return 'N/A'
  
  const totalHours = closedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.CreatedAt)
    const closed = new Date(ticket.ClosedDate!)
    const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
    return sum + hours
  }, 0)
  
  const avgHours = totalHours / closedTickets.length
  
  if (avgHours < 24) {
    return Math.round(avgHours).toString()
  } else {
    const days = Math.round(avgHours / 24)
    return `${days}d`
  }
}