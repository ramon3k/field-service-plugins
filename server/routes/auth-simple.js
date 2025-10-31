// server/routes/auth-simple.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Simple health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Authentication service is running'
    });
});

// Simple login endpoint for testing
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }
        
        // For testing purposes, accept admin/admin123
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { userId: 'admin', username: 'admin' },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    userId: 'admin',
                    username: 'admin',
                    fullName: 'System Administrator',
                    isAdmin: true
                }
            });
        }
        
        return res.status(401).json({ 
            error: 'Invalid username or password',
            code: 'INVALID_CREDENTIALS'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Simple logout endpoint
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// Simple user info endpoint
router.get('/me', (req, res) => {
    // For testing, return mock admin user
    res.json({
        userId: 'admin',
        username: 'admin',
        fullName: 'System Administrator',
        email: 'admin@company.com',
        isAdmin: true
    });
});

module.exports = router;