import React, { useState, useRef, useEffect } from 'react'
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
      console.warn('AttachmentUpload: Failed to parse sqlUser from localStorage')
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

type AttachmentUploadProps = {
  ticketId: string
  onUploadComplete: (attachment: Attachment) => void
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ ticketId, onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log('📎 AttachmentUpload component mounted for ticket:', ticketId)
    loadAttachments()
    return () => {
      console.log('📎 AttachmentUpload component unmounted')
    }
  }, [ticketId])

  // Load attachments for this ticket
  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/attachments`, {
        headers: buildAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (err) {
      console.error('Error loading attachments:', err)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleDownload = async (attachmentId: string, originalFileName: string) => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = buildAuthHeaders({ 'x-user-timezone': userTimezone })
      const url = `${API_BASE_URL}/attachments/${attachmentId}`
      console.log('📎 Downloading:', originalFileName)

      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = originalFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download file')
    }
  }

  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]

  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: images, PDF, Word, Excel, text files'
    }
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 10MB'
    }
    return null
  }

  const handleUpload = async (file: File) => {
    console.log('📎 AttachmentUpload: Starting upload for file:', file.name)
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      console.error('❌ File validation failed:', validationError)
      setError(validationError)
      return
    }

    setIsUploading(true)

    try {
  const user = authService.getCurrentUser()
  console.log('📎 User from authService:', user)
  console.log('📎 User ID being sent:', user?.id || '(EMPTY)')
      
      const formData = new FormData()
      formData.append('file', file)
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = buildAuthHeaders({ 'x-user-timezone': userTimezone })

      const uploadUrl = `${API_BASE_URL}/tickets/${ticketId}/attachments`
      console.log('📎 Uploading to:', uploadUrl)

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData
      })

      console.log('📎 Upload response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Upload failed:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('✅ Upload successful:', data)

      // Show success message
      setSuccessMessage(`✅ ${file.name} uploaded successfully!`)
      setTimeout(() => setSuccessMessage(null), 5000)

      // Reload attachments list
      await loadAttachments()

      // Refresh attachments list
      if (onUploadComplete) {
        // Fetch the full attachment details
        const attachmentsResponse = await fetch(
          `${API_BASE_URL}/tickets/${ticketId}/attachments`,
          { headers: buildAuthHeaders() }
        )
        
        if (attachmentsResponse.ok) {
          const attachments = await attachmentsResponse.json()
          const newAttachment = attachments.find((a: Attachment) => a.AttachmentID === data.attachment.id)
          if (newAttachment) {
            onUploadComplete(newAttachment)
          }
        }
      }

      // Reset form
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('❌ AttachmentUpload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '30px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          transition: 'all 0.2s ease',
          opacity: isUploading ? 0.6 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        
        {isUploading ? (
          <div>
            <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
              ⏳ Uploading...
            </p>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
              📎 Drop file here or click to browse
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
              Allowed: Images, PDF, Word, Excel, Text (Max 10MB)
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px' }}>
        <input
          type="text"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#e7f7e7',
          border: '1px solid #c3e6c3',
          borderRadius: '4px',
          color: '#28a745',
          fontSize: '14px'
        }}>
          {successMessage}
        </div>
      )}

      {/* Attachments List */}
      {loadingAttachments ? (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          Loading attachments...
        </div>
      ) : attachments.length > 0 ? (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>
            📎 Uploaded Files ({attachments.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attachments.map((att) => (
              <div
                key={att.AttachmentID}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#333' }}>
                    {att.OriginalFileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {(att.FileSize / 1024).toFixed(1)} KB • {new Date(att.UploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(att.AttachmentID, att.OriginalFileName)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                >
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#999' }}>
          No files uploaded yet
        </div>
      )}
    </div>
  )
}

export default AttachmentUpload
