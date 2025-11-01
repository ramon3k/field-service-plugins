/**
 * Global Notification API Routes
 * Allows plugins to send notifications through the built-in service
 */

const express = require('express');
const router = express.Router();
const globalNotificationService = require('./GlobalNotificationService.cjs');

/**
 * Send notification to a specific user
 * POST /api/notifications/user
 * Body: { targetUserId, title, message, icon?, url?, priority? }
 */
router.post('/user', async (req, res) => {
  try {
    const { targetUserId, title, message, icon, url, priority } = req.body;
    const companyCode = req.headers['x-company-code'];
    const fromUserId = req.headers['x-user-id'];
    const fromUserName = req.headers['x-user-name'] || 'System';

    // Validation
    if (!targetUserId || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: targetUserId, title, message'
      });
    }

    // Create notification object (preserve optional custom data payload)
    const notification = {
      title,
      message,
      icon: icon || '🔔',
      url: url || null,
      priority: priority || 'normal',
      fromUserId,
      fromUserName,
      companyCode,
      ...(req.body.data ? { data: req.body.data } : {})
    };

    // Send notification
    const sent = globalNotificationService.sendNotificationToUser(targetUserId, notification);

    res.json({
      success: true,
      sent,
      notification
    });

  } catch (error) {
    console.error('❌ Send notification to user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to all users in company
 * POST /api/notifications/company
 * Body: { title, message, icon?, url?, priority? }
 */
router.post('/company', async (req, res) => {
  try {
    const { title, message, icon, url, priority } = req.body;
    const companyCode = req.headers['x-company-code'];
    const fromUserId = req.headers['x-user-id'];
    const fromUserName = req.headers['x-user-name'] || 'System';

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: title, message'
      });
    }

    if (!companyCode) {
      return res.status(400).json({
        error: 'Missing company code header'
      });
    }

    // Create notification object (preserve optional custom data payload)
    const notification = {
      title,
      message,
      icon: icon || '📢',
      url: url || null,
      priority: priority || 'normal',
      fromUserId,
      fromUserName,
      companyCode,
      ...(req.body.data ? { data: req.body.data } : {})
    };

    // Send notification
    const sentCount = globalNotificationService.sendNotificationToCompany(companyCode, notification);

    res.json({
      success: true,
      sentCount,
      notification
    });

  } catch (error) {
    console.error('❌ Send notification to company error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send notification to specific role
 * POST /api/notifications/role
 * Body: { role, title, message, icon?, url?, priority? }
 */
router.post('/role', async (req, res) => {
  try {
    const { role, title, message, icon, url, priority } = req.body;
    const companyCode = req.headers['x-company-code'];
    const fromUserId = req.headers['x-user-id'];
    const fromUserName = req.headers['x-user-name'] || 'System';

    // Validation
    if (!role || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: role, title, message'
      });
    }

    if (!companyCode) {
      return res.status(400).json({
        error: 'Missing company code header'
      });
    }

    // Create notification object (preserve optional custom data payload)
    const notification = {
      title,
      message,
      icon: icon || '👥',
      url: url || null,
      priority: priority || 'normal',
      fromUserId,
      fromUserName,
      companyCode,
      ...(req.body.data ? { data: req.body.data } : {})
    };

    // Send notification
    const sentCount = globalNotificationService.sendNotificationToRole(companyCode, role, notification);

    res.json({
      success: true,
      sentCount,
      role,
      notification
    });

  } catch (error) {
    console.error('❌ Send notification to role error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active users for current company
 * GET /api/notifications/active-users
 */
router.get('/active-users', async (req, res) => {
  try {
    const companyCode = req.headers['x-company-code'];

    if (!companyCode) {
      return res.status(400).json({
        error: 'Missing company code header'
      });
    }

    const users = globalNotificationService.getActiveUsers(companyCode);

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Get active users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get service statistics (admin only)
 * GET /api/notifications/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    // Only system admins can view stats
    if (userRole !== 'SystemAdmin') {
      return res.status(403).json({
        error: 'Access denied. SystemAdmin role required.'
      });
    }

    const stats = globalNotificationService.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;