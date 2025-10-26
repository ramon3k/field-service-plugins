import React, { useState } from 'react';
import './TenantRegistration.css';

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  useWindowsAuth: boolean;
}

interface TenantRegistrationProps {
  onRegister: (tenantData: {
    tenantCode: string;
    companyName: string;
    adminUser: {
      username: string;
      password: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    databaseConfig: DatabaseConfig;
  }) => Promise<void>;
  onCancel: () => void;
}

export const TenantRegistration: React.FC<TenantRegistrationProps> = ({ onRegister, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Company Info
  const [tenantCode, setTenantCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Admin User
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  
  // Database Config
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('1433');
  const [dbDatabase, setDbDatabase] = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [useWindowsAuth, setUseWindowsAuth] = useState(false);

  const validateStep1 = () => {
    if (!tenantCode.trim()) {
      setError('Company code is required');
      return false;
    }
    if (tenantCode.length < 3) {
      setError('Company code must be at least 3 characters');
      return false;
    }
    if (!companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Username and password are required');
      return false;
    }
    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setError('Valid email address is required');
      return false;
    }
    if (!adminFirstName.trim() || !adminLastName.trim()) {
      setError('First and last name are required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!dbHost.trim() || !dbPort.trim() || !dbDatabase.trim()) {
      setError('Host, port, and database name are required');
      return false;
    }
    if (!useWindowsAuth && (!dbUsername.trim() || !dbPassword.trim())) {
      setError('Username and password are required for SQL authentication');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onRegister({
        tenantCode: tenantCode.trim().toUpperCase(),
        companyName: companyName.trim(),
        adminUser: {
          username: adminUsername.trim(),
          password: adminPassword,
          email: adminEmail.trim().toLowerCase(),
          firstName: adminFirstName.trim(),
          lastName: adminLastName.trim()
        },
        databaseConfig: {
          host: dbHost.trim(),
          port: dbPort.trim(),
          database: dbDatabase.trim(),
          username: useWindowsAuth ? '' : dbUsername.trim(),
          password: useWindowsAuth ? '' : dbPassword,
          useWindowsAuth
        }
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="registration-step">
      <h2>Company Information</h2>
      <p className="step-description">Set up your company's unique identifier and details</p>
      
      <div className="form-group">
        <label htmlFor="tenantCode">Company Code *</label>
        <input
          id="tenantCode"
          type="text"
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
          placeholder="e.g., ACME001, TECH-CORP"
          maxLength={20}
          disabled={isLoading}
        />
        <small className="field-help">
          This will be used by your team members to access the system
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="companyName">Company Name *</label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your Company Name"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="registration-step">
      <h2>Administrator Account</h2>
      <p className="step-description">Create the main administrator account for your company</p>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="adminFirstName">First Name *</label>
          <input
            id="adminFirstName"
            type="text"
            value={adminFirstName}
            onChange={(e) => setAdminFirstName(e.target.value)}
            placeholder="First Name"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="adminLastName">Last Name *</label>
          <input
            id="adminLastName"
            type="text"
            value={adminLastName}
            onChange={(e) => setAdminLastName(e.target.value)}
            placeholder="Last Name"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="adminEmail">Email Address *</label>
        <input
          id="adminEmail"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="admin@yourcompany.com"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="adminUsername">Username *</label>
        <input
          id="adminUsername"
          type="text"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          placeholder="admin"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="adminPassword">Password *</label>
        <input
          id="adminPassword"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="registration-step">
      <h2>Database Configuration</h2>
      <p className="step-description">Connect to your SQL Server database</p>
      
      <div className="form-row">
        <div className="form-group flex-2">
          <label htmlFor="dbHost">Server Host *</label>
          <input
            id="dbHost"
            type="text"
            value={dbHost}
            onChange={(e) => setDbHost(e.target.value)}
            placeholder="localhost or server.company.com"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group flex-1">
          <label htmlFor="dbPort">Port *</label>
          <input
            id="dbPort"
            type="text"
            value={dbPort}
            onChange={(e) => setDbPort(e.target.value)}
            placeholder="1433"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="dbDatabase">Database Name *</label>
        <input
          id="dbDatabase"
          type="text"
          value={dbDatabase}
          onChange={(e) => setDbDatabase(e.target.value)}
          placeholder="FieldServiceDB"
          disabled={isLoading}
        />
      </div>

      <div className="auth-type-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useWindowsAuth}
            onChange={(e) => setUseWindowsAuth(e.target.checked)}
            disabled={isLoading}
          />
          Use Windows Authentication
        </label>
      </div>

      {!useWindowsAuth && (
        <>
          <div className="form-group">
            <label htmlFor="dbUsername">Database Username *</label>
            <input
              id="dbUsername"
              type="text"
              value={dbUsername}
              onChange={(e) => setDbUsername(e.target.value)}
              placeholder="sa or database username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dbPassword">Database Password *</label>
            <input
              id="dbPassword"
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              placeholder="Database password"
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="tenant-registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h1>Company Registration</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <div className="registration-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div className="registration-actions">
          <button 
            type="button" 
            className="secondary-button"
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            disabled={isLoading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button 
              type="button" 
              className="primary-button"
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
            </button>
          ) : (
            <button 
              type="button" 
              className="primary-button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};