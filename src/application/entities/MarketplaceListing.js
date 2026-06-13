export class MarketplaceListing {
  constructor({
    id,
    listingType,
    title,
    description,
    providerId,
    price,
    currency = 'USD',
    metadata = {},
    isActive = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.listingType = listingType;
    this.title = title;
    this.description = description;
    this.providerId = providerId;
    this.price = price;
    this.currency = currency;
    this.metadata = metadata;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default MarketplaceListing;
