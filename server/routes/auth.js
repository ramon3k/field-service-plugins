// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { tenantMiddleware, auditLog } = require('../middleware/tenantMiddleware');

const router = express.Router();

// NOTE: No tenant enumeration endpoint for security reasons
// Companies must know their tenant code to access the system

// Tenant-aware login
router.post('/login', tenantMiddleware, async (req, res) => {
    const { username, password, tenantCode } = req.body;
    
    if (!username || !password || !tenantCode) {
        return res.status(400).json({ 
            error: 'Username, password, and tenant code are required',
            code: 'MISSING_CREDENTIALS'
        });
    }
    
    try {
        // Query tenant's user database
        const request = new sql.Request();
        request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        request.input('Username', sql.NVarChar(100), username);
        
        const result = await request.query(`
            SELECT 
                UserID, Username, Email, PasswordHash, FullName,
                IsActive, IsSystemAdmin, IsTenantAdmin, LastLoginAt
            FROM TenantUsers 
            WHERE TenantID = @TenantID AND Username = @Username AND IsActive = 1
        `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        const user = result.recordset[0];
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        // Update last login time
        const updateRequest = new sql.Request();
        updateRequest.input('UserID', sql.UniqueIdentifier, user.UserID);
        updateRequest.input('LastLoginAt', sql.DateTime2, new Date());
        
        await updateRequest.query(`
            UPDATE TenantUsers 
            SET LastLoginAt = @LastLoginAt 
            WHERE UserID = @UserID
        `);
        
        // Generate JWT token
        const tokenPayload = {
            userId: user.UserID,
            username: user.Username,
            email: user.Email,
            fullName: user.FullName,
            tenantId: req.tenant.TenantID,
            tenantCode: req.tenant.TenantCode,
            companyName: req.tenant.CompanyName,
            isSystemAdmin: user.IsSystemAdmin,
            isTenantAdmin: user.IsTenantAdmin,
            subscriptionTier: req.tenant.SubscriptionTier
        };
        
        const token = jwt.sign(
            tokenPayload, 
            process.env.JWT_SECRET || 'your-jwt-secret',
            { expiresIn: '24h' }
        );
        
        // Return user info and token
        res.json({
            token,
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email,
                fullName: user.FullName,
                isSystemAdmin: user.IsSystemAdmin,
                isTenantAdmin: user.IsTenantAdmin,
                lastLoginAt: user.LastLoginAt
            },
            tenant: {
                id: req.tenant.TenantID,
                code: req.tenant.TenantCode,
                name: req.tenant.CompanyName,
                tier: req.tenant.SubscriptionTier,
                maxUsers: req.tenant.MaxUsers
            }
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Login failed',
            code: 'LOGIN_ERROR'
        });
    }
});

// Verify token and get current user info
router.get('/me', tenantMiddleware, async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_MISSING'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Verify token belongs to current tenant
        if (decoded.tenantId !== req.tenant.TenantID) {
            return res.status(403).json({ 
                error: 'Token does not match tenant context',
                code: 'TENANT_TOKEN_MISMATCH'
            });
        }
        
        // Get fresh user data
        const request = new sql.Request();
        request.input('UserID', sql.UniqueIdentifier, decoded.userId);
        request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        const result = await request.query(`
            SELECT 
                UserID, Username, Email, FullName,
                IsActive, IsSystemAdmin, IsTenantAdmin, LastLoginAt
            FROM TenantUsers 
            WHERE UserID = @UserID AND TenantID = @TenantID AND IsActive = 1
        `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                error: 'User not found or inactive',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = result.recordset[0];
        
        res.json({
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email,
                fullName: user.FullName,
                isSystemAdmin: user.IsSystemAdmin,
                isTenantAdmin: user.IsTenantAdmin,
                lastLoginAt: user.LastLoginAt
            },
            tenant: {
                id: req.tenant.TenantID,
                code: req.tenant.TenantCode,
                name: req.tenant.CompanyName,
                tier: req.tenant.SubscriptionTier,
                maxUsers: req.tenant.MaxUsers
            }
        });
        
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                error: 'Invalid token',
                code: 'TOKEN_INVALID'
            });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        console.error('Token verification error:', err);
        res.status(500).json({ 
            error: 'Token verification failed',
            code: 'TOKEN_VERIFICATION_ERROR'
        });
    }
});

// Change password
router.post('/change-password', tenantMiddleware, async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_MISSING'
        });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
            error: 'Current password and new password are required',
            code: 'MISSING_PASSWORDS'
        });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ 
            error: 'New password must be at least 8 characters long',
            code: 'PASSWORD_TOO_SHORT'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Get current user
        const request = new sql.Request();
        request.input('UserID', sql.UniqueIdentifier, decoded.userId);
        request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        const result = await request.query(`
            SELECT PasswordHash
            FROM TenantUsers 
            WHERE UserID = @UserID AND TenantID = @TenantID AND IsActive = 1
        `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = result.recordset[0];
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.PasswordHash);
        
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }
        
        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        const updateRequest = new sql.Request();
        updateRequest.input('UserID', sql.UniqueIdentifier, decoded.userId);
        updateRequest.input('PasswordHash', sql.NVarChar(255), newPasswordHash);
        updateRequest.input('PasswordChangedAt', sql.DateTime2, new Date());
        
        await updateRequest.query(`
            UPDATE TenantUsers 
            SET PasswordHash = @PasswordHash, PasswordChangedAt = @PasswordChangedAt
            WHERE UserID = @UserID
        `);
        
        res.json({ 
            message: 'Password changed successfully',
            passwordChangedAt: new Date()
        });
        
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ 
            error: 'Failed to change password',
            code: 'PASSWORD_CHANGE_ERROR'
        });
    }
});

// Admin reset password (for admins/coordinators to reset other users' passwords)
router.post('/reset-password', tenantMiddleware, async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_MISSING'
        });
    }
    
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
        return res.status(400).json({ 
            error: 'User ID and new password are required',
            code: 'MISSING_PARAMETERS'
        });
    }
    
    if (newPassword.length < 8) {
        return res.status(400).json({ 
            error: 'New password must be at least 8 characters long',
            code: 'PASSWORD_TOO_SHORT'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        
        // Get current user (the one making the request)
        const request = new sql.Request();
        request.input('CurrentUserID', sql.UniqueIdentifier, decoded.userId);
        request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        const currentUserResult = await request.query(`
            SELECT IsSystemAdmin, IsTenantAdmin
            FROM TenantUsers 
            WHERE UserID = @CurrentUserID AND TenantID = @TenantID AND IsActive = 1
        `);
        
        if (currentUserResult.recordset.length === 0) {
            return res.status(401).json({ 
                error: 'Current user not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const currentUser = currentUserResult.recordset[0];
        
        // Check if current user has permission to reset passwords
        // Allow system admins, tenant admins, or if user is changing their own password
        const canResetPassword = currentUser.IsSystemAdmin || 
                                currentUser.IsTenantAdmin || 
                                decoded.userId === userId;
        
        if (!canResetPassword) {
            return res.status(403).json({ 
                error: 'Insufficient permissions to reset password',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        
        // Verify target user exists
        const targetUserRequest = new sql.Request();
        targetUserRequest.input('TargetUserID', sql.UniqueIdentifier, userId);
        targetUserRequest.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        const targetUserResult = await targetUserRequest.query(`
            SELECT UserID, Username
            FROM TenantUsers 
            WHERE UserID = @TargetUserID AND TenantID = @TenantID AND IsActive = 1
        `);
        
        if (targetUserResult.recordset.length === 0) {
            return res.status(404).json({ 
                error: 'Target user not found',
                code: 'TARGET_USER_NOT_FOUND'
            });
        }
        
        const targetUser = targetUserResult.recordset[0];
        
        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        const updateRequest = new sql.Request();
        updateRequest.input('TargetUserID', sql.UniqueIdentifier, userId);
        updateRequest.input('PasswordHash', sql.NVarChar(255), newPasswordHash);
        updateRequest.input('PasswordChangedAt', sql.DateTime2, new Date());
        updateRequest.input('PasswordResetBy', sql.UniqueIdentifier, decoded.userId);
        
        await updateRequest.query(`
            UPDATE TenantUsers 
            SET PasswordHash = @PasswordHash, 
                PasswordChangedAt = @PasswordChangedAt,
                PasswordResetBy = @PasswordResetBy
            WHERE UserID = @TargetUserID
        `);
        
        res.json({ 
            message: 'Password reset successfully',
            targetUser: targetUser.Username,
            passwordChangedAt: new Date()
        });
        
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ 
            error: 'Failed to reset password',
            code: 'PASSWORD_RESET_ERROR'
        });
    }
});

// Logout (mainly for audit logging)
router.post('/logout', tenantMiddleware, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Get tenant info (for dashboard display)
router.get('/tenant-info', tenantMiddleware, async (req, res) => {
    try {
        const request = new sql.Request();
        request.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        // Get tenant summary with user count and features
        const result = await request.query(`
            SELECT 
                t.TenantCode,
                t.CompanyName,
                t.SubscriptionTier,
                t.MaxUsers,
                t.MonthlyPrice,
                t.Status,
                t.CreatedAt,
                t.SupportLevel,
                t.SlaUptimePercent,
                COUNT(tu.UserID) as CurrentUserCount,
                td.IsHealthy as DatabaseHealthy,
                td.LastHealthCheck,
                td.DatabaseSizeMB
            FROM Tenants t
            LEFT JOIN TenantUsers tu ON t.TenantID = tu.TenantID AND tu.IsActive = 1
            LEFT JOIN TenantDatabases td ON t.TenantID = td.TenantID
            WHERE t.TenantID = @TenantID
            GROUP BY t.TenantCode, t.CompanyName, t.SubscriptionTier, t.MaxUsers, 
                     t.MonthlyPrice, t.Status, t.CreatedAt, t.SupportLevel, 
                     t.SlaUptimePercent, td.IsHealthy, td.LastHealthCheck, td.DatabaseSizeMB
        `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                error: 'Tenant not found',
                code: 'TENANT_NOT_FOUND'
            });
        }
        
        const tenantInfo = result.recordset[0];
        
        // Get enabled features
        const featuresRequest = new sql.Request();
        featuresRequest.input('TenantID', sql.UniqueIdentifier, req.tenant.TenantID);
        
        const featuresResult = await featuresRequest.query(`
            SELECT FeatureName, IsEnabled, ConfigurationData
            FROM TenantFeatures
            WHERE TenantID = @TenantID
        `);
        
        const features = featuresResult.recordset.reduce((acc, feature) => {
            acc[feature.FeatureName] = {
                enabled: feature.IsEnabled,
                config: feature.ConfigurationData ? JSON.parse(feature.ConfigurationData) : null
            };
            return acc;
        }, {});
        
        res.json({
            tenant: {
                code: tenantInfo.TenantCode,
                name: tenantInfo.CompanyName,
                tier: tenantInfo.SubscriptionTier,
                maxUsers: tenantInfo.MaxUsers,
                currentUsers: tenantInfo.CurrentUserCount,
                monthlyPrice: tenantInfo.MonthlyPrice,
                status: tenantInfo.Status,
                createdAt: tenantInfo.CreatedAt,
                supportLevel: tenantInfo.SupportLevel,
                slaUptime: tenantInfo.SlaUptimePercent
            },
            database: {
                healthy: tenantInfo.DatabaseHealthy,
                lastHealthCheck: tenantInfo.LastHealthCheck,
                sizeMB: tenantInfo.DatabaseSizeMB
            },
            features
        });
        
    } catch (err) {
        console.error('Get tenant info error:', err);
        res.status(500).json({ 
            error: 'Failed to get tenant information',
            code: 'TENANT_INFO_ERROR'
        });
    }
});

module.exports = router;