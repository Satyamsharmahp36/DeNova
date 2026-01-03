// ai-enhancement-service.js - Groq powered content generation
import Groq from 'groq-sdk';
import { config } from 'dotenv';

config();

export class AIEnhancementService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is required in environment variables');
        }
        
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.model = 'llama-3.3-70b-versatile';
        
        console.log('🤖 AI Enhancement Service Initialized with Groq');
        console.log(`   Model: ${this.model}`);
    }

    // Generate LinkedIn post content using Groq
async generateLinkedInPost(topic, options = {}) {
    try {
        const {
            tone = 'professional',
            length = 'medium',
            includeHashtags = true,
            includeEmojis = true,
            targetAudience = 'professionals',
            callToAction = false
        } = options;

        const prompt = `Create an engaging LinkedIn post about "${topic}" with these specifications:

REQUIREMENTS:
- Tone: ${tone} 
- Length: ${length} (short: 50-150 words, medium: 150-300 words, long: 300-500 words)
- Target audience: ${targetAudience}
- ${includeEmojis ? 'Include relevant emojis to make it visually appealing' : 'No emojis'}
- ${includeHashtags ? 'Include 3-5 relevant hashtags at the end' : 'No hashtags'}
- ${callToAction ? 'Include a compelling call-to-action' : 'No specific call-to-action needed'}

STYLE GUIDELINES:
- Start with a hook to grab attention
- Provide genuine value to readers
- Be authentic and relatable
- Use line breaks for readability
- End with hashtags if requested

EXAMPLE STRUCTURE:
Hook/Opening statement
Main content with value
Personal insight or lesson
Call to action (if requested)
Hashtags (if requested)

CRITICAL INSTRUCTION:
Return ONLY the final LinkedIn post content ready to be posted. Do not include any explanations, analysis, meta-commentary, or descriptions about the post. No "**Improvements Made:**" sections, no bullet points explaining what you did, no additional commentary. Just return the clean, ready-to-post LinkedIn content.

LinkedIn Post:`;

        const completion = await this.groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional LinkedIn content creator. Generate engaging, authentic LinkedIn posts that provide value to readers. Return ONLY the final post content without any explanations or meta-commentary."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: this.model,
            temperature: 0.7,
            max_tokens: 1024
        });

        let generatedContent = completion.choices[0]?.message?.content?.trim() || '';

        // CLEANUP: Remove any accidental meta-commentary
        generatedContent = this.cleanUpGeneratedContent(generatedContent);

        return {
            success: true,
            content: generatedContent,
            wordCount: this.countWords(generatedContent),
            estimatedReadTime: Math.ceil(this.countWords(generatedContent) / 200),
            hashtags: this.extractHashtags(generatedContent),
            emojis: this.extractEmojis(generatedContent),
            tone: tone,
            topic: topic,
            model: this.model
        };
    } catch (error) {
        throw new Error(`Groq post generation failed: ${error.message}`);
    }
}

// ADD THIS CLEANUP METHOD to your AIEnhancementService class
cleanUpGeneratedContent(content) {
    // Remove common AI meta-commentary patterns
    let cleanContent = content
        // Remove "Improvements Made" sections
        .replace(/\*\*Improvements Made:\*\*[\s\S]*$/i, '')
        .replace(/\*\*Key improvements[\s\S]*$/i, '')
        .replace(/\*\*Here's what[\s\S]*$/i, '')
        
        // Remove analysis and commentary at the end
        .replace(/This revised post is[\s\S]*$/i, '')
        .replace(/This post is[\s\S]*$/i, '')
        .replace(/Remember to[\s\S]*$/i, '')
        .replace(/The post[\s\S]*engagement[\s\S]*$/i, '')
        
        // Remove instructional prefixes
        .replace(/^[\s\S]*?LinkedIn Post:\s*/i, '')
        .replace(/^[\s\S]*?Enhanced Post:\s*/i, '')
        .replace(/^[\s\S]*?Improved Post:\s*/i, '')
        .replace(/^[\s\S]*?Final Post:\s*/i, '')
        .replace(/^[\s\S]*?Here's[\s\S]*?:/i, '')
        
        // Remove bullet point explanations and options
        .replace(/\*\*Option \d+[^:]*:\*\*[\s\S]*?(?=\*\*Option|\n\n|$)/g, '')
        .replace(/^\* \*\*[\s\S]*$/gm, '')
        .replace(/^[\*\-\+] [\s\S]*$/gm, '')
        
        // Remove explanatory sections in bold
        .replace(/\*\*[A-Z][^*]*:\*\* [^\n]*\n?/g, '')
        
        // Clean up extra whitespace and newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    
    // If content is empty after cleanup, return original (safety fallback)
    if (!cleanContent || cleanContent.length < 20) {
        console.warn('Content became too short after cleanup, using original');
        return content.trim();
    }
    
    return cleanContent;
}


    // Enhance existing post content using Gemini
// FIXED: Add clear instructions to return only the post content

async enhancePostContent(originalContent, enhancement = 'improve') {
    try {
        let prompt;
        
        switch (enhancement) {
            case 'improve':
                prompt = `Improve this LinkedIn post to make it more engaging, professional, and likely to get high engagement:

Original Post:
"${originalContent}"

IMPORTANT INSTRUCTIONS:
- Return ONLY the improved post content
- Do NOT include any explanations, meta-commentary, or analysis
- Do NOT add "**Improvements Made:**" or similar sections
- Do NOT explain what you changed
- Just return the final, improved LinkedIn post content
- Keep it ready to post directly to LinkedIn

Improved Post:`;
                break;
                
            case 'add_emojis':
                prompt = `Add relevant and professional emojis to this LinkedIn post:

Original Post:
"${originalContent}"

IMPORTANT: Return ONLY the post with emojis added. No explanations or commentary.

Enhanced Post:`;
                break;
                
            // Apply the same pattern to all other cases...
            default:
                prompt = `Enhance this LinkedIn post:

Original Post:
"${originalContent}"

IMPORTANT: Return ONLY the enhanced post content. No explanations, analysis, or meta-commentary.

Enhanced Post:`;
        }

        const completion = await this.groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional LinkedIn content enhancer. Return ONLY the enhanced post content without any explanations or meta-commentary."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: this.model,
            temperature: 0.7,
            max_tokens: 1024
        });

        let enhancedContent = completion.choices[0]?.message?.content?.trim() || '';
        
        // ADDITIONAL CLEANUP: Remove any accidental meta-commentary
        enhancedContent = this.cleanUpGeneratedContent(enhancedContent);

        return {
            success: true,
            originalContent: originalContent,
            enhancedContent: enhancedContent,
            enhancement: enhancement,
            improvements: await this.analyzeImprovements(originalContent, enhancedContent),
            wordCountChange: this.countWords(enhancedContent) - this.countWords(originalContent),
            model: this.model
        };
    } catch (error) {
        throw new Error(`Groq content enhancement failed: ${error.message}`);
    }
}

    // Generate achievement post using Gemini
async generateAchievementPost(achievement, context = {}) {
    try {
        const contextString = Object.entries(context)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        const prompt = `Create an inspiring LinkedIn post celebrating this achievement:

ACHIEVEMENT: ${achievement}

CONTEXT:
${contextString}

REQUIREMENTS:
- Professional yet humble tone
- Express genuine gratitude
- Share lessons learned or insights
- Inspire others in the community
- Include relevant emojis (3-5 max)
- Add 4-6 relevant hashtags
- Make it personal and authentic
- Structure it for high engagement

STRUCTURE:
1. Hook/exciting opening
2. Share the achievement with context
3. Acknowledge team/supporters
4. Share a lesson or insight
5. Inspire others
6. Call to action or question
7. Relevant hashtags

CRITICAL INSTRUCTION:
Return ONLY the final LinkedIn post content ready to be posted. No explanations, analysis, or meta-commentary.

Achievement Post:`;

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a professional LinkedIn content creator. Return ONLY the final post content." },
                { role: "user", content: prompt }
            ],
            model: this.model,
            temperature: 0.7,
            max_tokens: 1024
        });

        let generatedContent = completion.choices[0]?.message?.content?.trim() || '';
        generatedContent = this.cleanUpGeneratedContent(generatedContent);

        return {
            success: true,
            content: generatedContent,
            type: 'achievement',
            achievement: achievement,
            context: context,
            wordCount: this.countWords(generatedContent),
            hashtags: this.extractHashtags(generatedContent),
            emojis: this.extractEmojis(generatedContent),
            model: this.model
        };
    } catch (error) {
        throw new Error(`Groq achievement post generation failed: ${error.message}`);
    }
}

async enhancePostContent(originalContent, enhancement = 'improve') {
    try {
        let prompt;
        
        switch (enhancement) {
            case 'improve':
                prompt = `Improve this LinkedIn post to make it more engaging, professional, and likely to get high engagement:

Original Post:
"${originalContent}"

Requirements:
- Make it more compelling and engaging
- Improve the structure and flow
- Add professional insights
- Make it more likely to generate comments and shares
- Keep the core message intact
- Maintain authenticity

CRITICAL INSTRUCTION:
Return ONLY the improved LinkedIn post content. No explanations, analysis, bullet points, or meta-commentary.

Improved Post:`;
                break;
                
            case 'add_emojis':
                prompt = `Add relevant and professional emojis to this LinkedIn post:

Original Post:
"${originalContent}"

Rules:
- Use emojis sparingly and professionally
- Choose emojis that enhance the message
- Don't overuse emojis (max 5-6 total)
- Place them strategically for maximum impact

CRITICAL INSTRUCTION:
Return ONLY the post with emojis added. No explanations.

Enhanced Post:`;
                break;
                
            case 'add_hashtags':
                prompt = `Add 3-5 relevant and trending hashtags to this LinkedIn post:

Original Post:
"${originalContent}"

Requirements:
- Choose hashtags that are relevant to the content
- Mix popular and niche hashtags
- Consider current trends in the professional space
- Place hashtags at the end of the post

CRITICAL INSTRUCTION:
Return ONLY the post with hashtags added. No explanations.

Enhanced Post:`;
                break;
                
            case 'make_shorter':
                prompt = `Make this LinkedIn post more concise while keeping all key messages:

Original Post:
"${originalContent}"

Requirements:
- Reduce length by 30-50%
- Keep the most important points
- Maintain the tone and personality
- Ensure it's still engaging

CRITICAL INSTRUCTION:
Return ONLY the shortened post content. No explanations.

Shortened Post:`;
                break;
                
            case 'make_longer':
                prompt = `Expand this LinkedIn post with more details, insights, and value:

Original Post:
"${originalContent}"

Requirements:
- Add more context and background
- Include additional insights or lessons
- Provide more value to readers
- Keep the same tone and style

CRITICAL INSTRUCTION:
Return ONLY the expanded post content. No explanations.

Expanded Post:`;
                break;
                
            default:
                prompt = `Enhance this LinkedIn post to make it more engaging:

Original Post:
"${originalContent}"

CRITICAL INSTRUCTION:
Return ONLY the enhanced post content. No explanations or analysis.

Enhanced Post:`;
        }

        const completion = await this.groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a professional LinkedIn content enhancer. Return ONLY the enhanced post content." },
                { role: "user", content: prompt }
            ],
            model: this.model,
            temperature: 0.7,
            max_tokens: 1024
        });

        let enhancedContent = completion.choices[0]?.message?.content?.trim() || '';
        enhancedContent = this.cleanUpGeneratedContent(enhancedContent);

        return {
            success: true,
            originalContent: originalContent,
            enhancedContent: enhancedContent,
            enhancement: enhancement,
            improvements: await this.analyzeImprovements(originalContent, enhancedContent),
            wordCountChange: this.countWords(enhancedContent) - this.countWords(originalContent),
            model: this.model
        };
    } catch (error) {
        throw new Error(`Groq content enhancement failed: ${error.message}`);
    }
}


    // Analyze message sentiment and generate insights using Gemini
    async analyzeMessage(messageContent) {
        try {
            const prompt = `Analyze this LinkedIn message and provide detailed insights:

MESSAGE: "${messageContent}"

Please provide a comprehensive analysis including:

1. SENTIMENT: (positive/neutral/negative/mixed)
2. INTENT: (networking, job inquiry, collaboration, sales pitch, partnership, mentorship, etc.)
3. URGENCY LEVEL: (low/medium/high/urgent)
4. PROFESSIONALISM LEVEL: (very professional/professional/casual/informal)
5. SUGGESTED RESPONSE TONE: (formal, friendly-professional, casual, enthusiastic, etc.)
6. KEY POINTS TO ADDRESS: (list main topics that should be addressed in response)
7. RESPONSE PRIORITY: (immediate, within 24h, within week, low priority)
8. POTENTIAL OPPORTUNITIES: (what opportunities this message might present)

Format your response clearly with each section labeled.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a LinkedIn message analyst. Provide detailed insights." },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1024
            });

            const analysis = completion.choices[0]?.message?.content?.trim() || '';

            return {
                success: true,
                originalMessage: messageContent,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                model: this.model
            };
        } catch (error) {
            throw new Error(`Groq message analysis failed: ${error.message}`);
        }
    }

    // Generate response to LinkedIn message using Gemini
    async generateMessageResponse(originalMessage, responseType = 'professional') {
        try {
            const prompt = `Generate a ${responseType} response to this LinkedIn message:

ORIGINAL MESSAGE: "${originalMessage}"

RESPONSE REQUIREMENTS:
- Tone: ${responseType}
- Length: Appropriate for the context (usually 50-150 words)
- Professional LinkedIn etiquette
- Address the sender's message appropriately
- Show genuine interest where relevant
- Maintain networking best practices
- Be helpful and value-driven
- Include a subtle call to action if appropriate

RESPONSE STYLE GUIDELINES:
- Start with a friendly greeting
- Acknowledge their message
- Provide value or helpful information
- Show interest in continuing the conversation
- End with a professional closing

Create a response that feels natural, helpful, and maintains professional relationships.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a professional LinkedIn communicator. Generate natural, helpful responses." },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1024
            });

            const responseContent = completion.choices[0]?.message?.content?.trim() || '';

            return {
                success: true,
                originalMessage: originalMessage,
                suggestedResponse: responseContent,
                responseType: responseType,
                wordCount: this.countWords(responseContent),
                model: this.model
            };
        } catch (error) {
            throw new Error(`Groq response generation failed: ${error.message}`);
        }
    }

    // Generate HackIndia specific post using Gemini
    async generateHackIndiaPost(status = 'finalist', teamName = 'Sankalp') {
        try {
            const prompt = `Create an exciting LinkedIn post about reaching ${status} in HackIndia 2025:

CONTEXT:
- Team Name: ${teamName}
- Status: ${status} in HackIndia 2025
- Event: India's biggest AI & Web3 hackathon
- Achievement Level: Competing against thousands of teams nationwide
- Technology Focus: AI and Web3 innovations
- Current Status: ${status === 'winner' ? 'Won the competition' : status === 'finalist' ? 'Preparing for finals' : 'Participating in the competition'}

REQUIREMENTS:
- Exciting but humble tone
- Express gratitude to team, mentors, organizers
- Highlight the significance of HackIndia
- Mention the competitive nature (thousands of teams)
- Share what this means for the future
- Inspire other developers and students
- Include relevant tech hashtags
- Add appropriate emojis
- Make it shareable and engaging

STRUCTURE:
1. Exciting announcement with emoji
2. Context about HackIndia's significance
3. Team acknowledgment and gratitude
4. What this achievement means
5. Future aspirations or next steps
6. Inspire others to participate in hackathons
7. Relevant hashtags

Make it authentic, inspiring, and celebration-worthy while staying humble and grateful.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a professional LinkedIn content creator. Return ONLY the final post content." },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1024
            });

            const generatedContent = completion.choices[0]?.message?.content?.trim() || '';

            return {
                success: true,
                content: generatedContent,
                type: 'hackindia',
                status: status,
                teamName: teamName,
                wordCount: this.countWords(generatedContent),
                hashtags: this.extractHashtags(generatedContent),
                emojis: this.extractEmojis(generatedContent),
                engagementTips: [
                    'Post during peak hours (9-11 AM or 5-7 PM IST)',
                    'Tag team members and mentors',
                    'Use all relevant hashtags',
                    'Add images or videos from the event',
                    'Respond to all comments within first hour',
                    'Share in relevant tech groups',
                    'Follow up with comments to boost engagement'
                ],
                model: this.model
            };
        } catch (error) {
            throw new Error(`Groq HackIndia post generation failed: ${error.message}`);
        }
    }

    // Generate tech insight post using Groq
    async generateTechInsightPost(topic, insight, context = {}) {
        try {
            const prompt = `Create a thought leadership LinkedIn post about this tech insight:

TOPIC: ${topic}
INSIGHT: ${insight}
CONTEXT: ${JSON.stringify(context, null, 2)}

REQUIREMENTS:
- Thought leadership tone
- Share genuine technical insight
- Provide value to the tech community
- Include practical applications
- Add personal perspective or experience
- Make it discussion-worthy
- Include relevant hashtags
- Appropriate emojis for tech content
- Structure for engagement (comments/shares)

STRUCTURE:
1. Attention-grabbing opening about the topic
2. Share the key insight
3. Explain why it matters
4. Provide real-world applications or examples
5. Personal take or experience
6. Question to encourage discussion
7. Tech-focused hashtags

Make it informative, engaging, and valuable for tech professionals.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a tech thought leader. Create informative, engaging LinkedIn posts." },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 1024
            });

            const generatedContent = completion.choices[0]?.message?.content?.trim() || '';

            return {
                success: true,
                content: generatedContent,
                type: 'tech-insight',
                topic: topic,
                insight: insight,
                context: context,
                wordCount: this.countWords(generatedContent),
                hashtags: this.extractHashtags(generatedContent),
                engagementPotential: 'high',
                model: this.model
            };
        } catch (error) {
            throw new Error(`Groq tech insight post generation failed: ${error.message}`);
        }
    }

    // Helper methods
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    extractHashtags(content) {
        const hashtagRegex = /#[\w\d]+/g;
        return content.match(hashtagRegex) || [];
    }

    extractEmojis(content) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        return content.match(emojiRegex) || [];
    }

    async analyzeImprovements(original, enhanced) {
        const improvements = [];
        
        const originalWords = this.countWords(original);
        const enhancedWords = this.countWords(enhanced);
        
        if (enhancedWords > originalWords * 1.2) improvements.push('Expanded content with more details');
        if (enhancedWords < originalWords * 0.8) improvements.push('Made more concise and focused');
        
        const originalHashtags = this.extractHashtags(original).length;
        const enhancedHashtags = this.extractHashtags(enhanced).length;
        if (enhancedHashtags > originalHashtags) improvements.push('Added relevant hashtags');
        
        const originalEmojis = this.extractEmojis(original).length;
        const enhancedEmojis = this.extractEmojis(enhanced).length;
        if (enhancedEmojis > originalEmojis) improvements.push('Added emojis for visual appeal');
        
        if (enhanced.includes('?') && !original.includes('?')) improvements.push('Added engagement question');
        
        return improvements;
    }

    // Test Groq connection
    async testConnection() {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "user", content: "Say 'Hello from Groq!' and confirm you're working properly for LinkedIn content generation." }
                ],
                model: this.model,
                max_tokens: 100
            });

            return {
                success: true,
                message: 'Groq AI service is working properly',
                response: completion.choices[0]?.message?.content || '',
                model: this.model
            };
        } catch (error) {
            throw new Error(`Groq connection test failed: ${error.message}`);
        }
    }
}
