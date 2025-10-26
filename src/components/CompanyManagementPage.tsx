import React, { useState, useEffect } from 'react';
import './CompanyManagementPage.css';

interface Company {
  CompanyID: number;
  CompanyCode: string;
  CompanyName: string;
  DisplayName: string;
  ContactEmail: string;
  ContactPhone: string;
  Address: string;
  IsActive: boolean;
  AllowServiceRequests: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const CompanyManagementPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState({
    companyCode: '',
    companyName: '',
    displayName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    isActive: true,
    allowServiceRequests: true,
    // Admin user fields (only for new companies)
    adminUsername: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load companies');
      
      const data = await response.json();
      setCompanies(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      const url = editingCompany 
        ? `${API_BASE_URL}/companies/${editingCompany.CompanyCode}`
        : `${API_BASE_URL}/companies`;
      
      const method = editingCompany ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save company');
      }

      await loadCompanies();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving company:', err);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      companyCode: company.CompanyCode,
      companyName: company.CompanyName,
      displayName: company.DisplayName || company.CompanyName,
      contactEmail: company.ContactEmail || '',
      contactPhone: company.ContactPhone || '',
      address: company.Address || '',
      isActive: company.IsActive,
      allowServiceRequests: company.AllowServiceRequests,
      adminUsername: '',
      adminEmail: '',
      adminFullName: '',
      adminPassword: ''
    });
    setShowForm(true);
  };

  const handleToggleActive = async (company: Company) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/companies/${company.CompanyCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...company,
          companyName: company.CompanyName,
          displayName: company.DisplayName,
          contactEmail: company.ContactEmail,
          contactPhone: company.ContactPhone,
          address: company.Address,
          isActive: !company.IsActive,
          allowServiceRequests: company.AllowServiceRequests
        })
      });

      if (!response.ok) throw new Error('Failed to update company');
      
      await loadCompanies();
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling company status:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      companyCode: '',
      companyName: '',
      displayName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      isActive: true,
      allowServiceRequests: true,
      adminUsername: '',
      adminEmail: '',
      adminFullName: '',
      adminPassword: ''
    });
    setEditingCompany(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return <div className="company-management-loading">Loading companies...</div>;
  }

  return (
    <div className="company-management-page">
      <div className="company-management-header">
        <h1>🏢 Company Management</h1>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ➕ Add New Company
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <div className="company-form-modal">
          <div className="company-form-card">
            <h2>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Code *</label>
                  <input
                    type="text"
                    value={formData.companyCode}
                    onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                    required
                    disabled={!!editingCompany}
                    placeholder="e.g., ACME"
                    maxLength={50}
                  />
                  <small>Unique identifier (uppercase, no spaces)</small>
                </div>

                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    placeholder="e.g., ACME Corporation"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Public-facing name for service requests"
                />
                <small>Leave blank to use Company Name</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="support@company.com"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Company address"
                  rows={2}
                />
              </div>

              {/* Admin User Section - Only show when creating new company */}
              {!editingCompany && (
                <>
                  <div className="form-section-divider">
                    <h3>👤 Initial Admin User</h3>
                    <small>Create the first administrator account for this company</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Admin Username *</label>
                      <input
                        type="text"
                        value={formData.adminUsername}
                        onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                        required
                        placeholder="admin.username"
                      />
                    </div>

                    <div className="form-group">
                      <label>Admin Email *</label>
                      <input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        required
                        placeholder="admin@company.com"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Admin Full Name *</label>
                      <input
                        type="text"
                        value={formData.adminFullName}
                        onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                        required
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="form-group">
                      <label>Admin Password *</label>
                      <input
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allowServiceRequests}
                    onChange={(e) => setFormData({ ...formData, allowServiceRequests: e.target.checked })}
                  />
                  Allow Service Requests
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="companies-table-container">
        <table className="companies-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Company Name</th>
              <th>Display Name</th>
              <th>Contact Email</th>
              <th>Contact Phone</th>
              <th>Status</th>
              <th>Service Requests</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  No companies found. Add your first company to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.CompanyCode} className={!company.IsActive ? 'inactive-row' : ''}>
                  <td>
                    <strong>{company.CompanyCode}</strong>
                  </td>
                  <td>{company.CompanyName}</td>
                  <td>{company.DisplayName || company.CompanyName}</td>
                  <td>{company.ContactEmail || '-'}</td>
                  <td>{company.ContactPhone || '-'}</td>
                  <td>
                    <span className={`status-badge ${company.IsActive ? 'status-active' : 'status-inactive'}`}>
                      {company.IsActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${company.AllowServiceRequests ? 'status-enabled' : 'status-disabled'}`}>
                      {company.AllowServiceRequests ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(company)}
                        title="Edit company"
                      >
                        ✏️
                      </button>
                      {company.CompanyCode !== 'DCPSP' && (
                        <button
                          className="btn-icon"
                          onClick={() => handleToggleActive(company)}
                          title={company.IsActive ? 'Deactivate' : 'Activate'}
                        >
                          {company.IsActive ? '🔒' : '🔓'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="company-stats">
        <div className="stat-card">
          <div className="stat-value">{companies.length}</div>
          <div className="stat-label">Total Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{companies.filter(c => c.IsActive).length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{companies.filter(c => c.AllowServiceRequests).length}</div>
          <div className="stat-label">Accepting Requests</div>
        </div>
      </div>
    </div>
  );
};
