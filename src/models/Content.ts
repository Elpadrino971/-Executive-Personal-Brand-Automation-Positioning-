import { query } from '../config/database';

export interface GeneratedContent {
  id: number;
  user_id: number;
  content_type: 'linkedin_post' | 'twitter_thread' | 'twitter_post';
  title?: string;
  content: string;
  tone?: string;
  topic?: string;
  hashtags?: string[];
  status: 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class ContentModel {
  static async create(contentData: {
    user_id: number;
    content_type: string;
    title?: string;
    content: string;
    tone?: string;
    topic?: string;
    hashtags?: string[];
    metadata?: any;
  }): Promise<GeneratedContent> {
    const result = await query(
      `INSERT INTO generated_content
       (user_id, content_type, title, content, tone, topic, hashtags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        contentData.user_id,
        contentData.content_type,
        contentData.title,
        contentData.content,
        contentData.tone,
        contentData.topic,
        contentData.hashtags,
        JSON.stringify(contentData.metadata || {})
      ]
    );

    return result.rows[0];
  }

  static async findById(id: number): Promise<GeneratedContent | null> {
    const result = await query('SELECT * FROM generated_content WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUser(userId: number, limit = 50): Promise<GeneratedContent[]> {
    const result = await query(
      'SELECT * FROM generated_content WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  static async updateStatus(id: number, status: string): Promise<GeneratedContent> {
    const result = await query(
      'UPDATE generated_content SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM generated_content WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getStats(userId: number): Promise<any> {
    const result = await query(
      `SELECT
        content_type,
        status,
        COUNT(*) as count
       FROM generated_content
       WHERE user_id = $1
       GROUP BY content_type, status`,
      [userId]
    );
    return result.rows;
  }
}
