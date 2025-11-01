export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { profileService } from "../../../lib/services/profileService";

const updateProfileSchema = z
  .object({
    display_name: z.string().optional(),
    locale: z.enum(["en", "pl"]).optional(), // Assuming supported locales based on project context
    timezone: z
      .string()
      .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), {
        message: "Invalid IANA timezone",
      })
      .optional(),
  })
  .strict();

const GET: APIRoute = async ({ locals }) => {
  try {
    const { supabase } = locals;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const profile = await profileService.getProfile(user.id, supabase);
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(profile), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    const { supabase } = locals;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors,
        }),
        { status: 400 }
      );
    }

    const updatedProfile = await profileService.updateProfile(user.id, validation.data, supabase);
    if (!updatedProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};

export { GET, PATCH };
