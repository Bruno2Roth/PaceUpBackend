import BaseRepository from './BaseRepository.js';

export class TranslationRepository extends BaseRepository {
  constructor() {
    super('translations');
  }

  async findByLocale(locale, namespace = null) {
    const params = [locale];
    let query = 'SELECT * FROM translations WHERE locale = $1';
    if (namespace) {
      query += ' AND namespace = $2';
      params.push(namespace);
    }
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async findByKey(locale, namespace, key) {
    const result = await this.pool.query(`
      SELECT * FROM translations WHERE locale = $1 AND namespace = $2 AND key = $3
    `, [locale, namespace, key]);
    return result.rows[0];
  }

  async upsert(locale, namespace, key, value) {
    const result = await this.pool.query(`
      INSERT INTO translations (locale, namespace, key, value)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (locale, namespace, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [locale, namespace, key, value]);
    return result.rows[0];
  }
}

export default TranslationRepository;
