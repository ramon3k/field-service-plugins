import React, { createContext, useContext, useState, useCallback } from 'react'

interface MessengerNotification {
  unreadCount: number
  lastMessage?: {
    fromUserId: string
    fromUserName: string
    message: string
    timestamp: string
  }
}

interface MessengerNotificationContextType {
  unreadCount: number
  lastMessage?: {
    fromUserId: string
    fromUserName: string
    message: string
    timestamp: string
  }
  updateNotification: (notification: MessengerNotification) => void
  clearNotifications: () => void
}

const MessengerNotificationContext = createContext<MessengerNotificationContextType | null>(null)

export const useMessengerNotification = () => {
  const context = useContext(MessengerNotificationContext)
  if (!context) {
    throw new Error('useMessengerNotification must be used within MessengerNotificationProvider')
  }
  return context
}

interface Props {
  children: React.ReactNode
}

export const MessengerNotificationProvider: React.FC<Props> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastMessage, setLastMessage] = useState<{
    fromUserId: string
    fromUserName: string
    message: string
    timestamp: string
  } | undefined>()

  const updateNotification = useCallback((notification: MessengerNotification) => {
    setUnreadCount(notification.unreadCount)
    if (notification.lastMessage) {
      setLastMessage(notification.lastMessage)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setUnreadCount(0)
    setLastMessage(undefined)
  }, [])

  return (
    <MessengerNotificationContext.Provider value={{
      unreadCount,
      lastMessage,
      updateNotification,
      clearNotifications
    }}>
      {children}
    </MessengerNotificationContext.Provider>
  )
}