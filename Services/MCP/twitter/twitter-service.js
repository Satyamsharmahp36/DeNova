// twitter-service.js - Twitter API v2 Integration
import { TwitterApi } from 'twitter-api-v2';
import { config } from 'dotenv';

config();

export class TwitterService {
    constructor() {
        this.client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });

        this.rwClient = this.client.readWrite;
        this.maxTweetLength = parseInt(process.env.MAX_TWEET_LENGTH) || 280;

        console.log('🐦 Twitter Service Initialized');
        console.log(`   Max Tweet Length: ${this.maxTweetLength} characters`);
    }

    /**
     * Post a tweet to Twitter/X
     */
    async postTweet(text, options = {}) {
        try {
            if (!text || text.trim().length === 0) {
                throw new Error('Tweet text cannot be empty');
            }

            // Truncate if exceeds max length
            let tweetText = text;
            if (tweetText.length > this.maxTweetLength) {
                console.warn(`⚠️ Tweet exceeds ${this.maxTweetLength} chars, truncating...`);
                tweetText = tweetText.substring(0, this.maxTweetLength - 3) + '...';
            }

            console.log(`🐦 Posting tweet (${tweetText.length} chars)...`);

            const tweet = await this.rwClient.v2.tweet({
                text: tweetText,
                ...(options.reply_to && { reply: { in_reply_to_tweet_id: options.reply_to } })
            });

            console.log('✅ Tweet posted successfully:', tweet.data.id);

            return {
                success: true,
                tweetId: tweet.data.id,
                text: tweet.data.text,
                url: `https://twitter.com/user/status/${tweet.data.id}`,
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Twitter post error:', error);
            throw new Error(`Failed to post tweet: ${error.message}`);
        }
    }

    /**
     * Get user's timeline tweets
     */
    async getUserTweets(limit = 10) {
        try {
            const me = await this.rwClient.v2.me();
            const tweets = await this.rwClient.v2.userTimeline(me.data.id, {
                max_results: limit,
                'tweet.fields': ['created_at', 'public_metrics']
            });

            return {
                success: true,
                tweets: tweets.data.data || [],
                user: me.data
            };
        } catch (error) {
            console.error('❌ Get tweets error:', error);
            throw new Error(`Failed to get tweets: ${error.message}`);
        }
    }

    /**
     * Get authenticated user info
     */
    async getMe() {
        try {
            const user = await this.rwClient.v2.me({
                'user.fields': ['profile_image_url', 'public_metrics', 'description']
            });

            return {
                success: true,
                user: user.data
            };
        } catch (error) {
            console.error('❌ Get user error:', error);
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    }

    /**
     * Test Twitter API connection
     */
    async testConnection() {
        try {
            const user = await this.rwClient.v2.me();
            console.log('✅ Twitter API connection successful');
            console.log(`   Connected as: @${user.data.username}`);

            return {
                success: true,
                connected: true,
                username: user.data.username,
                userId: user.data.id
            };
        } catch (error) {
            console.error('❌ Twitter connection test failed:', error);
            throw new Error(`Twitter API connection failed: ${error.message}`);
        }
    }
}

export default TwitterService;
