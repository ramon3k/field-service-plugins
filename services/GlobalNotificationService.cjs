/**
 * Global Notification Service
 * Built-in service for cross-tab browser notifications
 * Plugins can use this service to send notifications to users
 */

const WebSocket = require('ws');

class GlobalNotificationService {
  constructor() {
    this.wss = null;
    this.activeConnections = new Map(); // userId -> { ws, companyCode, userName, role }
    this.port = 8081; // Different from messenger plugin (8080)
  }

  /**
   * Start the global notification WebSocket server
   */
  start() {
    if (this.wss) {
      console.log('⚠️ Global notification server already running');
      return;
    }

    try {
      this.wss = new WebSocket.Server({ port: this.port });
      
      this.wss.on('connection', (ws, req) => {
        console.log('🔔 New global notification connection');
        
        // Keep connection alive with ping/pong
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });
        
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('🔔 Global notification message error:', error);
          }
        });
        
        ws.on('close', () => {
          this.removeConnection(ws);
        });
        
        ws.on('error', (error) => {
          console.error('🔔 Global notification connection error:', error);
          this.removeConnection(ws);
        });
      });
      
      // Ping all connections every 30 seconds to keep them alive
      this.pingInterval = setInterval(() => {
        this.wss.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            console.log('🔔 Terminating inactive WebSocket connection');
            return ws.terminate();
          }
          
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);
      
      console.log(`✅ Global Notification Service started on port ${this.port}`);
    } catch (error) {
      console.error('❌ Failed to start Global Notification Service:', error);
    }
  }

  /**
   * Stop the global notification service
   */
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.activeConnections.clear();
      console.log('✅ Global Notification Service stopped');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, data) {
    switch (data.type) {
      case 'register':
        this.registerUser(ws, data);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      default:
        console.warn('🔔 Unknown message type:', data.type);
    }
  }

  /**
   * Register a user connection
   */
  registerUser(ws, data) {
    const { userId, userName, role, companyCode } = data;
    
    if (!userId || !companyCode) {
      console.warn('🔔 Invalid registration data:', data);
      return;
    }

    // Check if there's already a connection for this user
    const existingConnection = this.activeConnections.get(userId);
    if (existingConnection && existingConnection.ws !== ws) {
      console.log(`🔔 Replacing existing connection for ${userName} (${userId})`);
      // Close the old connection without triggering reconnect attempts
      try {
        existingConnection.ws.close(1000, 'Replaced by new connection');
      } catch (error) {
        // Ignore errors closing old connection
      }
    }

    // Store new connection
    this.activeConnections.set(userId, {
      ws,
      userName: userName || 'Unknown User',
      role: role || 'User',
      companyCode,
      connectedAt: new Date()
    });

    console.log(`🔔 User registered: ${userName} (${userId}) - ${companyCode}`);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'registered',
      userId,
      message: 'Connected to global notifications'
    }));
  }

  /**
   * Remove connection by WebSocket
   */
  removeConnection(ws) {
    for (const [userId, conn] of this.activeConnections.entries()) {
      if (conn.ws === ws) {
        console.log(`🔔 User disconnected: ${conn.userName} (${userId})`);
        this.activeConnections.delete(userId);
        break;
      }
    }
  }

  /**
   * Remove connection by userId
   */
  removeUserConnection(userId) {
    const conn = this.activeConnections.get(userId);
    if (conn) {
      try {
        conn.ws.close();
      } catch (error) {
        // Connection might already be closed
      }
      this.activeConnections.delete(userId);
    }
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(targetUserId, notification) {
    const connection = this.activeConnections.get(targetUserId);
    
    if (!connection) {
      console.log(`🔔 User ${targetUserId} not connected for notification`);
      return false;
    }

    try {
      connection.ws.send(JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🔔 Notification sent to ${connection.userName}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error(`🔔 Failed to send notification to ${targetUserId}:`, error);
      this.removeUserConnection(targetUserId);
      return false;
    }
  }

  /**
   * Send notification to all users in a company
   */
  sendNotificationToCompany(companyCode, notification) {
    let sentCount = 0;
    
    for (const [userId, connection] of this.activeConnections.entries()) {
      if (connection.companyCode === companyCode) {
        if (this.sendNotificationToUser(userId, notification)) {
          sentCount++;
        }
      }
    }
    
    console.log(`🔔 Notification sent to ${sentCount} users in ${companyCode}: ${notification.title}`);
    return sentCount;
  }

  /**
   * Send notification to specific role within a company
   */
  sendNotificationToRole(companyCode, role, notification) {
    let sentCount = 0;
    
    for (const [userId, connection] of this.activeConnections.entries()) {
      if (connection.companyCode === companyCode && connection.role === role) {
        if (this.sendNotificationToUser(userId, notification)) {
          sentCount++;
        }
      }
    }
    
    console.log(`🔔 Notification sent to ${sentCount} ${role}s in ${companyCode}: ${notification.title}`);
    return sentCount;
  }

  /**
   * Get active users for a company
   */
  getActiveUsers(companyCode) {
    const users = [];
    
    for (const [userId, connection] of this.activeConnections.entries()) {
      if (connection.companyCode === companyCode) {
        users.push({
          userId,
          userName: connection.userName,
          role: connection.role,
          connectedAt: connection.connectedAt
        });
      }
    }
    
    return users;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalConnections: this.activeConnections.size,
      byCompany: {},
      byRole: {}
    };

    for (const [userId, connection] of this.activeConnections.entries()) {
      // Count by company
      stats.byCompany[connection.companyCode] = (stats.byCompany[connection.companyCode] || 0) + 1;
      
      // Count by role
      stats.byRole[connection.role] = (stats.byRole[connection.role] || 0) + 1;
    }

    return stats;
  }
}

// Create singleton instance
const globalNotificationService = new GlobalNotificationService();

module.exports = globalNotificationService;