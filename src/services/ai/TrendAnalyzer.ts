import OpenAI from 'openai';
import axios from 'axios';
import logger from '../../config/logger';
import { query } from '../../config/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TrendingTopic {
  topic: string;
  platform: 'linkedin' | 'twitter' | 'general';
  relevance_score: number;
  engagement_potential: number;
  keywords: string[];
  suggested_angles: string[];
  metadata?: any;
}

export class TrendAnalyzer {
  /**
   * Discover trending topics relevant to user's industry
   */
  static async discoverTrends(
    industry: string,
    userTopics?: string[]
  ): Promise<TrendingTopic[]> {
    logger.info('Discovering trends', { industry, userTopics });

    try {
      // Use AI to analyze current trends based on industry
      const trends = await this.analyzeTrendsWithAI(industry, userTopics);

      // Save trends to database
      await this.saveTrends(trends);

      return trends;
    } catch (error) {
      logger.error('Error discovering trends', { error });
      throw new Error('Failed to discover trends');
    }
  }

  /**
   * Analyze trends using AI
   */
  private static async analyzeTrendsWithAI(
    industry: string,
    userTopics?: string[]
  ): Promise<TrendingTopic[]> {
    const date = new Date().toISOString().split('T')[0];

    const prompt = `As an expert in ${industry} and executive communications, identify 10 trending topics for ${date} that would be valuable for C-level executives to discuss on LinkedIn and Twitter.

${userTopics ? `Focus on topics related to: ${userTopics.join(', ')}` : ''}

For each topic, provide:
1. The topic title
2. Why it's trending
3. Relevance score (0-1) for executives
4. Engagement potential (0-1)
5. Key keywords
6. 2-3 unique angles for content creation

Return as JSON array:
[
  {
    "topic": "Topic name",
    "platform": "linkedin|twitter|general",
    "relevance_score": 0.85,
    "engagement_potential": 0.9,
    "keywords": ["keyword1", "keyword2"],
    "suggested_angles": ["angle1", "angle2"],
    "context": "Why this matters now"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a trend analyst specializing in business, technology, and leadership topics for executive audiences.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"trends": []}');
    return result.trends || [];
  }

  /**
   * Get personalized topic recommendations for a user
   */
  static async getRecommendations(userId: number, limit: number = 5): Promise<TrendingTopic[]> {
    // Get user's voice profile to understand interests
    const voiceProfile = await query(
      'SELECT topics_of_interest FROM voice_profiles WHERE user_id = $1',
      [userId]
    );

    const userTopics = voiceProfile.rows[0]?.topics_of_interest || [];

    // Get recent trends from database
    const recentTrends = await query(
      `SELECT * FROM trends
       WHERE discovered_at > NOW() - INTERVAL '7 days'
       AND expires_at > NOW()
       ORDER BY relevance_score DESC, engagement_potential DESC
       LIMIT $1`,
      [limit * 2]
    );

    let trends = recentTrends.rows;

    // If not enough trends in DB, fetch new ones
    if (trends.length < limit) {
      const industry = 'Technology & Business'; // Could be from user profile
      const newTrends = await this.discoverTrends(industry, userTopics);
      trends = [...trends, ...newTrends];
    }

    // Score trends based on user interests
    const scoredTrends = trends.map((trend) => ({
      ...trend,
      personalized_score: this.calculatePersonalizedScore(trend, userTopics),
    }));

    // Sort by personalized score and return top N
    return scoredTrends
      .sort((a, b) => b.personalized_score - a.personalized_score)
      .slice(0, limit);
  }

  /**
   * Calculate personalized relevance score
   */
  private static calculatePersonalizedScore(trend: any, userTopics: string[]): number {
    let score = (trend.relevance_score + trend.engagement_potential) / 2;

    // Boost score if trend keywords match user topics
    if (userTopics && userTopics.length > 0) {
      const trendKeywords = trend.keywords || [];
      const matchCount = trendKeywords.filter((keyword: string) =>
        userTopics.some((topic) => topic.toLowerCase().includes(keyword.toLowerCase()))
      ).length;

      score += matchCount * 0.1; // Add 0.1 for each matching keyword
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Save trends to database
   */
  private static async saveTrends(trends: TrendingTopic[]): Promise<void> {
    for (const trend of trends) {
      await query(
        `INSERT INTO trends
         (topic, platform, relevance_score, engagement_potential, keywords, metadata, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
         ON CONFLICT DO NOTHING`,
        [
          trend.topic,
          trend.platform,
          trend.relevance_score,
          trend.engagement_potential,
          trend.keywords,
          JSON.stringify(trend.metadata || {}),
        ]
      );
    }
  }

  /**
   * Generate content ideas based on trending topics
   */
  static async generateContentIdeas(
    topic: string,
    userProfile?: any
  ): Promise<string[]> {
    const prompt = `Generate 5 unique content ideas about "${topic}" for a C-level executive to post on LinkedIn or Twitter.

${userProfile ? `Author's expertise: ${userProfile.topics_of_interest?.join(', ')}` : ''}

Each idea should:
- Be specific and actionable
- Offer a unique perspective
- Encourage engagement
- Be suitable for executive-level discourse

Return as JSON array: {"ideas": ["idea1", "idea2", ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"ideas": []}');
    return result.ideas || [];
  }

  /**
   * Analyze competitor content for insights
   */
  static async analyzeCompetitorContent(
    competitorPosts: string[]
  ): Promise<{
    trending_topics: string[];
    engagement_patterns: string[];
    content_gaps: string[];
  }> {
    const prompt = `Analyze these recent posts from industry leaders and identify:
1. Trending topics they're discussing
2. Patterns in what gets engagement
3. Opportunities/gaps in the conversation

Posts:
${competitorPosts.join('\n\n---\n\n')}

Return JSON:
{
  "trending_topics": ["topic1", "topic2"],
  "engagement_patterns": ["pattern1", "pattern2"],
  "content_gaps": ["opportunity1", "opportunity2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }
}
