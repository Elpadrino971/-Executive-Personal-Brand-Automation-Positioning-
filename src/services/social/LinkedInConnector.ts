import axios from 'axios';
import logger from '../../config/logger';
import { query } from '../../config/database';

export interface LinkedInPost {
  text: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  mediaUrls?: string[];
}

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
}

export class LinkedInConnector {
  private static readonly API_BASE = 'https://api.linkedin.com/v2';

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
      state,
      scope: 'r_liteprofile r_emailaddress w_member_social',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting LinkedIn access token', { error });
      throw new Error('Failed to authenticate with LinkedIn');
    }
  }

  /**
   * Get user profile information
   */
  static async getProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      const response = await axios.get(`${this.API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        firstName: response.data.localizedFirstName,
        lastName: response.data.localizedLastName,
        headline: response.data.headline,
      };
    } catch (error) {
      logger.error('Error fetching LinkedIn profile', { error });
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  /**
   * Save LinkedIn account connection
   */
  static async saveAccount(
    userId: number,
    accessToken: string,
    expiresIn: number
  ): Promise<void> {
    const profile = await this.getProfile(accessToken);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await query(
      `INSERT INTO social_accounts
       (user_id, platform, account_id, account_username, access_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET
         access_token = EXCLUDED.access_token,
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        'linkedin',
        profile.id,
        `${profile.firstName} ${profile.lastName}`,
        accessToken,
        expiresAt,
      ]
    );

    logger.info('LinkedIn account connected', { userId, accountId: profile.id });
  }

  /**
   * Publish a post to LinkedIn
   */
  static async publishPost(
    accessToken: string,
    personUrn: string,
    post: LinkedInPost
  ): Promise<string> {
    try {
      const payload = {
        author: `urn:li:person:${personUrn}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.text,
            },
            shareMediaCategory: post.mediaUrls ? 'IMAGE' : 'NONE',
            ...(post.mediaUrls && {
              media: post.mediaUrls.map((url) => ({
                status: 'READY',
                originalUrl: url,
              })),
            }),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': post.visibility || 'PUBLIC',
        },
      };

      const response = await axios.post(`${this.API_BASE}/ugcPosts`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      const postId = response.data.id;
      logger.info('LinkedIn post published', { postId });

      return postId;
    } catch (error: any) {
      logger.error('Error publishing LinkedIn post', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to publish LinkedIn post');
    }
  }

  /**
   * Get post analytics
   */
  static async getPostAnalytics(
    accessToken: string,
    postId: string
  ): Promise<{
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    try {
      const response = await axios.get(
        `${this.API_BASE}/socialActions/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        impressions: response.data.impressionCount || 0,
        likes: response.data.likeCount || 0,
        comments: response.data.commentCount || 0,
        shares: response.data.shareCount || 0,
      };
    } catch (error) {
      logger.error('Error fetching LinkedIn analytics', { error });
      return { impressions: 0, likes: 0, comments: 0, shares: 0 };
    }
  }

  /**
   * Get user's access token from database
   */
  static async getAccessTokenForUser(userId: number): Promise<string | null> {
    const result = await query(
      `SELECT access_token, token_expires_at
       FROM social_accounts
       WHERE user_id = $1 AND platform = 'linkedin' AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const account = result.rows[0];

    // Check if token is expired
    if (new Date(account.token_expires_at) < new Date()) {
      logger.warn('LinkedIn token expired', { userId });
      return null;
    }

    return account.access_token;
  }

  /**
   * Disconnect LinkedIn account
   */
  static async disconnectAccount(userId: number): Promise<void> {
    await query(
      'UPDATE social_accounts SET is_active = false WHERE user_id = $1 AND platform = $2',
      [userId, 'linkedin']
    );

    logger.info('LinkedIn account disconnected', { userId });
  }
}
