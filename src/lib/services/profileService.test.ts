import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileService } from "./profileService";
import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDto } from "../../types";
import type { UpdateProfileCommand } from "../../types";

const mockSupabase = vi.fn() as unknown as SupabaseClient;
const mockLogAudit = vi.fn();

vi.mock("../../db/supabase.client", () => ({
  SupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: "test-user" } }, error: null })),
    },
  })),
}));

// Mock the internal _logAudit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.spyOn(profileService as any, "_logAudit").mockImplementation(mockLogAudit);

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn(),
          }),
        }),
      }),
    });
  });

  describe("getProfile", () => {
    it("should return profile on success", async () => {
      const mockProfile: ProfileDto = {
        user_id: "test-user",
        email: "test@example.com",
        display_name: "Test User",
        locale: "en",
        timezone: "UTC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        scheduled_for_deletion_until: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from("profiles").select as any).mockReturnValue({
        eq: vi.fn((field: string) => {
          if (field === "user_id") {
            return { single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) };
          }
          if (field === "deleted_at") {
            return { single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) };
          }
          return { single: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }),
      });

      const result = await profileService.getProfile("test-user", mockSupabase);

      expect(result).toEqual(mockProfile);
      expect(mockLogAudit).toHaveBeenCalledWith(mockSupabase, "get_profile", "test-user", null, mockProfile, undefined);
    });

    it("should return null if profile not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from("profiles").select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = await profileService.getProfile("test-user", mockSupabase);

      expect(result).toBeNull();
      expect(mockLogAudit).toHaveBeenCalledWith(
        mockSupabase,
        "get_profile",
        "test-user",
        null,
        null,
        "Profile not found"
      );
    });

    it("should throw error on invalid userId", async () => {
      await expect(profileService.getProfile("", mockSupabase)).rejects.toThrow("Invalid user ID");
      expect(mockLogAudit).toHaveBeenCalledWith(mockSupabase, "get_profile", "", null, null, "Invalid user ID");
    });

    it("should throw error on Supabase error", async () => {
      const error = new Error("DB error");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from("profiles").select as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error }),
        }),
      });

      await expect(profileService.getProfile("test-user", mockSupabase)).rejects.toThrow("Failed to fetch profile");
      expect(mockLogAudit).toHaveBeenCalledWith(mockSupabase, "get_profile", "test-user", null, null, "DB error");
    });
  });

  describe("updateProfile", () => {
    it("should update profile on success", async () => {
      const mockCurrentProfile: ProfileDto = {
        user_id: "test-user",
        email: "old@example.com",
        display_name: "Old Name",
        locale: "en",
        timezone: "UTC",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        scheduled_for_deletion_until: null,
      };

      const mockUpdatedProfile: ProfileDto = { ...mockCurrentProfile, display_name: "New Name" };

      const updates: UpdateProfileCommand = { display_name: "New Name" };

      // Mock getProfile to return current
      vi.spyOn(profileService, "getProfile").mockResolvedValueOnce(mockCurrentProfile);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from("profiles").update as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
          }),
        }),
      });

      const result = await profileService.updateProfile("test-user", updates, mockSupabase);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockLogAudit).toHaveBeenCalledWith(
        mockSupabase,
        "update_profile",
        "test-user",
        mockCurrentProfile,
        mockUpdatedProfile,
        undefined
      );
    });

    it("should return null if no current profile", async () => {
      const updates: UpdateProfileCommand = { display_name: "New Name" };

      vi.spyOn(profileService, "getProfile").mockResolvedValueOnce(null);

      const result = await profileService.updateProfile("test-user", updates, mockSupabase);

      expect(result).toBeNull();
    });

    it("should throw on invalid input", async () => {
      const updates: UpdateProfileCommand = {};

      await expect(profileService.updateProfile("test-user", updates, mockSupabase)).rejects.toThrow("Invalid input");
      expect(mockLogAudit).toHaveBeenCalledWith(mockSupabase, "update_profile", "test-user", null, {}, "Invalid input");
    });

    it("should throw on update error", async () => {
      const mockCurrentProfile: ProfileDto = {
        /* ... */
      };
      const updates: UpdateProfileCommand = { display_name: "New Name" };

      vi.spyOn(profileService, "getProfile").mockResolvedValueOnce(mockCurrentProfile);

      const error = new Error("Update failed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.from("profiles").update as any).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error }),
          }),
        }),
      });

      await expect(profileService.updateProfile("test-user", updates, mockSupabase)).rejects.toThrow(
        "Failed to update profile"
      );
      expect(mockLogAudit).toHaveBeenCalledWith(
        mockSupabase,
        "update_profile",
        "test-user",
        mockCurrentProfile,
        expect.any(Object),
        "Update failed"
      );
    });
  });
});
