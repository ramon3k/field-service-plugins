import React, { useState, useEffect } from 'react';
import './ServiceRequestModal.css';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ServiceRequest) => Promise<void>;
  customerName: string;
  sites: string[];
  selectedSite?: string;
}

export interface ServiceRequest {
  title: string;
  description: string;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  category: string;
  site: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredDate?: string;
  preferredTime?: string;
  urgency: string;
}

const CATEGORIES = [
  'Hardware Issue',
  'Software Issue',
  'Network Problem',
  'Maintenance Request',
  'Installation',
  'Upgrade',
  'Training',
  'Other'
];

const URGENCY_LEVELS = [
  'Can wait - Schedule when convenient',
  'Normal - Within a few days',
  'Urgent - Within 24 hours',
  'Emergency - Immediate response needed'
];

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerName,
  sites,
  selectedSite
}) => {
  const [formData, setFormData] = useState<ServiceRequest>({
    title: '',
    description: '',
    priority: 'Normal',
    category: '',
    site: selectedSite || '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    preferredDate: '',
    preferredTime: '',
    urgency: 'Normal - Within a few days'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedSite) {
      setFormData(prev => ({ ...prev, site: selectedSite }));
    }
  }, [selectedSite]);

  const handleInputChange = (field: keyof ServiceRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(''); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Please provide a title for your service request');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description of the issue');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.site) {
      setError('Please select a site');
      return false;
    }
    if (!formData.contactName.trim()) {
      setError('Please provide a contact name');
      return false;
    }
    if (!formData.contactPhone.trim() && !formData.contactEmail.trim()) {
      setError('Please provide either a phone number or email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'Normal',
        category: '',
        site: selectedSite || '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        preferredDate: '',
        preferredTime: '',
        urgency: 'Normal - Within a few days'
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityFromUrgency = (urgency: string): 'Low' | 'Normal' | 'High' | 'Critical' => {
    if (urgency.includes('Emergency')) return 'Critical';
    if (urgency.includes('Urgent')) return 'High';
    if (urgency.includes('Can wait')) return 'Low';
    return 'Normal';
  };

  // Update priority when urgency changes
  useEffect(() => {
    const newPriority = getPriorityFromUrgency(formData.urgency);
    setFormData(prev => ({ ...prev, priority: newPriority }));
  }, [formData.urgency]);

  if (!isOpen) return null;

  return (
    <div className="service-request-overlay">
      <div className="service-request-modal">
        <div className="modal-header">
          <h2>Submit Service Request</h2>
          <button onClick={onClose} className="close-btn" type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="service-request-form">
          <div className="form-section">
            <h3>Request Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Request Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  placeholder="Brief description of the issue"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="site">Site *</label>
                <select
                  id="site"
                  value={formData.site}
                  onChange={handleInputChange('site')}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="urgency">Urgency Level</label>
                <select
                  id="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange('urgency')}
                  disabled={isSubmitting}
                >
                  {URGENCY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <small>Priority will be set automatically based on urgency</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="description">Detailed Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  placeholder="Please provide detailed information about the issue, including any error messages, what you were doing when it occurred, and any troubleshooting steps you've already tried."
                  rows={4}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactName">Contact Name *</label>
                <input
                  type="text"
                  id="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange('contactName')}
                  placeholder="Person to contact about this request"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPhone">Phone Number</label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange('contactPhone')}
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contactEmail">Email Address</label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange('contactEmail')}
                  placeholder="contact@example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <small className="contact-note">* Please provide at least one contact method (phone or email)</small>
          </div>

          <div className="form-section">
            <h3>Scheduling Preferences (Optional)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredDate">Preferred Date</label>
                <input
                  type="date"
                  id="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange('preferredDate')}
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="preferredTime">Preferred Time</label>
                <select
                  id="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange('preferredTime')}
                  disabled={isSubmitting}
                >
                  <option value="">No preference</option>
                  <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 5 PM)">Afternoon (12 PM - 5 PM)</option>
                  <option value="After Hours (5 PM - 8 PM)">After Hours (5 PM - 8 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};