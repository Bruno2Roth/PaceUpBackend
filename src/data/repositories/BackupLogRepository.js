import BaseRepository from './BaseRepository.js';

export class BackupLogRepository extends BaseRepository {
  constructor() {
    super('backup_logs');
  }

  async create({ type, status, filePath, fileSize, databaseName, metadata }) {
    const query = `
      INSERT INTO backup_logs (type, status, file_path, file_size, database_name, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      type, status || 'pending', filePath || null, fileSize || null,
      databaseName || null, JSON.stringify(metadata || {}),
    ]);
    return result.rows[0];
  }

  async findRecent(limit = 20) {
    return this.pool.queryMany(
      'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT $1',
      [limit],
    );
  }
}

export default BackupLogRepository;
