import MarketplaceService from '../../application/services/MarketplaceService.js';

export class MarketplaceController {
  constructor() {
    this.marketplaceService = new MarketplaceService();
  }

  async list(req, res, next) {
    try {
      const type = req.query.type || null;
      const listings = await this.marketplaceService.listListings(type);
      return res.status(200).json({ data: listings });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const listing = await this.marketplaceService.createListing(req.body, req.userId);
      return res.status(201).json({ data: listing });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const listing = await this.marketplaceService.getListing(req.params.id);
      return res.status(200).json({ data: listing });
    } catch (error) {
      next(error);
    }
  }
}

export default MarketplaceController;
