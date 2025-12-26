import { query } from '../../config/database';
import logger from '../../config/logger';

export class AnalyticsService {
  /**
   * Track content generation event
   */
  static async trackContentGeneration(userId: number, contentType: string, metadata?: any) {
    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'content_generated', $2, NOW())`,
      [userId, JSON.stringify({ contentType, ...metadata })]
    );
  }

  /**
   * Track post publication event
   */
  static async trackPostPublished(userId: number, platform: string, postId: string) {
    await query(
      `INSERT INTO analytics_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'post_published', $2, NOW())`,
      [userId, JSON.stringify({ platform, postId })]
    );
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: number, days: number = 30) {
    const result = await query(
      `SELECT
        event_type,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as day
       FROM analytics_events
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY event_type, day
       ORDER BY day DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get platform analytics
   */
  static async getPlatformStats() {
    const result = await query(`
      SELECT
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_content,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
        AVG(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publish_rate
      FROM generated_content
    `);

    return result.rows[0];
  }

  /**
   * Get content performance
   */
  static async getContentPerformance(userId: number) {
    const result = await query(
      `SELECT
        gc.id,
        gc.content_type,
        gc.topic,
        COALESCE(AVG(pa.engagement_rate), 0) as avg_engagement,
        COALESCE(SUM(pa.impressions), 0) as total_impressions,
        COALESCE(SUM(pa.likes + pa.comments + pa.shares), 0) as total_engagement
       FROM generated_content gc
       LEFT JOIN scheduled_posts sp ON sp.content_id = gc.id
       LEFT JOIN post_analytics pa ON pa.scheduled_post_id = sp.id
       WHERE gc.user_id = $1 AND gc.status = 'published'
       GROUP BY gc.id
       ORDER BY avg_engagement DESC
       LIMIT 20`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get tier distribution
   */
  static async getTierDistribution() {
    const result = await query(`
      SELECT
        tier,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count
      FROM users
      GROUP BY tier
    `);

    return result.rows;
  }
}
