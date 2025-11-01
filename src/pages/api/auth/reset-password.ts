import type { APIRoute } from 'astro';
import { ResetPasswordRequestSchema, AuthError, AuthResponse } from '../../../types.ts';
import { z } from 'zod';

// Map Supabase errors to custom AuthError
function mapSupabaseError(error: any): AuthError {
  let code = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred';

  switch (error.code) {
    case 'P1001':
      code = 'INVALID_EMAIL';
      message = 'Invalid email';
      break;
    default:
      code = error.code || 'RESET_ERROR';
      message = error.message || 'Reset failed';
  }

  return { code, message };
}

const POST: APIRoute = async ({ locals, request }) => {
  // POST for requesting reset email
  try {
    const body = await request.json();
    const validatedData = ResetPasswordRequestSchema.safeParse(body);

    if (!validatedData.success) {
      const errorMessage = validatedData.error.errors[0].message;
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: errorMessage } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = validatedData.data;
    const origin = import.meta.env.SITE_URL || 'http://localhost:3000';
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password?type=update`
    });

    if (error) {
      const authError = mapSupabaseError(error);
      return new Response(
        JSON.stringify({ data: null, error: authError } as AuthResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success: email sent
    return new Response(
      JSON.stringify({
        data: { message: 'Password reset email sent' },
        error: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Reset request error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } as AuthError
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

const ResetPasswordUpdateSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    const body = await request.json();
    const validatedData = ResetPasswordUpdateSchema.safeParse(body);

    if (!validatedData.success) {
      const errorMessage = validatedData.error.errors[0].message;
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: errorMessage } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { newPassword } = validatedData.data;
    const { error } = await locals.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      const authError = mapSupabaseError(error);
      return new Response(
        JSON.stringify({ data: null, error: authError } as AuthResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        data: { message: 'Password updated successfully' },
        error: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Password update error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } as AuthError
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export { POST, PATCH };
