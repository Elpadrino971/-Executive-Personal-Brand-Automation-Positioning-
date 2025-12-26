import { query } from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  company?: string;
  position?: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'done-for-you';
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(userData: {
    email: string;
    password: string;
    full_name: string;
    company?: string;
    position?: string;
    tier?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, company, position, tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        passwordHash,
        userData.full_name,
        userData.company,
        userData.position,
        userData.tier || 'starter'
      ]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async updateTier(userId: number, tier: string): Promise<User> {
    const result = await query(
      'UPDATE users SET tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [tier, userId]
    );
    return result.rows[0];
  }

  static async list(filters?: { tier?: string; status?: string }): Promise<User[]> {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.tier) {
      sql += ` AND tier = $${paramCount}`;
      params.push(filters.tier);
      paramCount++;
    }

    if (filters?.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }
}
