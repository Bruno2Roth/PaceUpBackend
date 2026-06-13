import BaseRepository from './BaseRepository.js';

export class SponsorRepository extends BaseRepository {
  constructor() {
    super('sponsors');
  }

  async findActive() {
    return this.findMany('is_active = $1', [true], 100, 0);
  }
}
export default SponsorRepository;
