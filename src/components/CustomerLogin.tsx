import React, { useState } from 'react';
import './CustomerLogin.css';

interface CustomerLoginProps {
  onLogin: (customerData: { customerName: string; sites: string[]; token: string }) => void;
  onServiceRequest: () => void;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin, onServiceRequest }) => {
  const [companyCode, setCompanyCode] = useState('demo');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyCode,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin({
          customerName: data.customerName,
          sites: data.sites,
          token: data.token,
        });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-login-container">
      <div className="customer-login-card">
        <h2>Customer Portal</h2>
        <p className="subtitle">View and manage your service requests</p>

        <form onSubmit={handleSubmit} className="customer-login-form">
          <div className="form-group">
            <label htmlFor="companyCode">Company Code</label>
            <input
              type="text"
              id="companyCode"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              required
              placeholder="Enter your company code"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="service-request-button"
          onClick={onServiceRequest}
          disabled={isLoading}
        >
          Submit a Service Request
        </button>

        <p className="info-text">
          For technical support or account access, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default CustomerLogin;
