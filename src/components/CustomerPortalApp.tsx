import React, { useState } from 'react';
import { CustomerLogin } from '../components/CustomerLogin';
import './CustomerPortalApp.css';

interface SimpleServiceRequest {
  company: string;
  site: string;
  title: string;
  description: string;
}

export const CustomerPortalApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(customerPortalService.isLoggedIn());
  const [customerInfo, setCustomerInfo] = useState(customerPortalService.getCustomerInfo());
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SimpleServiceRequest>({
    company: '',
    site: '',
    title: '',
    description: ''
  });

  const handleLogin = async (companyCode: string, username: string, password: string) => {
    customerPortalService.setTenantCode(companyCode);
    const result = await customerPortalService.login(username, password);
    setCustomerInfo(result);
    setIsLoggedIn(true);
    
    // Set company code in form
    setFormData(prev => ({
      ...prev,
      company: companyCode.toUpperCase()
    }));
    
    return result;
  };

  const handleLogout = () => {
    customerPortalService.logout();
    setIsLoggedIn(false);
    setCustomerInfo(null);
    setSuccessMessage('');
    setFormData({
      company: '',
      site: '',
      title: '',
      description: ''
    });
  };

  const handleInputChange = (field: keyof SimpleServiceRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.site || !formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert to the format expected by the API
      const serviceRequest = {
        title: formData.title,
        description: formData.description,
        priority: 'Normal' as const,
        category: 'General Support',
        site: formData.site,
        contactName: customerInfo?.customerName || '',
        contactPhone: '',
        contactEmail: '',
        urgency: 'Normal - Within a few days'
      };

      const result = await customerPortalService.submitServiceRequest(serviceRequest);
      setSuccessMessage(`Service request submitted successfully! Ticket ID: ${result.ticketId}`);
      
      // Clear form
      setFormData(prev => ({
        company: prev.company,
        site: '',
        title: '',
        description: ''
      }));
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 10000);
      
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert('Failed to submit service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <CustomerLogin
        onLogin={handleLogin}
        onServiceRequest={() => {}} // Not used when not logged in
      />
    );
  }

  return (
    <div className="customer-portal-container">
      <div className="customer-portal-header">
        <h1>Service Request Portal</h1>
        <div className="customer-info">
          <span>Welcome, {customerInfo?.customerName}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      <div className="portal-content">
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {successMessage}
          </div>
        )}

        <div className="service-request-section">
          <h2>Submit a Service Request</h2>
          <p>Fill out the form below to submit a service request for your site:</p>
          
          <form onSubmit={handleSubmitServiceRequest} className="service-request-form">
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input
                type="text"
                id="company"
                value={formData.company}
                readOnly
                className="form-control readonly"
              />
            </div>

            <div className="form-group">
              <label htmlFor="site">Site *</label>
              <select
                id="site"
                value={formData.site}
                onChange={(e) => handleInputChange('site', e.target.value)}
                className="form-control"
                required
              >
                <option value="">Select a site...</option>
                {customerInfo?.sites.map((site, index) => (
                  <option key={index} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="form-control"
                placeholder="Brief description of the issue"
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-control"
                placeholder="Detailed description of the issue, including any relevant information that would help our technicians..."
                rows={6}
                required
                maxLength={1000}
              />
              <small className="form-text">
                {formData.description.length}/1000 characters
              </small>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Service Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};