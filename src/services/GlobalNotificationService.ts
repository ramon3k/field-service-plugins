/**
 * Global Notification Service
 * Provides browser notifications for messages when user is NOT on Messenger tab
 */

class GlobalNotificationService {
  private static instance: GlobalNotificationService | null = null
  private permissionGranted: boolean = false

  private constructor() {
    this.checkNotificationPermission()
  }

  public static getInstance(): GlobalNotificationService {
    if (!GlobalNotificationService.instance) {
      GlobalNotificationService.instance = new GlobalNotificationService()
    }
    return GlobalNotificationService.instance
  }

  private async checkNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support notifications')
      return
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true
      console.log('✅ Notification permission already granted')
    } else if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...')
      try {
        const permission = await Notification.requestPermission()
        this.permissionGranted = permission === 'granted'
        console.log('🔔 Permission response:', permission)
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error)
      }
    } else {
      console.warn('⚠️ Notification permission denied')
    }
  }

  public async showNotification(
    title: string, 
    message: string, 
    icon?: string,
    onClickCallback?: () => void
  ): Promise<void> {
    if (!this.permissionGranted) {
      console.log('⚠️ Cannot show notification - permission not granted')
      return
    }

    console.log('✅ Creating notification:', title, message.substring(0, 50))
    
    try {
      const notification = new Notification(title, {
        body: message.substring(0, 100),
        icon: icon || '/favicon.ico',
        tag: 'global-notification',
        requireInteraction: false
      })

      // Close notification after 5 seconds
      setTimeout(() => notification.close(), 5000)

      // Click callback
      notification.onclick = () => {
        if (onClickCallback) {
          onClickCallback()
        }
        notification.close()
      }
    } catch (error) {
      console.error('❌ Error creating notification:', error)
    }
  }

  public isPermissionGranted(): boolean {
    return this.permissionGranted
  }

  public async requestPermission(): Promise<boolean> {
    await this.checkNotificationPermission()
    return this.permissionGranted
  }
}

export default GlobalNotificationService