import React, { useState } from 'react'

interface PluginUploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function PluginUploadModal({ onClose, onSuccess }: PluginUploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_URL || '/api'

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file containing the plugin')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('plugin', file)

      const response = await fetch(`${API_BASE}/plugins/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload plugin')
      }

      alert(`Plugin "${data.plugin.displayName}" uploaded successfully!\n\nYou can now install it from the plugin list.`)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload plugin')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}>
          📦 Upload Plugin
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
            Upload a plugin package (.zip file) to add it to your system. The plugin will be registered in the catalog and available for installation.
          </p>

          <div style={{
            background: '#f3f4f6',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#374151',
            marginBottom: '16px'
          }}>
            <strong>📋 Required ZIP Contents:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>index.js (plugin code)</li>
              <li>plugin.json (metadata)</li>
              <li>README.md (optional)</li>
            </ul>
          </div>

          <input
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #d1d5db',
              borderRadius: '6px',
              cursor: uploading ? 'wait' : 'pointer',
              fontSize: '14px'
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {uploading && (
          <div style={{
            padding: '12px',
            background: '#dbeafe',
            color: '#1e40af',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            📤 Uploading plugin...
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
