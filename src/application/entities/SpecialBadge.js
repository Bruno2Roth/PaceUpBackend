export class SpecialBadge {
  constructor({
    id,
    code,
    title,
    description,
    icon_url,
    category,
    criteria,
    is_active = true,
    created_at,
  }) {
    this.id = id;
    this.code = code;
    this.title = title;
    this.description = description;
    this.icon_url = icon_url;
    this.category = category;
    this.criteria = criteria;
    this.is_active = is_active;
    this.created_at = created_at;
  }
}

export default SpecialBadge;
