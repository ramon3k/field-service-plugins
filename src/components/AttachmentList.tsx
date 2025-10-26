import React, { useState, useEffect } from 'react'
import type { Attachment } from '../types'
import { authService } from '../services/AuthService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function buildAuthHeaders(additional: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...additional }

  const token = localStorage.getItem('authToken')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const sqlUserStr = localStorage.getItem('sqlUser')
  if (sqlUserStr) {
    try {
      const sqlUser = JSON.parse(sqlUserStr)
      if (sqlUser.id) {
        headers['x-user-id'] = sqlUser.id
        headers['x-user-name'] = sqlUser.username || sqlUser.fullName || ''
        headers['x-user-role'] = sqlUser.role || ''
        if (sqlUser.companyCode) {
          headers['x-company-code'] = sqlUser.companyCode
        }
        if (sqlUser.companyName) {
          headers['x-company-name'] = sqlUser.companyName
        }
        return headers
      }
    } catch (err) {
      console.warn('AttachmentList: Failed to parse sqlUser from localStorage')
    }
  }

  const fallbackUser = authService.getCurrentUser()
  if (fallbackUser) {
    if ((fallbackUser as any).id) headers['x-user-id'] = (fallbackUser as any).id
    if (fallbackUser.fullName) headers['x-user-name'] = fallbackUser.fullName
    if (fallbackUser.role) headers['x-user-role'] = fallbackUser.role
  }

  return headers
}

type AttachmentListProps = {
  ticketId: string
  refreshTrigger?: number
}

const AttachmentList: React.FC<AttachmentListProps> = ({ ticketId, refreshTrigger }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/attachments`, {
        headers: buildAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }

      const data = await response.json()
      setAttachments(data)
    } catch (err) {
      console.error('Error fetching attachments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [ticketId, refreshTrigger])

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
        headers: buildAuthHeaders({ 'x-user-timezone': userTimezone })
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) {
      return
    }

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders({ 'x-user-timezone': userTimezone })
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Refresh list
      fetchAttachments()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType === 'text/plain') return '📃'
    return '📎'
  }

  const isImage = (fileType: string): boolean => {
    return fileType.startsWith('image/')
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading attachments...</div>
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#c00' }}>Error: {error}</div>
  }

  if (attachments.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No attachments yet</div>
  }

  return (
    <div>
      {attachments.map((attachment) => (
        <div
          key={attachment.AttachmentID}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}
        >
          <div style={{ fontSize: '32px', flexShrink: 0 }}>
            {getFileIcon(attachment.FileType)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              marginBottom: '5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {attachment.OriginalFileName}
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
              {formatFileSize(attachment.FileSize)} • {formatDate(attachment.UploadedAt)}
              {attachment.UploadedByName && ` • ${attachment.UploadedByName}`}
            </div>

            {attachment.Description && (
              <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                {attachment.Description}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => handleDownload(attachment.AttachmentID, attachment.OriginalFileName)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📥 Download
            </button>

            <button
              onClick={() => handleDelete(attachment.AttachmentID, attachment.OriginalFileName)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AttachmentList
