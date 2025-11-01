# REST API Plan

## 1. Resources

- **Profiles**: Corresponds to the `profiles` table, managing user profiles.
- **Habits**: Corresponds to the `habits` table, managing user habits.
- **Habit Params**: Corresponds to the `habit_params` table, versioning habit parameters.
- **Checkin Portions**: Corresponds to the `checkin_portions` table, atomic check-in portions.
- **Tag Catalog**: Corresponds to the `tag_catalog` table, catalog of allowed tags.
- **Tag Aliases**: Corresponds to the `tag_aliases` table, tag aliasing with effective dates.
- **PAT Tokens**: Corresponds to the `pat_tokens` table, personal access tokens for API.
- **PAT Token Allows**: Corresponds to the `pat_token_allows` table, allowlists for PAT.
- **ICS Tokens**: Corresponds to the `ics_tokens` table, tokens for ICS feeds.
- **DSAR Requests**: Corresponds to the `dsar_requests` table, data subject access requests.
- **Download Links**: Corresponds to the `download_links` table, one-time download links.
- **Consents**: Corresponds to the `consents` table, user consents for data processing.
- **Notifications**: Corresponds to the `notifications` table, notification settings.
- **Audit Logs**: Corresponds to the `audit_logs` table, audit logs for operations.
- **Sync Log**: Corresponds to the `sync_log` table, sync logs for offline debugging.

## 2. Endpoints

### Profiles

- **GET /api/profiles/me**
  - Description: Retrieve the current user's profile.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "user_id": "uuid", "email": "string", "display_name": "string", "timezone": "string", "locale": "string", "created_at": "timestamp", "updated_at": "timestamp", "deleted_at": "timestamp|null", "scheduled_for_deletion_until": "timestamp|null" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error
  - **Implementation**: Route in `src/pages/api/profiles/me.ts` with Zod validation (none for GET), authentication via Supabase, service call to `profileService.getProfile`. Unit tests in `src/lib/services/profileService.test.ts` cover success, not found, and errors. Audit logging enabled.

- **PATCH /api/profiles/me**
  - Description: Update the current user's profile.
  - Query Parameters: None
  - Request Payload: { "display_name": "string|optional", "timezone": "string|optional", "locale": "string|optional" }
  - Response Payload: Updated profile object
  - Success: 200 OK
  - Errors: 400 Bad Request (validation failed), 401 Unauthorized, 500 Internal Server Error
  - **Implementation**: Route in `src/pages/api/profiles/me.ts` with Zod schema for UpdateProfileCommand (validates locale as 'en'/'pl', timezone as IANA), authentication, service call to `profileService.updateProfile` with sanitization. Unit tests cover validation, updates, and errors. Audit logging for old/new values.

### Habits

- **GET /api/habits**
  - Description: List user's habits with pagination, filtering, and sorting.
  - Query Parameters: page (int, default 1), limit (int, default 20), filter_tags (array of strings), sort_by (string, e.g., "name|asc"), deleted (boolean, default false)
  - Request Payload: None
  - Response Payload: { "habits": [habit objects], "total": int, "page": int, "limit": int }
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

- **GET /api/habits/{habit_id}**
  - Description: Retrieve a specific habit.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Habit object including params and tags
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/habits**
  - Description: Create a new habit.
  - Query Parameters: None
  - Request Payload: { "name": "string", "description": "string|optional", "frequency_type": "DAILY|WEEKLY|TIMES_PER_WEEK", "target_value": "number|optional", "unit_kind": "count|volume|distance|time|optional", "value_min": "number|optional", "value_max": "number|optional", "tags": ["string", ...] (max 3), "week_days": [int, ...]|optional, "times_per_week": "int|optional" }
  - Response Payload: Created habit object
  - Success: 201 Created
  - Errors: 400 Bad Request (validation failed, e.g., invalid frequency_type, tags >3), 401 Unauthorized, 500 Internal Server Error

- **PATCH /api/habits/{habit_id}**
  - Description: Update a habit.
  - Query Parameters: None
  - Request Payload: Partial habit object (as in POST)
  - Response Payload: Updated habit object
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **DELETE /api/habits/{habit_id}**
  - Description: Soft delete a habit (move to trash).
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "message": "Habit moved to trash" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/habits/{habit_id}/restore**
  - Description: Restore a habit from trash.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Restored habit object
  - Success: 200 OK
  - Errors: 400 Bad Request (expired trash), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Habit Params

- **GET /api/habits/{habit_id}/params**
  - Description: List params for a habit.
  - Query Parameters: effective_date (date, optional)
  - Request Payload: None
  - Response Payload: Array of param objects
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/habits/{habit_id}/params**
  - Description: Create new param version.
  - Query Parameters: None
  - Request Payload: { "effective_from": "date", "effective_until": "date|optional", "target_value": "number|optional", "value_min": "number|optional", "value_max": "number|optional" }
  - Response Payload: Created param object
  - Success: 201 Created
  - Errors: 400 Bad Request (overlapping dates), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Checkin Portions

- **GET /api/habits/{habit_id}/checkins**
  - Description: List checkins for a habit with date range.
  - Query Parameters: start_date (date), end_date (date), page (int), limit (int)
  - Request Payload: None
  - Response Payload: { "checkins": [portion objects], "total": int }
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/habits/{habit_id}/checkins**
  - Description: Add a checkin portion (idempotent).
  - Query Parameters: None
  - Request Payload: { "local_date": "date", "value": "number", "note": "string|optional", "client_command_uuid": "uuid" }
  - Response Payload: Created portion object
  - Success: 201 Created
  - Errors: 400 Bad Request (invalid date >3 days back, value out of range), 401 Unauthorized, 404 Not Found, 409 Conflict (duplicate uuid), 500 Internal Server Error

- **PATCH /api/checkins/{portion_id}**
  - Description: Update a checkin portion.
  - Query Parameters: None
  - Request Payload: { "value": "number|optional", "note": "string|optional" }
  - Response Payload: Updated portion object
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **DELETE /api/checkins/{portion_id}**
  - Description: Soft delete a checkin portion.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "message": "Checkin moved to trash" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/checkins/{portion_id}/restore**
  - Description: Restore a checkin from trash.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Restored portion object
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Tag Catalog

- **GET /api/tags**
  - Description: List available tags.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Array of tag objects
  - Success: 200 OK
  - Errors: 500 Internal Server Error

### Tag Aliases

- **GET /api/tags/aliases**
  - Description: List tag aliases.
  - Query Parameters: effective_date (date, optional)
  - Request Payload: None
  - Response Payload: Array of alias objects
  - Success: 200 OK
  - Errors: 500 Internal Server Error

### PAT Tokens

- **GET /api/pat-tokens**
  - Description: List user's PAT tokens.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Array of token objects (without hashes)
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

- **POST /api/pat-tokens**
  - Description: Create a new PAT token.
  - Query Parameters: None
  - Request Payload: { "name": "string", "scopes": ["string", ...], "ttl_hours": "int|optional" }
  - Response Payload: { "token": "string", "token_id": "uuid", ... } (token shown only once)
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

- **DELETE /api/pat-tokens/{token_id}**
  - Description: Revoke a PAT token.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "message": "Token revoked" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### PAT Token Allows

- **POST /api/pat-tokens/{token_id}/allows**
  - Description: Add allow rule for PAT.
  - Query Parameters: None
  - Request Payload: { "allow_type": "ip|asn", "allow_value": "string" }
  - Response Payload: Created allow object
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### ICS Tokens

- **GET /api/ics-tokens**
  - Description: List user's ICS tokens.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Array of token objects (without hashes)
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

- **POST /api/ics-tokens**
  - Description: Create a new ICS token.
  - Query Parameters: None
  - Request Payload: { "name": "string" }
  - Response Payload: { "token": "string", "token_id": "uuid", ... }
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

- **DELETE /api/ics-tokens/{token_id}**
  - Description: Revoke an ICS token.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "message": "Token revoked" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **GET /api/ics/{token}**
  - Description: ICS feed endpoint (read-only, token-based).
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: ICS file content
  - Success: 200 OK (Content-Type: text/calendar)
  - Errors: 401 Unauthorized (invalid token), 410 Gone (revoked), 429 Too Many Requests, 500 Internal Server Error

### DSAR Requests

- **POST /api/dsar**
  - Description: Submit a DSAR request.
  - Query Parameters: None
  - Request Payload: { "request_type": "access|delete|rectify", "request_details": "object|optional" }
  - Response Payload: { "request_id": "uuid", "status": "received" }
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized (requires re-auth), 429 Too Many Requests, 500 Internal Server Error

- **GET /api/dsar/{request_id}**
  - Description: Get DSAR status.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: DSAR object
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Download Links

- **GET /api/downloads/{link_token}**
  - Description: Download file (one-time).
  - Query Parameters: password (string, optional)
  - Request Payload: None
  - Response Payload: File content (binary)
  - Success: 200 OK
  - Errors: 401 Unauthorized (invalid password), 410 Gone (expired or downloaded), 500 Internal Server Error

### Consents

- **GET /api/consents**
  - Description: List user's consents.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Array of consent objects
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

- **PATCH /api/consents/{consent_id}**
  - Description: Update consent (grant/revoke).
  - Query Parameters: None
  - Request Payload: { "granted": "boolean" }
  - Response Payload: Updated consent object
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Notifications

- **GET /api/notifications**
  - Description: Get notification settings.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: Array of notification objects
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

- **PATCH /api/notifications/{notification_id}**
  - Description: Update notification settings.
  - Query Parameters: None
  - Request Payload: { "enabled": "boolean|optional", "digest_hour": "int|optional", "quiet_hours_start": "int|optional", "quiet_hours_end": "int|optional", "silent_days": [int, ...]|optional }
  - Response Payload: Updated notification object
  - Success: 200 OK
  - Errors: 400 Bad Request (invalid hours), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Audit Logs

- **GET /api/audit-logs**
  - Description: List audit logs (admin only or self).
  - Query Parameters: start_date (date), end_date (date), action (string)
  - Request Payload: None
  - Response Payload: Array of log objects (PII masked)
  - Success: 200 OK
  - Errors: 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

### Sync Log

- **GET /api/sync-logs**
  - Description: List sync logs for debugging.
  - Query Parameters: device_id (string), status (string)
  - Request Payload: None
  - Response Payload: Array of sync log objects
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

### Business Logic Endpoints

- **GET /api/habits/today**
  - Description: Get habits for today with completion status.
  - Query Parameters: filter_tags (array)
  - Request Payload: None
  - Response Payload: Array of habits with { ..., "completed": boolean, "progress": number }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 500 Internal Server Error

- **GET /api/stats/heatmap**
  - Description: Get heatmap data for habits.
  - Query Parameters: start_date (date), end_date (date), habit_id (uuid, optional)
  - Request Payload: None
  - Response Payload: { "data": [ { "date": "date", "value": number, "completed": boolean }, ... ] }
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

- **POST /api/exports**
  - Description: Request data export.
  - Query Parameters: None
  - Request Payload: { "start_date": "date", "end_date": "date", "format": "csv|json", "raw": "boolean" }
  - Response Payload: { "export_id": "uuid", "status": "pending" }
  - Success: 202 Accepted
  - Errors: 400 Bad Request (date range exceeds plan limit), 401 Unauthorized, 429 Too Many Requests, 500 Internal Server Error

- **GET /api/exports/{export_id}**
  - Description: Get export status and download link if ready.
  - Query Parameters: None
  - Request Payload: None
  - Response Payload: { "status": "pending|ready|failed", "download_link": "string|null" }
  - Success: 200 OK
  - Errors: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

- **POST /api/imports**
  - Description: Import data from CSV.
  - Query Parameters: None
  - Request Payload: Multipart form with file and { "dry_run": "boolean", "tag_map": "object|optional" }
  - Response Payload: { "import_id": "uuid", "status": "processed", "report": "object" }
  - Success: 202 Accepted
  - Errors: 400 Bad Request (invalid CSV), 401 Unauthorized, 500 Internal Server Error

## 3. Authentication and Authorization

- Mechanism: Supabase Auth with JWT tokens for session-based authentication. Supports standard email/password login with email confirmation. Personal Access Tokens (PAT) for API read-only access, validated via token_hash comparison. Re-authentication required for sensitive actions (e.g., DSAR, token revocation) using Supabase's re-auth flow. Row-Level Security (RLS) in Supabase enforces data access at the database level. Rate limiting: 30 requests/min per user for mutations, implemented via Supabase Edge Functions. IP/ASN allowlists for PAT. All endpoints require authentication except public ICS feeds (token-based).

## 4. Validation and Business Logic

### Validation Conditions

- **Profiles**: email NOT NULL; timezone DEFAULT 'UTC'; locale DEFAULT 'en'; no direct INSERT/DELETE (managed by Supabase Auth).
- **Habits**: name NOT NULL; frequency_type CHECK IN ('DAILY', 'WEEKLY', 'TIMES_PER_WEEK'); target_value numeric(10,3); unit_kind CHECK IN ('count', 'volume', 'distance', 'time'); tags jsonb array length <=3; week_days integer[]; times_per_week integer. API enforces CHECK constraints and max tags.
- **Habit Params**: effective_from NOT NULL; EXCLUDE on overlapping dateranges. API checks for overlaps before insert.
- **Checkin Portions**: value NOT NULL DEFAULT 1; client_command_uuid NOT NULL UNIQUE per habit; local_date NOT NULL; value clamped to value_min/value_max from habit_params. Edits limited to <=3 days back.
- **Tag Catalog**: name NOT NULL UNIQUE; display_name jsonb NOT NULL.
- **Tag Aliases**: old_tag/new_tag NOT NULL; effective_from NOT NULL.
- **PAT Tokens**: name NOT NULL; token_hash NOT NULL; scopes text[]; ttl_hours DEFAULT 24; expires_at GENERATED.
- **PAT Token Allows**: allow_type CHECK IN ('ip', 'asn'); allow_value NOT NULL.
- **ICS Tokens**: name NOT NULL; token_hash NOT NULL.
- **DSAR Requests**: request_type CHECK IN ('access', 'delete', 'rectify'); status DEFAULT 'received' CHECK IN (...); priority DEFAULT 'normal' CHECK IN (...).
- **Download Links**: link_token NOT NULL; expires_at NOT NULL.
- **Consents**: consent_type NOT NULL; granted NOT NULL; consent_text NOT NULL; consent_version NOT NULL.
- **Notifications**: type CHECK IN ('digest', 'reminder'); digest_hour CHECK 0-23; quiet_hours_start/end CHECK 0-23; silent_days integer[].
- **Audit Logs**: action NOT NULL; resource_type NOT NULL.
- **Sync Log**: device_id NOT NULL; command_type NOT NULL; command_uuid NOT NULL; status CHECK IN ('pending', 'applied', 'failed').

### Business Logic Implementation

- **Offline Sync and Idempotency**: Handled in checkins POST with client_command_uuid for deduplication and LWW via logical_clock.
- **Completion Calculation**: In /habits/today and /stats/heatmap, use materialized view checkins_daily for SUM(value) >= target_value.
- **X/Week Goals**: In /habits/today, calculate progress as min(done/X,1) with risk states based on days left.
- **Trash and Restore**: Soft deletes set deleted_at/trash_expires_at; restore clears them and resolves conflicts (e.g., rename on collision).
- **Tag Filtering and Aliasing**: In list endpoints, apply GIN index for tags; aliases resolved by effective_from in queries.
- **Exports and Imports**: Exports generate one-time download links with plan limits (Free: 90 days, Pro: 24 months); imports use dry-run with fuzzy matching and undo via batch delete.
- **ICS Feed**: Generates ICS with stable UIDs, handles edits with SEQUENCE/CANCEL.
- **DSAR Processing**: Queue with priorities, resume checkpoints, throttle mode; delivers via encrypted ZIP with single-use links.
- **Rate Limiting and Security**: Implemented in Supabase Edge Functions; audit logs triggered on sensitive operations.
- **Performance**: Use indexes for queries (e.g., idx_habits_user_deleted); pagination and limits to prevent overload.
