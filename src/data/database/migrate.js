import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPool } from '../configs/database.js';
import config from '../configs/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    const pool = dbPool.initialize();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`Running migration: ${file}`);

      try {
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await pool.query(statement);
        }

        console.log(`✓ Migration completed: ${file}`);
      } catch (error) {
        console.error(`✗ Migration failed: ${file}`, error.message);
        throw error;
      }
    }

    console.log('✓ All migrations completed successfully');
    await dbPool.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await dbPool.close();
    process.exit(1);
  }
}

runMigrations();
