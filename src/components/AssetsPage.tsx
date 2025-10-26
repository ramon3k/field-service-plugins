import React, { useEffect, useState } from 'react'
import { listAssets, createAsset, listSites } from '../api-json'
import { customerApiService } from '../services/CustomerApiService'
import type { Asset, Site, Customer } from '../types'

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<Partial<Asset>>({ Customer: '', Site: '', Type: '' })

  async function refresh(){
    setItems(await listAssets())
    setSites(await listSites())
    setCustomers(await customerApiService.getCustomers())
  }
  useEffect(()=>{ refresh() }, [])

  function update<K extends keyof Asset>(k: K, v: any){ setForm(p=>({...p,[k]:v})) }

  const filteredSites = sites.filter(s => !form.Customer || s.Customer === form.Customer)

  async function save(e: React.FormEvent){
    e.preventDefault()
    await createAsset(form)
    setForm({ Customer: '', Site: '', Type: '' })
    refresh()
  }

  return (
    <div className="card">
      <div className="title" style={{marginBottom:8}}>Assets</div>
      <form className="grid" onSubmit={save}>
        <div className="col-4"><label>Customer</label>
          <select required value={form.Customer||''} onChange={e=>update('Customer', e.target.value)}>
            <option value="">— Select —</option>
            {customers.map(c => <option key={c.CustomerID} value={c.Name}>{c.Name}</option>)}
          </select>
        </div>
        <div className="col-4"><label>Site</label>
          <select required value={form.Site||''} onChange={e=>update('Site', e.target.value)}>
            <option value="">— Select —</option>
            {filteredSites.map(s => <option key={s.Customer+'|'+s.Site} value={s.Site}>{s.Site}</option>)}
          </select>
        </div>
        <div className="col-4"><label>Type</label>
          <input value={form.Type||''} onChange={e=>update('Type', e.target.value)} placeholder="Camera, NVR, Door, etc." />
        </div>
        <div className="col-3"><label>Make</label>
          <input value={form.Make||''} onChange={e=>update('Make', e.target.value)} />
        </div>
        <div className="col-3"><label>Model</label>
          <input value={form.Model||''} onChange={e=>update('Model', e.target.value)} />
        </div>
        <div className="col-3"><label>Serial</label>
          <input value={form.Serial||''} onChange={e=>update('Serial', e.target.value)} />
        </div>
        <div className="col-3"><label>Installed At</label>
          <input value={form.InstalledAt||''} onChange={e=>update('InstalledAt', e.target.value)} placeholder="YYYY-MM-DD" />
        </div>
        <div className="col-12" style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
          <button className="primary">Save / Update</button>
        </div>
      </form>

      <table style={{marginTop:12}}>
        <thead><tr><th>ID</th><th>Customer</th><th>Site</th><th>Type</th><th>Make/Model</th><th>Serial</th></tr></thead>
        <tbody>
          {items.map(a => (
            <tr key={a.AssetID}>
              <td>{a.AssetID}</td><td>{a.Customer}</td><td>{a.Site}</td><td>{a.Type}</td><td>{a.Make} {a.Model}</td><td className="muted">{a.Serial}</td>
            </tr>
          ))}
          {items.length===0 && <tr><td colSpan={6} className="muted">No assets yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
