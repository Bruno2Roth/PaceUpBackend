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
Protected. Create activity. Triggers XP award and achievement evaluation. Auto-updates challenge progress if activity belongs to a club.

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

### Types:
- `follow` — New follower
- `like` — Activity liked
- `comment` — Activity commented
- `achievement` — New achievement unlocked
- `challenge` — New challenge created
- `ranking` — Ranking position changed
- `club_invitation` — Invited to a club

---

## Clubs

### POST /clubs
Protected. Create a new club. Body: `{ name, description, logo_url, is_private }`. Founder auto-joined as admin. Awards XP.

### GET /clubs
Public. List public clubs (paginated). Query: `limit`, `offset`.

### GET /clubs/search?q=term&limit=20&offset=0
Search clubs by name or description.

### GET /clubs/my
Protected. List clubs the authenticated user belongs to.

### GET /clubs/invitations
Protected. List pending club invitations for the authenticated user.

### GET /clubs/:id
Public. Club details. Includes `is_member` and `member_role` if authenticated.

### PUT /clubs/:id
Protected. Update club (admin/founder only). Fields: `name`, `description`, `logo_url`, `is_private`.

### DELETE /clubs/:id
Protected. Delete club (founder only). Soft delete.

### POST /clubs/:id/join
Protected. Join a public club. Awards XP.

### DELETE /clubs/:id/leave
Protected. Leave a club (founder cannot leave).

### GET /clubs/:id/members
List club members (paginated). Roles: `admin`, `moderator`, `member`. Ordered by role then join date.

### GET /clubs/:id/activities
List club activities (paginated).

### POST /clubs/:id/invite
Protected. Invite a user to the club. Body: `{ user_id }`. Club admins/moderators only.

### PUT /clubs/:id/role
Protected. Update member role. Body: `{ user_id, role }`. Founder/admins only. Valid roles: `member`, `moderator`, `admin`.

### PUT /clubs/invitations/:invitationId/accept
Protected. Accept a club invitation.

### DELETE /clubs/invitations/:invitationId/reject
Protected. Reject a club invitation.

---

## Challenges

### POST /challenges
Protected. Create a challenge. Body: `{ title, description, challenge_type, goal_value, goal_unit, start_date, end_date, club_id, prize_description }`.

Types: `distance` (km), `elevation` (m), `time` (minutes/hours), `frequency` (sessions).

### GET /challenges
Public. List active challenges (paginated). Query: `limit`, `offset`.

### GET /challenges/search?q=term&limit=20&offset=0
Search challenges by title or description.

### GET /challenges/:id
Public. Challenge details. Includes `is_participant` and `my_progress` if authenticated.

### POST /challenges/:id/join
Protected. Join a challenge. Awards XP.

### POST /challenges/:id/leave
Protected. Leave a challenge.

### GET /challenges/:id/leaderboard
Public. Challenge leaderboard with ranks (paginated). Ordered by progress descending.

### GET /challenges/user/:id?status=active
Public. User's challenges by status: `active`, `completed`, `joined`.

Progress auto-updates when user creates an activity in the club.

---

## Rankings

### GET /rankings/leaderboard?criteria=distance&period=all&limit=100&offset=0
Public. Unified leaderboard. Period: `all`, `weekly`, `monthly`, `yearly`. Criteria: `distance`, `count`, `duration`, `elevation`.

### GET /rankings/global?criteria=distance&activity_type=running&limit=100&offset=0
Public. Global rankings. Filter by `activity_type`.

### GET /rankings/my-rank?criteria=distance
Protected. Get authenticated user's global rank.

### GET /rankings/club/:clubId?criteria=distance&limit=100
Public. Club member rankings.

### GET /rankings/monthly?year=2026&month=6&criteria=distance&limit=100
Public. Monthly rankings.

### GET /rankings/yearly?year=2026&criteria=distance&limit=100
Public. Yearly rankings.

---

## XP System

### GET /xp/status
Protected. Returns current XP, level, progress to next level, and level title.

### GET /xp/history?limit=50&offset=0
Protected. XP transaction history with event descriptions.

### XP Events
| Event | XP | Description |
|-------|----|-------------|
| activity_completed | 10 | Complete any activity |
| first_activity | 50 | Complete your first activity |
| distance_milestone_5k | 25 | Single activity 5+ km |
| distance_milestone_10k | 50 | Single activity 10+ km |
| distance_milestone_21k | 100 | Single activity 21+ km |
| distance_milestone_42k | 200 | Single activity 42+ km |
| total_distance_100km | 50 | Accumulate 100 km |
| total_distance_500km | 150 | Accumulate 500 km |
| total_distance_1000km | 300 | Accumulate 1000 km |
| streak_3_days | 30 | Activity streak: 3 days |
| streak_7_days | 70 | Activity streak: 7 days |
| streak_30_days | 300 | Activity streak: 30 days |
| challenge_joined | 15 | Join a challenge |
| challenge_completed | 50 | Complete challenge goal |
| club_joined | 10 | Join a club |
| club_created | 25 | Create a club |
| achievement_earned | 20 | Earn an achievement |

---

## Achievements

### GET /achievements
Protected. List all earned achievements for the authenticated user.

### GET /achievements/count
Protected. Returns `{ count: N }`.

### Achievement Types
| Type | Name | Condition |
|------|------|-----------|
| first_activity | Primer entrenamiento | Complete first activity |
| distance_5k | Primer 5K | Single activity 5+ km |
| distance_10k | Primer 10K | Single activity 10+ km |
| distance_21k | Primer 21K | Single activity 21+ km (half marathon) |
| distance_42k | Primer 42K | Single activity 42+ km (marathon) |
| total_100km | 100 km | Accumulate 100 km |
| total_500km | 500 km | Accumulate 500 km |
| total_1000km | 1000 km | Accumulate 1000 km |
| streak_3 | Racha de 3 días | Activity streak: 3 days |
| streak_7 | Racha de 7 días | Activity streak: 7 days |
| streak_30 | Racha de 30 días | Activity streak: 30 days |

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

## Level System

### Levels
| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Novato | 0 |
| 2 | Corredor | 1,000 |
| 3 | Atleta | 3,000 |
| 4 | Elite | 6,000 |
| 5 | Leyenda | 10,000 |
| 6 | Imparable | 15,000 |
| 7 | Inquebrantable | 21,000 |
| 8 | Titan | 28,000 |
| 9 | Inmortal | 36,000 |
| 10 | Pace God | 50,000 |

---

## Real-time (Socket.io)

Connect with `auth: { token: "<jwt>" }`.
User auto-joins room `user:{userId}`.

### Events received:
- `notification` — New notification object (supports: follow, like, comment, achievement, challenge, ranking, club_invitation)
- `notification_count` — `{ count: N }`
- `feed_update` — New activity from followed user

---

## Performance

- **Redis cache**: Like counts (5min), feed page 1 (1min), ranking user positions
- **Optimized queries**: Feed uses LEFT JOIN for like/comment counts (no N+1)
- **Cursor-based pagination**: Feed uses `start_time < cursor` for O(1) lookups
- **Indexes**: All foreign keys, sort columns, and search columns indexed
- **pg_trgm**: Fuzzy text search on name, username
