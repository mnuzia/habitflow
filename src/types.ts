export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Import Database type from database.types.ts (assuming it's imported or available)
import type { Database } from "./db/database.types";

// Base entity types derived from Database
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type HabitParam = Database["public"]["Tables"]["habit_params"]["Row"];
export type CheckinPortion = Database["public"]["Tables"]["checkin_portions"]["Row"];
export type TagCatalog = Database["public"]["Tables"]["tag_catalog"]["Row"];
export type TagAlias = Database["public"]["Tables"]["tag_aliases"]["Row"];
export type PatToken = Database["public"]["Tables"]["pat_tokens"]["Row"];
export type PatTokenAllow = Database["public"]["Tables"]["pat_token_allows"]["Row"];
export type IcsToken = Database["public"]["Tables"]["ics_tokens"]["Row"];
export type DsarRequest = Database["public"]["Tables"]["dsar_requests"]["Row"];
export type DownloadLink = Database["public"]["Tables"]["download_links"]["Row"];
export type Consent = Database["public"]["Tables"]["consents"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type SyncLog = Database["public"]["Tables"]["sync_log"]["Row"];

// DTOs for API Responses

// Profile DTO: Excludes internal fields, includes all relevant profile data
export type ProfileDto = Pick<
  Profile,
  | "user_id"
  | "email"
  | "display_name"
  | "locale"
  | "timezone"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "scheduled_for_deletion_until"
>;

// Habit DTO: Includes core habit fields, excludes deleted_at and trash_expires_at for active views
export type HabitDto = Pick<
  Habit,
  | "habit_id"
  | "name"
  | "description"
  | "frequency_type"
  | "target_value"
  | "unit_kind"
  | "value_min"
  | "value_max"
  | "times_per_week"
  | "week_days"
  | "tags"
  | "created_at"
  | "updated_at"
> & {
  params?: HabitParam[]; // Associated params
};

// Habit List Response DTO
export interface HabitListDto {
  habits: HabitDto[];
  total: number;
  page: number;
  limit: number;
}

// Habit Param DTO: Direct mapping with optional fields for API
export type HabitParamDto = Pick<
  HabitParam,
  | "param_id"
  | "habit_id"
  | "effective_from"
  | "effective_until"
  | "target_value"
  | "value_min"
  | "value_max"
  | "created_at"
>;

// Checkin Portion DTO: Excludes server/internal fields for client
export type CheckinPortionDto = Pick<
  CheckinPortion,
  | "portion_id"
  | "habit_id"
  | "local_date"
  | "value"
  | "note"
  | "client_command_uuid"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "trash_expires_at"
>;

// Checkin List Response DTO
export interface CheckinListDto {
  checkins: CheckinPortionDto[];
  total: number;
}

// Tag DTO: From tag_catalog
export type TagDto = Pick<TagCatalog, "tag_id" | "name" | "display_name" | "created_at">;

// Tag Alias DTO
export type TagAliasDto = Pick<TagAlias, "alias_id" | "old_tag" | "new_tag" | "effective_from" | "created_at">;

// PAT Token DTO: Excludes sensitive hash fields
export type PatTokenDto = Omit<PatToken, "token_hash"> & {
  allows?: PatTokenAllow[]; // Associated allows
};

// PAT Token Allow DTO
export type PatTokenAllowDto = Pick<PatTokenAllow, "allow_id" | "allow_type" | "allow_value" | "created_at">;

// ICS Token DTO: Excludes hash
export type IcsTokenDto = Omit<IcsToken, "token_hash">;

// DSAR DTO: Includes status and timestamps
export type DsarDto = Pick<
  DsarRequest,
  | "request_id"
  | "request_type"
  | "status"
  | "priority"
  | "request_details"
  | "resume_checkpoint"
  | "throttle_mode"
  | "created_at"
  | "updated_at"
  | "closed_at"
  | "delivered_at"
>;

// Consent DTO
export type ConsentDto = Pick<
  Consent,
  | "consent_id"
  | "consent_type"
  | "consent_text"
  | "consent_version"
  | "granted"
  | "granted_at"
  | "revoked_at"
  | "created_at"
>;

// Notification DTO
export type NotificationDto = Pick<
  Notification,
  | "notification_id"
  | "type"
  | "enabled"
  | "digest_hour"
  | "quiet_hours_start"
  | "quiet_hours_end"
  | "silent_days"
  | "created_at"
  | "updated_at"
>;

// Audit Log DTO: Masked PII, excludes sensitive fields like ip_address, user_agent if needed
export type AuditLogDto = Pick<
  AuditLog,
  "log_id" | "action" | "resource_type" | "resource_id" | "old_values" | "new_values" | "created_at"
> & {
  user_id?: string; // Optional for self-view
};

// Sync Log DTO
export type SyncLogDto = Pick<
  SyncLog,
  "sync_id" | "command_uuid" | "command_type" | "device_id" | "status" | "error_message" | "created_at" | "applied_at"
>;

// Habit Today DTO: Extends HabitDto with computed fields
export type HabitTodayDto = HabitDto & {
  completed: boolean;
  progress: number;
};

// Heatmap Data DTO
export interface HeatmapDataItem {
  date: string;
  value: number;
  completed: boolean;
}

export interface HeatmapDataDto {
  data: HeatmapDataItem[];
}

// Export Status DTO
export interface ExportStatusDto {
  status: "pending" | "ready" | "failed";
  download_link?: string;
}

// Command Models for API Requests (Input DTOs)

// Update Profile Command: Partial updates
export type UpdateProfileCommand = Partial<Pick<Profile, "display_name" | "locale" | "timezone">>;

// Create Habit Command: Based on Habit insert, with validations implied
export type CreateHabitCommand = Pick<
  Habit,
  | "name"
  | "description"
  | "frequency_type"
  | "target_value"
  | "unit_kind"
  | "value_min"
  | "value_max"
  | "times_per_week"
  | "week_days"
> & {
  tags: string[]; // Array, max 3 enforced in API
};

export type UpdateHabitCommand = Partial<CreateHabitCommand> & { habit_id: string };

// Create Habit Param Command
export type CreateHabitParamCommand = Pick<
  HabitParam,
  "effective_from" | "effective_until" | "target_value" | "value_min" | "value_max"
> & {
  habit_id: string;
};

// Create Checkin Command
export type CreateCheckinCommand = Pick<CheckinPortion, "local_date" | "value" | "note" | "client_command_uuid"> & {
  habit_id: string;
  portion_id?: string; // Optional for idempotency
};

export type UpdateCheckinCommand = Partial<Pick<CheckinPortion, "value" | "note">> & {
  portion_id: string;
};

// Create PAT Token Command
export interface CreatePatTokenCommand {
  name: string;
  scopes: string[];
  ttl_hours?: number;
}

// Create PAT Allow Command
export type CreatePatAllowCommand = {
  allow_type: "ip" | "asn";
  allow_value: string;
} & {
  token_id: string;
};

// Create ICS Token Command
export interface CreateIcsTokenCommand {
  name: string;
}

// Create DSAR Command
export interface CreateDsarCommand {
  request_type: "access" | "delete" | "rectify";
  request_details?: Json;
}

// Update Consent Command
export type UpdateConsentCommand = {
  granted: boolean;
} & {
  consent_id: string;
};

// Update Notification Command
export type UpdateNotificationCommand = Partial<
  Pick<Notification, "enabled" | "digest_hour" | "quiet_hours_start" | "quiet_hours_end" | "silent_days">
> & {
  notification_id: string;
};

// Create Export Command
export interface CreateExportCommand {
  start_date: string;
  end_date: string;
  format: "csv" | "json";
  raw: boolean;
}

// Create Import Command (simplified, as multipart handled separately)
export interface CreateImportCommand {
  dry_run: boolean;
  tag_map?: Record<string, string>;
}
