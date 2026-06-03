import { dbPool } from '../configs/database.js';

async function rollbackMigrations() {
  try {
    console.log('Starting database rollback...');

    const pool = dbPool.initialize();

    const tables = [
      'notifications',
      'levels',
      'achievements',
      'likes',
      'comments',
      'followers',
      'challenge_participants',
      'challenges',
      'club_members',
      'clubs',
      'segments',
      'routes',
      'activities',
      'users',
    ];

    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✓ Dropped table: ${table}`);
    }

    console.log('✓ All tables dropped successfully');
    await dbPool.close();
    process.exit(0);
  } catch (error) {
    console.error('Rollback error:', error);
    await dbPool.close();
    process.exit(1);
  }
}

rollbackMigrations();
