import MarketplaceListingRepository from '../../data/repositories/MarketplaceListingRepository.js';

export class MarketplaceService {
  constructor() {
    this.marketplaceListingRepository = new MarketplaceListingRepository();
  }

  async listListings(type) {
    if (type) {
      return this.marketplaceListingRepository.findByType(type);
    }
    return this.marketplaceListingRepository.findActive();
  }

  async createListing(data, userId) {
    if (!data.title || !data.listingType) {
      const err = new Error('title and listingType are required');
      err.status = 400;
      throw err;
    }

    const listing = await this.marketplaceListingRepository.create({
      listing_type: data.listingType,
      title: data.title.trim(),
      description: data.description || null,
      provider_id: userId,
      price: data.price || null,
      currency: data.currency || 'USD',
      metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
      is_active: true,
    });

    return listing;
  }

  async getListing(id) {
    const listing = await this.marketplaceListingRepository.findById(id);
    if (!listing) {
      const err = new Error('Listing not found');
      err.status = 404;
      throw err;
    }
    return listing;
  }
}

export default MarketplaceService;
