// twitter-server.js - Twitter/X AI-Enhanced Server
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import TwitterService from './twitter-service.js';
import AIService from './ai-service.js';

config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize services
let twitterService;
let aiService;

try {
    twitterService = new TwitterService();
    aiService = new AIService();
} catch (error) {
    console.error('❌ Failed to initialize services:', error.message);
    process.exit(1);
}

/**
 * GET / - API Documentation
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'Twitter/X AI-Enhanced Server',
        version: '1.0.0',
        endpoints: {
            // Twitter Operations
            testConnection: 'GET /api/twitter/test',
            getMe: 'GET /api/twitter/me',
            getUserTweets: 'GET /api/twitter/tweets',
            postTweet: 'POST /api/twitter/post',
            
            // AI Features
            generateTweet: 'POST /api/ai/generate',
            enhanceTweet: 'POST /api/ai/enhance',
            generateThread: 'POST /api/ai/thread',
            testAI: 'GET /api/ai/test'
        },
        quickStart: {
            step1: 'GET http://localhost:5000/api/twitter/test',
            step2: 'POST http://localhost:5000/api/ai/generate',
            step3: 'POST http://localhost:5000/api/twitter/post'
        }
    });
});

// ============= TWITTER API ENDPOINTS =============

/**
 * GET /api/twitter/test - Test Twitter API connection
 */
app.get('/api/twitter/test', async (req, res) => {
    try {
        const result = await twitterService.testConnection();
        
        res.json({
            success: true,
            message: 'Twitter API connection successful',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Twitter API connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/twitter/me - Get authenticated user info
 */
app.get('/api/twitter/me', async (req, res) => {
    try {
        const result = await twitterService.getMe();
        
        res.json({
            success: true,
            data: result.user,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/twitter/tweets - Get user's recent tweets
 */
app.get('/api/twitter/tweets', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await twitterService.getUserTweets(parseInt(limit));
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get tweets',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/twitter/post - Post a tweet
 */
app.post('/api/twitter/post', async (req, res) => {
    try {
        const { text, reply_to } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: text',
                example: {
                    text: "Hello Twitter! 🐦",
                    reply_to: "optional_tweet_id"
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await twitterService.postTweet(text, { reply_to });
        
        res.json({
            success: true,
            message: 'Tweet posted successfully!',
            data: result,
            tips: [
                'Your tweet should appear on your profile immediately',
                'Check Twitter/X to see your post',
                'Engage with replies to boost visibility'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Post tweet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post tweet',
            error: error.message,
            troubleshooting: [
                'Check if Twitter API credentials are correct',
                'Verify you have write permissions',
                'Ensure tweet length is within 280 characters',
                'Check if you are rate limited'
            ],
            timestamp: new Date().toISOString()
        });
    }
});

// ============= AI ENDPOINTS =============

/**
 * GET /api/ai/test - Test Gemini AI connection
 */
app.get('/api/ai/test', async (req, res) => {
    try {
        const result = await aiService.testConnection();
        
        res.json({
            success: true,
            message: 'Gemini AI connection successful',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gemini AI connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/generate - Generate tweet from context
 */
app.post('/api/ai/generate', async (req, res) => {
    try {
        const { context, options = {} } = req.body;
        
        if (!context) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: context',
                example: {
                    context: "AI is transforming healthcare",
                    options: {
                        tone: "engaging",
                        includeHashtags: true,
                        includeEmojis: true,
                        maxLength: 280
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.generateTweet(context, options);
        
        res.json({
            success: true,
            message: 'Tweet generated successfully',
            data: result,
            actions: {
                postTweet: 'POST /api/twitter/post',
                enhance: 'POST /api/ai/enhance'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Generate tweet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate tweet',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/enhance - Enhance existing tweet
 */
app.post('/api/ai/enhance', async (req, res) => {
    try {
        const { text, options = {} } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: text',
                example: {
                    text: "Check out this cool AI feature",
                    options: {
                        tone: "engaging",
                        maxLength: 280
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.enhanceTweet(text, options);
        
        res.json({
            success: true,
            message: 'Tweet enhanced successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Enhance tweet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enhance tweet',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/thread - Generate tweet thread
 */
app.post('/api/ai/thread', async (req, res) => {
    try {
        const { content, options = {} } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: content',
                example: {
                    content: "Long form content about AI innovations...",
                    options: {
                        maxTweetsInThread: 5,
                        tone: "engaging"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.generateThread(content, options);
        
        res.json({
            success: true,
            message: 'Thread generated successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Generate thread error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate thread',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/generate-and-post - Generate and post tweet in one step
 */
app.post('/api/ai/generate-and-post', async (req, res) => {
    try {
        const { context, options = {} } = req.body;
        
        if (!context) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: context',
                timestamp: new Date().toISOString()
            });
        }
        
        // Step 1: Generate tweet
        console.log('🤖 Generating tweet with AI...');
        const generated = await aiService.generateTweet(context, options);
        
        // Step 2: Post to Twitter
        console.log('🐦 Posting to Twitter...');
        const posted = await twitterService.postTweet(generated.content);
        
        res.json({
            success: true,
            message: 'Tweet generated and posted successfully!',
            data: {
                generated: generated,
                posted: posted
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Generate and post error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate and post tweet',
            error: error.message,
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
    console.log('🚀 TWITTER/X AI-ENHANCED SERVER STARTED');
    console.log('🚀 ========================================');
    console.log(`🔗 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/`);
    console.log(`🤖 AI Features: Enabled with Groq`);
    console.log(`🐦 Twitter Integration: Direct API v2`);
    console.log('🚀 ========================================');
    console.log('🎯 Quick Test: POST /api/ai/generate');
    console.log('📝 Post Tweet: POST /api/twitter/post');
    console.log('🚀 ========================================');
});
