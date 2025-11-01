import type { APIRoute } from 'astro';
import { z } from 'zod';
import { AuthError, AuthResponse } from '../../../types.ts';

// Schema for resend request
const ResendSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const POST: APIRoute = async ({ locals, request }) => {
  try {
    const body = await request.json();
    const validatedData = ResendSchema.safeParse(body);

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
    const { data, error } = await locals.supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/auth/verify-email`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          data: null,
          error: { code: error.code || 'RESEND_ERROR', message: 'Failed to resend email. Please try again later.' } as AuthError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        data: { message: 'Verification email resent successfully. Please check your inbox.' },
        error: null
      } as AuthResponse<{ message: string }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Resend verification error:', err);
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
