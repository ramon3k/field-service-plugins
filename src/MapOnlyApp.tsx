import React, { useEffect, useState } from 'react'
import OperationsMap from './components/OperationsMap'

export default function MapOnlyApp() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Auto-fullscreen when opened in popup
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => {
            // Fallback to browser fullscreen if DOM fullscreen fails
            console.log('Fullscreen API not available, using browser fullscreen')
          })
      }
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) {
        e.preventDefault()
        if (document.fullscreenElement) {
          document.exitFullscreen()
          setIsFullscreen(false)
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
          setIsFullscreen(true)
        }
      }
      if (e.key === 'Escape' && e.shiftKey) {
        window.close()
      }
    }

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Small delay to ensure page is loaded
    const timer = setTimeout(enterFullscreen, 1000)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      height: '100vh', 
      width: '100vw',
      background: '#f0f0f0',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span>🗺️ DCPSP Operations Center - Live Map</span>
        <span style={{ opacity: 0.7, fontSize: '10px' }}>
          Shortcuts: F11 (Fullscreen) | Shift+Esc (Close)
        </span>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Close Window
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen()
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      
      <div style={{ height: '100vh', width: '100vw' }}>
        <OperationsMap />
      </div>
    </div>
  )
}