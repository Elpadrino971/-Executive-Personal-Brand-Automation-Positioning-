import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../../config/database';
import logger from '../../config/logger';

export class TwoFactorService {
  /**
   * Enable 2FA for user
   */
  static async enable2FA(userId: number): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `Executive Brand (${userId})`,
      length: 32,
    });

    await query(
      'UPDATE users SET two_factor_secret = $1, two_factor_enabled = false WHERE id = $2',
      [secret.base32, userId]
    );

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    logger.info('2FA setup initiated', { userId });

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify and activate 2FA
   */
  static async verify2FA(userId: number, token: string): Promise<boolean> {
    const user = await query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0]?.two_factor_secret) {
      throw new Error('2FA not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (verified) {
      await query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      );
      logger.info('2FA enabled', { userId });
    }

    return verified;
  }

  /**
   * Validate 2FA token
   */
  static async validate2FAToken(userId: number, token: string): Promise<boolean> {
    const user = await query(
      'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0]?.two_factor_enabled) {
      return true; // 2FA not enabled
    }

    return speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: number): Promise<void> {
    await query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    logger.info('2FA disabled', { userId });
  }

  /**
   * Generate backup codes
   */
  static async generateBackupCodes(userId: number): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    const hashedCodes = codes.map(code =>
      require('crypto').createHash('sha256').update(code).digest('hex')
    );

    await query(
      'UPDATE users SET backup_codes = $1 WHERE id = $2',
      [JSON.stringify(hashedCodes), userId]
    );

    logger.info('Backup codes generated', { userId });

    return codes;
  }
}
