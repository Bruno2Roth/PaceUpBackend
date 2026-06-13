import BaseRepository from './BaseRepository.js';

export class SpecialBadgeRepository extends BaseRepository {
  constructor() {
    super('special_badges');
  }

  async findByCode(code) {
    return this.findOne('code = $1', [code]);
  }

  async findActive() {
    const query = 'SELECT * FROM special_badges WHERE is_active = true ORDER BY category, title';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findByCategory(category) {
    return this.findMany('category = $1', [category]);
  }
}

export default SpecialBadgeRepository;
