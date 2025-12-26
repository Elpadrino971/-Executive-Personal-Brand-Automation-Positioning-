import axios from 'axios';
import logger from '../../config/logger';
import { query } from '../../config/database';

export interface Tweet {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
}

export interface TwitterProfile {
  id: string;
  username: string;
  name: string;
}

export class TwitterConnector {
  private static readonly API_BASE = 'https://api.twitter.com/2';

  /**
   * Post a tweet
   */
  static async postTweet(
    accessToken: string,
    accessSecret: string,
    tweet: Tweet
  ): Promise<string> {
    try {
      // For OAuth 2.0, use bearer token
      const response = await axios.post(
        `${this.API_BASE}/tweets`,
        {
          text: tweet.text,
          ...(tweet.mediaIds && { media: { media_ids: tweet.mediaIds } }),
          ...(tweet.replyToTweetId && {
            reply: { in_reply_to_tweet_id: tweet.replyToTweetId },
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const tweetId = response.data.data.id;
      logger.info('Tweet posted', { tweetId });

      return tweetId;
    } catch (error: any) {
      logger.error('Error posting tweet', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to post tweet');
    }
  }

  /**
   * Post a Twitter thread
   */
  static async postThread(
    accessToken: string,
    accessSecret: string,
    tweets: string[]
  ): Promise<string[]> {
    const tweetIds: string[] = [];
    let previousTweetId: string | undefined;

    for (const text of tweets) {
      const tweetId = await this.postTweet(accessToken, accessSecret, {
        text,
        replyToTweetId: previousTweetId,
      });

      tweetIds.push(tweetId);
      previousTweetId = tweetId;

      // Wait a bit between tweets to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.info('Twitter thread posted', { threadLength: tweetIds.length });

    return tweetIds;
  }

  /**
   * Get tweet analytics
   */
  static async getTweetAnalytics(
    tweetId: string
  ): Promise<{
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
  }> {
    try {
      const response = await axios.get(`${this.API_BASE}/tweets/${tweetId}`, {
        params: {
          'tweet.fields': 'public_metrics',
        },
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      });

      const metrics = response.data.data.public_metrics;

      return {
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
      };
    } catch (error) {
      logger.error('Error fetching tweet analytics', { error, tweetId });
      return { impressions: 0, likes: 0, retweets: 0, replies: 0 };
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(bearerToken: string): Promise<TwitterProfile> {
    try {
      const response = await axios.get(`${this.API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      return {
        id: response.data.data.id,
        username: response.data.data.username,
        name: response.data.data.name,
      };
    } catch (error) {
      logger.error('Error fetching Twitter profile', { error });
      throw new Error('Failed to fetch Twitter profile');
    }
  }

  /**
   * Save Twitter account connection
   */
  static async saveAccount(
    userId: number,
    accessToken: string,
    accessSecret: string
  ): Promise<void> {
    const profile = await this.getProfile(accessToken);

    await query(
      `INSERT INTO social_accounts
       (user_id, platform, account_id, account_username, access_token, refresh_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, 'twitter', profile.id, profile.username, accessToken, accessSecret]
    );

    logger.info('Twitter account connected', { userId, username: profile.username });
  }

  /**
   * Get user's access token from database
   */
  static async getAccessTokenForUser(
    userId: number
  ): Promise<{ token: string; secret: string } | null> {
    const result = await query(
      `SELECT access_token, refresh_token
       FROM social_accounts
       WHERE user_id = $1 AND platform = 'twitter' AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      token: result.rows[0].access_token,
      secret: result.rows[0].refresh_token,
    };
  }

  /**
   * Disconnect Twitter account
   */
  static async disconnectAccount(userId: number): Promise<void> {
    await query(
      'UPDATE social_accounts SET is_active = false WHERE user_id = $1 AND platform = $2',
      [userId, 'twitter']
    );

    logger.info('Twitter account disconnected', { userId });
  }

  /**
   * Split long content into tweet-sized chunks for threads
   */
  static splitIntoThreads(content: string, maxLength: number = 280): string[] {
    const tweets: string[] = [];
    const paragraphs = content.split('\n\n');

    let currentTweet = '';

    for (const paragraph of paragraphs) {
      if ((currentTweet + '\n\n' + paragraph).length <= maxLength) {
        currentTweet += (currentTweet ? '\n\n' : '') + paragraph;
      } else {
        if (currentTweet) {
          tweets.push(currentTweet);
        }

        // If single paragraph is too long, split it
        if (paragraph.length > maxLength) {
          const words = paragraph.split(' ');
          currentTweet = '';

          for (const word of words) {
            if ((currentTweet + ' ' + word).length <= maxLength) {
              currentTweet += (currentTweet ? ' ' : '') + word;
            } else {
              tweets.push(currentTweet);
              currentTweet = word;
            }
          }
        } else {
          currentTweet = paragraph;
        }
      }
    }

    if (currentTweet) {
      tweets.push(currentTweet);
    }

    // Add thread numbering
    return tweets.map((tweet, index) => {
      if (tweets.length > 1) {
        return `${index + 1}/${tweets.length}\n\n${tweet}`;
      }
      return tweet;
    });
  }
}
