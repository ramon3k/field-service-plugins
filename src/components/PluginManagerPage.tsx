import React, { useState, useEffect } from 'react'
import PluginUploadModal from './PluginUploadModal'

interface Plugin {
  PluginID: string
  PluginName: string
  displayName: string
  Version: string
  Description: string
  author?: string
  Category: string
  status: string
  isOfficial: boolean
  isInstalled?: boolean
  isEnabled?: boolean
}

// Shape of installed plugin info returned by `/plugins/installed`
interface InstalledPluginInfo {
  PluginID: string
  IsEnabled: boolean
  [key: string]: any
}

export default function PluginManagerPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [installedPluginIds, setInstalledPluginIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'
  
  // Get user context from localStorage
  const companyCode = localStorage.getItem('companyCode') || 'DCPSP'
  const userId = localStorage.getItem('userId') || 'system'

  useEffect(() => {
    fetchPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all available plugins
      const availableResponse = await fetch(`${API_BASE}/plugins`)
      if (!availableResponse.ok) throw new Error('Failed to fetch available plugins')
      const availableData = await availableResponse.json()

      // Fetch installed plugins
      const installedResponse = await fetch(`${API_BASE}/plugins/installed`)
      if (!installedResponse.ok) throw new Error('Failed to fetch installed plugins')
      const installedData = await installedResponse.json()

      // Create a map of installed plugin statuses (typed)
      const installedMap = new Map<string, InstalledPluginInfo>(
        installedData.plugins.map((p: InstalledPluginInfo) => [p.PluginID, p])
      )

      // Merge data
      const mergedPlugins = availableData.plugins.map((plugin: Plugin) => {
        const installedInfo = installedMap.get(plugin.PluginID)
        return {
          ...plugin,
          isInstalled: !!installedInfo,
          isEnabled: installedInfo?.IsEnabled ?? false
        }
      })

      setPlugins(mergedPlugins)
      setInstalledPluginIds(new Set(installedData.plugins.map((p: any) => p.PluginID)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins')
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (pluginId: string) => {
    try {
      setActionLoading(pluginId)
      const response = await fetch(`${API_BASE}/plugins/${pluginId}/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-code': companyCode,
          'x-user-id': userId
        },
        body: JSON.stringify({ configuration: {} }) // Empty configuration for now
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to install plugin')
      }

      await fetchPlugins()
      alert('Plugin installed successfully! Please refresh the page to see changes.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to install plugin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUninstall = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin? This will remove all plugin data for this company.')) {
      return
    }

    try {
      setActionLoading(pluginId)
      const response = await fetch(`${API_BASE}/plugins/${pluginId}/uninstall`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to uninstall plugin')
      }

      await fetchPlugins()
      alert('Plugin uninstalled successfully! Please refresh the page to see changes.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to uninstall plugin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (pluginId: string, pluginName: string) => {
    if (!confirm(`⚠️ DELETE PLUGIN FROM SYSTEM?\n\nThis will permanently remove "${pluginName}" from the system.\n\nThis action cannot be undone!\n\nType YES to confirm.`)) {
      return
    }

    const confirmation = prompt('Type "DELETE" to confirm:')
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled.')
      return
    }

    try {
      setActionLoading(pluginId)
      const response = await fetch(`${API_BASE}/plugins/${pluginId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete plugin')
      }

      await fetchPlugins()
      alert('Plugin deleted successfully from the system!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete plugin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggle = async (pluginId: string, currentlyEnabled: boolean) => {
    try {
      setActionLoading(pluginId)
      const endpoint = currentlyEnabled ? 'disable' : 'enable'
      const response = await fetch(`${API_BASE}/plugins/${pluginId}/${endpoint}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${endpoint} plugin`)
      }

      await fetchPlugins()
      alert(`Plugin ${currentlyEnabled ? 'disabled' : 'enabled'} successfully! Click "Reload Plugins" to apply changes.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle plugin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReloadPlugins = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/plugins/reload`, {
        method: 'POST',
        headers: {
          'x-company-code': companyCode
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reload plugins')
      }

      const data = await response.json()
      await fetchPlugins()
      alert(`Plugins reloaded successfully!\n\nLoaded plugins: ${data.loadedPlugins.join(', ') || 'None'}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reload plugins')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (plugin: Plugin) => {
    if (!plugin.isInstalled) {
      return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#e5e7eb', color: '#374151' }}>Not Installed</span>
    }
    if (plugin.isEnabled) {
      return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#dcfce7', color: '#166534' }}>✓ Enabled</span>
    }
    return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#fef3c7', color: '#92400e' }}>Disabled</span>
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading plugins...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <p>Error: {error}</p>
        <button onClick={fetchPlugins} style={{ marginTop: '16px', padding: '8px 16px' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            🔌 Plugin Manager
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Manage plugins for your Field Service application. Install, enable, disable, or uninstall plugins to customize your experience.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleReloadPlugins}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            {loading ? '⏳ Reloading...' : '🔄 Reload Plugins'}
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            📦 Upload Plugin
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {plugins.map(plugin => (
          <div
            key={plugin.PluginID}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              background: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    {plugin.displayName}
                  </h3>
                  {getStatusBadge(plugin)}
                  {plugin.isOfficial && (
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#dbeafe', color: '#1e40af' }}>
                      Official
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                  Version {plugin.Version} {plugin.author && `• by ${plugin.author}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!plugin.isInstalled ? (
                  <button
                    onClick={() => handleInstall(plugin.PluginID)}
                    disabled={actionLoading === plugin.PluginID}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading === plugin.PluginID ? 'wait' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {actionLoading === plugin.PluginID ? 'Installing...' : 'Install'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggle(plugin.PluginID, plugin.isEnabled || false)}
                      disabled={actionLoading === plugin.PluginID}
                      style={{
                        padding: '8px 16px',
                        background: plugin.isEnabled ? '#f59e0b' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: actionLoading === plugin.PluginID ? 'wait' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {actionLoading === plugin.PluginID
                        ? 'Processing...'
                        : plugin.isEnabled
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleUninstall(plugin.PluginID)}
                      disabled={actionLoading === plugin.PluginID}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: actionLoading === plugin.PluginID ? 'wait' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Uninstall
                    </button>
                  </>
                )}
                {!plugin.isInstalled && (
                  <button
                    onClick={() => handleDelete(plugin.PluginID, plugin.displayName)}
                    disabled={actionLoading === plugin.PluginID}
                    style={{
                      padding: '8px 16px',
                      background: '#991b1b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading === plugin.PluginID ? 'wait' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    title="Permanently delete this plugin from the system"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>

            <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>
              {plugin.Description}
            </p>

            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
              <span>📁 {plugin.Category}</span>
              <span>🆔 {plugin.PluginName}</span>
              <span>📊 {plugin.status}</span>
            </div>
          </div>
        ))}

        {plugins.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No plugins available.</p>
          </div>
        )}
      </div>
      
      {showUploadModal && (
        <PluginUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchPlugins()
          }}
        />
      )}
    </div>
  )
}
