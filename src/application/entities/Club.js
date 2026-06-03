export class Club {
  constructor({
    id,
    name,
    description,
    logo_url,
    member_count = 0,
    founder_id,
    is_private = false,
    created_at,
    updated_at,
    deleted_at,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.logo_url = logo_url;
    this.member_count = member_count;
    this.founder_id = founder_id;
    this.is_private = is_private;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }

  isPublic() {
    return !this.is_private;
  }

  isPrivate() {
    return this.is_private;
  }
}

export default Club;
