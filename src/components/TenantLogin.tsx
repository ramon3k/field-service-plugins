import React, { useState } from 'react';
import './TenantLogin.css';

interface TenantLoginProps {
  onLogin: (tenantCode: string, username: string, password: string) => Promise<void>;
}

export const TenantLogin: React.FC<TenantLoginProps> = ({ onLogin }) => {
  const [tenantCode, setTenantCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantCode.trim()) {
      setError('Please enter your company/site code');
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await onLogin(tenantCode.trim().toUpperCase(), username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tenant-login-container">
      <div className="tenant-login-card">
        <div className="login-header">
          <h1>Field Service Management</h1>
          <p className="login-subtitle">Enter your company details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="tenant-login-form">
          <div className="form-group">
            <label htmlFor="tenantCode">Company/Site Code</label>
            <input
              id="tenantCode"
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
              placeholder="e.g., ACME001, TECH-CORP"
              maxLength={20}
              disabled={isLoading}
              autoComplete="organization"
            />
            <small className="field-help">
              Your unique company identifier
              <button 
                type="button" 
                className="help-button"
                onClick={() => setShowHelp(!showHelp)}
              >
                ?
              </button>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Connecting...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {showHelp && (
          <div className="help-panel">
            <h3>Don't have a company code?</h3>
            <p>Your company code is provided by your system administrator when your organization is set up.</p>
            
            <h4>Common formats:</h4>
            <ul>
              <li><code>COMPANY001</code> - Company name + number</li>
              <li><code>ACME-NYC</code> - Company + location</li>
              <li><code>TECH-CORP</code> - Abbreviated company name</li>
            </ul>
            
            <p>Contact your IT department or system administrator for your company code.</p>
          </div>
        )}

        <div className="login-footer">
          <p>Need to set up a new company?</p>
          <p className="contact-admin">
            Please contact your system administrator or email{' '}
            <a href="mailto:admin@dcpsp.com">admin@dcpsp.com</a>{' '}
            to register your organization.
          </p>
        </div>

        <div className="hosting-options">
          <p className="hosting-note">
            <strong>Hosting Options Available:</strong>
          </p>
          <ul className="hosting-list">
            <li>🌐 Cloud-hosted with your database</li>
            <li>🏢 Self-hosted on your infrastructure</li>
            <li>🔒 Hybrid deployment options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};