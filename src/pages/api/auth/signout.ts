import type { APIRoute } from 'astro';
import { AuthResponse, AuthError } from '../../../types.ts';

const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: error.code || 'LOGOUT_ERROR', message: 'Logout failed' } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        data: { message: 'Logged out successfully' },
        error: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Signout error:', err);
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
