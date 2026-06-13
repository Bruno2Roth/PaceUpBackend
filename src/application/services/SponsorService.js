import SponsorRepository from '../../data/repositories/SponsorRepository.js';
import SponsoredChallengeRepository from '../../data/repositories/SponsoredChallengeRepository.js';
import SponsoredClubRepository from '../../data/repositories/SponsoredClubRepository.js';

export class SponsorService {
  constructor() {
    this.sponsorRepository = new SponsorRepository();
    this.challengeRepository = new SponsoredChallengeRepository();
    this.clubRepository = new SponsoredClubRepository();
  }

  async getSponsors() {
    return this.sponsorRepository.findActive();
  }

  async getSponsoredChallenges() {
    return this.challengeRepository.findActive();
  }

  async getSponsoredClubs() {
    return this.clubRepository.findActive();
  }
}
export default SponsorService;
