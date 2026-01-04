import Groq from 'groq-sdk';

export class AIEmailAnalyzer {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        this.model = 'llama-3.3-70b-versatile';
        
        console.log('🤖 AI Email Analyzer initialized with Groq');
    }

    async analyzeEmails(emails) {
        try {
            console.log(`🤖 Analyzing ${emails.length} emails with AI...`);

            // Prepare email data for AI analysis
            const emailSummaries = emails.map((email, index) => ({
                index: index + 1,
                from: email.fromName || email.from,
                subject: email.subject,
                preview: email.preview?.substring(0, 200),
                date: email.date,
                isUnread: !email.isRead
            }));

            const prompt = `You are an intelligent email assistant. Analyze these ${emails.length} emails and identify which ones are IMPORTANT.

EMAILS TO ANALYZE:
${JSON.stringify(emailSummaries, null, 2)}

INSTRUCTIONS:
1. Identify which emails are IMPORTANT based on:
   - Work-related communications (job offers, interviews, projects)
   - Financial matters (bills, payments, transactions)
   - Time-sensitive information (deadlines, appointments, alerts)
   - Personal important communications (family, friends with urgent matters)
   - Security alerts and account notifications
   
2. PRIORITIZE UNREAD EMAILS - they are more likely to be important

3. IGNORE promotional emails, newsletters, marketing, social media notifications

Return a JSON object with this EXACT structure:
{
  "importantEmails": [
    {
      "index": 1,
      "reason": "Brief reason why this is important",
      "priority": "high" or "medium"
    }
  ],
  "summary": "A brief 2-3 sentence summary of all important emails",
  "overallInsight": "A brief insight about the email situation (e.g., 'You have 3 urgent work emails requiring immediate attention')"
}

Return ONLY valid JSON, no other text.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert email analyst. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.3,
                max_tokens: 2000
            });

            const aiResponse = completion.choices[0]?.message?.content;
            console.log('🤖 AI Response received');

            // Parse AI response
            let analysis;
            try {
                // Try to extract JSON if wrapped in markdown code blocks
                const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/```\n?([\s\S]*?)\n?```/);
                const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
                analysis = JSON.parse(jsonString);
            } catch (parseError) {
                console.error('❌ Failed to parse AI response:', parseError);
                // Fallback: mark unread emails as important
                analysis = {
                    importantEmails: emails
                        .map((email, index) => ({ email, index }))
                        .filter(({ email }) => !email.isRead)
                        .slice(0, 5)
                        .map(({ index }) => ({
                            index: index + 1,
                            reason: 'Unread email',
                            priority: 'medium'
                        })),
                    summary: 'AI analysis unavailable. Showing unread emails.',
                    overallInsight: `You have ${emails.filter(e => !e.isRead).length} unread emails.`
                };
            }

            // Map important email indices back to actual emails
            const importantEmailsWithData = analysis.importantEmails.map(item => {
                const email = emails[item.index - 1];
                return {
                    ...email,
                    aiReason: item.reason,
                    aiPriority: item.priority
                };
            });

            return {
                success: true,
                totalEmails: emails.length,
                importantCount: importantEmailsWithData.length,
                importantEmails: importantEmailsWithData,
                summary: analysis.summary,
                overallInsight: analysis.overallInsight,
                unreadCount: emails.filter(e => !e.isRead).length
            };

        } catch (error) {
            console.error('❌ AI analysis error:', error.message);
            
            // Fallback: return unread emails as important
            const unreadEmails = emails.filter(e => !e.isRead).slice(0, 5);
            return {
                success: true,
                totalEmails: emails.length,
                importantCount: unreadEmails.length,
                importantEmails: unreadEmails.map(email => ({
                    ...email,
                    aiReason: 'Unread email',
                    aiPriority: 'medium'
                })),
                summary: 'AI analysis unavailable. Showing unread emails as important.',
                overallInsight: `You have ${emails.filter(e => !e.isRead).length} unread emails to review.`,
                unreadCount: emails.filter(e => !e.isRead).length,
                error: error.message
            };
        }
    }

    async generateDetailedSummary(importantEmails) {
        try {
            if (importantEmails.length === 0) {
                return {
                    success: true,
                    summary: 'No important emails found. Your inbox is clear! 🎉'
                };
            }

            const emailDetails = importantEmails.map(email => ({
                from: email.fromName || email.from,
                subject: email.subject,
                preview: email.preview?.substring(0, 150),
                aiReason: email.aiReason,
                priority: email.aiPriority
            }));

            const prompt = `Generate a concise, actionable summary of these important emails:

${JSON.stringify(emailDetails, null, 2)}

Create a summary that:
1. Groups related emails together
2. Highlights urgent actions needed
3. Is written in a friendly, professional tone
4. Is 3-5 sentences maximum

Return ONLY the summary text, no JSON or formatting.`;

            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful email assistant that creates concise, actionable summaries.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.5,
                max_tokens: 500
            });

            const summary = completion.choices[0]?.message?.content;

            return {
                success: true,
                summary: summary
            };

        } catch (error) {
            console.error('❌ Summary generation error:', error.message);
            return {
                success: false,
                summary: `You have ${importantEmails.length} important emails requiring your attention.`,
                error: error.message
            };
        }
    }
}
