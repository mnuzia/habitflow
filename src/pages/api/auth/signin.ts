import type { APIRoute } from 'astro';
import { SigninSchema, AuthError, AuthResponse } from '../../../types.ts';
import { z } from 'zod';

// Map Supabase errors to custom AuthError
function mapSupabaseError(error: any): AuthError {
  let code = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred';

  switch (error.code) {
    case 'P1001':
      code = 'INVALID_CREDENTIALS';
      message = 'Invalid email or password';
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
    const validatedData = SigninSchema.safeParse(body);

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
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const authError = mapSupabaseError(error);
      return new Response(
        JSON.stringify({ data: null, error: authError } as AuthResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success: return session
    return new Response(
      JSON.stringify({
        data: { user: data.user, session: data.session },
        error: null
      } as AuthResponse<{ user: any; session: any }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Signin error:', err);
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
