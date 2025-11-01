import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDto, AuditLog } from "../../types";
import type { UpdateProfileCommand } from "../../types";

export const profileService = {
  async getProfile(userId: string, supabase: SupabaseClient): Promise<ProfileDto | null> {
    // Guard: Validate userId
    if (!userId) {
      await this._logAudit(supabase, "get_profile", userId, null, null, "Invalid user ID");
      throw new Error("Invalid user ID");
    }

    try {
      // Query profile with RLS (user_id = auth.uid())
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          email,
          display_name,
          locale,
          timezone,
          created_at,
          updated_at,
          deleted_at,
          scheduled_for_deletion_until
        `
        )
        .eq("user_id", userId)
        .single()
        .eq("deleted_at", null); // Filter soft-deleted

      if (error) {
        await this._logAudit(supabase, "get_profile", userId, null, null, error.message);
        throw new Error("Failed to fetch profile");
      }

      if (!profile) {
        await this._logAudit(supabase, "get_profile", userId, null, null, "Profile not found");
        return null;
      }

      // Log success
      await this._logAudit(supabase, "get_profile", userId, null, profile, null);

      // Transform to DTO (already matches)
      return profile as ProfileDto;
    } catch (error) {
      await this._logAudit(supabase, "get_profile_error", userId, null, null, (error as Error).message);
      throw error;
    }
  },

  async updateProfile(
    userId: string,
    updates: UpdateProfileCommand,
    supabase: SupabaseClient
  ): Promise<ProfileDto | null> {
    // Guard: Validate inputs
    if (!userId || Object.keys(updates).length === 0) {
      await this._logAudit(supabase, "update_profile", userId, null, updates, "Invalid input");
      throw new Error("Invalid input");
    }

    // Sanitize inputs (trim strings)
    const sanitizedUpdates = {
      ...updates,
      display_name: updates.display_name?.trim(),
      locale: updates.locale,
      timezone: updates.timezone,
    };

    try {
      // Fetch current profile for old_values
      const currentProfile = await this.getProfile(userId, supabase);
      if (!currentProfile) {
        return null;
      }

      // Perform update with RLS (user_id = auth.uid())
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(sanitizedUpdates)
        .eq("user_id", userId)
        .select(
          `
          user_id,
          email,
          display_name,
          locale,
          timezone,
          created_at,
          updated_at,
          deleted_at,
          scheduled_for_deletion_until
        `
        )
        .single()
        .eq("deleted_at", null);

      if (error) {
        await this._logAudit(supabase, "update_profile", userId, currentProfile, sanitizedUpdates, error.message);
        throw new Error("Failed to update profile");
      }

      if (!updatedProfile) {
        await this._logAudit(
          supabase,
          "update_profile",
          userId,
          currentProfile,
          sanitizedUpdates,
          "Profile not found after update"
        );
        return null;
      }

      // Log success
      await this._logAudit(supabase, "update_profile", userId, currentProfile, updatedProfile, null);

      // Transform to DTO
      return updatedProfile as ProfileDto;
    } catch (error) {
      await this._logAudit(supabase, "update_profile_error", userId, null, sanitizedUpdates, (error as Error).message);
      throw error;
    }
  },

  // Internal helper for audit logging (no 'private' in object literal)
  async _logAudit(
    supabase: SupabaseClient,
    action: string,
    userId: string,
    oldValues: ProfileDto | null,
    newValues: ProfileDto | UpdateProfileCommand | null,
    errorMessage?: string
  ): Promise<void> {
    const logEntry: Partial<AuditLog> = {
      action,
      resource_type: "profile",
      resource_id: userId,
      old_values: oldValues ? { ...oldValues } : null, // Mask PII if needed
      new_values: newValues ? { ...newValues } : null,
      user_id: userId,
    };

    if (errorMessage) {
      logEntry.error_message = errorMessage; // Assuming AuditLog has error_message field; adjust if not
    }

    const { error } = await supabase.from("audit_logs").insert(logEntry);

    if (error) {
      // Log failure but don't throw to avoid breaking audit
    }
  },
};
