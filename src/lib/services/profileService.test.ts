import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileService } from "./profileService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileDto } from "../../types";
import type { UpdateProfileCommand } from "../../types";

const mockSupabase: SupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(() => ({ data: { user: { id: "test-user" } }, error: null })),
  },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const mockLogAudit = vi.fn();

// Mock the internal _logAudit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.spyOn(profileService as any, "_logAudit").mockImplementation(mockLogAudit);

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the from() method to return a query builder object
    (mockSupabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn(),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn(),
            }),
          }),
        }),
      }),
    }));
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

      // Mock the query chain to return success
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEqDeletedAt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqDeletedAt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

      (mockSupabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await profileService.getProfile("test-user", mockSupabase);

      expect(result).toEqual(mockProfile);
      expect(mockLogAudit).toHaveBeenCalledWith(mockSupabase, "get_profile", "test-user", null, mockProfile, null);
    });

    it("should return null if profile not found", async () => {
      // Mock the query chain to return null data
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEqDeletedAt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqDeletedAt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

      (mockSupabase.from as any).mockReturnValue({ select: mockSelect });

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
      // Mock the query chain to return error
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error });
      const mockEqDeletedAt = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqDeletedAt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

      (mockSupabase.from as any).mockReturnValue({ select: mockSelect });

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

      // Mock the update query chain
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqDeletedAt = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqDeletedAt });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUserId });

      (mockSupabase.from as any).mockReturnValue({ update: mockUpdate });

      const result = await profileService.updateProfile("test-user", updates, mockSupabase);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockLogAudit).toHaveBeenCalledWith(
        mockSupabase,
        "update_profile",
        "test-user",
        mockCurrentProfile,
        mockUpdatedProfile,
        null
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
      const updates: UpdateProfileCommand = { display_name: "New Name" };

      vi.spyOn(profileService, "getProfile").mockResolvedValueOnce(mockCurrentProfile);

      const error = new Error("Update failed");
      // Mock the update query chain with error
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqDeletedAt = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqDeletedAt });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUserId });

      (mockSupabase.from as any).mockReturnValue({ update: mockUpdate });

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
