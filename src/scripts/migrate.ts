import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

const runMigration = async () => {
  const client = await pool.connect();

  try {
    logger.info('Starting database migration...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await client.query(schema);

    logger.info('Database migration completed successfully');

    // Create default admin user (optional)
    const adminExists = await client.query(
      "SELECT id FROM users WHERE email = 'admin@executive-brand.com'"
    );

    if (adminExists.rows.length === 0) {
      logger.info('Creating default admin user...');

      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

      await client.query(
        `INSERT INTO users (email, password_hash, full_name, tier, status)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@executive-brand.com', passwordHash, 'Admin User', 'enterprise', 'active']
      );

      logger.info('Default admin user created: admin@executive-brand.com / ChangeMe123!');
      logger.warn('IMPORTANT: Change the admin password immediately!');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  } finally {
    client.release();
  }
};

runMigration();
