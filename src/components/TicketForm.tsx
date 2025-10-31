import React, { useEffect, useMemo, useState } from 'react'
import type { Ticket, Customer, Site, Asset, User } from '../types'
import { listAssets } from '../api-json'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Props = {
  onClose: () => void
  onSubmit: (data: Partial<Ticket>) => Promise<void>
}

export default function TicketForm({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<Ticket>>({
    Title: '',
    Priority: 'Normal',
    Status: 'New',
    Category: '',
    Customer: '',
    Site: '',
    AssignedTo: '',
    Owner: '',
    ScheduledStart: '',
    ScheduledEnd: '',
    SLA_Due: '',
    GeoLocation: '',
    Tags: '',
    Description: '',
    Resolution: '',
    ClosedBy: '',
    ClosedDate: ''
  })
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])

  useEffect(()=>{
    (async()=>{
      try {
        // Fetch customers
        console.log('TicketForm: Fetching customers...')
  const customersResponse = await fetch(`${API_BASE_URL}/customers`)
        const customersData = await customersResponse.json()
        console.log('TicketForm: Customers loaded:', customersData)
        setCustomers(customersData)
        
        // Fetch sites  
        console.log('TicketForm: Fetching sites...')
  const sitesResponse = await fetch(`${API_BASE_URL}/sites`)
        const sitesData = await sitesResponse.json()
        console.log('TicketForm: Sites loaded:', sitesData)
        setSites(sitesData)
        
        // For now, keep assets from the old service until we implement assets API
        console.log('TicketForm: Fetching assets...')
        const assetsData = await listAssets()
        console.log('TicketForm: Assets loaded:', assetsData)
        setAssets(assetsData)
        
        // Fetch users for technician dropdown
        console.log('TicketForm: Fetching users...')
  const usersResponse = await fetch(`${API_BASE_URL}/users`)
        const usersData = await usersResponse.json()
        console.log('TicketForm: Users loaded:', usersData)
        setUsers(usersData.value || usersData || [])
      } catch (error) {
        console.error('TicketForm: Error fetching data:', error)
      }
    })()
  }, [])

  function update<K extends keyof Ticket>(key: K, val: any) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // Custom handler for site selection that auto-populates geolocation
  function handleSiteChange(siteName: string) {
    update('Site', siteName)
    
    // Auto-populate geolocation if the site has it
    if (siteName && form.Customer) {
      const selectedSite = sites.find(s => s.Customer === form.Customer && s.Site === siteName)
      if (selectedSite && selectedSite.GeoLocation) {
        update('GeoLocation', selectedSite.GeoLocation)
      }
    }
  }

  const filteredSites = useMemo(
    () => sites.filter(s => !form.Customer || s.Customer === (form.Customer as string)),
    [sites, form.Customer]
  )

  const filteredAssets = useMemo(
    () => assets.filter(a => (!form.Customer || a.Customer===form.Customer) && (!form.Site || a.Site===form.Site)),
    [assets, form.Customer, form.Site]
  )

  // Get technicians for assignment dropdown
  const technicians = useMemo(
    () => users.filter(user => user.role === 'Technician' && user.isActive),
    [users]
  )

  // Get coordinators and admins for owner dropdown
  const coordinatorsAndAdmins = useMemo(
    () => users.filter(user => (user.role === 'Coordinator' || user.role === 'Admin') && user.isActive),
    [users]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Log form state for debugging
      console.log('TicketForm.handleSubmit: Current form state:', form);
      console.log('TicketForm.handleSubmit: Customer value:', form.Customer);
      console.log('TicketForm.handleSubmit: Selected assets:', selectedAssets);
      
      // Backend normalizes list fields; provide arrays for clarity where appropriate
      const payload: Partial<Ticket> = {
        ...form,
        Tags: (form.Tags as string || '').split(',').map(t=>t.trim()).filter(Boolean).join(','),
      }
      console.log('TicketForm.handleSubmit: Final payload being sent:', payload);
      await onSubmit(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function toggleAsset(id: string){
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="card modal">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <div className="title">New Ticket</div>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>

        <form className="grid" onSubmit={handleSubmit}>
          <div className="col-12">
            <label>Title</label>
            <input required value={form.Title||''} onChange={e=>update('Title', e.target.value)} />
          </div>

          <div className="col-3">
            <label>Priority</label>
            <select value={form.Priority as string} onChange={e=>update('Priority', e.target.value)}>
              <option>Low</option><option>Normal</option><option>High</option><option>Critical</option>
            </select>
          </div>
          <div className="col-3">
            <label>Category</label>
            <input value={form.Category||''} onChange={e=>update('Category', e.target.value)} />
          </div>
          <div className="col-3">
            <label>Assigned To</label>
            <select value={form.AssignedTo||''} onChange={e=>update('AssignedTo', e.target.value)}>
              <option value="">— Select Technician —</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.fullName}>
                  {tech.fullName} {tech.vendor ? `(${tech.vendor})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="col-3">
            <label>Owner</label>
            <select value={form.Owner||''} onChange={e=>update('Owner', e.target.value)}>
              <option value="">— Select Owner —</option>
              {coordinatorsAndAdmins.map(user => (
                <option key={user.id} value={user.username}>
                  {user.fullName} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div className="col-3">
            <label>Status</label>
            <select value={form.Status as string} onChange={e=>update('Status', e.target.value)}>
              <option>New</option><option>Assigned</option><option>In Progress</option><option>Complete</option><option>Closed</option>
            </select>
          </div>

          <div className="col-6">
            <label>Customer</label>
            <select value={form.Customer||''} onChange={e=>update('Customer', e.target.value)}>
              <option value="">— Select —</option>
              {customers.map(c => <option key={c.CustomerID} value={c.Name}>{c.Name}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label>Site</label>
            <select value={form.Site||''} onChange={e=>handleSiteChange(e.target.value)}>
              <option value="">— Select —</option>
              {filteredSites.map(s => <option key={s.Customer+'|'+s.Site} value={s.Site}>{s.Site}</option>)}
            </select>
          </div>

          <div className="col-12">
            <label>Description</label>
            <textarea rows={4} value={form.Description||''} onChange={e=>update('Description', e.target.value)} />
          </div>

          <div className="col-4">
            <label>Scheduled Start</label>
            <input type="datetime-local" value={form.ScheduledStart||''} onChange={e=>update('ScheduledStart', e.target.value)} />
          </div>
          <div className="col-4">
            <label>Scheduled End</label>
            <input type="datetime-local" value={form.ScheduledEnd||''} onChange={e=>update('ScheduledEnd', e.target.value)} />
          </div>
            <div className="col-4">
            <label>SLA Due</label>
            <input type="datetime-local" value={form.SLA_Due||''} onChange={e=>update('SLA_Due', e.target.value)} />
          </div>

          <div className="col-6">
            <label>Geo Location</label>
            <input 
              placeholder="lat,long or address (auto-filled from site)" 
              value={form.GeoLocation||''} 
              onChange={e=>update('GeoLocation', e.target.value)} 
            />
          </div>
          <div className="col-6">
            <label>Tags (comma separated)</label>
            <input placeholder="network,camera,urgent" value={form.Tags||''} onChange={e=>update('Tags', e.target.value)} />
          </div>

          {/* Completion/Audit Fields - Show only for completed/closed tickets */}
          {(form.Status === 'Complete' || form.Status === 'Closed') && (
            <>
              <div className="col-12">
                <label>Resolution</label>
                <textarea rows={3} value={form.Resolution||''} onChange={e=>update('Resolution', e.target.value)} 
                  placeholder="Describe how the issue was resolved..." />
              </div>
            </>
          )}

          <div className="col-12">
            <label>Assets at this site</label>
            <div className="row" style={{gap:8, flexWrap:'wrap'}}>
              {filteredAssets.map(a => (
                <label key={a.AssetID} className="pill" style={{display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                  <input type="checkbox" checked={selectedAssets.includes(a.AssetID)} onChange={()=>toggleAsset(a.AssetID)} />
                  {a.AssetID} · {a.Type} · {a.Make} {a.Model}
                </label>
              ))}
              {filteredAssets.length===0 && <div className="muted">No assets found for this selection.</div>}
            </div>
          </div>

          <div className="col-12" style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button className="primary" disabled={saving}>{saving? 'Saving…' : 'Create Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
