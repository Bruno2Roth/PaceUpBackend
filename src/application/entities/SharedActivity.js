export class SharedActivity {
  constructor({
    id,
    activity_id,
    user_id,
    share_token,
    is_public = true,
    image_url,
    view_count = 0,
    created_at,
  }) {
    this.id = id;
    this.activity_id = activity_id;
    this.user_id = user_id;
    this.share_token = share_token;
    this.is_public = is_public;
    this.image_url = image_url;
    this.view_count = view_count;
    this.created_at = created_at;
  }
}

export default SharedActivity;
