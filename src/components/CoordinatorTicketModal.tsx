import React, { useEffect, useMemo, useState } from 'react'
import type { Ticket, Customer, Site, Asset } from '../types'
import { listCustomers, listSites, listAssets } from '../api-json'

type Props = {
  ticket: Ticket
  onClose: () => void
  onSave: (updates: Partial<Ticket>) => Promise<void>
}

export default function CoordinatorTicketModal({ ticket, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Ticket>>({...ticket})
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    ticket.AssetIDs ? ticket.AssetIDs.split(',').map(id => id.trim()).filter(Boolean) : []
  )

  useEffect(() => { 
    const loadData = async () => {
      try {
        const [customersData, sitesData, assetsData] = await Promise.all([
          listCustomers(), 
          listSites(), 
          listAssets()
        ])
        setCustomers(customersData)
        setSites(sitesData)
        setAssets(assetsData)
      } catch (error) {
        console.error('Failed to load data:', error)
        setCustomers([])
        setSites([])
        setAssets([])
      }
    }
    loadData()
  }, [])

  function update<K extends keyof Ticket>(key: K, value: any) { 
    console.log('CoordinatorTicketModal.update: Setting', key, '=', value);
    setForm(prev => {
      const newForm = { ...prev, [key]: value }
      
      // If customer changes, clear site selection
      if (key === 'Customer') {
        newForm.Site = ''
      }
      
      console.log('CoordinatorTicketModal.update: New form state:', newForm);
      return newForm
    })
  }

  // Helper to format datetime for input
  function formatDateTimeForInput(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      // Convert to local timezone for input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // Helper to convert input datetime to ISO string
  function formatInputToDateTime(inputValue: string): string {
    if (!inputValue) return '';
    try {
      const date = new Date(inputValue);
      return date.toISOString();
    } catch (error) {
      console.error('Error parsing date input:', error);
      return '';
    }
  }

  const filteredSites = useMemo(() => 
    sites.filter(s => !form.Customer || s.Customer === form.Customer), 
    [sites, form.Customer]
  )

  const filteredAssets = useMemo(() => 
    assets.filter(a => (!form.Customer || a.Customer === form.Customer) && (!form.Site || a.Site === form.Site)), 
    [assets, form.Customer, form.Site]
  )

  function toggleAsset(id: string){
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    
    // Add a visual indicator that we're attempting to save
    console.log('🚀 CoordinatorTicketModal.handleSave: STARTING SAVE PROCESS');
    console.log('📝 Original ticket data:', ticket);
    console.log('📝 Current form data:', form);
    console.log('📝 Selected assets:', selectedAssets);
    
    try {
      const updates: Partial<Ticket> = {
        ...form,
        AssetIDs: selectedAssets.join(','),
        Tags: (form.Tags as string || '').split(',').map(t=>t.trim()).filter(Boolean).join(','),
        UpdatedAt: new Date().toISOString()
      }
      
      console.log('📤 Final updates object being sent to onSave:', updates);
      console.log('🔄 About to call onSave function...');
      
      // Test if onSave is actually a function
      if (typeof onSave !== 'function') {
        throw new Error('onSave is not a function!');
      }
      
      await onSave(updates)
      
      console.log('✅ onSave function completed successfully!');
      console.log('🎉 Closing modal...');
      onClose()
    } catch (error) {
      console.error('❌ ERROR in CoordinatorTicketModal.handleSave:', error);
      console.error('❌ Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        error
      });
      
      // Show a more detailed error message
      const errorMsg = (error as any).message || 'Unknown error occurred';
      alert(`Failed to save ticket: ${errorMsg}\n\nCheck console for detailed error information.`);
    } finally {
      setSaving(false)
      console.log('🏁 Save process completed (success or failure)');
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" 
         style={{
           position: 'fixed', 
           top: 0, 
           left: 0, 
           right: 0, 
           bottom: 0, 
           backgroundColor: 'rgba(0,0,0,0.7)', 
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center',
           zIndex: 1000
         }}>
      <div className="card modal" style={{
        width: '90vw',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '20px',
        backgroundColor: '#2c3e50',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom: '20px', borderBottom: '1px solid #34495e', paddingBottom: '15px'}}>
          <div className="title" style={{fontSize: '24px', fontWeight: 'bold', color: 'white'}}>
            Edit Ticket: {ticket.TicketID}
          </div>
          <button className="ghost" onClick={onClose} style={{fontSize: '16px', padding: '8px 16px', color: 'white', border: '1px solid #7f8c8d'}}>✕ Close</button>
        </div>

        <div className="grid">
          {/* Basic Information Section */}
          <div className="col-12" style={{marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #007acc', color: '#007acc'}}>
              📋 Basic Information
            </h3>
          </div>
          
          <div className="col-12">
            <label style={{fontWeight: 'bold', color: 'white'}}>Title *</label>
            <input required value={form.Title||''} onChange={e=>update('Title', e.target.value)} 
                   style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>

          <div className="col-3">
            <label style={{fontWeight: 'bold', color: 'white'}}>Priority *</label>
            <select value={form.Priority as string} onChange={e=>update('Priority', e.target.value)}
                    style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}>
              <option>Low</option><option>Normal</option><option>High</option><option>Critical</option>
            </select>
          </div>
          <div className="col-3">
            <label style={{fontWeight: 'bold', color: 'white'}}>Status *</label>
            <select value={form.Status as string} onChange={e=>update('Status', e.target.value)}
                    style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}>
              <option>New</option><option>Assigned</option><option>In Progress</option><option>Complete</option><option>Closed</option>
            </select>
          </div>
          <div className="col-3">
            <label style={{fontWeight: 'bold', color: 'white'}}>Category</label>
            <input value={form.Category||''} onChange={e=>update('Category', e.target.value)} 
                   placeholder="e.g., Video Management, Access Control" 
                   style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>
          <div className="col-3">
            <label style={{fontWeight: 'bold', color: 'white'}}>Assigned To</label>
            <input value={form.AssignedTo||''} onChange={e=>update('AssignedTo', e.target.value)} 
                   placeholder="Technician name" 
                   style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>

          {/* Location Section */}
          <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #28a745', color: '#28a745'}}>
              📍 Location & Customer
            </h3>
          </div>

          <div className="col-6">
            <label style={{fontWeight: 'bold', color: 'white'}}>Customer *</label>
            <select value={form.Customer||''} onChange={e=>update('Customer', e.target.value)}
                    style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}>
              <option value="">— Select Customer —</option>
              {customers.map(c => <option key={c.Customer} value={c.Customer}>{c.Customer}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label style={{fontWeight: 'bold', color: 'white'}}>Site</label>
            <select value={form.Site||''} onChange={e=>update('Site', e.target.value)}
                    style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}>
              <option value="">— Select Site —</option>
              {filteredSites.map(s => <option key={s.Customer+'|'+s.Site} value={s.Site}>{s.Site}</option>)}
            </select>
          </div>

          {/* Description Section */}
          <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #6f42c1', color: '#6f42c1'}}>
              📝 Description & Details
            </h3>
          </div>

          <div className="col-12">
            <label style={{fontWeight: 'bold', color: 'white'}}>Description</label>
            <textarea rows={4} value={form.Description||''} onChange={e=>update('Description', e.target.value)} 
                      style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>

          {/* Scheduling Section */}
          <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #fd7e14', color: '#fd7e14'}}>
              📅 Scheduling & Timeline
            </h3>
          </div>

          <div className="col-4">
            <label style={{fontWeight: 'bold', color: 'white'}}>Scheduled Start</label>
            <input 
              type="datetime-local" 
              value={formatDateTimeForInput(form.ScheduledStart)} 
              onChange={e => update('ScheduledStart', formatInputToDateTime(e.target.value))} 
              style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}
            />
          </div>
          <div className="col-4">
            <label style={{fontWeight: 'bold', color: 'white'}}>Scheduled End</label>
            <input 
              type="datetime-local" 
              value={formatDateTimeForInput(form.ScheduledEnd)} 
              onChange={e => update('ScheduledEnd', formatInputToDateTime(e.target.value))} 
              style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}
            />
          </div>
          <div className="col-4">
            <label style={{fontWeight: 'bold', color: 'white'}}>SLA Due</label>
            <input 
              type="datetime-local" 
              value={formatDateTimeForInput(form.SLA_Due)} 
              onChange={e => update('SLA_Due', formatInputToDateTime(e.target.value))} 
              style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}
            />
          </div>

          {/* Additional Information Section */}
          <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #20c997', color: '#20c997'}}>
              🏷️ Additional Information
            </h3>
          </div>

          <div className="col-6">
            <label style={{fontWeight: 'bold', color: 'white'}}>Geo Location</label>
            <input placeholder="lat,long or address" value={form.GeoLocation||''} onChange={e=>update('GeoLocation', e.target.value)} 
                   style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>
          <div className="col-6">
            <label style={{fontWeight: 'bold', color: 'white'}}>Tags (comma separated)</label>
            <input placeholder="network,camera,urgent" value={form.Tags||''} onChange={e=>update('Tags', e.target.value)} 
                   style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
          </div>

          {/* Completion/Audit Fields - Show only for completed/closed tickets */}
          {(form.Status === 'Complete' || form.Status === 'Closed') && (
            <>
              <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
                <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #dc3545', color: '#dc3545'}}>
                  ✅ Completion Details
                </h3>
              </div>
              
              <div className="col-12">
                <label style={{fontWeight: 'bold', color: 'white'}}>Resolution</label>
                <textarea rows={3} value={form.Resolution||''} onChange={e=>update('Resolution', e.target.value)} 
                  placeholder="Describe how the issue was resolved..." 
                  style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
              </div>
              <div className="col-6">
                <label style={{fontWeight: 'bold', color: 'white'}}>Closed By</label>
                <input value={form.ClosedBy||''} onChange={e=>update('ClosedBy', e.target.value)} 
                  placeholder="Name of person who closed the ticket" 
                  style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}} />
              </div>
              <div className="col-6">
                <label style={{fontWeight: 'bold', color: 'white'}}>Closed Date</label>
                <input 
                  type="datetime-local" 
                  value={formatDateTimeForInput(form.ClosedDate)} 
                  onChange={e => update('ClosedDate', formatInputToDateTime(e.target.value))} 
                  style={{fontSize: '16px', padding: '10px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d'}}
                />
              </div>
            </>
          )}

          {/* Assets Section */}
          <div className="col-12" style={{marginTop: '30px', marginBottom: '15px'}}>
            <h3 style={{margin: '0 0 10px 0', padding: '10px 0', borderBottom: '2px solid #6610f2', color: '#6610f2'}}>
              🔧 Assets at this site
            </h3>
          </div>

          <div className="col-12">
            <div className="row" style={{gap:8, flexWrap:'wrap'}}>
              {filteredAssets.map(a => (
                <label key={a.AssetID} className="pill" style={{
                  display:'inline-flex', 
                  alignItems:'center', 
                  gap:6, 
                  cursor:'pointer',
                  padding: '8px 12px',
                  border: selectedAssets.includes(a.AssetID) ? '2px solid #007acc' : '1px solid #ddd',
                  borderRadius: '20px',
                  backgroundColor: selectedAssets.includes(a.AssetID) ? '#e7f3ff' : 'white'
                }}>
                  <input type="checkbox" checked={selectedAssets.includes(a.AssetID)} onChange={()=>toggleAsset(a.AssetID)} />
                  <strong>{a.AssetID}</strong> · {a.Type} · {a.Make} {a.Model}
                </label>
              ))}
              {filteredAssets.length===0 && <div className="muted" style={{padding: '20px', fontSize: '16px'}}>No assets found for this selection.</div>}
            </div>
          </div>

          {/* Show original values for comparison */}
          <div className="col-12" style={{marginTop: 30, padding: 20, backgroundColor: '#34495e', borderRadius: 8, border: '1px solid #7f8c8d'}}>
            <div style={{fontSize: '18px', color: 'white', marginBottom: 15, fontWeight: 'bold'}}>
              📊 Original Values (for comparison)
            </div>
            <div style={{fontSize: '14px', color: 'var(--muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12}}>
              <div><strong>Status:</strong> {ticket.Status}</div>
              <div><strong>Priority:</strong> {ticket.Priority}</div>
              <div><strong>Customer:</strong> {ticket.Customer || '—'}</div>
              <div><strong>Site:</strong> {ticket.Site || '—'}</div>
              <div><strong>Assigned:</strong> {ticket.AssignedTo || '—'}</div>
              <div><strong>Category:</strong> {ticket.Category || '—'}</div>
              <div><strong>Created:</strong> {ticket.CreatedAt ? new Date(ticket.CreatedAt).toLocaleString() : '—'}</div>
              <div><strong>Updated:</strong> {ticket.UpdatedAt ? new Date(ticket.UpdatedAt).toLocaleString() : '—'}</div>
            </div>
          </div>

          <div className="col-12" style={{display:'flex', gap:15, justifyContent:'flex-end', marginTop: 30, paddingTop: 20, borderTop: '1px solid #7f8c8d'}}>
            <button type="button" className="ghost" onClick={onClose} 
                    style={{fontSize: '16px', padding: '12px 20px', color: 'white', border: '1px solid #7f8c8d'}}>
              Cancel
            </button>
            <button className="primary" disabled={saving} onClick={handleSave}
                    style={{fontSize: '16px', padding: '12px 20px', minWidth: '120px', backgroundColor: '#3498db', color: 'white', border: 'none'}}>
              {saving? '💾 Saving…' : '💾 Update Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}