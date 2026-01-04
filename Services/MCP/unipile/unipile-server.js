// unipile-server.js - Unipile Hosted Auth Integration Service
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import axios from 'axios';

config();

const app = express();
const PORT = process.env.PORT || 9500;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Unipile configuration
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;
const UNIPILE_BASE_URL = process.env.UNIPILE_BASE_URL;
const UNIPILE_DSN = process.env.UNIPILE_DSN;
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || `http://localhost:${PORT}`;

// In-memory storage for connected accounts (for demo - use DB in production)
const connectedAccounts = new Map();

// Helper to get Unipile headers
const getHeaders = () => ({
    'X-API-KEY': UNIPILE_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
});

/**
 * GET / - API Documentation
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'Unipile Integration Service',
        version: '1.0.0',
        description: 'Dynamic account connection via Unipile Hosted Auth',
        endpoints: {
            generateAuthLink: 'POST /api/auth/link',
            callback: 'POST /api/auth/callback',
            getAccounts: 'GET /api/accounts',
            getAccount: 'GET /api/accounts/:accountId',
            testConnection: 'GET /api/test'
        },
        supportedProviders: ['LINKEDIN', 'WHATSAPP', 'GOOGLE', 'OUTLOOK', 'IMAP', 'INSTAGRAM', 'MESSENGER', 'TELEGRAM']
    });
});

/**
 * GET /api/test - Test Unipile API connection
 */
app.get('/api/test', async (req, res) => {
    try {
        const response = await axios.get(`${UNIPILE_BASE_URL}/api/v1/accounts`, {
            headers: getHeaders()
        });

        res.json({
            success: true,
            message: 'Unipile API connection successful',
            accountCount: response.data.items?.length || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Unipile connection test failed:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Unipile API connection failed',
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/auth/link - Generate Hosted Auth Link
 * Body: { providers: ["LINKEDIN", "WHATSAPP"], userId: "user123" }
 */
app.post('/api/auth/link', async (req, res) => {
    try {
        const { providers = ['*'], userId = 'default_user', successUrl, failureUrl } = req.body;

        // Generate expiration time (1 hour from now)
        const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const payload = {
            type: 'create',
            providers: Array.isArray(providers) ? providers : [providers],
            api_url: UNIPILE_BASE_URL,
            expiresOn: expiresOn,
            notify_url: `${CALLBACK_BASE_URL}/api/auth/callback`,
            name: userId,
            success_redirect_url: successUrl || `${CALLBACK_BASE_URL}/api/auth/success`,
            failure_redirect_url: failureUrl || `${CALLBACK_BASE_URL}/api/auth/failure`
        };

        console.log('📤 Generating Hosted Auth Link:', JSON.stringify(payload, null, 2));

        const response = await axios.post(
            `${UNIPILE_BASE_URL}/api/v1/hosted/accounts/link`,
            payload,
            { headers: getHeaders() }
        );

        console.log('✅ Hosted Auth Link generated:', response.data);

        res.json({
            success: true,
            message: 'Hosted Auth link generated successfully',
            data: {
                authUrl: response.data.url,
                expiresOn: expiresOn,
                userId: userId,
                providers: providers
            },
            instructions: [
                'Redirect the user to the authUrl',
                'User will authenticate with the selected provider',
                'After success, callback will be received at notify_url',
                'Account info will be stored and returned'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to generate auth link:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Hosted Auth link',
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/auth/callback - Receive callback from Unipile after account connection
 */
app.post('/api/auth/callback', async (req, res) => {
    try {
        console.log('📥 Received Unipile callback:', JSON.stringify(req.body, null, 2));

        const { status, account_id, name } = req.body;

        if (status === 'CREATION_SUCCESS' || status === 'RECONNECTED') {
            // Fetch account details
            const accountDetails = await axios.get(
                `${UNIPILE_BASE_URL}/api/v1/accounts/${account_id}`,
                { headers: getHeaders() }
            );

            const accountInfo = {
                accountId: account_id,
                userId: name,
                status: status,
                provider: accountDetails.data.type || accountDetails.data.provider,
                email: accountDetails.data.email,
                name: accountDetails.data.name,
                connectedAt: new Date().toISOString(),
                details: accountDetails.data
            };

            // Store in memory (use DB in production)
            connectedAccounts.set(account_id, accountInfo);

            console.log('✅ Account connected successfully:', accountInfo);

            res.json({
                success: true,
                message: 'Account connected successfully',
                data: accountInfo
            });
        } else {
            console.log('⚠️ Account connection status:', status);
            res.json({
                success: false,
                message: `Account connection status: ${status}`,
                data: req.body
            });
        }
    } catch (error) {
        console.error('❌ Callback processing error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to process callback',
            error: error.message
        });
    }
});

/**
 * GET /api/auth/success - Success redirect page
 */
app.get('/api/auth/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connection Successful</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                h1 { color: #22c55e; margin-bottom: 16px; }
                p { color: #666; margin-bottom: 24px; }
                .icon { font-size: 64px; margin-bottom: 16px; }
                button { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
                button:hover { background: #5a67d8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">✅</div>
                <h1>Account Connected!</h1>
                <p>Your account has been successfully connected to ChatMate.</p>
                <p>You can close this window and return to the application.</p>
                <button onclick="window.close()">Close Window</button>
                <script>
                    // Send message to parent window if opened as popup
                    if (window.opener) {
                        window.opener.postMessage({ type: 'UNIPILE_AUTH_SUCCESS' }, '*');
                    }
                </script>
            </div>
        </body>
        </html>
    `);
});

/**
 * GET /api/auth/failure - Failure redirect page
 */
app.get('/api/auth/failure', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connection Failed</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                h1 { color: #ef4444; margin-bottom: 16px; }
                p { color: #666; margin-bottom: 24px; }
                .icon { font-size: 64px; margin-bottom: 16px; }
                button { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
                button:hover { background: #5a67d8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">❌</div>
                <h1>Connection Failed</h1>
                <p>There was an error connecting your account.</p>
                <p>Please try again or contact support.</p>
                <button onclick="window.close()">Close Window</button>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'UNIPILE_AUTH_FAILURE' }, '*');
                    }
                </script>
            </div>
        </body>
        </html>
    `);
});

/**
 * GET /api/accounts - Get all connected accounts
 */
app.get('/api/accounts', async (req, res) => {
    try {
        // Fetch all accounts from Unipile
        const response = await axios.get(`${UNIPILE_BASE_URL}/api/v1/accounts`, {
            headers: getHeaders()
        });

        const accounts = response.data.items || [];

        res.json({
            success: true,
            message: 'Accounts retrieved successfully',
            data: {
                accounts: accounts.map(acc => ({
                    accountId: acc.id,
                    type: acc.type,
                    provider: acc.provider,
                    name: acc.name,
                    email: acc.email,
                    status: acc.status,
                    createdAt: acc.created_at
                })),
                total: accounts.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to get accounts:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve accounts',
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/accounts/:accountId - Get specific account details
 */
app.get('/api/accounts/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        const response = await axios.get(`${UNIPILE_BASE_URL}/api/v1/accounts/${accountId}`, {
            headers: getHeaders()
        });

        res.json({
            success: true,
            message: 'Account details retrieved',
            data: {
                accountId: response.data.id,
                type: response.data.type,
                provider: response.data.provider,
                name: response.data.name,
                email: response.data.email,
                status: response.data.status,
                createdAt: response.data.created_at,
                raw: response.data
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to get account:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve account details',
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * DELETE /api/accounts/:accountId - Delete/disconnect an account
 */
app.delete('/api/accounts/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        await axios.delete(`${UNIPILE_BASE_URL}/api/v1/accounts/${accountId}`, {
            headers: getHeaders()
        });

        // Remove from local storage
        connectedAccounts.delete(accountId);

        res.json({
            success: true,
            message: 'Account disconnected successfully',
            accountId: accountId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to delete account:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect account',
            error: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log('🚀 UNIPILE INTEGRATION SERVICE STARTED');
    console.log('🚀 ========================================');
    console.log(`🔗 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/`);
    console.log(`🔑 Unipile API: ${UNIPILE_BASE_URL}`);
    console.log('🚀 ========================================');
    console.log('🎯 Generate Auth Link: POST /api/auth/link');
    console.log('📋 Get Accounts: GET /api/accounts');
    console.log('🚀 ========================================');
});
