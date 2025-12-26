import Bull, { Queue, Job } from 'bull';
import logger from '../../config/logger';
import { query } from '../../config/database';
import { LinkedInConnector } from '../social/LinkedInConnector';
import { TwitterConnector } from '../social/TwitterConnector';

interface PublishJobData {
  scheduledPostId: number;
  userId: number;
  contentId: number;
  platform: 'linkedin' | 'twitter';
  content: string;
  contentType: string;
}

export class ContentScheduler {
  private static publishQueue: Queue<PublishJobData>;

  /**
   * Initialize the queue system
   */
  static async initialize(): Promise<void> {
    this.publishQueue = new Bull<PublishJobData>('content-publishing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    });

    // Process jobs
    this.publishQueue.process(async (job: Job<PublishJobData>) => {
      return this.processPublishJob(job.data);
    });

    // Event listeners
    this.publishQueue.on('completed', (job, result) => {
      logger.info('Post published successfully', {
        scheduledPostId: job.data.scheduledPostId,
        platform: job.data.platform,
      });
    });

    this.publishQueue.on('failed', (job, err) => {
      logger.error('Post publishing failed', {
        scheduledPostId: job?.data.scheduledPostId,
        error: err.message,
      });
    });

    logger.info('Content scheduler initialized');
  }

  /**
   * Schedule a post for publishing
   */
  static async schedulePost(
    userId: number,
    contentId: number,
    socialAccountId: number,
    scheduledTime: Date
  ): Promise<number> {
    // Create scheduled post record
    const result = await query(
      `INSERT INTO scheduled_posts
       (user_id, content_id, social_account_id, scheduled_time, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [userId, contentId, socialAccountId, scheduledTime]
    );

    const scheduledPostId = result.rows[0].id;

    // Get content and account details
    const contentResult = await query(
      `SELECT gc.*, sa.platform
       FROM generated_content gc
       JOIN scheduled_posts sp ON sp.content_id = gc.id
       JOIN social_accounts sa ON sa.id = sp.social_account_id
       WHERE sp.id = $1`,
      [scheduledPostId]
    );

    const content = contentResult.rows[0];

    // Calculate delay in milliseconds
    const delay = scheduledTime.getTime() - Date.now();

    // Add to queue
    await this.publishQueue.add(
      {
        scheduledPostId,
        userId,
        contentId,
        platform: content.platform,
        content: content.content,
        contentType: content.content_type,
      },
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
      }
    );

    logger.info('Post scheduled', { scheduledPostId, scheduledTime });

    return scheduledPostId;
  }

  /**
   * Process a publish job
   */
  private static async processPublishJob(data: PublishJobData): Promise<void> {
    try {
      // Update status to publishing
      await query(
        'UPDATE scheduled_posts SET status = $1 WHERE id = $2',
        ['publishing', data.scheduledPostId]
      );

      let platformPostId: string;

      if (data.platform === 'linkedin') {
        const accessToken = await LinkedInConnector.getAccessTokenForUser(data.userId);
        if (!accessToken) {
          throw new Error('LinkedIn access token not found');
        }

        // Get LinkedIn person URN
        const accountResult = await query(
          'SELECT account_id FROM social_accounts WHERE user_id = $1 AND platform = $2',
          [data.userId, 'linkedin']
        );

        const personUrn = accountResult.rows[0]?.account_id;
        if (!personUrn) {
          throw new Error('LinkedIn account not connected');
        }

        platformPostId = await LinkedInConnector.publishPost(accessToken, personUrn, {
          text: data.content,
        });
      } else if (data.platform === 'twitter') {
        const credentials = await TwitterConnector.getAccessTokenForUser(data.userId);
        if (!credentials) {
          throw new Error('Twitter credentials not found');
        }

        if (data.contentType === 'twitter_thread') {
          const tweets = TwitterConnector.splitIntoThreads(data.content);
          const tweetIds = await TwitterConnector.postThread(
            credentials.token,
            credentials.secret,
            tweets
          );
          platformPostId = tweetIds[0]; // Store first tweet ID
        } else {
          platformPostId = await TwitterConnector.postTweet(
            credentials.token,
            credentials.secret,
            { text: data.content }
          );
        }
      } else {
        throw new Error(`Unsupported platform: ${data.platform}`);
      }

      // Update as published
      await query(
        `UPDATE scheduled_posts
         SET status = 'published',
             published_at = NOW(),
             platform_post_id = $1
         WHERE id = $2`,
        [platformPostId, data.scheduledPostId]
      );

      // Update content status
      await query(
        "UPDATE generated_content SET status = 'published' WHERE id = $1",
        [data.contentId]
      );

      // Increment subscription usage
      await query(
        'UPDATE subscriptions SET posts_used = posts_used + 1 WHERE user_id = $1',
        [data.userId]
      );
    } catch (error: any) {
      logger.error('Error processing publish job', {
        error: error.message,
        scheduledPostId: data.scheduledPostId,
      });

      // Update retry count and status
      await query(
        `UPDATE scheduled_posts
         SET retry_count = retry_count + 1,
             status = 'failed',
             error_message = $1
         WHERE id = $2`,
        [error.message, data.scheduledPostId]
      );

      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  static async cancelScheduledPost(scheduledPostId: number): Promise<void> {
    // Remove from queue (would need to store job ID)
    // For now, just update status
    await query(
      'UPDATE scheduled_posts SET status = $1 WHERE id = $2',
      ['cancelled', scheduledPostId]
    );

    logger.info('Scheduled post cancelled', { scheduledPostId });
  }

  /**
   * Get scheduled posts for a user
   */
  static async getScheduledPosts(userId: number): Promise<any[]> {
    const result = await query(
      `SELECT
         sp.*,
         gc.content,
         gc.content_type,
         sa.platform,
         sa.account_username
       FROM scheduled_posts sp
       JOIN generated_content gc ON gc.id = sp.content_id
       JOIN social_accounts sa ON sa.id = sp.social_account_id
       WHERE sp.user_id = $1
       ORDER BY sp.scheduled_time DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Reschedule a failed post
   */
  static async reschedulePost(
    scheduledPostId: number,
    newTime: Date
  ): Promise<void> {
    const result = await query(
      `UPDATE scheduled_posts
       SET scheduled_time = $1,
           status = 'pending',
           error_message = NULL
       WHERE id = $2
       RETURNING user_id, content_id, social_account_id`,
      [newTime, scheduledPostId]
    );

    const post = result.rows[0];

    // Re-add to queue
    await this.schedulePost(
      post.user_id,
      post.content_id,
      post.social_account_id,
      newTime
    );

    logger.info('Post rescheduled', { scheduledPostId, newTime });
  }
}
