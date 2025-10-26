import React, { useEffect, useState, useMemo } from 'react'
import { siteApiService } from '../SiteApiService'
import { customerApiService } from '../services/CustomerApiService'
import type { Site, Customer } from '../types'
import { SiteEditModal } from './SiteEditModal'
import { arrayToCSV } from '../utils/csvExport'

interface SiteFilters {
  search: string
  customer: string
}

const emptyFilters: SiteFilters = {
  search: '',
  customer: 'All'
}

export default function SitesPage() {
  const [items, setItems] = useState<Site[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<Partial<Site>>({ CustomerID: '', Site: '' })
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [filters, setFilters] = useState<SiteFilters>(emptyFilters)

  async function refresh(){
    setItems(await siteApiService.getSites())
    setCustomers(await customerApiService.getCustomers())
  }
  useEffect(()=>{ refresh() }, [])

  function update<K extends keyof Site>(k: K, v: any){ setForm(p=>({...p,[k]:v})) }

  async function save(e: React.FormEvent){
    e.preventDefault()
    
    try {
      // Only create new sites in this form
      console.log('🏢 Creating new site:', form)
      await siteApiService.createSite(form)
      
      setForm({ CustomerID: '', Site: '' })
      refresh()
    } catch (error) {
      console.error('❌ Error saving site:', error)
      alert('Error saving site: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  function startEdit(site: Site) {
    setEditingSite({...site})
    setIsEditModalOpen(true)
  }

  function closeEditModal() {
    setEditingSite(null)
    setIsEditModalOpen(false)
  }

  async function saveEdit(site: Site) {
    try {
      if (site.SiteID) {
        console.log('🏢 Updating site:', site.SiteID, site)
        await siteApiService.updateSite(site.SiteID, site)
      }
      closeEditModal() // Close modal first
      await refresh() // Then refresh data
    } catch (error) {
      console.error('Failed to update site:', error)
      throw error
    }
  }

  async function deleteSiteHandler(siteId: string, siteName: string) {
    try {
      console.log('🏢 Deleting site:', siteId)
      await siteApiService.deleteSite(siteId)
      console.log('✅ Site deleted successfully')
      await refresh() // Reload the sites list
    } catch (error) {
      console.error('Failed to delete site:', error)
      throw error
    }
  }

  // Filter helper function
  const setFilter = (patch: Partial<SiteFilters>) => {
    setFilters(f => ({ ...f, ...patch }))
  }

  const resetFilters = () => setFilters(emptyFilters)

  // Customer dropdown options
  const customerOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach(item => { if (item.Customer) set.add(item.Customer) })
    return Array.from(set).sort()
  }, [items])

  // Filtered sites
  const filteredItems = useMemo(() => {
    const s = filters.search.toLowerCase()
    return items.filter(item => {
      if (filters.customer !== 'All' && item.Customer !== filters.customer) return false
      
      if (s) {
        const searchFields = [
          item.Site,
          item.Customer,
          item.Address,
          item.City,
          item.State,
          item.ContactName,
          item.ContactPhone
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(s)) return false
      }
      
      return true
    })
  }, [items, filters])

  const handleExportCSV = () => {
    const columns = [
      { key: 'SiteID' as keyof Site, label: 'Site ID' },
      { key: 'Customer' as keyof Site, label: 'Customer' },
      { key: 'Site' as keyof Site, label: 'Site Name' },
      { key: 'Address' as keyof Site, label: 'Address' },
      { key: 'City' as keyof Site, label: 'City' },
      { key: 'State' as keyof Site, label: 'State' },
      { key: 'ZIP' as keyof Site, label: 'ZIP Code' },
      { key: 'ContactName' as keyof Site, label: 'Contact Name' },
      { key: 'ContactPhone' as keyof Site, label: 'Contact Phone' },
      { key: 'ContactEmail' as keyof Site, label: 'Contact Email' },
      { key: 'GeoLocation' as keyof Site, label: 'Geo Location' },
      { key: 'Notes' as keyof Site, label: 'Notes' }
    ]

    arrayToCSV(filteredItems, columns, 'sites')
  }

  const hasActiveFilters = filters.search || filters.customer !== 'All'

  return (
    <div className="card">
      <div className="title" style={{marginBottom:8}}>Sites</div>
      <form className="grid" onSubmit={save}>
        <div className="col-6"><label>Customer</label>
          <select 
            required 
            value={form.CustomerID||''} 
            onChange={e=>update('CustomerID', e.target.value)}
          >
            <option value="">— Select —</option>
            {customers.map(c => <option key={c.CustomerID} value={c.CustomerID}>{c.Name}</option>)}
          </select>
        </div>
        <div className="col-6"><label>Site</label>
          <input 
            required 
            value={form.Site||''} 
            onChange={e=>update('Site', e.target.value)} 
          />
        </div>
        <div className="col-12"><label>Address</label>
          <input value={form.Address||''} onChange={e=>update('Address', e.target.value)} />
        </div>
        <div className="col-6"><label>Geolocation (Lat, Lng)</label>
          <input 
            placeholder="e.g., 40.7128, -74.0060" 
            value={form.GeoLocation||''} 
            onChange={e=>update('GeoLocation', e.target.value)} 
          />
        </div>
        <div className="col-3"><label>Contact Name</label>
          <input value={form.ContactName||''} onChange={e=>update('ContactName', e.target.value)} />
        </div>
        <div className="col-3"><label>Contact Phone</label>
          <input value={form.ContactPhone||''} onChange={e=>update('ContactPhone', e.target.value)} />
        </div>
        <div className="col-12"><label>Notes</label>
          <textarea 
            value={form.Notes||''} 
            onChange={e=>update('Notes', e.target.value)}
            rows={3}
          />
        </div>
        <div className="col-12" style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
          <button className="primary">Create Site</button>
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div style={{marginBottom: 12, padding: 8, background: '#17263f', borderRadius: 4, border: '1px solid #2a3a5f'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <span style={{color: '#9fb3ff', fontSize: '14px'}}>Active filters:</span>
            {filters.search && <span style={{ color: '#9fb3ff' }}>Search: "{filters.search}"</span>}
            {filters.customer !== 'All' && <span style={{ color: '#79e2b6' }}>Customer: {filters.customer}</span>}
          </div>
          <button 
            onClick={resetFilters}
            style={{
              marginTop: 4,
              background: 'transparent',
              border: '1px solid #9fb3ff',
              color: '#9fb3ff',
              padding: '2px 8px',
              fontSize: '12px',
              borderRadius: 3,
              cursor: 'pointer'
            }}
            title="Clear all filters"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="row" style={{gap:8, margin:'16px 0 12px 0'}}>
        <div style={{flex:'1 1 200px'}}>
          <input 
            placeholder="🔍 Search sites..." 
            value={filters.search} 
            onChange={e=>setFilter({search:e.target.value})} 
          />
        </div>
        <div style={{flex:'0 0 180px'}}>
          <select value={filters.customer} onChange={e=>setFilter({customer:e.target.value})}>
            <option value="All">Customer (All)</option>
            {customerOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <button 
            className="primary" 
            onClick={handleExportCSV}
            style={{ padding: '8px 16px' }}
            title={`Export ${filteredItems.length} sites to CSV`}
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{marginBottom: 10}}>
        <strong>
          {filteredItems.length} of {items.length} sites {hasActiveFilters ? 'match filters' : 'found'}
        </strong>
      </div>

      <table style={{marginTop:12}}>
        <thead><tr><th>Customer</th><th>Site</th><th>Address</th><th>Contact</th><th>Phone</th><th>GeoLocation</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredItems.map(s => (
            <tr key={s.Customer + '|' + s.Site}>
              <td>{s.Customer}</td>
              <td>{s.Site}</td>
              <td className="muted">{s.Address}</td>
              <td>{s.ContactName}</td>
              <td>{s.ContactPhone}</td>
              <td className="muted" style={{fontSize: '12px'}}>{s.GeoLocation || 'Not set'}</td>
              <td>
                <button 
                  className="ghost" 
                  onClick={() => startEdit(s)}
                  style={{fontSize: '12px', padding: '4px 8px'}}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {items.length===0 && <tr><td colSpan={7} className="muted">No sites yet.</td></tr>}
        </tbody>
      </table>

      <SiteEditModal
        site={editingSite}
        customers={customers}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={saveEdit}
        onDelete={deleteSiteHandler}
      />
    </div>
  )
}
