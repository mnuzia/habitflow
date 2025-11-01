import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./me";
import { profileService } from "../../../lib/services/profileService";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { ProfileDto } from "../../../types";

vi.mock("../../../lib/services/profileService");

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

const mockUpdatedProfile: ProfileDto = {
  ...mockProfile,
  display_name: "Updated User",
};

const mockSupabase: SupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const mockLocals = {
  supabase: mockSupabase,
};

const mockRequest = new Request("http://localhost", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ display_name: "Updated User" }),
});

// vi.mock("../../../lib/services/profileService", () => ({
//   profileService: {
//     getProfile: vi.fn(),
//     updateProfile: vi.fn(),
//   },
// }));

describe("API Route /api/profiles/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (profileService.getProfile as vi.Mock).mockResolvedValue(mockProfile);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
  });

  describe("GET handler", () => {
    it("should return profile on success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET({ locals: mockLocals } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockProfile);
      expect(profileService.getProfile).toHaveBeenCalledWith("test-user", mockSupabase);
    });

    it("should return 401 on unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET({ locals: mockLocals } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
      expect(profileService.getProfile).not.toHaveBeenCalled();
    });

    it("should return 404 if profile not found", async () => {
      (profileService.getProfile as vi.Mock).mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET({ locals: mockLocals } as any);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({ error: "Profile not found" });
    });

    it("should return 500 on server error", async () => {
      const error = new Error("Service error");
      (profileService.getProfile as vi.Mock).mockRejectedValue(error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET({ locals: mockLocals } as any);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });
  });

  describe("PATCH handler", () => {
    it("should update profile on success", async () => {
      (profileService.updateProfile as vi.Mock).mockResolvedValue(mockUpdatedProfile);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH({ locals: mockLocals, request: mockRequest } as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockUpdatedProfile);
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        "test-user",
        { display_name: "Updated User" },
        mockSupabase
      );
    });

    it("should return 401 on unauthorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH({ locals: mockLocals, request: mockRequest } as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it("should return 400 on validation failure", async () => {
      const invalidRequest = new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid_field: "test", timezone: "InvalidTZ" }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH({ locals: mockLocals, request: invalidRequest } as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeDefined(); // Zod errors array
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it("should return 404 if profile not found after update", async () => {
      (profileService.updateProfile as vi.Mock).mockResolvedValue(null);

      // Create a fresh supabase mock for this test
      const testSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as any;

      const testLocals = { supabase: testSupabase };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH({ locals: testLocals, request: mockRequest } as any);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({ error: "Profile not found" });
    });

    it("should return 500 on server error", async () => {
      const error = new Error("Update error");
      (profileService.updateProfile as vi.Mock).mockRejectedValue(error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PATCH({ locals: mockLocals, request: mockRequest } as any);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });
  });
});
