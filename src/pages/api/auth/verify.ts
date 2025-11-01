import type { APIRoute } from 'astro';
import { AuthResponse, AuthError } from '../../../types.ts';

// No Zod needed, but validate presence
const POST: APIRoute = async ({ locals, request }) => {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'MISSING_TOKENS', message: 'Access and refresh tokens required' } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await locals.supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: 'VERIFICATION_FAILED', message: error.message || 'Invalid or expired token' } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        data: { message: 'Email verified successfully' },
        error: null
      } as AuthResponse<{ message: string }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Verify error:', err);
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
