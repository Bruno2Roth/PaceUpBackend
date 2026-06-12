# PaceUp API Documentation

## Base URL
`/api/v1`

## Authentication
All protected endpoints require `Authorization: Bearer <token>` header.

---

## Users

### GET /users/profile
Protected. Returns authenticated user's profile with stats, streaks, personal bests.

### PUT /users/profile
Protected. Update profile fields: `name`, `username`, `bio`, `city`, `country`, `gender`, `date_of_birth`.

### POST /users/profile/photo
Protected. Upload profile picture (multipart/form-data, field: `photo`).

### GET /users/search?q=term&limit=20&offset=0
Search users by name, username, or city. Results ranked by relevance.

### GET /users/:id
Public profile with stats, recent activities, top distances, personal bests, streaks. Includes `is_following` if authenticated.

### GET /users/:id/activities
User's activities (paginated).

### GET /users/:id/stats
User's lifetime activity stats.

---

## Follows

### POST /users/:id/follow
Protected. Follow a user. Generates notification.

### DELETE /users/:id/follow
Protected. Unfollow a user.

### GET /users/:id/followers
List followers (paginated).

### GET /users/:id/following
List following (paginated).

---

## Activities

### POST /activities
Protected. Create activity.

### POST /activities/import
Protected. Bulk import activities.

### POST /activities/sync
Protected. Alias for import.

### GET /activities
Public. List activities (filterable by `user_id`, `activity_type`, `mine=true`).

### GET /activities/feed
Protected. Following feed with cursor-based pagination (`?cursor=<ISO timestamp>&limit=20`). Returns `next_cursor` for next page. Includes `likes_count`, `comments_count`, author info. Cached in Redis (page 1).

### GET /activities/:id
Public. Activity detail with counts.

### PUT /activities/:id
Protected. Update own activity.

### DELETE /activities/:id
Protected. Soft-delete own activity.

---

## Likes

### POST /activities/:id/like
Protected. Rate limited: 30/min, anti-flood: 5 per 2s. Generates notification.

### DELETE /activities/:id/like
Protected. Remove like.

### GET /activities/:id/likes
List users who liked (paginated). Count cached in Redis (5min TTL).

---

## Comments

### POST /activities/:id/comments
Protected. Rate limited: 10/min, anti-flood: 3 per 10s. Body: `{ "body": "text", "parent_id": null }`. Supports 1-level replies via `parent_id`. Generates notification. Sanitized (HTML stripped, max 2000 chars).

### GET /activities/:id/comments
List top-level comments (paginated). Includes `author_name`, `author_avatar`.

### GET /activities/:id/comments/:commentId/replies
List replies to a comment (paginated).

### PUT /activities/:id/comments/:commentId
Protected. Edit own comment.

### DELETE /activities/:id/comments/:commentId
Protected. Soft-delete own comment.

---

## Notifications

### GET /notifications
Protected. List notifications with actor info. Returns `unread_count`.

### GET /notifications/unread-count
Protected. Returns `{ unread_count: N }`.

### PATCH /notifications/read-all
Protected. Mark all as read.

### PATCH /notifications/:id/read
Protected. Mark one as read.

---

## Statistics

### GET /activities/:id/stats
Protected. Authenticated user's lifetime stats.

### Types:
- `stats_week`: Monday-starting week stats
- `stats_month`: Month-to-date stats
- `stats_year`: Year-to-date stats
- `stats`: Lifetime stats
- `personal_bests`: Best times for 1K, 5K, 10K, 21K, 42K
- `current_streak` / `max_streak`: Activity streaks
- `recent_activities`: Last 5 activities
- `top_distances`: Top 5 by distance

---

## Real-time (Socket.io)

Connect with `auth: { token: "<jwt>" }`.
User auto-joins room `user:{userId}`.

### Events received:
- `notification` — New notification object
- `notification_count` — `{ count: N }`
- `feed_update` — New activity from followed user

---

## Performance

- **Redis cache**: Like counts (5min), feed page 1 (1min)
- **Optimized queries**: Feed uses LEFT JOIN for like/comment counts (no N+1)
- **Cursor-based pagination**: Feed uses `start_time < cursor` for O(1) lookups
- **Indexes**: All foreign keys, sort columns, and search columns indexed
- **pg_trgm**: Fuzzy text search on name, username
