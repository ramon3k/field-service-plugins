import React, { useMemo, useState, useEffect, useRef } from 'react'
import type { Ticket, Site } from '../types'
import { listSites } from '../api-json'
import { arrayToCSV, formatDateForCSV, formatPriorityForCSV, formatStatusForCSV } from '../utils/csvExport'
import RecentActivityWidget from './RecentActivityWidget'

type Props = {
  items: Ticket[]
  onStatusChange: (id: string, status: string) => void
  onEdit?: (t: Ticket) => void
  onReopen?: (t: Ticket) => void
  loading?: boolean
}

const statusOrder = ['New','Scheduled','In-Progress','On-Hold','Complete','Closed']

type SortKey = keyof Ticket
type SortDir = 'asc' | 'desc'

interface Filters {
  search: string
  customer: string
  site: string
  status: string
  priority: string
  createdFrom: string
  createdTo: string
}

const emptyFilters: Filters = {
  search: '',
  customer: 'All',
  site: 'All',
  status: 'All',
  priority: 'All',
  createdFrom: '',
  createdTo: ''
}

// Utility to get safe display value
const display = (v?: string) => (v && v.trim() ? v : '—')

export default function TicketList({ items, onStatusChange, onEdit, onReopen, loading }: Props) {
  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('CreatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sites, setSites] = useState<Site[]>([])
  
  // Split pane state (activity log takes 30% by default)
  const [ticketActivitySplit, setTicketActivitySplit] = useState(30)
  const [isDragging, setIsDragging] = useState(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startSplitRef = useRef(30)

  // Load sites for address lookup
  useEffect(() => {
    const loadSites = async () => {
      try {
        const sitesData = await listSites()
        setSites(sitesData)
      } catch (error) {
        console.error('Failed to load sites:', error)
        setSites([])
      }
    }
    loadSites()
  }, [])

  // Handle divider drag for split pane
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    if (!splitContainerRef.current) return
    
    setIsDragging(true)
    startYRef.current = e.clientY
    startSplitRef.current = ticketActivitySplit
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && splitContainerRef.current) {
        const containerRect = splitContainerRef.current.getBoundingClientRect()
        const containerHeight = containerRect.height
        const deltaY = e.clientY - startYRef.current
        const deltaPercentage = (deltaY / containerHeight) * 100
        
        // Activity log percentage DECREASES as you drag down (inverted)
        // Drag DOWN = more tickets, less activity
        // Drag UP = less tickets, more activity
        const newSplit = startSplitRef.current - deltaPercentage
        const clampedSplit = Math.max(15, Math.min(60, newSplit))
        
        setTicketActivitySplit(clampedSplit)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // Coordinator dashboard stats
  const stats = useMemo(() => {
    const total = items.length
    const newTickets = items.filter(t => t.Status === 'New').length
    const assigned = items.filter(t => ['Assigned', 'Scheduled'].includes(t.Status || '')).length
    const inProgress = items.filter(t => t.Status === 'In-Progress').length
    const complete = items.filter(t => t.Status === 'Complete').length
    const overdue = items.filter(t => {
      if (!t.SLA_Due) return false
      return new Date(t.SLA_Due) < new Date() && t.Status !== 'Closed'
    }).length
    const highPriority = items.filter(t => ['High', 'Critical'].includes(t.Priority || '')).length
    
    return { total, newTickets, assigned, inProgress, complete, overdue, highPriority }
  }, [items])

  const onHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'CreatedAt' ? 'desc' : 'asc')
    }
  }

  // Handle dashboard stat clicks for filtering
  const handleStatClick = (filterType: string) => {
    switch (filterType) {
      case 'total':
        // Clear all filters to show all tickets
        setFilters(emptyFilters)
        break
      case 'new':
        setFilters({ ...emptyFilters, status: 'New' })
        break
      case 'assigned':
        setFilters({ ...emptyFilters, status: 'Scheduled' })
        break
      case 'inProgress':
        setFilters({ ...emptyFilters, status: 'In-Progress' })
        break
      case 'complete':
        setFilters({ ...emptyFilters, status: 'Complete' })
        break
      case 'overdue':
        // Set a custom filter for overdue tickets (will be handled in filtering logic)
        setFilters({ ...emptyFilters, status: 'Overdue' })
        break
      case 'highPriority':
        setFilters({ ...emptyFilters, priority: 'High,Critical' })
        break
    }
  }

  // Check if a stat filter is currently active
  const isStatActive = (filterType: string): boolean => {
    switch (filterType) {
      case 'total':
        return JSON.stringify(filters) === JSON.stringify(emptyFilters)
      case 'new':
        return filters.status === 'New'
      case 'assigned':
        return filters.status === 'Scheduled'
      case 'inProgress':
        return filters.status === 'In-Progress'
      case 'complete':
        return filters.status === 'Complete'
      case 'overdue':
        return filters.status === 'Overdue'
      case 'highPriority':
        return filters.priority === 'High,Critical'
      default:
        return false
    }
  }

  // Derived dropdown lists
  const customerOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(t => { if (t.Customer) set.add(t.Customer) })
    return Array.from(set).sort()
  }, [items])

  const siteOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(t => {
      if (filters.customer === 'All' || t.Customer === filters.customer) {
        if (t.Site) set.add(t.Site)
      }
    })
    return Array.from(set).sort()
  }, [items, filters.customer])

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase()
    const from = filters.createdFrom ? new Date(filters.createdFrom + 'T00:00:00') : null
    const to = filters.createdTo ? new Date(filters.createdTo + 'T23:59:59.999') : null
    return items.filter(t => {
      if (filters.customer !== 'All' && t.Customer !== filters.customer) return false
      if (filters.site !== 'All' && filters.site && t.Site !== filters.site) return false
      
      // Handle special status filters
      if (filters.status !== 'All') {
        if (filters.status === 'Overdue') {
          // Check if ticket is overdue
          if (!t.SLA_Due) return false
          const isOverdue = new Date(t.SLA_Due) < new Date() && t.Status !== 'Closed'
          if (!isOverdue) return false
        } else {
          if (t.Status !== filters.status) return false
        }
      }
      
      // Handle multiple priority filter (High,Critical)
      if (filters.priority !== 'All') {
        if (filters.priority.includes(',')) {
          const priorities = filters.priority.split(',')
          if (!priorities.includes(t.Priority || '')) return false
        } else {
          if (t.Priority !== filters.priority) return false
        }
      }
      
      if (s) {
        const hay = (t.Title + ' ' + t.Description + ' ' + t.Tags).toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (from && t.CreatedAt) {
        if (new Date(t.CreatedAt) < from) return false
      }
      if (to && t.CreatedAt) {
        if (new Date(t.CreatedAt) > to) return false
      }
      return true
    })
  }, [items, filters])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a,b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp = 0
      if (sortKey === 'CreatedAt' || sortKey === 'UpdatedAt' || sortKey === 'SLA_Due' || sortKey.endsWith('Date') || sortKey.startsWith('Scheduled')) {
        const ad = av ? new Date(av as string).getTime() : 0
        const bd = bv ? new Date(bv as string).getTime() : 0
        cmp = ad - bd
      } else if (sortKey === 'Priority') {
        const order = ['Low','Normal','High','Critical']
        cmp = order.indexOf(av as string) - order.indexOf(bv as string)
      } else if (sortKey === 'Status') {
        cmp = statusOrder.indexOf(av as string) - statusOrder.indexOf(bv as string)
      } else {
        const as = (av || '').toString().toLowerCase()
        const bs = (bv || '').toString().toLowerCase()
        if (as < bs) cmp = -1
        else if (as > bs) cmp = 1
        else cmp = 0
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const setFilter = (patch: Partial<Filters>) => {
    setFilters(f => ({ ...f, ...patch, ...(patch.customer ? { site: 'All' } : null) }))
  }

  const resetFilters = () => setFilters(emptyFilters)

  const header = (label: string, key: SortKey) => {
    const active = sortKey === key
    return (
      <th className={"th-sort" + (active ? ' active' : '')} onClick={() => onHeaderClick(key)}>
        <span>{label}</span>
        {active && <span className="arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </th>
    )
  }

  const renderDate = (v?: string) => {
    if (!v) return '—'
    try { const d = new Date(v); if (isNaN(d.getTime())) return '—'; return d.toLocaleString() } catch { return '—' }
  }

  // Get address for a ticket based on customer and site
  const getSiteAddress = (siteName: string, customer: string) => {
    const site = sites.find(s => s.Site === siteName && s.Customer === customer)
    if (!site) return '—'
    return [site.Address, site.City, site.State].filter(Boolean).join(', ') || '—'
  }

  const handleExportCSV = () => {
    const columns = [
      { key: 'TicketID' as keyof Ticket, label: 'Ticket ID' },
      { key: 'Title' as keyof Ticket, label: 'Title' },
      { key: 'Customer' as keyof Ticket, label: 'Customer' },
      { key: 'Site' as keyof Ticket, label: 'Site' },
      { key: 'Priority' as keyof Ticket, label: 'Priority' },
      { key: 'Status' as keyof Ticket, label: 'Status' },
      { key: 'AssignedTo' as keyof Ticket, label: 'Assigned To' },
      { key: 'Owner' as keyof Ticket, label: 'Owner' },
      { key: 'Category' as keyof Ticket, label: 'Category' },
      { key: 'ScheduledStart' as keyof Ticket, label: 'Scheduled Start' },
      { key: 'ScheduledEnd' as keyof Ticket, label: 'Scheduled End' },
      { key: 'SLA_Due' as keyof Ticket, label: 'SLA Due' },
      { key: 'LicenseIDs' as keyof Ticket, label: 'License IDs' },
      { key: 'Tags' as keyof Ticket, label: 'Tags' },
      { key: 'CreatedAt' as keyof Ticket, label: 'Created At' },
      { key: 'UpdatedAt' as keyof Ticket, label: 'Updated At' },
      { key: 'Resolution' as keyof Ticket, label: 'Resolution' },
      { key: 'Description' as keyof Ticket, label: 'Description' }
    ]

    // Prepare data with formatted values and site addresses
    const exportData = sorted.map(ticket => ({
      ...ticket,
      Priority: formatPriorityForCSV(ticket.Priority || ''),
      Status: formatStatusForCSV(ticket.Status || ''),
      CreatedAt: formatDateForCSV(ticket.CreatedAt || ''),
      UpdatedAt: formatDateForCSV(ticket.UpdatedAt || ''),
      ScheduledStart: formatDateForCSV(ticket.ScheduledStart || ''),
      ScheduledEnd: formatDateForCSV(ticket.ScheduledEnd || ''),
      SLA_Due: formatDateForCSV(ticket.SLA_Due || ''),
      Address: getSiteAddress(ticket.Site || '', ticket.Customer || '')
    }))

    // Add address column
    const columnsWithAddress = [
      ...columns.slice(0, 12), // Include up to SLA_Due
      { key: 'Address' as keyof typeof exportData[0], label: 'Address' },
      ...columns.slice(12) // Include remaining columns
    ]

    arrayToCSV(exportData, columnsWithAddress, 'service-tickets')
  }

  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div className="title">Service Coordinator Dashboard</div>
        {loading && <span className="muted">Loading…</span>}
      </div>
      
      {/* Coordinator Stats */}
      <div className="row" style={{gap:12, marginBottom:16, padding:'12px 0', borderBottom:'1px solid #1b2740'}}>
        <div 
          className="pill" 
          style={{
            background: isStatActive('total') ? '#2a3a5f' : '#17263f', 
            color:'#9fb3ff', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('total') ? '1px solid #9fb3ff' : '1px solid transparent',
            boxShadow: isStatActive('total') ? '0 0 8px rgba(159, 179, 255, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('total')}
          title="Click to show all tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('total')) {
              e.currentTarget.style.backgroundColor = '#1e2d4a'
              e.currentTarget.style.borderColor = '#9fb3ff'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('total')) {
              e.currentTarget.style.backgroundColor = '#17263f'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          📋 Total: {stats.total}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('new') ? '#2a3a5f' : '#17263f', 
            color:'#ffaf38', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('new') ? '1px solid #ffaf38' : '1px solid transparent',
            boxShadow: isStatActive('new') ? '0 0 8px rgba(255, 175, 56, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('new')}
          title="Click to filter New tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('new')) {
              e.currentTarget.style.backgroundColor = '#1e2d4a'
              e.currentTarget.style.borderColor = '#ffaf38'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('new')) {
              e.currentTarget.style.backgroundColor = '#17263f'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          🆕 New: {stats.newTickets}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('assigned') ? '#243d35' : '#17312a', 
            color:'#79e2b6', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('assigned') ? '1px solid #79e2b6' : '1px solid transparent',
            boxShadow: isStatActive('assigned') ? '0 0 8px rgba(121, 226, 182, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('assigned')}
          title="Click to filter Assigned/Scheduled tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('assigned')) {
              e.currentTarget.style.backgroundColor = '#1d3a30'
              e.currentTarget.style.borderColor = '#79e2b6'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('assigned')) {
              e.currentTarget.style.backgroundColor = '#17312a'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          ✅ Assigned: {stats.assigned}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('inProgress') ? '#3d332b' : '#2b2321', 
            color:'#ffc78a', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('inProgress') ? '1px solid #ffc78a' : '1px solid transparent',
            boxShadow: isStatActive('inProgress') ? '0 0 8px rgba(255, 199, 138, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('inProgress')}
          title="Click to filter In Progress tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('inProgress')) {
              e.currentTarget.style.backgroundColor = '#332a26'
              e.currentTarget.style.borderColor = '#ffc78a'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('inProgress')) {
              e.currentTarget.style.backgroundColor = '#2b2321'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          🔄 In Progress: {stats.inProgress}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('complete') ? '#2d3d2d' : '#213321', 
            color:'#88cc88', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('complete') ? '1px solid #88cc88' : '1px solid transparent',
            boxShadow: isStatActive('complete') ? '0 0 8px rgba(136, 204, 136, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('complete')}
          title="Click to filter Complete tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('complete')) {
              e.currentTarget.style.backgroundColor = '#263326'
              e.currentTarget.style.borderColor = '#88cc88'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('complete')) {
              e.currentTarget.style.backgroundColor = '#213321'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          ✅ Complete: {stats.complete}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('overdue') ? '#4d2d2d' : '#3a1f1f', 
            color:'#ff9b9b', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('overdue') ? '1px solid #ff9b9b' : '1px solid transparent',
            boxShadow: isStatActive('overdue') ? '0 0 8px rgba(255, 155, 155, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('overdue')}
          title="Click to filter Overdue tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('overdue')) {
              e.currentTarget.style.backgroundColor = '#442525'
              e.currentTarget.style.borderColor = '#ff9b9b'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('overdue')) {
              e.currentTarget.style.backgroundColor = '#3a1f1f'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          ⚠️ Overdue: {stats.overdue}
        </div>
        <div 
          className="pill" 
          style={{
            background: isStatActive('highPriority') ? '#4d2d2d' : '#3a1f1f', 
            color:'#ff5470', 
            padding:'6px 12px', 
            cursor:'pointer',
            transition: 'all 0.2s ease',
            border: isStatActive('highPriority') ? '1px solid #ff5470' : '1px solid transparent',
            boxShadow: isStatActive('highPriority') ? '0 0 8px rgba(255, 84, 112, 0.3)' : 'none'
          }}
          onClick={() => handleStatClick('highPriority')}
          title="Click to filter High Priority tickets"
          onMouseEnter={(e) => {
            if (!isStatActive('highPriority')) {
              e.currentTarget.style.backgroundColor = '#442525'
              e.currentTarget.style.borderColor = '#ff5470'
            }
          }}
          onMouseLeave={(e) => {
            if (!isStatActive('highPriority')) {
              e.currentTarget.style.backgroundColor = '#3a1f1f'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          🔥 High Priority: {stats.highPriority}
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(filters.status !== 'All' || filters.priority !== 'All' || filters.customer !== 'All' || filters.site !== 'All' || filters.search) && (
        <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#1a2332', borderRadius: '6px', fontSize: '13px', color: '#9fb3ff' }}>
          🔍 Active filters: {' '}
          {filters.status === 'Overdue' && <span style={{ color: '#ff9b9b' }}>Overdue tickets</span>}
          {filters.status !== 'All' && filters.status !== 'Overdue' && <span style={{ color: '#79e2b6' }}>Status: {filters.status}</span>}
          {filters.priority === 'High,Critical' && <span style={{ color: '#ff5470' }}>High Priority</span>}
          {filters.priority !== 'All' && filters.priority !== 'High,Critical' && <span style={{ color: '#ffc78a' }}>Priority: {filters.priority}</span>}
          {filters.customer !== 'All' && <span style={{ color: '#ffaf38' }}>Customer: {filters.customer}</span>}
          {filters.site !== 'All' && <span style={{ color: '#ffaf38' }}>Site: {filters.site}</span>}
          {filters.search && <span style={{ color: '#9fb3ff' }}>Search: "{filters.search}"</span>}
          <button 
            onClick={() => setFilters(emptyFilters)}
            style={{ 
              marginLeft: '8px', 
              background: 'transparent', 
              border: '1px solid #ff5470', 
              color: '#ff5470', 
              borderRadius: '4px', 
              fontSize: '11px', 
              padding: '2px 6px',
              cursor: 'pointer' 
            }}
            title="Clear all filters"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="row" style={{gap:8, marginBottom:12}}>
        <div style={{flex:'1 1 180px'}}>
          <input placeholder="🔍 Search tickets..." value={filters.search} onChange={e=>setFilter({search:e.target.value})} />
        </div>
        <div style={{flex:'0 0 160px'}}>
          <select value={filters.customer} onChange={e=>setFilter({customer:e.target.value})}>
            <option value="All">Customer (All)</option>
            {customerOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{flex:'0 0 160px'}}>
          <select value={filters.site} onChange={e=>setFilter({site:e.target.value})}>
            <option value="All">Site (All)</option>
            {siteOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{flex:'0 0 140px'}}>
          <select value={filters.status} onChange={e=>setFilter({status:e.target.value})}>
            <option value="All">Status (All)</option>
            {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{flex:'0 0 140px'}}>
          <select value={filters.priority} onChange={e=>setFilter({priority:e.target.value})}>
            <option value="All">Priority (All)</option>
            {['Low','Normal','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{display:'flex', gap:4, flex:'0 0 280px'}}>
          <input type="date" value={filters.createdFrom} onChange={e=>setFilter({createdFrom:e.target.value})} title="Created From" />
          <input type="date" value={filters.createdTo} onChange={e=>setFilter({createdTo:e.target.value})} title="Created To" />
        </div>
        <div style={{flex:'0 0 auto', display:'flex', gap:8}}>
          <button type="button" className="ghost" onClick={resetFilters}>Reset</button>
          <button type="button" className="primary" onClick={handleExportCSV} title={`Export ${sorted.length} tickets to CSV`}>
            📊 Export CSV
          </button>
        </div>
      </div>
      
      {/* Split Pane: Tickets Table (Top) and Activity Log (Bottom) */}
      <div 
        ref={splitContainerRef}
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: 'calc(100vh - 280px)',
          gap: 0
        }}
      >
        {/* Tickets Table with Scroll */}
        <div style={{ 
          flex: `1 1 ${100 - ticketActivitySplit}%`,
          overflow: 'auto',
          minHeight: '200px'
        }}>
          <div className="table-wrap">
            <table>
          <thead>
            <tr>
              {header('TicketID','TicketID')}
              {header('Title','Title')}
              {header('Customer','Customer')}
              {header('Site','Site')}
              {header('LicenseIDs','LicenseIDs')}
              {header('Priority','Priority')}
              {header('Status','Status')}
              {header('AssignedTo','AssignedTo')}
              {header('Owner','Owner')}
              {header('Category','Category')}
              {header('ScheduledStart','ScheduledStart')}
              {header('ScheduledEnd','ScheduledEnd')}
              {header('SLA_Due','SLA_Due')}
              <th>Address</th>
              {header('Tags','Tags')}
              {header('CreatedAt','CreatedAt')}
              {header('UpdatedAt','UpdatedAt')}
              {header('Resolution','Resolution')}
            </tr>
          </thead>
          <tbody>
            {sorted.map(t => (
              <tr 
                key={t.TicketID} 
                onClick={() => onEdit && onEdit(t)}
                title={onEdit ? "Click to edit ticket" : undefined}
                style={{ 
                  cursor: onEdit ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (onEdit) {
                    e.currentTarget.style.backgroundColor = '#e2e8f0'
                    e.currentTarget.style.color = '#1a202c'
                    e.currentTarget.style.transform = 'scale(1.002)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                    // Make sure all text in cells is visible
                    const cells = e.currentTarget.querySelectorAll('td')
                    cells.forEach(cell => {
                      cell.style.color = '#1a202c'
                      cell.style.fontWeight = '500'
                    })
                  }
                }}
                onMouseLeave={(e) => {
                  if (onEdit) {
                    e.currentTarget.style.backgroundColor = ''
                    e.currentTarget.style.color = ''
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = ''
                    // Reset text styling
                    const cells = e.currentTarget.querySelectorAll('td')
                    cells.forEach(cell => {
                      cell.style.color = ''
                      cell.style.fontWeight = ''
                    })
                  }
                }}
              >
                <td className="muted">{display(t.TicketID)}</td>
                <td className="cell-clip" title={t.Title}>{display(t.Title)}</td>
                <td className="cell-clip" title={t.Customer}>{display(t.Customer)}</td>
                <td className="cell-clip" title={t.Site}>{display(t.Site)}</td>
                <td className="cell-clip" title={t.LicenseIDs}>{display(t.LicenseIDs)}</td>
                <td><span className="pill" title={t.Priority}>{display(t.Priority)}</span></td>
                <td><span className={"pill status-" + (t.Status?.replace(/\s/g,'-') || 'New')} title={t.Status}>{display(t.Status)}</span></td>
                <td className="cell-clip" title={t.AssignedTo}>{display(t.AssignedTo)}</td>
                <td className="cell-clip" title={t.Owner}>{display(t.Owner)}</td>
                <td className="cell-clip" title={t.Category}>{display(t.Category)}</td>
                <td className="cell-clip" title={t.ScheduledStart}>{renderDate(t.ScheduledStart)}</td>
                <td className="cell-clip" title={t.ScheduledEnd}>{renderDate(t.ScheduledEnd)}</td>
                <td className="cell-clip" title={t.SLA_Due}>{renderDate(t.SLA_Due)}</td>
                <td className="cell-clip" title={getSiteAddress(t.Site || '', t.Customer || '')}>{getSiteAddress(t.Site || '', t.Customer || '')}</td>
                <td className="cell-clip" title={t.Tags}>{display(t.Tags)}</td>
                <td className="cell-clip" title={t.CreatedAt}>{renderDate(t.CreatedAt)}</td>
                <td className="cell-clip" title={t.UpdatedAt}>{renderDate(t.UpdatedAt)}</td>
                <td className="cell-clip" title={t.Resolution}>{display(t.Resolution)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={18} className="muted">No tickets found.</td></tr>
            )}
          </tbody>
        </table>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          style={{
            height: '8px',
            background: isDragging ? '#1e2d4a' : '#0f1729',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #1e2d4a',
            borderBottom: '1px solid #1e2d4a',
            position: 'relative',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            if (!isDragging) e.currentTarget.style.background = '#1e2d4a'
          }}
          onMouseLeave={(e) => {
            if (!isDragging) e.currentTarget.style.background = '#0f1729'
          }}
        >
          <div style={{
            width: '40px',
            height: '3px',
            background: '#64748b',
            borderRadius: '2px'
          }}></div>
        </div>

        {/* Activity Log with Scroll */}
        <div style={{ 
          flex: `1 1 ${ticketActivitySplit}%`,
          minHeight: '150px',
          overflow: 'hidden'
        }}>
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  )
}
