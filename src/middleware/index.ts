import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = supabaseClient;
  context.locals.supabase = supabase;

  // Fetch session
  const session = await supabase.auth.getSession();
  context.locals.session = session.data.session;

  // Define protected routes (extend as more pages are added)
  const protectedRoutes = [
    '/api/profiles',
    '/habits',
    '/profile',
    '/stats'
    // Add more like /dashboard, etc.
  ];

  const { pathname } = new URL(context.request.url);

  // Check if current path is protected and user is not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !context.locals.session) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/auth/login'
      }
    });
  }

  return next();
});
