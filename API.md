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

## Premium — Métricas Avanzadas

All premium endpoints require `Authorization: Bearer <token>` header and an active premium subscription.

### GET /metrics/me
Protected. Premium (feature: `metrics`). Returns current metrics: VO2Max, fitness, fatigue, recovery, training load.

### GET /metrics/history?days=30
Protected. Premium (feature: `metrics`). Historical metrics time series.

### GET /metrics/load?days=7
Protected. Premium (feature: `metrics`). Training load breakdown with acute/chronic load ratio.

### GET /metrics/recovery
Protected. Premium (feature: `metrics`). Recovery status with HRV and readiness.

### GET /metrics/fitness?days=30
Protected. Premium (feature: `metrics`). Fitness trend over time.

---

## Premium — Coach IA

### GET /ai/weekly-report
Protected. Premium (feature: `ai_coach`). Weekly training report with summary, stats, and recommendations.

### GET /ai/recommendations?limit=5
Protected. Premium (feature: `ai_coach`). Personalized training recommendations.

### GET /ai/insights?days=30
Protected. Premium (feature: `ai_coach`). Training insights and pattern detection.

### POST /ai/analyze
Protected. Premium (feature: `ai_coach`). Body: `{ activity_id }`. Analyzes a specific activity and returns detailed feedback.

---

## Premium — Planes de Entrenamiento

### POST /training-plans
Protected. Premium (feature: `training_plans`). Generate a new training plan. Body: `{ goal: "5K"|"10K"|"21K"|"42K", level: "beginner"|"intermediate"|"advanced", start_date?: "YYYY-MM-DD" }`. Auto-deactivates existing plan.

### GET /training-plans/current
Protected. Premium (feature: `training_plans`). Current active plan with weeks, sessions, and progress.

### GET /training-plans/:id
Protected. Premium (feature: `training_plans`). Specific plan details.

### PATCH /training-plans/:id
Protected. Premium (feature: `training_plans`). Update plan fields.

### DELETE /training-plans/:id
Protected. Premium (feature: `training_plans`). Soft-delete plan.

### POST /training-plans/:id/pause
Protected. Premium (feature: `training_plans`). Pause a plan.

### POST /training-plans/:id/resume
Protected. Premium (feature: `training_plans`). Resume a paused plan.

### POST /training-plans/:id/recalculate
Protected. Premium (feature: `training_plans`). Recalculate plan based on missed sessions and progress.

### POST /training-plans/sessions/:sessionId/complete
Protected. Premium (feature: `training_plans`). Mark session as completed. Body: `{ distance_m, duration_seconds, notes? }`.

### Session Types:
- `easy` — Rodaje suave
- `tempo` — Ritmo cómodamente rápido
- `intervals` — Series con recuperación
- `long_run` — Rodaje largo
- `recovery` — Recuperación activa
- `rest` — Descanso

---

## Premium — Rutas

### POST /routes
Protected. Create a route. Body: `{ name?, description?, distance_m?, elevation_gain_m?, elevation_loss_m?, difficulty_level?, gps_points?, map_preview_url?, is_public?, city?, country?, surface_type? }`.

### GET /routes
Public. List public routes (paginated).

### GET /routes/search?q=&city=&difficulty=&limit=20&offset=0
Public. Search routes.

### GET /routes/popular?limit=20
Public. Most used/favorited routes. Cached (10min).

### GET /routes/nearby?lat=&lng=&radius=10&limit=20
Public. Routes near given coordinates within radius (km).

### GET /routes/favorites
Protected. Authenticated user's favorite routes.

### GET /routes/user/:id
Public. User's public routes.

### GET /routes/:id
Public. Route details.

### PUT /routes/:id
Protected. Update route (owner only).

### DELETE /routes/:id
Protected. Soft-delete route (owner only).

### POST /routes/:id/favorite
Protected. Toggle favorite status.

### Difficulty Levels:
- `easy`, `moderate`, `hard`, `extreme`

---

## Premium — Heatmaps

### GET /heatmaps/me?zoom=14
Protected. Premium (feature: `heatmaps`). Personal heatmap tiles.

### GET /heatmaps/club/:clubId?zoom=14
Protected. Premium (feature: `heatmaps`). Club aggregate heatmap.

### GET /heatmaps/global?zoom=14
Protected. Premium (feature: `heatmaps`). Global heatmap.

### POST /heatmaps/generate
Protected. Premium (feature: `heatmaps`). Generate personal heatmap from GPS data (last 6 months).

---

## Premium — Real-time Events (Socket.io)

### New events:
- `metrics_update` — Updated metrics pushed when recalculated
- `coach_insight` — New AI coach insight/analysis
- `plan_update` — Training plan modified or session completed
- `heatmap_update` — Heatmap tiles regenerated

### New notification types:
- `weekly_report` — Weekly training report available
- `ai_insight` — New AI analysis ready
- `training_plan_update` — Plan was updated/adapted
- `metrics_alert` — Metrics threshold alert

---

## Performance

- **Redis cache**: Like counts (5min), feed page 1 (1min), ranking user positions, route pages (5min), popular routes (10min), heatmap tiles (10min), training plans (5min)
- **Optimized queries**: Feed uses LEFT JOIN for like/comment counts (no N+1)
- **Cursor-based pagination**: Feed uses `start_time < cursor` for O(1) lookups
- **Indexes**: All foreign keys, sort columns, and search columns indexed
- **pg_trgm**: Fuzzy text search on name, username

---

## Integrations — Wearables & Third-Party

All integration endpoints require `Authorization: Bearer <token>` header.

### GET /integrations
Protected. List all connected integration providers with status.

### Garmin

#### GET /integrations/garmin/auth
Protected. Returns `{ url: "<Garmin OAuth URL>", state: "<state>" }`. Redirect user to Garmin's OAuth consent screen.

#### GET /integrations/garmin/callback?code=&state=
Public (handles OAuth redirect). Exchanges auth code for tokens, stores encrypted connection. Returns `{ success: true }`.

#### POST /integrations/garmin/sync
Protected. Triggers manual sync. Fetches new activities from Garmin since last sync (or last 30 days). Returns sync result with counts.

#### DELETE /integrations/garmin/disconnect
Protected. Disconnects Garmin, removes stored tokens.

#### GET /integrations/garmin/status
Protected. Returns connection status, last sync timestamp, and sync history.

### COROS

#### GET /integrations/coros/auth
Protected. Returns COROS OAuth URL.

#### GET /integrations/coros/callback
Public. OAuth callback handler.

#### POST /integrations/coros/sync
Protected. Manual sync.

#### DELETE /integrations/coros/disconnect
Protected. Disconnect.

#### GET /integrations/coros/status
Protected. Connection status.

### Polar

#### GET /integrations/polar/auth
Protected. Returns Polar OAuth URL.

#### GET /integrations/polar/callback
Public. OAuth callback handler.

#### POST /integrations/polar/sync
Protected. Manual sync.

#### DELETE /integrations/polar/disconnect
Protected. Disconnect.

#### GET /integrations/polar/status
Protected. Connection status.

### Suunto

#### GET /integrations/suunto/auth
Protected. Returns Suunto OAuth URL.

#### GET /integrations/suunto/callback
Public. OAuth callback handler.

#### POST /integrations/suunto/sync
Protected. Manual sync.

#### DELETE /integrations/suunto/disconnect
Protected. Disconnect.

#### GET /integrations/suunto/status
Protected. Connection status.

### Apple Health

#### POST /integrations/apple/import
Protected. Body: `{ workouts: [...], metrics: {...} }`. Imports Apple Health data via HealthKit export. Returns import summary.

#### GET /integrations/apple/status
Protected. Returns import history and stats.

### Health Connect

#### POST /integrations/health-connect/import
Protected. Body: `{ sessions: [...], metrics: {...} }`. Imports Health Connect / Wear OS data. Returns import summary.

#### GET /integrations/health-connect/status
Protected. Returns import history and stats.

---

## File Imports

All import endpoints require `Authorization: Bearer <token>` and an active premium subscription (feature: `advanced_routes`).

### POST /imports/gpx
Protected. Premium. Upload a GPX file (multipart/form-data, field: `file`, max 50MB). Parses waypoints/tracks and creates activities.

### POST /imports/fit
Protected. Premium. Upload a FIT file (multipart/form-data, field: `file`, max 50MB). Parses binary FIT protocol and creates activities with full metrics (heart rate, cadence, power, temperature).

### POST /imports/tcx
Protected. Premium. Upload a TCX file (multipart/form-data, field: `file`, max 50MB). Parses Training Center XML and creates activities.

---

## Webhooks

Public endpoints for provider push notifications. Each validates the payload using the provider's signature mechanism.

### POST /webhooks/garmin
Public. Garmin Health API webhook. Validates HMAC-SHA256 signature. Handles `activity.created`, `activity.updated`, `activity.deleted` events. Auto-syncs user's activities.

### POST /webhooks/coros
Public. COROS webhook. Validates HMAC-SHA256 signature. Handles activity events.

### POST /webhooks/polar
Public. Polar webhook. Validates HMAC-SHA256 signature. Handles activity events.

### POST /webhooks/suunto
Public. Suunto webhook. Validates HMAC-SHA256 signature. Handles activity events.

---

## Integrations — Socket Events

### New events:
- `sync_update` — Sync progress/result pushed in real-time
- `integration_status` — Connection status changed

### New notification types:
- `sync_completed` — Data sync finished successfully
- `sync_failed` — Data sync encountered an error
- `integration_connected` — New provider connected
- `integration_disconnected` — Provider disconnected
- `import_completed` — File import finished

---

## Integrations — Jobs (Background)

| Job | Interval | Description |
|-----|----------|-------------|
| `garminSyncJob` | Every 60 min | Auto-sync all connected Garmin users |
| `corosSyncJob` | Every 60 min | Auto-sync all connected COROS users |
| `polarSyncJob` | Every 60 min | Auto-sync all connected Polar users |
| `suuntoSyncJob` | Every 60 min | Auto-sync all connected Suunto users |

---

## Integrations — Environment Variables

| Variable | Description |
|----------|-------------|
| `ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM OAuth token encryption |
| `GARMIN_CLIENT_ID` | Garmin Health API client ID |
| `GARMIN_CLIENT_SECRET` | Garmin Health API client secret |
| `COROS_CLIENT_ID` | COROS API client ID |
| `COROS_CLIENT_SECRET` | COROS API client secret |
| `POLAR_CLIENT_ID` | Polar AccessLink client ID |
| `POLAR_CLIENT_SECRET` | Polar AccessLink client secret |
| `POLAR_ACCESS_KEY` | Polar AccessLink access key |
| `SUUNTO_CLIENT_ID` | Suunto API client ID |
| `SUUNTO_CLIENT_SECRET` | Suunto API client secret |
| `GARMIN_WEBHOOK_SECRET` | Garmin webhook verification secret |
| `COROS_WEBHOOK_SECRET` | COROS webhook verification secret |
| `POLAR_WEBHOOK_SECRET` | Polar webhook verification secret |
| `SUUNTO_WEBHOOK_SECRET` | Suunto webhook verification secret |

---

# FASE 6 — PRODUCCIÓN, ESCALABILIDAD Y OBSERVABILIDAD

---

## Email Verification

### POST /auth/verify-email/send
Protected. Sends verification email to current user's registered email. Returns `{ sent: true }`.

### GET /auth/verify-email?token=
Public. Verifies email using token from email link. Returns `{ verified: true }`.

### POST /auth/verify-email/resend
Protected. Resends verification email. Returns `{ sent: true }`.

**Token expiry**: 24 hours. Tokens are single-use and invalidated after use or on resend.

---

## Password Recovery

### POST /auth/forgot-password
Public. Body: `{ email }`. Sends password reset email if account exists. Always returns `{ sent: true }` to prevent email enumeration.

### POST /auth/validate-reset-token
Public. Body: `{ token }`. Validates reset token without consuming it. Returns `{ valid: true, userId }` or error.

### POST /auth/reset-password
Public. Body: `{ token, password }`. Resets password (min 8 chars). Token is single-use, expires in 1 hour. Logs audit event on success.

---

## Audit System

All critical actions are logged to `audit_logs` table with user, action, entity, IP, user agent, and metadata.

### Logged Events:
- `login` — Successful authentication
- `logout` — Session end
- `password_change` — Password updated
- `email_change` — Email address changed
- `activity_delete` — Activity soft-deleted
- `role_change` — User role modified (admin)
- `subscription_create/update/cancel` — Premium subscription changes

### Admin Endpoints

#### GET /admin/audit?limit=50&offset=0
Admin. Returns audit log entries with user names. Ordered by newest first.

#### GET /admin/audit/:id
Admin. Returns single audit log entry with full details.

---

## Structured Logging

- **Winston** with custom levels: `fatal(0)`, `error(1)`, `warn(2)`, `info(3)`, `debug(4)`, `trace(5)`
- **Log files**: `logs/error.log`, `logs/combined.log`, `logs/audit.log`, `logs/exceptions.log`, `logs/rejections.log`
- **Rotation**: 100MB max size, 30-day retention (90 days for audit)
- **JSON format** in production with timestamp, level, message, correlationId, stack traces
- **Correlation IDs**: Generated per-request (UUIDv4) via `x-correlation-id` header. Passed to all log entries and response headers
- **Console**: Colorized human-readable format in development, JSON in production

---

## System Metrics

### GET /admin/metrics
Admin. Returns JSON with:
- `uptime` — Server uptime in seconds
- `requests.total` — Total requests served
- `requests.perMinute` — Requests in last minute
- `requests.byStatus` — Breakdown by HTTP status
- `requests.errors` — Total 5xx responses
- `latency` — Bucketed count (<100ms, <300ms, <500ms, <1s, >1s)
- `cache.hits/misses/hitRate` — Cache performance
- `jobs.executed` — Total background jobs run
- `users.active` — Unique user IDs seen
- `database.status/activeConnections` — DB health
- `redis.status` — Redis health
- `system.memory/cpu/platform` — Node.js runtime info

### GET /admin/health
Admin. Returns `{ status, database, redis, uptime, timestamp }`. Returns 200 if all healthy, 503 if degraded.

### GET /admin/status
Admin. Returns full status including version, Node.js version, and environment.

---

## Prometheus

### GET /metrics
Public (or restricted via network policy). Exposes Prometheus metrics in text format.

### Metrics Exposed:
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, path, status | Request latency buckets |
| `db_query_duration_seconds` | Histogram | operation | DB query latency |
| `redis_operation_duration_seconds` | Histogram | operation | Redis operation latency |
| `jobs_executed_total` | Counter | queue, status | Background job count |
| `active_users` | Gauge | — | Currently active users |
| `cache_hit_rate` | Gauge | — | Cache hit rate (0–1) |

Default metrics (CPU, memory, event loop, GC) are collected automatically via `prom-client` default metrics.

---

## Grafana

Dashboard JSON definitions available in `docs/grafana-dashboards.json`:

### API Dashboard
- HTTP request rate by endpoint
- Request latency (p99 heatmap)
- Error rate percentage
- Active users gauge
- Cache hit rate
- HTTP status breakdown (pie chart)

### PostgreSQL Dashboard
- Average query duration
- Active connections
- Query rate by operation type

### Redis Dashboard
- Operation duration
- Operations per second

### Jobs Dashboard
- Job execution rate by queue
- Success vs failure pie chart

### Socket.IO Dashboard
- Active connections
- Event rate by event type

---

## Alertas

Automatic alerts trigger when thresholds are exceeded. Cooldown: 5 minutes per alert type.

### Alert Events:
| Event | Threshold | Severity | Description |
|-------|-----------|----------|-------------|
| High Latency | >2s, 5+ occurrences/min | Warning | API response time degraded |
| High Error Rate | >10% of requests in last minute | Critical | Service may be failing |
| Redis Down | Connection failure | Critical | Caching unavailable |
| PostgreSQL Down | Query failure | Critical | Data layer unavailable |
| API Down | No response | Critical | Complete outage |

### Channels:
- **Email**: Configurable via `ALERT_EMAIL`. Sends HTML alerts.
- **Discord**: Configurable via `ALERT_DISCORD_WEBHOOK`. Rich embeds with severity colors (red=critical, orange=warning, blue=info).
- **Slack**: Configurable via `ALERT_SLACK_WEBHOOK`. Formatted messages with attachments.

All alerts are logged to Winston before sending.

---

## Distributed Rate Limiting (Redis)

All rate limiters use Redis-backed sliding window (sorted sets) with local in-memory fallback.

| Limiter | Points | Window | Scope |
|---------|--------|--------|-------|
| Global | 100 | 15 min | All endpoints |
| Auth | 10 | 1 min | Login/register |
| Likes | 30 | 1 min | Per user |
| Comments | 10 | 1 min | Per user |
| Search | 60 | 1 min | Per IP |
| Integrations | 20 | 1 min | Per user |

Configuration is dynamic via environment variables. Falls back to local in-memory if Redis is unavailable.

---

## BullMQ — Colas de Trabajo

### Queues:
| Queue | Purpose | Retries | Concurrency |
|-------|---------|---------|-------------|
| `notifications` | Push notifications (in-app + socket) | 3 | 5 |
| `emails` | Email sending (verify, reset, alerts) | 3 | 5 |
| `integrations` | Provider sync (Garmin, COROS, etc.) | 3 | 5 |
| `rankings` | Ranking recalculation | 3 | 5 |
| `achievements` | Achievement evaluation | 3 | 5 |
| `metrics` | Metrics calculation | 3 | 5 |
| `ai-reports` | AI weekly report generation | 3 | 5 |

### Features:
- **Retries**: Exponential backoff (2s base, 3 attempts)
- **Delayed jobs**: `addDelayedJob(queue, name, data, delayMs)` for scheduled tasks
- **Dead letter queue**: Failed jobs are retained (50 max) for inspection
- **Rate limiting**: 100 jobs/second per queue

---

## Backups

### Automatic Schedule:
| Type | Frequency | Retention |
|------|-----------|-----------|
| Daily | Every 24h | 7 days |
| Weekly | Sundays | 30 days |
| Monthly | 1st of month | 365 days |

### Admin Endpoints:

#### GET /admin/backups?limit=20
Admin. Returns backup history with status, file size, and timestamps.

#### POST /admin/backups/run
Admin. Triggers manual PostgreSQL backup. Returns `{ id, filepath, size }`.

### PostgreSQL:
- Uses `pg_dump` with custom format (compressed, parallel-restore capable)
- Stored in `backups/` directory
- Automatic cleanup of expired backups

### Redis:
- Triggers `BGSAVE` for RDB snapshot
- Snapshots stored alongside database backups

---

## Admin API

All admin endpoints require `Authorization: Bearer <token>` with `role: ADMIN`.

### Users

#### GET /admin/users?limit=20&offset=0&role=&search=&is_banned=&is_suspended=
Admin. List users with optional filters. Returns id, name, email, role, statuses.

#### GET /admin/users/:id
Admin. Full user detail including activity count and recent audit logs.

#### PATCH /admin/users/:id
Admin. Update user fields: `name`, `username`, `role`, `is_active`, `bio`, `city`, `country`. Logs audit event.

#### DELETE /admin/users/:id
Admin. Soft-deletes user. Logs audit event.

### Activities

#### GET /admin/activities?limit=20&offset=0
Admin. Lists all activities with user info. Ordered by newest.

#### DELETE /admin/activities/:id
Admin. Soft-deletes activity. Logs audit event.

### Reports

#### GET /admin/reports
Admin. Returns all audit log reports.

---

## Moderation

### Endpoints

#### POST /moderation/reports
Protected. Body: `{ reported_user_id?, entity_type, entity_id, reason, description? }`. Reports content for review.

#### Admin moderation endpoints (under /admin/moderation):

| Endpoint | Description |
|----------|-------------|
| GET /admin/moderation/reports | List pending reports |
| PATCH /admin/moderation/reports/:id | Resolve report (body: `{ status }`) |
| POST /admin/moderation/users/:id/ban | Ban user (body: `{ reason }`) |
| POST /admin/moderation/users/:id/suspend | Suspend user (body: `{ reason, duration_hours }`) |
| POST /admin/moderation/users/:id/unban | Lift ban |
| POST /admin/moderation/users/:id/unsuspend | Lift suspension |

### Tables:
- **reports**: User-submitted content reports with status tracking
- **moderation_actions**: Moderator actions (ban, suspend, warn) with duration

### User Statuses:
- `is_banned`: Permanent block, cannot login or use API
- `is_suspended`: Temporary block with `suspended_until` timestamp
- Banned/suspended users receive 403 on all authenticated endpoints

---

## Seguridad Avanzada

### Helmet
- Content Security Policy (disabled by default for API)
- Cross-Origin Resource Policy: `cross-origin`
- HSTS: 1 year, include subdomains, preload
- Referrer Policy: `strict-origin-when-cross-origin`

### Security Middleware
- **Correlation IDs**: UUIDv4 per request, header round-trip
- **Abuse Detection**: Blocks IP after 100 requests in 10s window (5 min cooldown)
- **User restriction check**: Every authenticated request checks ban/suspend status
- **Rate limiting**: Redis-backed sliding window (see above)
- **Input validation**: express-validator on all mutation endpoints

### JWT
- Access token: 7d expiry (configurable via `JWT_EXPIRATION`)
- Refresh token: 30d expiry (configurable via `JWT_REFRESH_EXPIRATION`)
- Algorithm: HS256 (configurable via `JWT_ALGORITHM`)
- Tokens are stateless (no server-side session storage)

### CSRF Protection
- Token-based protection via `x-csrf-token` header
- Tokens generated per-session, validated on all state-changing methods (POST, PUT, PATCH, DELETE)
- Safe methods (GET, HEAD, OPTIONS) exempt

### Session Security
- User-agent and IP recorded per session
- Audit log on auth events (login, logout, password change)

---

## Caché Avanzado (Redis)

| Entity | TTL | Invalidation |
|--------|-----|-------------|
| Profiles | 5 min | On profile update |
| Rankings | 2 min | On new activity |
| Metrics | 1 min | On metrics recalc |
| Feed | 1 min | On new activity |
| Clubs | 5 min | On club update |
| Challenges | 5 min | On challenge update |
| Routes | 5 min | On route create/update |
| Heatmap tiles | 10 min | On heatmap regen |
| Training plans | 5 min | On plan update |
| Like counts | 5 min | On like/unlike |

Local in-memory cache mirrors Redis for sub-millisecond reads. Automatic invalidation via pattern-based key deletion.

---

## WebSockets Escalables

- **Redis Adapter**: `@socket.io/redis-adapter` with pub/sub for multi-instance support
- **Auto-fallback**: Single instance mode if Redis unavailable
- **Connection auth**: JWT verified on handshake via `auth.token` or `query.token`
- **Rooms**: `user:{userId}` for targeted events
- **Event types**: notification, notification_count, feed_update, metrics_update, coach_insight, plan_update, heatmap_update, sync_update, integration_status

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

| Stage | Triggers | Actions |
|-------|----------|---------|
| Lint | PR, push to main/develop | ESLint |
| Test | After lint | Jest with PostgreSQL + Redis service containers |
| Security | After test | `npm audit` |
| Build | After test + security | Migration + full test suite |
| Deploy Staging | Push to develop | (Configured per environment) |
| Deploy Production | Push to main | (Configured per environment) |

### Branch Strategy:
- `main` — Production-ready code. Direct pushes trigger production deploy.
- `develop` — Integration branch. Pushes deploy to staging.

---

## Testing

### Test Structure:
- `tests/social.test.js` — Social features (users, activities, notifications)
- `tests/premium.test.js` — Premium features (metrics, AI coach, training plans, routes, heatmaps, subscriptions)
- `tests/production.test.js` — Phase 6 (email verification, password reset, audit, moderation, rate limiting, system metrics, cache)

### Test categories:
- **Unit tests**: Service-level with mocked repositories
- **Integration tests**: Full request-response cycles (planned)
- **Load tests**: k6/artillery scripts (planned)
- **Security tests**: Auth bypass, rate limit, CSRF (planned)

---

## Environment Variables — Phase 6

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logger level | `debug` |
| `LOG_JSON` | JSON log format in console | `true` in prod |
| `LOG_DIR` | Log directory | `logs` |
| `LOG_MAX_SIZE` | Log file max size | `100m` |
| `LOG_MAX_FILES` | Log retention | `30d` |
| `ALERT_EMAIL` | Alert notification email | — |
| `ALERT_DISCORD_WEBHOOK` | Discord webhook URL | — |
| `ALERT_SLACK_WEBHOOK` | Slack webhook URL | — |
| `BACKUP_DIR` | Backup storage directory | `backups` |
| `BACKUP_RETENTION_DAYS` | Backup retention | `30` |
| `PG_DUMP_PATH` | pg_dump binary path | `pg_dump` |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASSWORD` | SMTP password | — |
| `SMTP_FROM_NAME` | From name for emails | `PaceUp` |
| `SMTP_FROM_EMAIL` | From address for emails | `noreply@paceup.com` |
| `REDIS_URL` | Redis connection URL (overrides host/port) | — |

---

## Notification Types — Extended

In addition to existing types, the following are now supported:
- `sync_completed` — Data sync finished
- `sync_failed` — Data sync error
- `integration_connected` — Provider connected
- `integration_disconnected` — Provider disconnected
- `import_completed` — File import finished

---

## Socket Events — Extended

| Event | Payload | Description |
|-------|---------|-------------|
| `sync_update` | `{ provider, status, imported, total }` | Integration sync progress |
| `integration_status` | `{ provider, connected, last_sync }` | Connection state change |

---

# FASE 7 — COMERCIAL, MONETIZACIÓN Y CRECIMIENTO

## 7.1 — Suscripciones

### `GET /subscriptions/plans`
Returns available subscription plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Premium Mensual",
      "code": "premium_monthly",
      "description": "Acceso completo a funciones premium",
      "price_monthly": 9.99,
      "price_yearly": 99.99,
      "currency": "USD",
      "features": ["metrics", "ai_coach", "training_plans", "heatmaps", "advanced_routes"],
      "is_active": true
    }
  ]
}
```

### `GET /subscriptions/me`
Returns current user subscription. Auth required.

### `POST /subscriptions/subscribe`
Subscribe to a plan. Auth required.

**Body:**
```json
{ "planCode": "premium_monthly", "paymentProvider": "stripe", "paymentData": {} }
```

### `POST /subscriptions/cancel`
Cancel active subscription at period end. Auth required.

### `POST /subscriptions/reactivate`
Reactivate a canceled subscription. Auth required.

### `POST /subscriptions/start-trial`
Start a trial period. Auth required. One trial per user.

**Body:**
```json
{ "planCode": "premium_monthly", "durationDays": 7 }
```

### `GET /subscriptions/trial-status`
Returns trial status. Auth required.

### `GET /subscriptions/history`
Returns subscription history. Auth required.

## 7.2 — Stripe

### `POST /billing/stripe/checkout`
Create Stripe checkout session. Auth required.

**Body:**
```json
{ "planCode": "premium_monthly", "successUrl": "...", "cancelUrl": "..." }
```

**Response:**
```json
{ "sessionId": "cs_xxx", "url": "https://checkout.stripe.com/..." }
```

### `POST /billing/stripe/webhook`
Stripe webhook handler. No auth.

Handles events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### `GET /billing/stripe/status`
Check Stripe configuration. Auth required.

## 7.3 — Mercado Pago

### `POST /billing/mercadopago/checkout`
Create Mercado Pago preference. Auth required.

**Response:**
```json
{ "preferenceId": "xxx", "initPoint": "https://www.mercadopago.com/..." }
```

### `POST /billing/mercadopago/webhook`
Mercado Pago webhook handler. No auth.

### `GET /billing/mercadopago/status`
Check Mercado Pago configuration. Auth required.

## 7.4 — Facturación

### `GET /billing/history`
Returns paginated billing history. Auth required.

### `GET /billing/invoices`
Returns all invoices. Auth required.

### `GET /billing/invoices/:id`
Returns invoice by ID. Auth required. Only owner can access.

## 7.5 — Referidos

### `GET /referrals/me`
Returns referral info (code, URL, count, rewards). Auth required.

### `POST /referrals/invite`
Invite a friend via email. Auth required.

**Body:**
```json
{ "email": "friend@example.com" }
```

### `GET /referrals/history`
Returns referral history. Auth required.

**Rewards:** 500 XP + 7 days Premium per completed referral.

## 7.6 — Logros Premium

Awarded automatically on:
- `premium_first_month` — First month of Premium
- `premium_100_activities` — 100 activities as Premium user
- `premium_one_year` — One year of subscription
- `premium_coach` — First AI Coach usage

## 7.7 — Cupones

### `POST /coupons/validate`
Validate a coupon code. Auth required.

**Body:**
```json
{ "code": "SAVE10" }
```

### `POST /coupons/redeem`
Redeem a coupon. Auth required.

**Body:**
```json
{ "code": "SAVE10", "subscriptionId": "uuid" }
```

## 7.8 — Partners y Marcas

### `GET /sponsors`
Returns active sponsors.

### `GET /sponsored-challenges`
Returns active sponsored challenges.

### `GET /sponsored-clubs`
Returns active sponsored clubs.

## 7.9 — Administración Comercial

All endpoints require admin auth.

### `GET /admin/subscriptions`
Paginated subscription list.

### `GET /admin/revenue`
Revenue data. Query params: `start`, `end`.

### `GET /admin/conversions`
Conversion data. Query params: `start`, `end`.

### `GET /admin/churn`
Churn data. Query params: `start`, `end`.

### `GET /admin/analytics`
Business KPIs: MRR, ARR, ARPU, churn rate, conversion rate.

### `GET /admin/revenue-metrics`
Detailed revenue metrics: MRR, ARR, ARPU, MRR growth, churn rate.

### `GET /admin/coupons`
List all coupons.

### `POST /admin/retention/run`
Run retention campaign.

### `POST /admin/winback/run`
Run winback campaign.

## 7.10 — Retention Jobs

Two cron-ready worker jobs:

- `retentionJob` — Detects users inactive for 14+ days, sends push + email
- `winbackJob` — Detects users who canceled premium 7+ days ago, sends re-engagement offer

## 7.11 — Environment Variables (Phase 7)

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | Stripe price ID for monthly premium | — |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | Stripe price ID for yearly premium | — |
| `STRIPE_COACH_PLUS_PRICE_ID` | Stripe price ID for coach+ | — |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago access token | — |
| `MERCADOPAGO_PUBLIC_KEY` | Mercado Pago public key | — |
| `APP_URL` | Application URL | `https://paceup.app` |
| `SUPPORT_EMAIL` | Support email address | `support@paceup.com` |
| `TRIAL_DEFAULT_DAYS` | Default trial duration | `7` |

## 7.12 — Tablas (Phase 7)

| Table | Description |
|-------|-------------|
| `subscription_history` | Subscription event log |
| `billing_invoices` | Invoice records |
| `referrals` | Referral tracking |
| `coupons` | Discount coupons |
| `coupon_redemptions` | Coupon usage log |
| `sponsors` | Brand partners |
| `sponsored_challenges` | Partner challenges |
| `sponsored_clubs` | Partner clubs |
| `trial_config` | Trial duration configuration |
| `email_templates` | Transactional email templates |

---

# FASE 8 — ECOSISTEMA, DIFERENCIACIÓN Y ESCALA GLOBAL

---

## 8.1 — Segments (KOM/QOM)

### `POST /segments`
Protected. Create a segment. Body: `{ name, description, start_lat, start_lng, end_lat, end_lng, segment_type, distance_m, elevation_gain_m }`.

### `GET /segments`
List segments (paginated). Query: `limit`, `offset`, `type`, `nearby[lat]&nearby[lng]&nearby[radius]`.

### `GET /segments/:id`
Segment details with KOM/QOM/course record.

### `PATCH /segments/:id`
Protected. Update segment (creator only).

### `DELETE /segments/:id`
Protected. Soft-delete segment (creator only).

### `GET /segments/:id/leaderboard?gender=&limit=50`
Segment leaderboard. Filter by gender.

### `GET /segments/:id/efforts?userId=&limit=50`
User efforts on segment.

**KOM/QOM rules:**
- Male users → KOM (King of Mountain)
- Female users → QOM (Queen of Mountain)
- Unspecified → course_record

---

## 8.2 — Events

### `POST /events`
Protected. Create an event. Body: `{ title, description, event_type, start_date, end_date, lat, lng, club_id, max_participants }`.

### `GET /events`
List upcoming events (paginated). Query: `limit`, `offset`, `type`, `nearby[lat]&nearby[lng]&nearby[radius]`.

### `GET /events/:id`
Event details.

### `POST /events/:id/join`
Protected. Join an event.

### `DELETE /events/:id/leave`
Protected. Leave an event.

---

## 8.3 — Chats

### `GET /chats`
Protected. List user's chats with last message and unread count.

### `GET /chats/:id?limit=50&before=<ISO timestamp>`
Protected. Get chat messages (cursor-based pagination).

### `POST /chats/:id/messages`
Protected. Send a message. Body: `{ content, message_type, image_url }`.

**Message types:** text, image, system.

---

## 8.4 — Share Activities

### `GET /share/activity/:token`
Public. View shared activity (no auth required). Returns activity data with user profile.

### `POST /share/activity/:id/image`
Protected. Generate activity image URL for sharing.

---

## 8.5 — Special Badges

### `GET /badges`
Protected. Returns user's earned badges with details.

**Badge types:**
| Code | Condition |
|------|-----------|
| `verified_runner` | Strava account verified |
| `marathon_finisher` | Activity ≥ 42,195m |
| `ultra_runner` | Activity ≥ 50,000m |
| `club_leader` | Leader of any club |
| `early_adopter` | Account created before June 2024 |
| `centurion` | 100+ activities |
| `streak_master` | 30-day activity streak |
| `global_explorer` | Activities in 10+ countries |

---

## 8.6 — Discovery

### `GET /discover/users?q=&city=&lat=&lng=&radius=50&minActivities=&limit=20&page=1`
Protected. Search/discover users.

### `GET /discover/routes?lat=&lng=&minDistance=&maxDistance=&surfaceType=&city=&limit=20&page=1`
Protected. Discover public routes.

### `GET /discover/events?lat=&lng=&eventType=&dateFrom=&dateTo=&limit=20&page=1`
Protected. Discover upcoming events.

### `GET /discover/clubs?lat=&lng=&minMembers=&city=&limit=20&page=1`
Protected. Discover public clubs.

Results sorted by proximity when lat/lng provided.

---

## 8.7 — Recommendations

### `GET /recommendations/clubs?limit=10`
Protected. Recommended clubs based on activity patterns and friends.

### `GET /recommendations/challenges?limit=10`
Protected. Challenges matching user's fitness level.

### `GET /recommendations/routes?limit=10`
Protected. Routes near frequent locations matching preferred distance.

### `GET /recommendations/events?limit=10`
Protected. Events near user or club events.

---

## 8.8 — Race Predictions & Training Simulation

### `GET /race-predictions`
Protected. Returns predictions for all distances (5K, 10K, 21K, 42K).

### `POST /race-predictions/predict`
Protected. Body: `{ distance: 10000 }`. Predicts time using Riegel formula.

### `POST /race-predictions/simulate`
Protected. Body: `{ name, weeks, weeklyDistance, weeklyFrequency, targetDistance }`. Simulates training and estimates improvement.

### `GET /race-predictions/simulations`
Protected. Returns previous simulations.

---

## 8.9 — Public API (OAuth)

### `POST /public-api/apps`
Protected (Internal). Register a third-party app. Body: `{ name, description, redirectUris, scopes }`.

### `GET /public-api/activities`
Public API. Requires Bearer token (OAuth). Scope: `activities`. Returns user's activities.

### `GET /public-api/profile`
Public API. Requires Bearer token (OAuth). Scope: `profile`. Returns user's public profile.

---

## 8.10 — Marketplace

### `GET /marketplace`
Public. List active marketplace listings. Query: `type`.

### `GET /marketplace/:id`
Public. Listing details.

### `POST /marketplace`
Protected. Create listing. Body: `{ listingType, title, description, price, currency, metadata }`.

---

## 8.11 — Translations (i18n)

### `GET /translations/:locale?namespace=default`
Public. Returns key-value translations for locale.

### `PUT /translations/:locale/:key`
Admin. Set translation. Body: `{ value, namespace }`.

Supported locales: `en`, `es`, `pt`, `fr`.

---

## 8.12 — Advanced Analytics

### `GET /analytics/dau?date=YYYY-MM-DD`
Admin. Daily Active Users.

### `GET /analytics/wau?date=YYYY-MM-DD`
Admin. Weekly Active Users.

### `GET /analytics/mau?date=YYYY-MM-DD`
Admin. Monthly Active Users.

### `GET /analytics/cohort-retention?cohortDate=YYYY-MM-DD&periods=12`
Admin. Weekly cohort retention analysis.

### `GET /analytics/engagement`
Protected. User engagement score (0-100) with breakdown.

---

## 8.13 — Admin Endpoints (Phase 8)

All require admin auth.

| Endpoint | Description |
|----------|-------------|
| `GET /admin/badges` | List special badges |
| `POST /admin/badges` | Create special badge |
| `GET /admin/segments` | List all segments |
| `DELETE /admin/segments/:id` | Delete segment |
| `GET /admin/events` | List all events |
| `DELETE /admin/events/:id` | Delete event |
| `GET /admin/marketplace` | List marketplace listings |
| `DELETE /admin/marketplace/:id` | Deactivate listing |
| `GET /admin/system-analytics` | DAU/WAU/MAU summary |

---

## 8.14 — Tables (Phase 8)

| Table | Description |
|-------|-------------|
| `segments` | GPS-defined route segments |
| `segment_points` | GPS points for segment geometry |
| `segment_efforts` | User attempts on segments |
| `segment_leaderboards` | Cached leaderboard data |
| `events` | Community events |
| `event_participants` | Event registration |
| `chats` | Direct and group chats |
| `chat_participants` | Chat membership |
| `chat_messages` | Chat messages |
| `shared_activities` | Public activity share links |
| `special_badges` | Badge definitions |
| `user_badges` | User badge awards |
| `race_predictions` | Race time predictions |
| `training_simulations` | Training plan simulations |
| `oauth_apps` | Third-party OAuth applications |
| `oauth_tokens` | OAuth access/refresh tokens |
| `marketplace_listings` | Marketplace offers |
| `translations` | Multi-language key-value pairs |
| `user_sessions` | User session tracking |
| `user_daily_activity` | Daily activity aggregation |

---

## 8.15 — Environment Variables (Phase 8)

| Variable | Description | Default |
|----------|-------------|---------|
| `MAPBOX_ACCESS_TOKEN` | Mapbox API token for advanced maps | — |
| `OPENAI_API_KEY` | OpenAI API key for advanced AI features | — |
| `APP_URL` | Application base URL | `http://localhost:3000` |

---

## 8.16 — Socket Events (Phase 8)

| Event | Payload | Description |
|-------|---------|-------------|
| `chat_message` | `{ chatId, sender, content, type, timestamp }` | New chat message |
| `segment_leaderboard_update` | `{ segmentId, kom, qom }` | KOM/QOM changed |

---

## 8.17 — Notification Types (Phase 8)

- `segment_kom` — You achieved KOM on a segment
- `segment_qom` — You achieved QOM on a segment
- `segment_lost` — Your KOM/QOM was beaten
- `chat_message` — New chat message received
- `event_reminder` — Event starting soon
- `badge_earned` — Special badge unlocked
