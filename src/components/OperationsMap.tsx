import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'

// Create clustered marker icon with count badge
const createClusteredIcon = (count: number, priority: string) => {
  const baseColors = {
    'Critical': '#ff4444',
    'High': '#ff8800', 
    'Normal': '#3388ff',
    'Low': '#88cc88'
  }
  
  const color = baseColors[priority as keyof typeof baseColors] || '#3388ff'
  const size = Math.min(30 + count * 3, 50) // Scale size with count, max 50px
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(12, Math.min(16, 10 + count))}px;
        ${priority === 'Critical' ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${count}
      </div>
    `,
    className: 'clustered-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  })
}

// Component to update map bounds programmatically
function MapBoundsUpdater({ center, zoom, bounds }: { 
  center: [number, number], 
  zoom: number,
  bounds?: [number, number][]
}) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      // Use fitBounds for multiple tickets
      map.fitBounds(bounds, { padding: [20, 20] })
    } else {
      // Use setView for single tickets or default
      map.setView(center, zoom)
    }
  }, [map, center, zoom, bounds])
  
  return null
}
import L from 'leaflet'
import { listTickets, listSites, fixTicketGeolocations } from '../api-sql'
import type { Ticket, Site } from '../types'
import 'leaflet/dist/leaflet.css'

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #3388ff; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [25, 25],
  className: ''
})

// Priority-based icons
const priorityIcons = {
  Critical: L.divIcon({
    html: `<div style="background-color: #ff4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); animation: pulse 2s infinite;"></div>`,
    iconSize: [30, 30],
    className: 'critical-marker'
  }),
  High: L.divIcon({
    html: `<div style="background-color: #ff8800; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    className: ''
  }),
  Normal: L.divIcon({
    html: `<div style="background-color: #3388ff; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    className: ''
  }),
  Low: L.divIcon({
    html: `<div style="background-color: #88cc88; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [22, 22],
    className: ''
  })
}

// Status-based styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return '#ff6b6b'
    case 'Scheduled': return '#4ecdc4'
    case 'In-Progress': return '#45b7d1'
    case 'On-Hold': return '#f9ca24'
    case 'Complete': return '#6c5ce7'
    case 'Closed': return '#a0a0a0'
    default: return '#3388ff'
  }
}

// Auto-refresh component
function AutoRefresh({ onRefresh, interval = 60000 }: { onRefresh: () => void, interval?: number }) {
  const [countdown, setCountdown] = useState(interval / 1000)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRefresh()
          return interval / 1000
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [onRefresh, interval])
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(255,255,255,0.9)',
      padding: '8px 12px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      zIndex: 1000,
      fontSize: '12px'
    }}>
      Auto-refresh in {countdown}s
    </div>
  )
}

// Statistics overlay
function StatsOverlay({ tickets }: { tickets: Ticket[] }) {
  const stats = useMemo(() => {
    const open = tickets.filter(t => !['Complete', 'Closed'].includes(t.Status))
    const critical = open.filter(t => t.Priority === 'Critical').length
    const high = open.filter(t => t.Priority === 'High').length
    const inProgress = open.filter(t => t.Status === 'In-Progress').length
    const overdue = open.filter(t => new Date(t.SLA_Due) < new Date()).length
    
    return { 
      total: open.length, 
      critical, 
      high, 
      inProgress, 
      overdue,
      byStatus: open.reduce((acc, ticket) => {
        acc[ticket.Status] = (acc[ticket.Status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [tickets])
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      minWidth: '200px',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
        Operations Dashboard
      </div>
      <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
        <div>🎯 Open Tickets: {stats.total}</div>
        <div style={{ color: '#ff4444' }}>🚨 Critical: {stats.critical}</div>
        <div style={{ color: '#ff8800' }}>⚠️ High: {stats.high}</div>
        <div style={{ color: '#45b7d1' }}>🔧 In Progress: {stats.inProgress}</div>
        <div style={{ color: '#ff6b6b' }}>⏰ Overdue: {stats.overdue}</div>
        
        {Object.entries(stats.byStatus).length > 0 && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} style={{ color: getStatusColor(status) }}>
                {status}: {count}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Legend component
function MapLegend() {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(255,255,255,0.95)',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 1000,
      fontSize: '11px',
      minWidth: '120px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>Priority</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#ff4444', marginRight: '6px' }}></div>
        <span style={{ color: '#333' }}>Critical</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff8800', marginRight: '6px' }}></div>
        <span style={{ color: '#333' }}>High</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: '#3388ff', marginRight: '6px' }}></div>
        <span style={{ color: '#333' }}>Normal</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#88cc88', marginRight: '6px' }}></div>
        <span style={{ color: '#333' }}>Low</span>
      </div>
    </div>
  )
}

// Map controls component
function MapControls({ onToggleFullscreen, isFullscreen, onRefresh, onPopOut, onFixGeolocations }: {
  onToggleFullscreen: () => void
  isFullscreen: boolean
  onRefresh: () => void
  onPopOut: () => void
  onFixGeolocations: () => void
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '140px',
      display: 'flex',
      gap: '4px',
      zIndex: 1000,
      flexWrap: 'wrap'
    }}>
      <button
        onClick={onRefresh}
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        🔄 Refresh
      </button>
      <button
        onClick={onFixGeolocations}
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        title="Fix missing geolocations for existing tickets"
      >
        📍 Fix Locations
      </button>
      <button
        onClick={onPopOut}
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        🗗 Pop Out
      </button>
      <button
        onClick={onToggleFullscreen}
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {isFullscreen ? '🗗 Exit' : '🗖 Full'}
      </button>
    </div>
  )
}

interface OperationsMapProps {
  tickets?: Ticket[]
  refreshTrigger?: number
}

export default function OperationsMap({ tickets: propTickets, refreshTrigger }: OperationsMapProps = {}) {
  const [tickets, setTickets] = useState<Ticket[]>(propTickets || [])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const loadData = async () => {
    try {
      setLoading(true)
      // If tickets are provided as props, just load sites
      if (propTickets && propTickets.length > 0) {
        const sitesData = await listSites()
        setTickets(propTickets)
        setSites(sitesData)
      } else {
        // Otherwise load both tickets and sites
        const [ticketsData, sitesData] = await Promise.all([
          listTickets(),
          listSites()
        ])
        setTickets(ticketsData)
        setSites(sitesData)
      }
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      setError('Failed to load ticket data')
      console.error('Error loading map data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Update tickets when props change
  useEffect(() => {
    if (propTickets) {
      setTickets(propTickets)
      setLastUpdate(new Date())
    }
  }, [propTickets])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadData()
    }
  }, [refreshTrigger])

  // Filter to open tickets only
  const openTickets = useMemo(() => 
    tickets.filter(ticket => !['Complete', 'Closed'].includes(ticket.Status))
  , [tickets])

  // Parse coordinates and create clustered markers
  const ticketMarkers = useMemo(() => {
    const ticketsWithCoords = openTickets
      .filter(ticket => ticket.GeoLocation)
      .map(ticket => {
        const [lat, lng] = ticket.GeoLocation.split(',').map(coord => parseFloat(coord.trim()))
        if (isNaN(lat) || isNaN(lng)) return null
        
        return {
          ticket,
          position: [lat, lng] as [number, number],
          coordKey: `${lat.toFixed(4)},${lng.toFixed(4)}` // Group by rounded coordinates
        }
      })
      .filter(Boolean)

    // Group tickets by location
    const locationGroups = ticketsWithCoords.reduce((groups, item) => {
      const key = item!.coordKey
      if (!groups[key]) {
        groups[key] = {
          position: item!.position,
          tickets: []
        }
      }
      groups[key].tickets.push(item!.ticket)
      return groups
    }, {} as Record<string, { position: [number, number], tickets: Ticket[] }>)

    // Create markers with count information
    return Object.entries(locationGroups).map(([coordKey, group]) => {
      const ticketCount = group.tickets.length
      const highestPriority = group.tickets.reduce((highest, ticket) => {
        const priorities = { 'Critical': 4, 'High': 3, 'Normal': 2, 'Low': 1 }
        const currentPriority = priorities[ticket.Priority as keyof typeof priorities] || 0
        const highestPriority = priorities[highest as keyof typeof priorities] || 0
        return currentPriority > highestPriority ? ticket.Priority : highest
      }, 'Low')

      return {
        coordKey,
        position: group.position,
        tickets: group.tickets,
        count: ticketCount,
        priority: highestPriority,
        icon: ticketCount > 1 
          ? createClusteredIcon(ticketCount, highestPriority)
          : priorityIcons[highestPriority as keyof typeof priorityIcons] || DefaultIcon
      }
    })
  }, [openTickets])

  // Calculate optimal map bounds and center from tickets
  const mapBounds = useMemo(() => {
    if (ticketMarkers.length === 0) {
      // Default to Texas center if no tickets
      return {
        center: [31.9686, -99.9018] as [number, number],
        zoom: 6
      }
    }

    if (ticketMarkers.length === 1) {
      // Single ticket - center on it with moderate zoom
      const pos = ticketMarkers[0]?.position || [31.9686, -99.9018]
      return {
        center: pos,
        zoom: 10
      }
    }

    // Multiple tickets - calculate bounding box
    const positions = ticketMarkers.map(marker => marker?.position).filter(Boolean) as [number, number][]
    
    const lats = positions.map(pos => pos[0])
    const lngs = positions.map(pos => pos[1])
    
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    // Calculate center
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calculate span to determine zoom level
    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng
    const maxSpan = Math.max(latSpan, lngSpan)
    
    // Determine appropriate zoom level based on span
    let zoom = 6 // Default
    if (maxSpan < 1) zoom = 10        // City level
    else if (maxSpan < 3) zoom = 8    // Metro area
    else if (maxSpan < 8) zoom = 6    // State level  
    else if (maxSpan < 20) zoom = 5   // Regional level
    else if (maxSpan < 40) zoom = 4   // Multi-state
    else zoom = 3                     // National level
    
    return {
      center: [centerLat, centerLng] as [number, number],
      zoom,
      bounds: [[minLat, minLng] as [number, number], [maxLat, maxLng] as [number, number]]
    }
  }, [ticketMarkers])

  // Calculate center from tickets or default to Texas
  const mapCenter = mapBounds.center

  const getSiteAddress = (siteName: string, customer: string) => {
    const site = sites.find(s => s.Site === siteName && s.Customer === customer)
    return site ? `${site.Address || ''}, ${site.City || ''}, ${site.State || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Unknown location'
  }

  const formatTimeUntilSLA = (slaDate: string) => {
    const now = new Date()
    const sla = new Date(slaDate)
    const diffMs = sla.getTime() - now.getTime()
    
    if (diffMs < 0) {
      const hoursOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)))
      return `⚠️ ${hoursOverdue}h overdue`
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 1) return `${minutes}m remaining`
    if (hours < 24) return `${hours}h ${minutes}m remaining`
    
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h remaining`
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handlePopOut = () => {
    const currentUrl = window.location.origin + window.location.pathname
    const popoutUrl = `${currentUrl}?map-only=true`
    
    const popoutWindow = window.open(
      popoutUrl,
      'operations-map',
      'width=1200,height=800,scrollbars=no,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
    )
    
    if (popoutWindow) {
      popoutWindow.focus()
    }
  }

  const handleFixGeolocations = async () => {
    try {
      console.log('Fixing geolocations for existing tickets...')
      const fixedCount = await fixTicketGeolocations()
      if (fixedCount > 0) {
        alert(`Successfully fixed geolocation for ${fixedCount} tickets! The map will refresh automatically.`)
        await loadData() // Refresh the data to show new markers
      } else {
        alert('No tickets needed geolocation fixes.')
      }
    } catch (error) {
      console.error('Error fixing geolocations:', error)
      alert('Error occurred while fixing geolocations. Please try again.')
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        Loading operations map...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff5f5',
        color: '#d32f2f',
        borderRadius: '8px',
        border: '1px solid #ffcdd2'
      }}>
        {error}
      </div>
    )
  }

  const mapHeight = isFullscreen ? '100vh' : 'calc(100vh - 120px)'
  const mapWidth = isFullscreen ? '100vw' : '100%'

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        ${isFullscreen ? `
          .operations-map-fullscreen {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            background: white;
          }
        ` : ''}
      `}</style>
      
      <div 
        className={isFullscreen ? 'operations-map-fullscreen' : ''}
        style={{
          position: 'relative',
          height: mapHeight,
          width: mapWidth,
          borderRadius: isFullscreen ? '0' : '8px',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid #e0e0e0'
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapBounds.zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          key={`map-${ticketMarkers.length}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBoundsUpdater 
            center={mapCenter} 
            zoom={mapBounds.zoom} 
            bounds={mapBounds.bounds}
          />
          
          {ticketMarkers.map((marker, index) => {
            if (!marker) return null
            
            return (
              <Marker
                key={`${marker.coordKey}-${index}`}
                position={marker.position}
                icon={marker.icon}
              >
                <Popup>
                  <div style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                    {marker.count > 1 && (
                      <div style={{ 
                        background: '#f0f0f0', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        marginBottom: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        📍 {marker.count} Open Tickets at This Location
                      </div>
                    )}
                    
                    {marker.tickets.map((ticket, ticketIndex) => (
                      <div 
                        key={ticket.TicketID} 
                        style={{ 
                          marginBottom: ticketIndex < marker.tickets.length - 1 ? '16px' : '0',
                          paddingBottom: ticketIndex < marker.tickets.length - 1 ? '16px' : '0',
                          borderBottom: ticketIndex < marker.tickets.length - 1 ? '1px solid #eee' : 'none'
                        }}
                      >
                        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                          {ticket.Title}
                        </h4>
                        
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>ID:</strong> {ticket.TicketID}
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Status:</strong> <span style={{ color: getStatusColor(ticket.Status) }}>
                              {ticket.Status}
                            </span>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Priority:</strong> <span style={{ 
                              color: ticket.Priority === 'Critical' ? '#ff4444' : 
                                    ticket.Priority === 'High' ? '#ff8800' : '#333' 
                            }}>
                              {ticket.Priority}
                            </span>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Location:</strong> {getSiteAddress(ticket.Site, ticket.Customer)}
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Assigned:</strong> {ticket.AssignedTo || 'Unassigned'}
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>SLA:</strong> {formatTimeUntilSLA(ticket.SLA_Due)}
                          </div>
                          {ticket.Description && (
                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                              <div style={{ fontStyle: 'italic', color: '#555' }}>
                                {ticket.Description.length > 100 
                                  ? `${ticket.Description.substring(0, 100)}...`
                                  : ticket.Description
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        
        <MapLegend />
        <StatsOverlay tickets={tickets} />
        <AutoRefresh onRefresh={loadData} />
        <MapControls 
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onRefresh={loadData}
          onPopOut={handlePopOut}
          onFixGeolocations={handleFixGeolocations}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '120px',
          right: '10px',
          background: 'rgba(255,255,255,0.9)',
          padding: '6px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#333',
          zIndex: 1000
        }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </>
  )
}