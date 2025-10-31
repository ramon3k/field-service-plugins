import React, { useState } from 'react';
import './TenantLogin.css';

interface TenantLoginProps {
  onLogin: (tenantCode: string, username: string, password: string) => Promise<void>;
}

export const TenantLogin: React.FC<TenantLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Company code is determined by the user's record in the database
      // Pass empty string - the backend will look up the user's company
      await onLogin('', username.trim(), password);
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
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="tenant-login-form">
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

        <div className="login-footer">
          <p>Need help with installation?</p>
          <p className="contact-admin">
            Please contact your system administrator for assistance.
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