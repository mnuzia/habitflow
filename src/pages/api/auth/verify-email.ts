import type { APIRoute } from 'astro';
import { AuthError, AuthResponse } from '../../../types.ts';

// Map Supabase errors to custom AuthError
function mapSupabaseError(error: any): AuthError {
  let code = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred';

  switch (error.code) {
    case 'P1009':
      code = 'INVALID_TOKEN';
      message = 'Invalid or expired token';
      break;
    default:
      code = error.code || 'VERIFY_ERROR';
      message = error.message || 'Verification failed';
  }

  return { code, message };
}

const GET: APIRoute = async ({ locals, url }) => {
  try {
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'MISSING_TOKEN', message: 'Token is required' } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await locals.supabase.auth.verifyEmail({
      token
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
        data: { user: data.user, session: data.session },
        error: null
      } as AuthResponse<{ user: any; session: any }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Verify email error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } as AuthError
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export { GET };
