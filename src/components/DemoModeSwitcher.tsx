// Demo Mode Switcher Component
// Add this to your header or create a floating button

import React, { useState, useEffect } from 'react'
import styles from './DemoModeSwitcher.module.css'

const COMPANY_CODES = {
  PRODUCTION: 'DCPSP',
  DEMO: 'DEMO',
  DEMO_HVAC: 'DEMO-HVAC',
  DEMO_SECURITY: 'DEMO-SECURITY'
}

export default function DemoModeSwitcher() {
  const [companyCode, setCompanyCode] = useState<string>(
    localStorage.getItem('companyCode') || COMPANY_CODES.PRODUCTION
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('companyCode', companyCode)
    // Store in window for API calls to use
    ;(window as any).COMPANY_CODE = companyCode
  }, [companyCode])

  const handleSwitch = (code: string) => {
    setCompanyCode(code)
    setIsOpen(false)
    // Reload page to fetch data from new database
    window.location.reload()
  }

  const isDemo = companyCode !== COMPANY_CODES.PRODUCTION

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className={styles.demoBanner}>
          <span className={styles.icon}>🎭</span>
          DEMO MODE ACTIVE
          <span className={styles.badge}>
            {companyCode}
          </span>
          <button onClick={() => handleSwitch(COMPANY_CODES.PRODUCTION)}>
            Exit Demo →
          </button>
        </div>
      )}

      {/* Floating Switcher Button */}
      <div className={styles.floatingContainer}>
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={`${styles.floatingButton} ${isDemo ? styles.demo : styles.production}`}
            title="Switch Environment"
          >
            {isDemo ? '🎭' : '🏢'}
          </button>
        ) : (
          <div className={styles.menuPanel}>
            <div className={styles.menuHeader}>
              <h3>Switch Environment</h3>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.buttonContainer}>
              {/* Production */}
              <button
                onClick={() => handleSwitch(COMPANY_CODES.PRODUCTION)}
                className={`${styles.envButton} ${companyCode === COMPANY_CODES.PRODUCTION ? `${styles.production} ${styles.active}` : styles.inactive}`}
              >
                🏢 Production (DCPSP)
                {companyCode === COMPANY_CODES.PRODUCTION && (
                  <div className={styles.currentLabel}>
                    Current environment
                  </div>
                )}
              </button>

              {/* General Demo */}
              <button
                onClick={() => handleSwitch(COMPANY_CODES.DEMO)}
                className={`${styles.envButton} ${companyCode === COMPANY_CODES.DEMO ? `${styles.demo} ${styles.active}` : styles.inactive}`}
              >
                🎭 General Demo
                {companyCode === COMPANY_CODES.DEMO && (
                  <div className={styles.currentLabel}>
                    Current environment
                  </div>
                )}
                {companyCode !== COMPANY_CODES.DEMO && (
                  <div className={styles.description}>
                    Sample data across all scenarios
                  </div>
                )}
              </button>

              {/* HVAC Demo */}
              <button
                onClick={() => handleSwitch(COMPANY_CODES.DEMO_HVAC)}
                className={`${styles.envButton} ${companyCode === COMPANY_CODES.DEMO_HVAC ? `${styles.hvac} ${styles.active}` : styles.inactive}`}
              >
                ❄️ HVAC Demo
                {companyCode === COMPANY_CODES.DEMO_HVAC && (
                  <div className={styles.currentLabel}>
                    Current environment
                  </div>
                )}
                {companyCode !== COMPANY_CODES.DEMO_HVAC && (
                  <div className={styles.description}>
                    HVAC service scenarios
                  </div>
                )}
              </button>

              {/* Security Demo */}
              <button
                onClick={() => handleSwitch(COMPANY_CODES.DEMO_SECURITY)}
                className={`${styles.envButton} ${companyCode === COMPANY_CODES.DEMO_SECURITY ? `${styles.security} ${styles.active}` : styles.inactive}`}
              >
                🔒 Security Demo
                {companyCode === COMPANY_CODES.DEMO_SECURITY && (
                  <div className={styles.currentLabel}>
                    Current environment
                  </div>
                )}
                {companyCode !== COMPANY_CODES.DEMO_SECURITY && (
                  <div className={styles.description}>
                    Security system scenarios
                  </div>
                )}
              </button>
            </div>

            <div className={styles.infoBox}>
              <strong>Note:</strong> Switching will reload the page and fetch data from the selected database.
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Helper function to get company code for API calls
export function getCompanyCode(): string {
  return (window as any).COMPANY_CODE || localStorage.getItem('companyCode') || 'DCPSP'
}

// Update your api-json.ts or wherever you make API calls:
// 
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
// 
// export async function listTickets() {
//   const companyCode = getCompanyCode()
//   const response = await fetch(`${API_BASE_URL}/api/tickets?company=${companyCode}`)
//   return response.json()
// }
