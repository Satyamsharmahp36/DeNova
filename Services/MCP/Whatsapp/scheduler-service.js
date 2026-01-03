// scheduler-service.js - Message Scheduling with Cron Jobs
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

export class MessageScheduler {
    constructor(whatsappService, aiService) {
        this.whatsappService = whatsappService;
        this.aiService = aiService;
        this.scheduledJobs = new Map(); // jobId -> { task, details }
        this.jobHistory = []; // Keep history of executed jobs
        
        console.log('📅 Message Scheduler Initialized');
    }

    /**
     * Schedule a message to be sent at a specific time
     * @param {Object} options - Scheduling options
     * @returns {Object} - Job details
     */
    scheduleMessage(options) {
        const {
            sendMode,
            phoneNumber,
            contactName,
            content,
            scheduleTime,
            repeat = false,
            repeatInterval = 'daily',
            aiEnhance = false
        } = options;

        // Validate required fields
        if (!content || (!phoneNumber && !contactName)) {
            throw new Error('Missing required fields: content and (phoneNumber or contactName)');
        }

        const scheduleDate = new Date(scheduleTime);
        if (scheduleDate <= new Date()) {
            throw new Error('Schedule time must be in the future');
        }

        // Generate unique job ID
        const jobId = uuidv4();

        // Calculate cron expression based on schedule time and repeat settings
        const cronExpression = this.getCronExpression(scheduleDate, repeat, repeatInterval);

        console.log(`📅 Scheduling message (ID: ${jobId})`);
        console.log(`   Mode: ${sendMode}`);
        console.log(`   To: ${contactName || phoneNumber}`);
        console.log(`   Time: ${scheduleDate.toLocaleString()}`);
        console.log(`   Repeat: ${repeat ? repeatInterval : 'No'}`);
        console.log(`   AI Enhance: ${aiEnhance ? 'Yes' : 'No'}`);
        console.log(`   Cron: ${cronExpression}`);

        // Create the scheduled task
        const task = cron.schedule(cronExpression, async () => {
            console.log(`⏰ Executing scheduled message (ID: ${jobId})`);
            
            try {
                let messageContent = content;

                // AI Enhancement if enabled
                if (aiEnhance) {
                    console.log('🤖 Enhancing message with AI...');
                    try {
                        const enhanced = await this.aiService.enhanceWhatsAppMessage(content, {
                            platform: 'whatsapp',
                            tone: 'friendly'
                        });
                        messageContent = enhanced.enhancedContent;
                        console.log(`✨ AI Enhanced: "${content}" → "${messageContent}"`);
                    } catch (aiError) {
                        console.warn('⚠️ AI enhancement failed, using original message:', aiError.message);
                    }
                }

                // Send message based on mode
                let result;
                if (sendMode === 'contact') {
                    result = await this.whatsappService.sendMessageToContact(contactName, messageContent);
                } else {
                    result = await this.whatsappService.sendMessageToNumber(phoneNumber, messageContent);
                }

                console.log('✅ Scheduled message sent successfully!');
                
                // Add to history
                this.jobHistory.push({
                    jobId,
                    executedAt: new Date().toISOString(),
                    status: 'success',
                    result
                });

                // If not repeating, remove the job
                if (!repeat) {
                    this.cancelScheduledMessage(jobId);
                }
            } catch (error) {
                console.error('❌ Scheduled message failed:', error.message);
                
                // Add to history
                this.jobHistory.push({
                    jobId,
                    executedAt: new Date().toISOString(),
                    status: 'failed',
                    error: error.message
                });

                // If not repeating, still remove the job
                if (!repeat) {
                    this.cancelScheduledMessage(jobId);
                }
            }
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata" // IST timezone
        });

        // Store job details
        this.scheduledJobs.set(jobId, {
            task,
            details: {
                jobId,
                sendMode,
                phoneNumber,
                contactName,
                content,
                scheduleTime: scheduleDate.toISOString(),
                repeat,
                repeatInterval,
                aiEnhance,
                cronExpression,
                createdAt: new Date().toISOString(),
                status: 'scheduled'
            }
        });

        console.log(`✅ Message scheduled successfully (ID: ${jobId})`);

        return {
            success: true,
            jobId,
            scheduleTime: scheduleDate.toISOString(),
            repeat,
            repeatInterval,
            message: `Message scheduled for ${scheduleDate.toLocaleString()}`
        };
    }

    /**
     * Generate cron expression from date and repeat settings
     */
    getCronExpression(date, repeat, repeatInterval) {
        const minute = date.getMinutes();
        const hour = date.getHours();
        const dayOfMonth = date.getDate();
        const month = date.getMonth() + 1;

        if (!repeat) {
            // One-time execution: specific date and time
            return `${minute} ${hour} ${dayOfMonth} ${month} *`;
        }

        // Repeating schedules
        switch (repeatInterval) {
            case 'hourly':
                return `${minute} * * * *`; // Every hour at specified minute
            case 'daily':
                return `${minute} ${hour} * * *`; // Every day at specified time
            case 'weekly':
                const dayOfWeek = date.getDay();
                return `${minute} ${hour} * * ${dayOfWeek}`; // Every week on same day
            case 'monthly':
                return `${minute} ${hour} ${dayOfMonth} * *`; // Every month on same date
            default:
                return `${minute} ${hour} * * *`; // Default to daily
        }
    }

    /**
     * Cancel a scheduled message
     */
    cancelScheduledMessage(jobId) {
        const job = this.scheduledJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        job.task.stop();
        this.scheduledJobs.delete(jobId);
        
        console.log(`🗑️ Cancelled scheduled message (ID: ${jobId})`);
        
        return {
            success: true,
            message: `Scheduled message ${jobId} cancelled`
        };
    }

    /**
     * Get all scheduled messages
     */
    getScheduledMessages() {
        const jobs = [];
        this.scheduledJobs.forEach((job, jobId) => {
            jobs.push(job.details);
        });
        
        return {
            success: true,
            total: jobs.length,
            jobs
        };
    }

    /**
     * Get job history
     */
    getJobHistory(limit = 50) {
        return {
            success: true,
            total: this.jobHistory.length,
            history: this.jobHistory.slice(-limit).reverse()
        };
    }

    /**
     * Clear completed jobs from history
     */
    clearHistory() {
        const count = this.jobHistory.length;
        this.jobHistory = [];
        
        return {
            success: true,
            message: `Cleared ${count} history entries`
        };
    }
}
