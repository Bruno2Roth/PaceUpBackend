import BaseRepository from './BaseRepository.js';

export class SponsoredChallengeRepository extends BaseRepository {
  constructor() {
    super('sponsored_challenges');
  }

  async findActive() {
    return this.pool.query(
      `SELECT sc.*, s.name as sponsor_name, s.logo_url as sponsor_logo, s.slug as sponsor_slug
       FROM sponsored_challenges sc
       INNER JOIN sponsors s ON sc.sponsor_id = s.id
       WHERE sc.is_active = TRUE AND s.is_active = TRUE
       ORDER BY sc.ends_at ASC`
    ).then(r => r.rows);
  }
}
export default SponsoredChallengeRepository;
