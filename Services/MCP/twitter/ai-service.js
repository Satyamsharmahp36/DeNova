// ai-service.js - Groq AI for Twitter content optimization
import Groq from 'groq-sdk';
import { config } from 'dotenv';

config();

export class AIService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        
        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY is required in .env file');
        }

        this.groq = new Groq({ apiKey: this.apiKey });
        this.model = 'llama-3.3-70b-versatile';

        console.log('🤖 Groq AI Service Initialized for Twitter');
        console.log('   Model: llama-3.3-70b-versatile');
    }

    /**
     * Generate optimized tweet from context/topic
     */
    async generateTweet(context, options = {}) {
        try {
            const {
                tone = 'engaging',
                includeHashtags = true,
                includeEmojis = true,
                maxLength = 280
            } = options;

            const prompt = `You are a professional social media content creator specializing in Twitter/X posts.

Context/Topic: ${context}

Create an engaging tweet with these requirements:
- Maximum ${maxLength} characters (STRICT LIMIT)
- Tone: ${tone}
- ${includeHashtags ? 'Include 2-3 relevant hashtags' : 'No hashtags'}
- ${includeEmojis ? 'Include 1-2 relevant emojis' : 'No emojis'}
- Make it attention-grabbing and shareable
- Use short, punchy sentences
- Add value or insight

Return ONLY the tweet text, nothing else. No explanations, no quotes around it.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 300
            });

            let tweetText = completion.choices[0]?.message?.content?.trim() || '';

            // Remove quotes if AI added them
            tweetText = tweetText.replace(/^["']|["']$/g, '');

            // Ensure it's within character limit
            if (tweetText.length > maxLength) {
                tweetText = tweetText.substring(0, maxLength - 3) + '...';
            }

            console.log(`✅ Generated tweet (${tweetText.length} chars)`);

            return {
                success: true,
                content: tweetText,
                characterCount: tweetText.length,
                tone: tone,
                context: context
            };
        } catch (error) {
            console.error('❌ Tweet generation error:', error);
            throw new Error(`Failed to generate tweet: ${error.message}`);
        }
    }

    /**
     * Enhance/optimize existing tweet text
     */
    async enhanceTweet(tweetText, options = {}) {
        try {
            const {
                tone = 'engaging',
                maxLength = 280
            } = options;

            const prompt = `You are a professional social media editor for Twitter/X.

Original tweet: ${tweetText}

Enhance this tweet to make it more ${tone} and engaging while:
- Keeping it under ${maxLength} characters (STRICT LIMIT)
- Maintaining the core message
- Making it more impactful and shareable
- Adding relevant emojis if appropriate
- Improving readability

Return ONLY the enhanced tweet text, nothing else.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 300
            });

            let enhancedText = completion.choices[0]?.message?.content?.trim() || '';

            // Remove quotes if AI added them
            enhancedText = enhancedText.replace(/^["']|["']$/g, '');

            // Ensure it's within character limit
            if (enhancedText.length > maxLength) {
                enhancedText = enhancedText.substring(0, maxLength - 3) + '...';
            }

            console.log(`✅ Enhanced tweet (${enhancedText.length} chars)`);

            return {
                success: true,
                original: tweetText,
                enhanced: enhancedText,
                characterCount: enhancedText.length,
                tone: tone
            };
        } catch (error) {
            console.error('❌ Tweet enhancement error:', error);
            throw new Error(`Failed to enhance tweet: ${error.message}`);
        }
    }

    /**
     * Generate tweet thread from long content
     */
    async generateThread(content, options = {}) {
        try {
            const {
                maxTweetsInThread = 5,
                tone = 'engaging'
            } = options;

            const prompt = `You are a professional social media content creator for Twitter/X.

Content to convert into a thread: ${content}

Create a Twitter thread with these requirements:
- Maximum ${maxTweetsInThread} tweets
- Each tweet must be under 280 characters
- First tweet should be a hook/attention grabber
- Last tweet should have a call-to-action or conclusion
- Tone: ${tone}
- Include relevant emojis
- Number each tweet (1/n, 2/n, etc.)

Return the tweets as a JSON array: ["tweet 1", "tweet 2", ...]`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1000
            });

            const text = completion.choices[0]?.message?.content?.trim() || '';

            // Try to parse as JSON
            let tweets;
            try {
                tweets = JSON.parse(text);
            } catch {
                // If not JSON, split by newlines
                tweets = text.split('\n').filter(t => t.trim().length > 0);
            }

            // Ensure each tweet is within limit
            tweets = tweets.map(tweet => {
                tweet = tweet.trim().replace(/^["']|["']$/g, '');
                if (tweet.length > 280) {
                    tweet = tweet.substring(0, 277) + '...';
                }
                return tweet;
            });

            console.log(`✅ Generated thread with ${tweets.length} tweets`);

            return {
                success: true,
                tweets: tweets,
                threadLength: tweets.length,
                tone: tone
            };
        } catch (error) {
            console.error('❌ Thread generation error:', error);
            throw new Error(`Failed to generate thread: ${error.message}`);
        }
    }

    /**
     * Test Gemini AI connection
     */
    async testConnection() {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello from Groq AI for Twitter!"'
                    }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 50
            });

            const text = completion.choices[0]?.message?.content || '';

            console.log('✅ Groq AI connection successful');

            return {
                success: true,
                connected: true,
                response: text
            };
        } catch (error) {
            console.error('❌ Gemini AI connection test failed:', error);
            throw new Error(`Groq AI connection failed: ${error.message}`);
        }
    }
}

export default AIService;
