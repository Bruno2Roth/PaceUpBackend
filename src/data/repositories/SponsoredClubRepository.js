import BaseRepository from './BaseRepository.js';

export class SponsoredClubRepository extends BaseRepository {
  constructor() {
    super('sponsored_clubs');
  }

  async findActive() {
    return this.pool.query(
      `SELECT sclub.*, s.name as sponsor_name, s.logo_url as sponsor_logo,
              c.name as club_name, c.description as club_description, c.member_count
       FROM sponsored_clubs sclub
       INNER JOIN sponsors s ON sclub.sponsor_id = s.id
       INNER JOIN clubs c ON sclub.club_id = c.id
       WHERE sclub.is_active = TRUE AND s.is_active = TRUE
       ORDER BY sclub.created_at DESC`
    ).then(r => r.rows);
  }
}
export default SponsoredClubRepository;
