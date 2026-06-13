import SponsorService from '../../application/services/SponsorService.js';

export class SponsorController {
  constructor() {
    this.sponsorService = new SponsorService();
  }

  getSponsors = async (req, res, next) => {
    try {
      const sponsors = await this.sponsorService.getSponsors();
      res.json({ sponsors });
    } catch (err) { next(err); }
  };

  getSponsoredChallenges = async (req, res, next) => {
    try {
      const challenges = await this.sponsorService.getSponsoredChallenges();
      res.json({ challenges });
    } catch (err) { next(err); }
  };

  getSponsoredClubs = async (req, res, next) => {
    try {
      const clubs = await this.sponsorService.getSponsoredClubs();
      res.json({ clubs });
    } catch (err) { next(err); }
  };
}
export default SponsorController;
