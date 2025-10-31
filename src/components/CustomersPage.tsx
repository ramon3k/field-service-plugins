import React, { useEffect, useState, useMemo } from 'react'
import { customerApiService } from '../services/CustomerApiService'
import type { Customer } from '../types'
import { CustomerEditModal } from './CustomerEditModal'
import { arrayToCSV } from '../utils/csvExport'

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [form, setForm] = useState<Partial<Customer>>({ Name: '' })
  const [loading, setLoading] = useState(true)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  async function refresh() {
    setLoading(true)
    try { 
      setItems(await customerApiService.getCustomers()) 
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally { 
      setLoading(false) 
    }
  }
  useEffect(()=>{ refresh() }, [])

  function update<K extends keyof Customer>(k: K, v: any){ setForm(p=>({...p,[k]:v})) }

  async function save(e: React.FormEvent){
    e.preventDefault()
    try {
      // Only create new customers in this form
      await customerApiService.createCustomer(form)
      setForm({ Name: '' })
      refresh()
    } catch (error) {
      console.error('Failed to save customer:', error)
      alert('Failed to save customer: ' + (error as Error).message)
    }
  }

  function startEdit(customer: Customer) {
    setEditingCustomer({...customer})
    setIsEditModalOpen(true)
  }

  function closeEditModal() {
    setEditingCustomer(null)
    setIsEditModalOpen(false)
  }

  async function saveEdit(customer: Customer) {
    try {
      await customerApiService.updateCustomer(customer.CustomerID!, customer)
      refresh()
    } catch (error) {
      console.error('Failed to update customer:', error)
      throw error
    }
  }

  async function deleteCustomerHandler(customerId: string, customerName: string) {
    try {
      // For now, just throw an error since delete is not implemented
      throw new Error('Delete functionality not yet implemented')
    } catch (error) {
      console.error('Failed to delete customer:', error)
      throw error
    }
  }

  // Filtered customers based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    
    const s = searchTerm.toLowerCase()
    return items.filter(item => {
      const searchFields = [
        item.Name,
        item.Contact,
        item.Phone,
        item.Email
      ].filter(Boolean).join(' ').toLowerCase()
      
      return searchFields.includes(s)
    })
  }, [items, searchTerm])

  const handleExportCSV = () => {
    const columns = [
      { key: 'CustomerID' as keyof Customer, label: 'Customer ID' },
      { key: 'Name' as keyof Customer, label: 'Name' },
      { key: 'Contact' as keyof Customer, label: 'Contact' },
      { key: 'Email' as keyof Customer, label: 'Email' },
      { key: 'Phone' as keyof Customer, label: 'Phone' },
      { key: 'Address' as keyof Customer, label: 'Address' },
      { key: 'Notes' as keyof Customer, label: 'Notes' }
    ]

    arrayToCSV(filteredItems, columns, 'customers')
  }

  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div className="title">Customers {loading && <span className="muted">Loading…</span>}</div>
      </div>
      <form className="grid" onSubmit={save}>
        <div className="col-4"><label>Name</label>
          <input required value={form.Name||''} onChange={e=>update('Name', e.target.value)} />
        </div>
        <div className="col-4"><label>Contact</label>
          <input value={form.Contact||''} onChange={e=>update('Contact', e.target.value)} />
        </div>
        <div className="col-4"><label>Email</label>
          <input value={form.Email||''} onChange={e=>update('Email', e.target.value)} />
        </div>
        <div className="col-4"><label>Phone</label>
          <input value={form.Phone||''} onChange={e=>update('Phone', e.target.value)} />
        </div>
        <div className="col-8"><label>Address</label>
          <input value={form.Address||''} onChange={e=>update('Address', e.target.value)} />
        </div>
        <div className="col-12"><label>Notes</label>
          <textarea value={form.Notes||''} onChange={e=>update('Notes', e.target.value)} />
        </div>
        <div className="col-12" style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
          <button className="primary">Create Customer</button>
        </div>
      </form>

      {/* Search Bar */}
      <div className="row" style={{gap:8, margin:'16px 0 12px 0'}}>
        <div style={{flex:'1 1 200px'}}>
          <input 
            placeholder="🔍 Search customers..." 
            value={searchTerm} 
            onChange={e=>setSearchTerm(e.target.value)} 
          />
        </div>
        <div>
          <button 
            className="primary" 
            onClick={handleExportCSV}
            style={{ padding: '8px 16px' }}
            title={`Export ${filteredItems.length} customers to CSV`}
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{marginBottom: 10}}>
        <strong>
          {filteredItems.length} of {items.length} customers {searchTerm ? 'match search' : 'found'}
        </strong>
      </div>

      <table style={{marginTop:12}}>
        <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
          {filteredItems.map(c => (
            <tr key={c.CustomerID}>
              <td>{c.Name}</td>
              <td>{c.Contact}</td>
              <td>{c.Email}</td>
              <td>{c.Phone}</td>
              <td className="muted">{c.Address}</td>
              <td>
                <button 
                  className="ghost small" 
                  onClick={() => startEdit(c)}
                  style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {items.length===0 && <tr><td colSpan={6} className="muted">No customers yet.</td></tr>}
        </tbody>
      </table>

      <CustomerEditModal
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={saveEdit}
        onDelete={deleteCustomerHandler}
      />
    </div>
  )
}
