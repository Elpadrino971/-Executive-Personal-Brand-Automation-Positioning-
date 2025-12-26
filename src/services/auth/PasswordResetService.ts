import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { query } from '../../config/database';
import { EmailService } from '../email/EmailService';
import logger from '../../config/logger';

export class PasswordResetService {
  /**
   * Request password reset
   */
  static async requestReset(email: string): Promise<void> {
    const user = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (!user.rows[0]) {
      // Don't reveal if email exists
      logger.warn('Password reset requested for non-existent email', { email });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
      [user.rows[0].id, hashedToken, expiresAt]
    );

    await EmailService.sendPasswordResetEmail(email, token);

    logger.info('Password reset requested', { userId: user.rows[0].id });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `SELECT user_id FROM password_resets
       WHERE token = $1 AND expires_at > NOW()`,
      [hashedToken]
    );

    if (!result.rows[0]) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, result.rows[0].user_id]
    );

    await query('DELETE FROM password_resets WHERE user_id = $1', [result.rows[0].user_id]);

    logger.info('Password reset completed', { userId: result.rows[0].user_id });
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (!user.rows[0]) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    logger.info('Password changed', { userId });
  }
}
