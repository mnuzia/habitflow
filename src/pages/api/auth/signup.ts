import type { APIRoute } from 'astro';
import { SignupSchema, AuthError, AuthResponse } from '../../../types.ts';
import { z } from 'zod';
import type { Session } from '@supabase/supabase-js';

// Map Supabase errors to custom AuthError
function mapSupabaseError(error: any): AuthError {
  let code = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred';

  switch (error.code) {
    case 'P2002':
      code = 'EMAIL_ALREADY_EXISTS';
      message = 'Email already exists';
      break;
    case 'P0011':
      code = 'WEAK_PASSWORD';
      message = 'Password is too weak';
      break;
    default:
      code = error.code || 'AUTH_ERROR';
      message = error.message || 'Authentication failed';
  }

  return { code, message };
}

const POST: APIRoute = async ({ locals, request }) => {
  try {
    const body = await request.json();
    const validatedData = SignupSchema.safeParse(body);

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

    const { email, password } = validatedData.data;
    const origin = import.meta.env.SITE_URL || 'http://localhost:3000';
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/verify-email`
      }
    });

    if (error) {
      const authError = mapSupabaseError(error);
      return new Response(
        JSON.stringify({ data: null, error: authError } as AuthResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success: User created, email sent, no session yet (unconfirmed)
    return new Response(
      JSON.stringify({
        data: { message: 'Verification email sent. Please check your inbox.' },
        error: null
      } as AuthResponse<{ message: string }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } as AuthError
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export { POST };
