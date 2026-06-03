import { dbPool } from '../../configs/database.js';

export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = dbPool.getPool();
  }

  async findAll(limit = 20, offset = 0, whereClause = '', params = []) {
    let query = `SELECT * FROM ${this.tableName}`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const result = await this.pool.query(query, [...params, limit, offset]);
    return result.rows;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async findOne(whereClause, params = []) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async findMany(whereClause, params = []) {
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length === 0) {
      return this.findById(id);
    }

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;

    const result = await this.pool.query(query, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async softDelete(id) {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }

  async count(whereClause = '', params = []) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }
}

export default BaseRepository;
