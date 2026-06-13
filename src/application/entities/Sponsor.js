export class Sponsor {
  constructor({ id, name, slug, description, logoUrl, websiteUrl, isActive, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.logoUrl = logoUrl;
    this.websiteUrl = websiteUrl;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
export default Sponsor;
