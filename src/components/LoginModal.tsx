import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { username: string; password: string; tenantCode: string }) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  isLoading = false, 
  error 
}) => {
  const [formData, setFormData] = useState({
    tenantCode: '',
    username: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantCode || !formData.username || !formData.password) {
      return;
    }

    onLogin(formData);
  };

  const handleClose = () => {
    setFormData({ tenantCode: '', username: '', password: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2>Sign In to Field Service</h2>
          <button 
            className="login-modal-close" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Company Code Input */}
          <div className="form-group">
            <label htmlFor="tenantCode">
              Company Code
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="tenantCode"
              name="tenantCode"
              value={formData.tenantCode}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your company code"
              autoComplete="organization"
              className="tenant-input"
            />
            <div className="input-hint">
              Contact your administrator if you don't know your company code
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">
              Username
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="login-submit"
            disabled={isLoading || !formData.tenantCode || !formData.username || !formData.password}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-modal-footer">
          <div className="help-links">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
            <span className="separator">•</span>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Need access?
            </a>
            <span className="separator">•</span>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Support
            </a>
          </div>
          <div className="login-info">
            <p>
              <strong>New to this system?</strong><br/>
              Contact your system administrator to get your company code and account access.
            </p>
            <div className="security-notice">
              <small>
                🔒 Each company operates with complete data isolation for security.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;