import React, { useEffect, useMemo, useRef, useState } from 'react'
import './InstantMessenger.css'

interface PluginComponentProps {
  currentUser: {
    id: string
    fullName: string
    role: string
  }
  companyCode: string
  pluginId: string
  componentId: string
}

interface Contact {
  userId: string
  userName: string
  role: string
  isOnline: boolean
  lastActive?: string
}

interface ChatMessage {
  id: string
  fromUserId: string
  toUserId: string
  message: string
  timestamp: string
  pending?: boolean
  failed?: boolean
}

interface ConversationState {
  contact: Contact
  messages: ChatMessage[]
  unread: number
  isLoading: boolean
  error?: string | null
}

interface NotificationMessage {
  type?: string
  fromUserId: string
  fromUserName?: string
  message: string
  timestamp: string
}

interface ToastNotification {
  id: string
  userName: string
  message: string
  userId: string
}

const API_BASE = '/api/plugins/instant-messenger'
const CONTACT_POLL_MS = 15_000
const HEARTBEAT_MS = 45_000

function buildHeaders(user: PluginComponentProps['currentUser'], companyCode: string) {
  return {
    'Content-Type': 'application/json',
    'x-company-code': companyCode,
    'x-user-id': user.id,
    'x-user-name': user.fullName,
    'x-user-role': user.role
  }
}

export default function InstantMessenger({ currentUser, companyCode }: PluginComponentProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [conversations, setConversations] = useState<Record<string, ConversationState>>({})
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const contactsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const conversationsRef = useRef<Record<string, ConversationState>>({})
  const isMountedRef = useRef<boolean>(true)

  const unreadTotal = useMemo(() => {
    return Object.values(conversations).reduce((sum, convo) => sum + (convo.unread || 0), 0)
  }, [conversations])

  const headers = useMemo(() => buildHeaders(currentUser, companyCode), [currentUser, companyCode])

  const broadcastBadge = (count: number) => {
    window.dispatchEvent(
      new CustomEvent('instant-messenger:badge', {
        detail: { unread: count }
      })
    )
  }

  useEffect(() => {
    broadcastBadge(unreadTotal)
  }, [unreadTotal])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contacts`, { headers })
      if (!response.ok) throw new Error(`Failed to fetch contacts (${response.status})`)
      const data = await response.json()
      const list: Contact[] = Array.isArray(data.contacts) ? data.contacts : []
      list.sort((a, b) => {
        if (a.isOnline === b.isOnline) {
          return a.userName.localeCompare(b.userName)
        }
        return a.isOnline ? -1 : 1
      })

      setContacts(list)
      setConversations(prev => {
        const next = { ...prev }
        list.forEach(contact => {
          if (next[contact.userId]) {
            next[contact.userId] = {
              ...next[contact.userId],
              contact: { ...next[contact.userId].contact, ...contact }
            }
          }
        })
        return next
      })
    } catch (error) {
      console.error('InstantMessenger: contacts fetch failed', error)
    }
  }

  const sendHeartbeat = async () => {
    try {
      await fetch(`${API_BASE}/heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.fullName,
          role: currentUser.role
        })
      })
    } catch (error) {
      console.error('InstantMessenger: heartbeat failed', error)
    }
  }

  const openConversation = async (contact: Contact) => {
    setActiveConversationId(contact.userId)
    setConversations(prev => {
      const next = { ...prev }
      next[contact.userId] = next[contact.userId]
        ? {
            ...next[contact.userId],
            contact: { ...next[contact.userId].contact, ...contact },
            unread: 0,
            isLoading: true,
            error: null
          }
        : {
            contact,
            messages: [],
            unread: 0,
            isLoading: true,
            error: null
          }
      return next
    })

    try {
      const response = await fetch(`${API_BASE}/conversations/${contact.userId}`, { headers })
      if (!response.ok) throw new Error(`Failed to load conversation (${response.status})`)
      const data = await response.json()
      const messages: ChatMessage[] = Array.isArray(data.messages)
        ? data.messages.map((msg: any) => ({
            id: String(msg.id ?? `${msg.timestamp}-${msg.fromUserId ?? ''}`),
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            message: msg.message,
            timestamp: msg.timestamp
          }))
        : []

      setConversations(prev => {
        const next = { ...prev }
        if (!next[contact.userId]) return prev
        next[contact.userId] = {
          ...next[contact.userId],
          messages,
          isLoading: false,
          unread: 0,
          error: null
        }
        return next
      })
    } catch (error: any) {
      console.error('InstantMessenger: conversation load failed', error)
      setConversations(prev => {
        const next = { ...prev }
        if (!next[contact.userId]) return prev
        next[contact.userId] = {
          ...next[contact.userId],
          isLoading: false,
          error: error?.message || 'Failed to load conversation.'
        }
        return next
      })
    }
  }

  const appendMessage = (userId: string, message: ChatMessage, incrementUnread: boolean) => {
    setConversations(prev => {
      const next = { ...prev }
      const existing = next[userId]
      if (existing) {
        const unread = incrementUnread ? existing.unread + 1 : existing.unread
        next[userId] = {
          ...existing,
          messages: [...existing.messages, message],
          unread,
          isLoading: false
        }
      } else {
        const contact = contacts.find(c => c.userId === userId) || {
          userId,
          userName: 'Unknown User',
          role: 'User',
          isOnline: false
        }
        next[userId] = {
          contact,
          messages: [message],
          unread: incrementUnread ? 1 : 0,
          isLoading: false
        }
      }
      return next
    })
  }

  const handleIncomingNotification = (notification: NotificationMessage) => {
    console.log('📬 Incoming notification:', notification);
    
    if (!notification || !notification.fromUserId || !notification.message) {
      console.warn('⚠️ Invalid notification format:', notification);
      return;
    }

    const message: ChatMessage = {
      id: `${notification.timestamp}-${notification.fromUserId}`,
      fromUserId: notification.fromUserId,
      toUserId: currentUser.id,
      message: notification.message,
      timestamp: notification.timestamp
    }

    const shouldIncrement = activeConversationId !== notification.fromUserId
    console.log(`📨 Message from ${notification.fromUserName}, shouldIncrement: ${shouldIncrement}, activeConversation: ${activeConversationId}`);
    
    appendMessage(notification.fromUserId, message, shouldIncrement)

    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltrzxnMnBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2kdXzzn4sBS6Dz/Pah0ELGW++7+OcTQwOVKzn8LJfGgpBmNvxxXUpBi2BzvLajDkIF2u77OWhTxAKTKPi8bllHAU2kdXzyoIyBh1uw+/nmk0MDVWr5/C1YhsJPpnc88p1KwYvf87y2YU2Bxdqvu7mnEwOC1Gn4vG2ZRsGNI/W8styKgUuf9Dy2Ik5CBZpvO3mnkwOC1Cl4vG4Zh0GNI/W88p2LgYufcvy2Ic3BxZovu/jnU0NC1Om4fK4aR0GNpDV88h1LQUte87x2Ig4BxVpvO7knkwOC1On4vK3aB4GN5HV88h1LAUte87y2Ig4CBVovO7kn0wPDVOm4/K4aB4GN5DU88h1LAUte87y2Ig4CBVovO7kn0wPDVOm4/K4aB4GN5DU88d1LAYte87y2Ic4BxVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4CBVpvO7jn0wPDFOm5PK3aB4FNo/V88h1LAYte87y2Ic4A==')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore if user hasn't interacted with page yet
      })
    } catch (error) {
      // Ignore audio errors
    }

    // Show browser notification if not on active conversation
    if (shouldIncrement && 'Notification' in window) {
      console.log('🔔 Notification permission status:', Notification.permission);
      
      // Always show in-app toast notification
      const toastId = `${Date.now()}-${notification.fromUserId}`;
      setToasts(prev => [...prev, {
        id: toastId,
        userName: notification.fromUserName || 'Someone',
        message: notification.message,
        userId: notification.fromUserId
      }]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);
      
      if (Notification.permission === 'granted') {
        try {
          console.log('🔔 Creating browser notification...');
          const senderName = notification.fromUserName || 'Someone'
          const browserNotif = new Notification(`💬 ${senderName}`, {
            body: notification.message.substring(0, 100),
            icon: '/favicon.ico',
            tag: `instant-messenger-${notification.fromUserId}`,
            requireInteraction: false,
            badge: '/favicon.ico'
          })
          
          console.log('✅ Browser notification created successfully');

          setTimeout(() => browserNotif.close(), 5000)

          browserNotif.onclick = () => {
            window.focus()
            // Switch to this conversation
            setActiveConversationId(notification.fromUserId)
            browserNotif.close()
          }
          
          browserNotif.onerror = (err) => {
            console.error('❌ Browser notification error:', err);
          }
        } catch (error) {
          console.error('❌ Error creating browser notification:', error)
        }
      } else {
        console.warn(`⚠️ Cannot show notification - permission is "${Notification.permission}"`);
      }
    }
  }

  const connectToNotificationService = () => {
    if (wsRef.current) {
      console.log('⚠️ Already have a WebSocket connection, closing old one first');
      wsRef.current.close()
      wsRef.current = null
    }

    if (!isMountedRef.current) {
      console.log('⚠️ Component unmounted, skipping WebSocket connection');
      return;
    }

    try {
      // Determine WebSocket URL based on environment
      // In development (Vite), use localhost:8081 directly
      // In production, use same host with wss protocol
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = import.meta.env.DEV 
        ? '127.0.0.1:8081'  // Dev: connect directly to notification service
        : window.location.host;  // Prod: use same host (assumes reverse proxy)
      
      const wsUrl = `${wsProtocol}//${wsHost}`;
      console.log('🔌 Connecting to notification service:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Connected to notification service');
        ws.send(
          JSON.stringify({
            type: 'register',
            userId: currentUser.id,
            userName: currentUser.fullName,
            role: currentUser.role,
            companyCode
          })
        )
      }

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket message received:', data);
          
          if (data.type === 'notification' && data.data?.type === 'message') {
            handleIncomingNotification({
              fromUserId: data.data.fromUserId,
              fromUserName: data.data.fromUserName,
              message: data.data.message,
              timestamp: data.data.timestamp,
              type: data.data.type
            })
          } else if (data.type === 'registered') {
            console.log('✅ Registered with notification service as:', currentUser.fullName);
          } else {
            console.log('ℹ️ Other notification type:', data.type);
          }
        } catch (error) {
          console.error('InstantMessenger: notification parse failed', error)
        }
      }

      ws.onerror = error => {
        console.error('InstantMessenger: WebSocket error', error);
        console.warn('⚠️ Make sure the API server is running on port 5000 with notification service on port 8081');
      }

      ws.onclose = (event) => {
        console.log('🔌 Disconnected from notification service', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        });
        
        wsRef.current = null
        
        // Only reconnect if component is still mounted
        if (isMountedRef.current) {
          console.log('Will retry in 3s...');
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
          reconnectTimerRef.current = setTimeout(connectToNotificationService, 3000)
        } else {
          console.log('Component unmounted, not reconnecting');
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('InstantMessenger: WebSocket connect failed', error)
      console.warn('⚠️ Retrying connection in 5 seconds...');
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connectToNotificationService, 5000);
    }
  }

  const sendMessage = async (userId: string) => {
    const draft = drafts[userId]?.trim()
    if (!draft) return

    const tempId = `local-${Date.now()}`
    const pendingMessage: ChatMessage = {
      id: tempId,
      fromUserId: currentUser.id,
      toUserId: userId,
      message: draft,
      timestamp: new Date().toISOString(),
      pending: true
    }

    setDrafts(prev => ({ ...prev, [userId]: '' }))
    appendMessage(userId, pendingMessage, false)

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toUserId: userId, message: draft })
      })
      if (!response.ok) throw new Error(`Failed to send message (${response.status})`)
      const data = await response.json()
      const confirmed = data?.message
        ? {
            id: String(data.message.id ?? tempId),
            fromUserId: data.message.fromUserId ?? currentUser.id,
            toUserId: data.message.toUserId ?? userId,
            message: data.message.message ?? draft,
            timestamp: data.message.timestamp ?? new Date().toISOString()
          }
        : {
            id: tempId,
            fromUserId: currentUser.id,
            toUserId: userId,
            message: draft,
            timestamp: new Date().toISOString()
          }

      setConversations(prev => {
        const next = { ...prev }
        if (!next[userId]) return prev
        next[userId] = {
          ...next[userId],
          messages: next[userId].messages.map(msg =>
            msg.id === tempId ? confirmed : msg
          )
        }
        return next
      })
    } catch (error) {
      console.error('InstantMessenger: send failed', error)
      setConversations(prev => {
        const next = { ...prev }
        if (!next[userId]) return prev
        next[userId] = {
          ...next[userId],
          messages: next[userId].messages.map(msg =>
            msg.id === tempId ? { ...msg, pending: false, failed: true } : msg
          )
        }
        return next
      })
    }
  }

  const retryMessage = (userId: string, message: ChatMessage) => {
    setDrafts(prev => ({ ...prev, [userId]: message.message }))
    setConversations(prev => {
      const next = { ...prev }
      if (!next[userId]) return prev
      next[userId] = {
        ...next[userId],
        messages: next[userId].messages.filter(msg => msg.id !== message.id)
      }
      return next
    })
  }

  const sendCloseRequest = async (userId: string, useBeacon = false) => {
    const url = `${API_BASE}/conversations/${userId}/close`

    if (useBeacon && navigator.sendBeacon) {
      try {
        const payload = new Blob([JSON.stringify({ reason: 'close' })], {
          type: 'application/json'
        })
        navigator.sendBeacon(url, payload)
        return
      } catch (error) {
        console.warn('InstantMessenger: beacon close failed', error)
      }
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'close' })
      })
    } catch (error) {
      console.error('InstantMessenger: close failed', error)
    }
  }

  const closeConversation = async (userId: string, options: { silent?: boolean; useBeacon?: boolean } = {}) => {
    const { silent = false, useBeacon = false } = options

    await sendCloseRequest(userId, useBeacon)
    if (silent) return

    setConversations(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })

    setDrafts(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })

    setActiveConversationId(prev => {
      if (prev && prev !== userId) return prev
      const remaining = Object.keys(conversationsRef.current).filter(id => id !== userId)
      return remaining[0] ?? null
    })
  }

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      console.log('🔔 Current notification permission:', Notification.permission);
      
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        Notification.requestPermission().then((permission) => {
          console.log('🔔 Permission result:', permission);
        }).catch((error) => {
          console.error('🔔 Notification permission error:', error);
        });
      } else if (Notification.permission === 'denied') {
        console.warn('⚠️ Browser notifications are blocked. Please enable them in browser settings.');
      } else if (Notification.permission === 'granted') {
        console.log('✅ Browser notifications are enabled');
      }
    } else {
      console.warn('⚠️ Browser notifications not supported');
    }

    // Reset mounted flag on each mount
    isMountedRef.current = true;

    fetchContacts()
    sendHeartbeat()
    connectToNotificationService()

    contactsTimerRef.current = setInterval(fetchContacts, CONTACT_POLL_MS)
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_MS)

    const beforeUnloadHandler = () => {
      const ids = Object.keys(conversationsRef.current)
      ids.forEach(id => {
        sendCloseRequest(id, true)
      })
    }

    window.addEventListener('beforeunload', beforeUnloadHandler)

    return () => {
      console.log('🧹 Cleaning up InstantMessenger component');
      isMountedRef.current = false;
      
      if (contactsTimerRef.current) clearInterval(contactsTimerRef.current)
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      
      if (wsRef.current) {
        console.log('🔌 Closing WebSocket connection on unmount');
        wsRef.current.close()
        wsRef.current = null;
      }

      window.removeEventListener('beforeunload', beforeUnloadHandler)

      const ids = Object.keys(conversationsRef.current)
      ids.forEach(id => {
        sendCloseRequest(id, true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return []
    return conversations[activeConversationId]?.messages ?? []
  }, [activeConversationId, conversations])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeMessages])

  const activeConversation = activeConversationId ? conversations[activeConversationId] : undefined

  const handleDraftChange = (userId: string, value: string) => {
    setDrafts(prev => ({ ...prev, [userId]: value }))
  }

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    userId: string
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(userId)
    }
  }

  return (
    <div className="ims-container">
      <aside className="ims-sidebar">
        <header className="ims-sidebar-header">
          <h2>Contacts</h2>
          <span className="ims-sidebar-count">
            {contacts.filter(c => c.isOnline).length} online
          </span>
        </header>
        <div className="ims-contact-list">
          {contacts.length === 0 && (
            <div className="ims-empty">No active users</div>
          )}
          {contacts.map(contact => {
            const unread = conversations[contact.userId]?.unread || 0
            return (
              <button
                key={contact.userId}
                className={`ims-contact ${
                  activeConversationId === contact.userId ? 'ims-contact-active' : ''
                }`}
                onClick={() => openConversation(contact)}
              >
                <span className={`ims-status-dot ${contact.isOnline ? 'ims-online' : 'ims-offline'}`} />
                <div className="ims-contact-info">
                  <span className="ims-contact-name">{contact.userName}</span>
                  <span className="ims-contact-role">{contact.role}</span>
                </div>
                {unread > 0 && <span className="ims-badge">{unread}</span>}
              </button>
            )
          })}
        </div>
      </aside>

      <section className="ims-main">
        <header className="ims-main-header">
          <h2>Instant Messenger</h2>
          {unreadTotal > 0 && <span className="ims-badge">{unreadTotal}</span>}
        </header>

        {Object.keys(conversations).length > 0 && (
          <div className="ims-tab-bar">
            {Object.values(conversations).map(convo => (
              <button
                key={convo.contact.userId}
                className={`ims-tab ${
                  activeConversationId === convo.contact.userId ? 'ims-tab-active' : ''
                }`}
                onClick={() => {
                  setActiveConversationId(convo.contact.userId)
                  setConversations(prev => {
                    const next = { ...prev }
                    if (!next[convo.contact.userId]) return prev
                    next[convo.contact.userId] = {
                      ...next[convo.contact.userId],
                      unread: 0
                    }
                    return next
                  })
                }}
              >
                <span>{convo.contact.userName}</span>
                {convo.unread > 0 && <span className="ims-badge">{convo.unread}</span>}
                <span
                  className="ims-tab-close"
                  onClick={event => {
                    event.stopPropagation()
                    closeConversation(convo.contact.userId)
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        {!activeConversation && (
          <div className="ims-placeholder">
            <h3>Select a user to start chatting</h3>
            <p>Chats are ephemeral—closing the window clears the history.</p>
          </div>
        )}

        {activeConversation && (
          <div className="ims-conversation">
            <header className="ims-conversation-header">
              <div>
                <h3>{activeConversation.contact.userName}</h3>
                <span className={`ims-status-dot ${
                  activeConversation.contact.isOnline ? 'ims-online' : 'ims-offline'
                }`}
                >
                  {activeConversation.contact.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                className="ims-close"
                onClick={() => closeConversation(activeConversation.contact.userId)}
              >
                Close Chat
              </button>
            </header>

            <div className="ims-messages">
              {activeConversation.isLoading && (
                <div className="ims-loading">Loading conversation…</div>
              )}
              {activeConversation.error && (
                <div className="ims-error">{activeConversation.error}</div>
              )}
              {activeMessages.map(message => (
                <div
                  key={message.id}
                  className={`ims-message ${
                    message.fromUserId === currentUser.id ? 'ims-outgoing' : 'ims-incoming'
                  }`}
                >
                  <div className="ims-message-body">
                    <p>{message.message}</p>
                    <span className="ims-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {message.pending && <span className="ims-status">Sending…</span>}
                  {message.failed && (
                    <span className="ims-status ims-failed">
                      Failed
                      <button onClick={() => retryMessage(activeConversation.contact.userId, message)}>
                        Retry
                      </button>
                    </span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="ims-composer"
              onSubmit={event => {
                event.preventDefault()
                sendMessage(activeConversation.contact.userId)
              }}
            >
              <textarea
                value={drafts[activeConversation.contact.userId] || ''}
                onChange={event => handleDraftChange(activeConversation.contact.userId, event.target.value)}
                onKeyDown={event => handleComposerKeyDown(event, activeConversation.contact.userId)}
                placeholder={`Message ${activeConversation.contact.userName}`}
                rows={2}
              />
              <button
                type="submit"
                className="ims-send"
                disabled={!drafts[activeConversation.contact.userId]?.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Toast Notifications */}
      <div className="ims-toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="ims-toast"
            onClick={() => {
              setActiveConversationId(toast.userId);
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
          >
            <div className="ims-toast-header">💬 {toast.userName}</div>
            <div className="ims-toast-body">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
