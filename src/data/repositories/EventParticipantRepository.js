import BaseRepository from './BaseRepository.js';

export class EventParticipantRepository extends BaseRepository {
  constructor() {
    super('event_participants');
  }

  async findByEvent(eventId) {
    const query = `
      SELECT ep.*, u.name AS user_name, u.username, u.profile_picture_url
      FROM event_participants ep
      INNER JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = $1
      ORDER BY ep.created_at ASC
    `;
    const result = await this.pool.query(query, [eventId]);
    return result.rows;
  }

  async findByUserAndEvent(userId, eventId) {
    const query = `
      SELECT * FROM event_participants
      WHERE user_id = $1 AND event_id = $2
    `;
    const result = await this.pool.query(query, [userId, eventId]);
    return result.rows[0] || null;
  }

  async countByEvent(eventId) {
    const query = `
      SELECT COUNT(*)::int AS count FROM event_participants
      WHERE event_id = $1 AND status != 'canceled'
    `;
    const result = await this.pool.query(query, [eventId]);
    return result.rows[0].count;
  }

  async findByUser(userId) {
    const query = `
      SELECT ep.*, e.title AS event_title, e.event_type, e.start_date, e.location
      FROM event_participants ep
      INNER JOIN events e ON ep.event_id = e.id
      WHERE ep.user_id = $1
      ORDER BY e.start_date DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
}

export default EventParticipantRepository;
