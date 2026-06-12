import BaseRepository from './BaseRepository.js';

export class XpEventRepository extends BaseRepository {
  constructor() {
    super('xp_events');
  }

  async findByEventKey(eventKey) {
    return this.findOne('event_key = $1', [eventKey]);
  }

  async getAllEvents() {
    const result = await this.pool.query('SELECT * FROM xp_events ORDER BY event_key');
    return result.rows;
  }
}

export default XpEventRepository;
