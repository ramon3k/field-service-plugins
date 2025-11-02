import React, { useEffect, useRef } from 'react'
import GlobalNotificationService from '../services/GlobalNotificationService'

interface GlobalNotificationProps {
  currentTab: string
  onTabSwitch: (tab: string) => void
  currentUser?: {
    id: string
    fullName: string
    role: string
    companyCode?: string
  }
}

export default function GlobalNotificationProvider({ 
  currentTab, 
  onTabSwitch, 
  currentUser,
  children 
}: GlobalNotificationProps & { children: React.ReactNode }) {
  const notificationService = GlobalNotificationService.getInstance()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!currentUser) return

    // Request notification permission when component mounts
    notificationService.requestPermission()

    // Connect to global notification WebSocket service
    let ws: WebSocket | null = null
    let isCleanedUp = false
    let reconnectTimer: NodeJS.Timeout | null = null

    const connectToGlobalNotificationService = () => {
      if (isCleanedUp || wsRef.current?.readyState === WebSocket.OPEN) return

      try {
        console.log('🔔 Connecting to Global Notification Service...')
        // Connect to built-in global notification service on port 8081
        // Use current hostname to support remote access
        const wsHost = window.location.hostname
        const wsUrl = `ws://${wsHost}:8081`
        console.log('🔔 WebSocket URL:', wsUrl)
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          if (isCleanedUp) {
            ws?.close()
            return
          }

          console.log('🔔 Connected to Global Notification Service')

          // Register with the service
          ws?.send(JSON.stringify({
            type: 'register',
            userId: currentUser.id,
            userName: currentUser.fullName,
            role: currentUser.role,
            companyCode: currentUser.companyCode || 'TEST'
          }))
        }

        ws.onmessage = (event) => {
          if (isCleanedUp) return

          try {
            const data = JSON.parse(event.data)

            if (data.type === 'notification') {
              console.log('🔔 Received global notification:', data)
              
              // Show browser notification
              notificationService.showNotification(
                data.title,
                data.message,
                data.icon,
                () => {
                  // Handle notification click
                  if (data.url) {
                    // If URL is provided, navigate to it
                    if (data.url.startsWith('/')) {
                      // Internal navigation
                      const tabMatch = data.url.match(/^\/tab\/(.+)/)
                      if (tabMatch) {
                        onTabSwitch(tabMatch[1])
                      }
                    } else {
                      // External URL
                      window.open(data.url, '_blank')
                    }
                  }
                }
              )
            }
          } catch (err) {
            console.error('🔔 Error parsing notification:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('🔔 Global notification connection error:', error)
        }

        ws.onclose = () => {
          wsRef.current = null
          if (!isCleanedUp) {
            console.log('🔔 Disconnected from Global Notification Service, reconnecting in 3s...')
            // Try to reconnect after 3 seconds
            reconnectTimer = setTimeout(() => {
              if (!isCleanedUp) {
                console.log('🔔 Attempting to reconnect to Global Notification Service...')
                connectToGlobalNotificationService()
              }
            }, 3000)
          }
        }

        wsRef.current = ws

      } catch (error) {
        console.error('🔔 Failed to connect to Global Notification Service:', error)
        // Retry after 5 seconds
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(() => {
            if (!isCleanedUp) {
              connectToGlobalNotificationService()
            }
          }, 5000)
        }
      }
    }

    connectToGlobalNotificationService()

    return () => {
      isCleanedUp = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
      wsRef.current = null
    }
  }, []) // Empty dependency - only connect once on mount

  return <>{children}</>
}