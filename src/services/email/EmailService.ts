import nodemailer from 'nodemailer';
import logger from '../../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Executive Brand" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info('Email sent', { to: options.to, subject: options.subject });
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Executive Brand Automation',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining Executive Brand Automation.</p>
        <p>Here's what to do next:</p>
        <ul>
          <li>Complete your voice profile by uploading writing samples</li>
          <li>Connect your LinkedIn and Twitter accounts</li>
          <li>Generate your first AI-powered content</li>
        </ul>
        <p>Need help? Reply to this email or visit our support center.</p>
      `,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  /**
   * Send post published notification
   */
  static async sendPostPublishedEmail(
    email: string,
    platform: string,
    postUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Your post was published on ${platform}`,
      html: `
        <h1>Post Published Successfully</h1>
        <p>Your scheduled post has been published on ${platform}.</p>
        <p><a href="${postUrl}">View Post</a></p>
      `,
    });
  }

  /**
   * Send post failed notification
   */
  static async sendPostFailedEmail(
    email: string,
    platform: string,
    error: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Post Publishing Failed on ${platform}`,
      html: `
        <h1>Post Publishing Failed</h1>
        <p>We encountered an error while publishing your post on ${platform}.</p>
        <p><strong>Error:</strong> ${error}</p>
        <p>Please check your account connections and try again.</p>
      `,
    });
  }

  /**
   * Send weekly digest
   */
  static async sendWeeklyDigest(
    email: string,
    stats: {
      postsPublished: number;
      totalImpressions: number;
      totalEngagement: number;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Weekly Performance Digest',
      html: `
        <h1>Weekly Performance Summary</h1>
        <p>Here's how your content performed this week:</p>
        <ul>
          <li><strong>Posts Published:</strong> ${stats.postsPublished}</li>
          <li><strong>Total Impressions:</strong> ${stats.totalImpressions.toLocaleString()}</li>
          <li><strong>Total Engagement:</strong> ${stats.totalEngagement}</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/dashboard/analytics">View Detailed Analytics</a></p>
      `,
    });
  }
}
