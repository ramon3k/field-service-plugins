/**
 * VAMP Device Manager Component
 * Virtual Asset Management Platform
 * Uses the Field Service app's native UI components
 */

import React, { useState, useEffect } from 'react';
import type { PluginComponentProps } from './PluginComponentRegistry';

interface VampDevice {
  DeviceID: string;
  DeviceIdentifier: string;
  DeviceName?: string;
  MACAddress?: string;
  IPAddress?: string;
  SubnetMask?: string;
  Gateway?: string;
  Manufacturer?: string;
  Model?: string;
  PartNumber?: string;
  SerialNumber?: string;
  FirmwareVersion?: string;
  Location?: string;
  Building?: string;
  TerminationPoint?: string;
  DrawingRef?: string;
  InstallationDate?: string;
  Login?: string;
  ServiceRecord?: string;
  CreatedAt?: string;
  CreatedBy?: string;
  UpdatedAt?: string;
  UpdatedBy?: string;
}

interface VampStats {
  TotalDevices: number;
  TotalLocations: number;
  TotalBuildings: number;
  TotalManufacturers: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const sqlUserStr = localStorage.getItem('sqlUser');
  if (sqlUserStr) {
    try {
      const sqlUser = JSON.parse(sqlUserStr);
      if (sqlUser.id) {
        headers['x-user-id'] = sqlUser.id;
        headers['x-user-name'] = sqlUser.username || sqlUser.fullName || '';
        headers['x-user-role'] = sqlUser.role || '';
      }
    } catch (e) {
      console.warn('Failed to parse sqlUser');
    }
  }
  
  return headers;
}

export default function VampDeviceManager({ pluginId }: PluginComponentProps) {
  const [devices, setDevices] = useState<VampDevice[]>([]);
  const [stats, setStats] = useState<VampStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<VampDevice | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<VampDevice | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [form, setForm] = useState<Partial<VampDevice>>({
    DeviceIdentifier: '',
    DeviceName: '',
    MACAddress: '',
    IPAddress: '',
    SubnetMask: '',
    Gateway: '',
    Manufacturer: '',
    Model: '',
    PartNumber: '',
    SerialNumber: '',
    FirmwareVersion: '',
    Location: '',
    Building: '',
    TerminationPoint: '',
    DrawingRef: '',
    InstallationDate: '',
    Login: '',
    ServiceRecord: ''
  });

  useEffect(() => {
    loadDevices();
    loadStats();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform snake_case to PascalCase
        const transformedDevices = (data.devices || []).map((d: any) => ({
          DeviceID: d.DeviceID,
          DeviceIdentifier: d.device_id,
          DeviceName: d.name,
          MACAddress: d.mac_address,
          IPAddress: d.ip_address,
          SubnetMask: d.subnet_mask,
          Gateway: d.gateway,
          Manufacturer: d.manufacturer,
          Model: d.model,
          PartNumber: d.part_number,
          SerialNumber: d.serial_number,
          FirmwareVersion: d.firmware_version,
          Location: d.location,
          Building: d.building,
          TerminationPoint: d.termination_point,
          DrawingRef: d.drawing_ref,
          InstallationDate: d.installation_date,
          Login: d.login,
          ServiceRecord: d.service_record,
          CreatedAt: d.CreatedAt,
          CreatedBy: d.CreatedBy,
          UpdatedAt: d.UpdatedAt,
          UpdatedBy: d.UpdatedBy
        }));
        setDevices(transformedDevices);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/stats`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Transform PascalCase to snake_case for backend
      const payload = {
        device_id: form.DeviceIdentifier,
        name: form.DeviceName,
        mac_address: form.MACAddress,
        ip_address: form.IPAddress,
        subnet_mask: form.SubnetMask,
        gateway: form.Gateway,
        manufacturer: form.Manufacturer,
        model: form.Model,
        part_number: form.PartNumber,
        serial_number: form.SerialNumber,
        firmware_version: form.FirmwareVersion,
        location: form.Location,
        building: form.Building,
        termination_point: form.TerminationPoint,
        drawing_ref: form.DrawingRef,
        installation_date: form.InstallationDate,
        login: form.Login,
        service_record: form.ServiceRecord
      };
      
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setForm({
          DeviceIdentifier: '',
          DeviceName: '',
          MACAddress: '',
          IPAddress: '',
          SubnetMask: '',
          Gateway: '',
          Manufacturer: '',
          Model: '',
          PartNumber: '',
          SerialNumber: '',
          FirmwareVersion: '',
          Location: '',
          Building: '',
          TerminationPoint: '',
          DrawingRef: '',
          InstallationDate: '',
          Login: '',
          ServiceRecord: ''
        });
        setShowAddForm(false);
        loadDevices();
        loadStats();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add device');
      }
    } catch (err) {
      console.error('Error adding device:', err);
      alert('Error connecting to server');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    
    try {
      // Transform PascalCase to snake_case for backend
      const payload = {
        device_id: editingDevice.DeviceIdentifier,
        name: editingDevice.DeviceName,
        mac_address: editingDevice.MACAddress,
        ip_address: editingDevice.IPAddress,
        subnet_mask: editingDevice.SubnetMask,
        gateway: editingDevice.Gateway,
        manufacturer: editingDevice.Manufacturer,
        model: editingDevice.Model,
        part_number: editingDevice.PartNumber,
        serial_number: editingDevice.SerialNumber,
        firmware_version: editingDevice.FirmwareVersion,
        location: editingDevice.Location,
        building: editingDevice.Building,
        termination_point: editingDevice.TerminationPoint,
        drawing_ref: editingDevice.DrawingRef,
        installation_date: editingDevice.InstallationDate,
        login: editingDevice.Login,
        service_record: editingDevice.ServiceRecord
      };
      
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices/${editingDevice.DeviceID}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setEditingDevice(null);
        loadDevices();
      } else {
        alert('Failed to update device');
      }
    } catch (err) {
      console.error('Error updating device:', err);
    }
  };

  const handleDelete = async (device: VampDevice) => {
    if (!confirm(`Delete device "${device.DeviceIdentifier}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices/${device.DeviceID}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (response.ok) {
        loadDevices();
        loadStats();
      }
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'DeviceIdentifier', 'DeviceName', 'MACAddress', 'IPAddress', 'SubnetMask', 'Gateway',
      'Manufacturer', 'Model', 'PartNumber', 'SerialNumber', 'FirmwareVersion',
      'Location', 'Building', 'TerminationPoint', 'DrawingRef', 'InstallationDate',
      'Login', 'ServiceRecord'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vamp_devices_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const devices = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const device: any = {};
        
        headers.forEach((header, index) => {
          device[header] = values[index] || '';
        });
        
        if (device.DeviceIdentifier) {
          devices.push(device);
        }
      }

      if (devices.length === 0) {
        alert('No valid devices found in CSV');
        setImporting(false);
        return;
      }

      // Import devices one by one
      let successCount = 0;
      let failCount = 0;

      for (const device of devices) {
        try {
          const payload = {
            device_id: device.DeviceIdentifier,
            name: device.DeviceName,
            mac_address: device.MACAddress,
            ip_address: device.IPAddress,
            subnet_mask: device.SubnetMask,
            gateway: device.Gateway,
            manufacturer: device.Manufacturer,
            model: device.Model,
            part_number: device.PartNumber,
            serial_number: device.SerialNumber,
            firmware_version: device.FirmwareVersion,
            location: device.Location,
            building: device.Building,
            termination_point: device.TerminationPoint,
            drawing_ref: device.DrawingRef,
            installation_date: device.InstallationDate,
            login: device.Login,
            service_record: device.ServiceRecord
          };

          const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      alert(`Import complete!\n✅ ${successCount} devices imported\n❌ ${failCount} failed`);
      loadDevices();
      loadStats();
      e.target.value = ''; // Reset file input
    } catch (err) {
      console.error('Error importing CSV:', err);
      alert('Failed to import CSV file');
    } finally {
      setImporting(false);
    }
  };

  const loadHistory = async (device: VampDevice) => {
    try {
      const response = await fetch(`${API_BASE_URL}/plugins/${pluginId}/devices/${device.DeviceID}/history`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setViewingHistory(device);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      alert('Failed to load device history');
    }
  };

  function update<K extends keyof VampDevice>(k: K, v: any) { 
    if (editingDevice) {
      setEditingDevice(p => ({...p!, [k]: v}));
    } else {
      setForm(p => ({...p, [k]: v}));
    }
  }

  // Filter devices
  const filteredDevices = devices.filter(device => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return [
      device.DeviceIdentifier,
      device.DeviceName,
      device.MACAddress,
      device.IPAddress,
      device.Location,
      device.Building,
      device.Manufacturer,
      device.Model
    ].some(field => field?.toLowerCase().includes(search));
  });

  return (
    <div className="card">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <div>
          <div className="title">📱 VAMP - Virtual Asset Management Platform</div>
          {stats && (
            <div className="muted" style={{fontSize:'0.875rem', marginTop:4}}>
              {stats.TotalDevices} devices • {stats.TotalLocations} locations • {stats.TotalBuildings} buildings • {stats.TotalManufacturers} manufacturers
            </div>
          )}
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="ghost" onClick={downloadTemplate}>
            📥 Download Template
          </button>
          <label className="ghost" style={{cursor:'pointer', margin:0}}>
            {importing ? '⏳ Importing...' : '📤 Import CSV'}
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV} 
              style={{display:'none'}} 
              disabled={importing}
            />
          </label>
          <button className="primary" onClick={() => {
            if (showAddForm || editingDevice) {
              setShowAddForm(false);
              setEditingDevice(null);
            } else {
              setShowAddForm(true);
            }
          }}>
            {showAddForm || editingDevice ? 'Cancel' : '+ Add Device'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && !editingDevice && (
        <form className="grid" onSubmit={handleSubmit} style={{marginBottom:16}}>
          <div className="col-12"><strong>Add New Device</strong></div>
          
          {/* Device Identification */}
          <div className="col-3">
            <label>Device ID *</label>
            <input required value={form.DeviceIdentifier||''} onChange={e=>update('DeviceIdentifier', e.target.value)} placeholder="DEV-001" />
          </div>
          <div className="col-3">
            <label>Device Name</label>
            <input value={form.DeviceName||''} onChange={e=>update('DeviceName', e.target.value)} placeholder="Router X1000" />
          </div>
          
          {/* Network Configuration */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Network Configuration</strong></div>
          <div className="col-3">
            <label>MAC Address</label>
            <input value={form.MACAddress||''} onChange={e=>update('MACAddress', e.target.value)} placeholder="00:00:00:00:00:00" />
          </div>
          <div className="col-3">
            <label>IP Address</label>
            <input value={form.IPAddress||''} onChange={e=>update('IPAddress', e.target.value)} placeholder="192.168.1.1" />
          </div>
          <div className="col-3">
            <label>Subnet Mask</label>
            <input value={form.SubnetMask||''} onChange={e=>update('SubnetMask', e.target.value)} placeholder="255.255.255.0" />
          </div>
          <div className="col-3">
            <label>Gateway</label>
            <input value={form.Gateway||''} onChange={e=>update('Gateway', e.target.value)} placeholder="192.168.1.1" />
          </div>
          
          {/* Hardware Information */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Hardware Information</strong></div>
          <div className="col-3">
            <label>Manufacturer</label>
            <input value={form.Manufacturer||''} onChange={e=>update('Manufacturer', e.target.value)} placeholder="Cisco" />
          </div>
          <div className="col-3">
            <label>Model</label>
            <input value={form.Model||''} onChange={e=>update('Model', e.target.value)} placeholder="X1000" />
          </div>
          <div className="col-3">
            <label>Part Number</label>
            <input value={form.PartNumber||''} onChange={e=>update('PartNumber', e.target.value)} placeholder="PN-12345" />
          </div>
          <div className="col-3">
            <label>Serial Number</label>
            <input value={form.SerialNumber||''} onChange={e=>update('SerialNumber', e.target.value)} placeholder="SN-67890" />
          </div>
          <div className="col-3">
            <label>Firmware Version</label>
            <input value={form.FirmwareVersion||''} onChange={e=>update('FirmwareVersion', e.target.value)} placeholder="v2.1.0" />
          </div>
          
          {/* Location & Installation */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Location & Installation</strong></div>
          <div className="col-3">
            <label>Location</label>
            <input value={form.Location||''} onChange={e=>update('Location', e.target.value)} placeholder="Data Center A" />
          </div>
          <div className="col-3">
            <label>Building</label>
            <input value={form.Building||''} onChange={e=>update('Building', e.target.value)} placeholder="Building 1" />
          </div>
          <div className="col-3">
            <label>Termination Point</label>
            <input value={form.TerminationPoint||''} onChange={e=>update('TerminationPoint', e.target.value)} placeholder="Port 24" />
          </div>
          <div className="col-3">
            <label>Drawing Reference</label>
            <input value={form.DrawingRef||''} onChange={e=>update('DrawingRef', e.target.value)} placeholder="DWG-001" />
          </div>
          <div className="col-3">
            <label>Installation Date</label>
            <input type="date" value={form.InstallationDate||''} onChange={e=>update('InstallationDate', e.target.value)} />
          </div>
          
          {/* Security & Maintenance */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Security & Maintenance</strong></div>
          <div className="col-4">
            <label>Login Credentials</label>
            <input value={form.Login||''} onChange={e=>update('Login', e.target.value)} placeholder="Reference to credential system" />
          </div>
          <div className="col-8">
            <label>Service Record</label>
            <textarea value={form.ServiceRecord||''} onChange={e=>update('ServiceRecord', e.target.value)} rows={3} placeholder="Service and maintenance history..." />
          </div>
          
          <div className="col-12" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button type="button" className="ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="primary">Add Device</button>
          </div>
        </form>
      )}

      {/* Edit Form */}
      {editingDevice && (
        <form className="grid" onSubmit={handleUpdate} style={{marginBottom:16, padding:16, borderRadius:8, border:'1px solid #444'}}>
          <div className="col-12"><strong>Editing: {editingDevice.DeviceIdentifier}</strong></div>
          
          {/* Device Identification */}
          <div className="col-3">
            <label>Device Name</label>
            <input value={editingDevice.DeviceName||''} onChange={e=>update('DeviceName', e.target.value)} placeholder="Router X1000" />
          </div>
          
          {/* Network Configuration */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Network Configuration</strong></div>
          <div className="col-3">
            <label>MAC Address</label>
            <input value={editingDevice.MACAddress||''} onChange={e=>update('MACAddress', e.target.value)} placeholder="00:00:00:00:00:00" />
          </div>
          <div className="col-3">
            <label>IP Address</label>
            <input value={editingDevice.IPAddress||''} onChange={e=>update('IPAddress', e.target.value)} placeholder="192.168.1.1" />
          </div>
          <div className="col-3">
            <label>Subnet Mask</label>
            <input value={editingDevice.SubnetMask||''} onChange={e=>update('SubnetMask', e.target.value)} placeholder="255.255.255.0" />
          </div>
          <div className="col-3">
            <label>Gateway</label>
            <input value={editingDevice.Gateway||''} onChange={e=>update('Gateway', e.target.value)} placeholder="192.168.1.1" />
          </div>
          
          {/* Hardware Information */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Hardware Information</strong></div>
          <div className="col-3">
            <label>Manufacturer</label>
            <input value={editingDevice.Manufacturer||''} onChange={e=>update('Manufacturer', e.target.value)} placeholder="Cisco" />
          </div>
          <div className="col-3">
            <label>Model</label>
            <input value={editingDevice.Model||''} onChange={e=>update('Model', e.target.value)} placeholder="X1000" />
          </div>
          <div className="col-3">
            <label>Part Number</label>
            <input value={editingDevice.PartNumber||''} onChange={e=>update('PartNumber', e.target.value)} placeholder="PN-12345" />
          </div>
          <div className="col-3">
            <label>Serial Number</label>
            <input value={editingDevice.SerialNumber||''} onChange={e=>update('SerialNumber', e.target.value)} placeholder="SN-67890" />
          </div>
          <div className="col-3">
            <label>Firmware Version</label>
            <input value={editingDevice.FirmwareVersion||''} onChange={e=>update('FirmwareVersion', e.target.value)} placeholder="v2.1.0" />
          </div>
          
          {/* Location & Installation */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Location & Installation</strong></div>
          <div className="col-3">
            <label>Location</label>
            <input value={editingDevice.Location||''} onChange={e=>update('Location', e.target.value)} placeholder="Data Center A" />
          </div>
          <div className="col-3">
            <label>Building</label>
            <input value={editingDevice.Building||''} onChange={e=>update('Building', e.target.value)} placeholder="Building 1" />
          </div>
          <div className="col-3">
            <label>Termination Point</label>
            <input value={editingDevice.TerminationPoint||''} onChange={e=>update('TerminationPoint', e.target.value)} placeholder="Port 24" />
          </div>
          <div className="col-3">
            <label>Drawing Reference</label>
            <input value={editingDevice.DrawingRef||''} onChange={e=>update('DrawingRef', e.target.value)} placeholder="DWG-001" />
          </div>
          <div className="col-3">
            <label>Installation Date</label>
            <input type="date" value={editingDevice.InstallationDate||''} onChange={e=>update('InstallationDate', e.target.value)} />
          </div>
          
          {/* Security & Maintenance */}
          <div className="col-12"><hr /></div>
          <div className="col-12"><strong>Security & Maintenance</strong></div>
          <div className="col-4">
            <label>Login Credentials</label>
            <input value={editingDevice.Login||''} onChange={e=>update('Login', e.target.value)} placeholder="Reference to credential system" />
          </div>
          <div className="col-8">
            <label>Service Record</label>
            <textarea value={editingDevice.ServiceRecord||''} onChange={e=>update('ServiceRecord', e.target.value)} rows={3} placeholder="Service and maintenance history..." />
          </div>
          
          <div className="col-12" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button type="button" className="ghost" onClick={() => setEditingDevice(null)}>Cancel</button>
            <button type="submit" className="primary">Update Device</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div style={{marginBottom:12}}>
        <input 
          placeholder="🔍 Search devices..." 
          value={searchTerm} 
          onChange={e=>setSearchTerm(e.target.value)} 
          style={{width:'100%', maxWidth:400}}
        />
      </div>

      <div style={{marginBottom:10}}>
        <strong>{filteredDevices.length} of {devices.length} devices {searchTerm ? 'match search' : 'found'}</strong>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Name</th>
            <th>MAC</th>
            <th>IP</th>
            <th>Serial</th>
            <th>Firmware</th>
            <th>Location</th>
            <th>Building</th>
            <th>Manufacturer</th>
            <th>Model</th>
            <th>Install Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={12} className="muted">Loading...</td></tr>}
          {!loading && filteredDevices.map(device => (
            <tr key={device.DeviceID}>
              <td><strong>{device.DeviceIdentifier}</strong></td>
              <td>{device.DeviceName || '-'}</td>
              <td className="muted">{device.MACAddress || '-'}</td>
              <td className="muted">{device.IPAddress || '-'}</td>
              <td className="muted">{device.SerialNumber || '-'}</td>
              <td className="muted">{device.FirmwareVersion || '-'}</td>
              <td>{device.Location || '-'}</td>
              <td>{device.Building || '-'}</td>
              <td>{device.Manufacturer || '-'}</td>
              <td>{device.Model || '-'}</td>
              <td className="muted">{device.InstallationDate ? new Date(device.InstallationDate).toLocaleDateString() : '-'}</td>
              <td>
                <button 
                  className="ghost small" 
                  onClick={() => setEditingDevice(device)}
                  style={{ padding: '4px 8px', fontSize: '0.875rem', marginRight: 4 }}
                >
                  Edit
                </button>
                <button 
                  className="ghost small" 
                  onClick={() => loadHistory(device)}
                  style={{ padding: '4px 8px', fontSize: '0.875rem', marginRight: 4 }}
                >
                  History
                </button>
                <button 
                  className="ghost small" 
                  onClick={() => handleDelete(device)}
                  style={{ padding: '4px 8px', fontSize: '0.875rem', color: '#ff5470' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!loading && filteredDevices.length === 0 && (
            <tr><td colSpan={12} className="muted">
              {searchTerm ? 'No devices match your search.' : 'No devices yet. Click "Add Device" to get started.'}
            </td></tr>
          )}
        </tbody>
      </table>

      {/* History Modal */}
      {viewingHistory && (
        <div style={{
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
          <div className="card" style={{
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <div className="title">📜 Version History - {viewingHistory.DeviceIdentifier}</div>
              <button className="ghost" onClick={() => {
                setViewingHistory(null);
                setHistory([]);
              }}>✕ Close</button>
            </div>

            {history.length === 0 ? (
              <p className="muted">No history found for this device.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Change Type</th>
                    <th>Field Changed</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry: any, idx: number) => (
                    <tr key={idx}>
                      <td className="muted" style={{fontSize:'0.875rem'}}>
                        {new Date(entry.ChangedAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          backgroundColor: entry.ChangeType === 'CREATE' ? '#28a745' : 
                                         entry.ChangeType === 'UPDATE' ? '#ffc107' : 
                                         entry.ChangeType === 'DELETE' ? '#dc3545' : '#6c757d',
                          color: 'white'
                        }}>
                          {entry.ChangeType}
                        </span>
                      </td>
                      <td>{entry.FieldChanged || '-'}</td>
                      <td className="muted" style={{fontSize:'0.875rem'}}>
                        {entry.OldValue || <em style={{opacity:0.5}}>empty</em>}
                      </td>
                      <td style={{fontSize:'0.875rem'}}>
                        {entry.NewValue || <em style={{opacity:0.5}}>empty</em>}
                      </td>
                      <td className="muted">{entry.ChangedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
