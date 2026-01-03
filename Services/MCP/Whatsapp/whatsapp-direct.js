// whatsapp-direct.js - Direct WhatsApp Web Integration
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let isReady = false;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code for authentication
client.on('qr', (qr) => {
    console.log('📱 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('\n👆 Open WhatsApp > Settings > Linked Devices > Link a Device');
});

// Client ready
client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
    isReady = true;
});

// Handle authentication
client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated successfully!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// Initialize client
client.initialize();

// ============= API ENDPOINTS =============

/**
 * GET / - Status check
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'WhatsApp Direct Integration',
        status: isReady ? 'ready' : 'initializing',
        message: isReady ? 'WhatsApp is connected and ready' : 'Waiting for QR code scan'
    });
});

/**
 * POST /api/whatsapp/messages/send-to-number - Send message to phone number
 */
app.post('/api/whatsapp/messages/send-to-number', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client not ready. Please scan QR code first.'
            });
        }

        const { phoneNumber, content } = req.body;

        if (!phoneNumber || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phoneNumber, content'
            });
        }

        // Format phone number (remove + and spaces)
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
        const chatId = `${formattedNumber}@c.us`;

        console.log(`📤 Sending message to ${phoneNumber}...`);

        // Send message
        const message = await client.sendMessage(chatId, content);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: message.id.id,
                phoneNumber: phoneNumber,
                sentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
});

/**
 * POST /api/whatsapp/groups/send - Send message to group
 */
app.post('/api/whatsapp/groups/send', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client not ready. Please scan QR code first.'
            });
        }

        const { groupName, content } = req.body;

        if (!groupName || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: groupName, content'
            });
        }

        // Get all chats
        const chats = await client.getChats();
        
        // Find the group by name
        const group = chats.find(chat => 
            chat.isGroup && chat.name.toLowerCase().includes(groupName.toLowerCase())
        );

        if (!group) {
            return res.status(404).json({
                success: false,
                message: `Group "${groupName}" not found`,
                availableGroups: chats
                    .filter(chat => chat.isGroup)
                    .map(chat => chat.name)
                    .slice(0, 10)
            });
        }

        console.log(`📤 Sending message to group: ${group.name}`);

        // Send message to group
        const message = await group.sendMessage(content);

        res.json({
            success: true,
            message: 'Message sent to group successfully',
            data: {
                messageId: message.id.id,
                groupName: group.name,
                sentAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error sending to group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message to group',
            error: error.message
        });
    }
});

/**
 * POST /api/whatsapp/groups/messages/fetch - Fetch messages from group
 */
app.post('/api/whatsapp/groups/messages/fetch', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client not ready. Please scan QR code first.'
            });
        }

        const { groupName, limit = 50 } = req.body;

        if (!groupName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: groupName'
            });
        }

        // Get all chats
        const chats = await client.getChats();
        
        // Find the group
        const group = chats.find(chat => 
            chat.isGroup && chat.name.toLowerCase().includes(groupName.toLowerCase())
        );

        if (!group) {
            return res.status(404).json({
                success: false,
                message: `Group "${groupName}" not found`
            });
        }

        console.log(`📥 Fetching messages from group: ${group.name}`);

        // Fetch messages
        const messages = await group.fetchMessages({ limit: parseInt(limit) });

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg.id.id,
            content: msg.body,
            senderName: msg._data.notifyName || 'Unknown',
            senderPhone: msg.from,
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            isFromMe: msg.fromMe,
            hasMedia: msg.hasMedia
        }));

        // Calculate summary
        const uniqueSenders = [...new Set(formattedMessages.map(m => m.senderPhone))].length;
        const mediaMessages = formattedMessages.filter(m => m.hasMedia).length;

        res.json({
            success: true,
            message: `Fetched ${formattedMessages.length} messages from ${group.name}`,
            data: {
                groupInfo: {
                    name: group.name,
                    id: group.id._serialized
                },
                messages: formattedMessages,
                pagination: {
                    limit: parseInt(limit),
                    count: formattedMessages.length
                }
            },
            summary: {
                totalMessages: formattedMessages.length,
                uniqueSenders: uniqueSenders,
                mediaMessages: mediaMessages
            }
        });

    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

/**
 * GET /api/whatsapp/groups - Get all groups
 */
app.get('/api/whatsapp/groups', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client not ready'
            });
        }

        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(chat => ({
                id: chat.id._serialized,
                name: chat.name,
                participantCount: chat.participants?.length || 0
            }));

        res.json({
            success: true,
            data: groups,
            total: groups.length
        });

    } catch (error) {
        console.error('❌ Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups',
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`\n🚀 WhatsApp Direct Service running on http://localhost:${PORT}`);
    console.log(`📱 Waiting for WhatsApp authentication...\n`);
});
