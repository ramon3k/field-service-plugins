// src/components/LoginPage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px 40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}>
            🔧 Field Service Operations
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0
          }}>
            Sign in with your Microsoft account to continue
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#0078d4',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              M365
            </div>
            <span style={{ color: '#333', fontSize: '16px', fontWeight: '500' }}>
              Microsoft 365 Integration
            </span>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            lineHeight: '1.4'
          }}>
            Access your SharePoint data, manage tickets, and collaborate with your team using your existing Microsoft 365 account.
          </p>
        </div>

        <button
          onClick={login}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: isLoading ? '#ccc' : '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Signing In...
            </>
          ) : (
            <>
              <span>🔐</span>
              Sign in with Microsoft
            </>
          )}
        </button>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#e8f4fd',
          borderRadius: '6px',
          border: '1px solid #b6d7f0'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#0078d4',
            margin: '0 0 8px 0'
          }}>
            System Features:
          </h3>
          <ul style={{
            fontSize: '13px',
            color: '#333',
            margin: 0,
            paddingLeft: '16px',
            textAlign: 'left'
          }}>
            <li>Interactive operations center map</li>
            <li>Real-time ticket management</li>
            <li>Comprehensive reporting & analytics</li>
            <li>User role management</li>
            <li>SharePoint integration</li>
          </ul>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;