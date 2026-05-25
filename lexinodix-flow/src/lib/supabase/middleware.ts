import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  // BUG FIX: response must be rebuilt correctly each time cookies are set/removed.
  // The previous implementation was re-creating NextResponse.next() on each
  // cookie mutation but losing the original request headers — this could cause
  // subtle issues with downstream middleware or server components.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Must set on both request AND response so the session propagates
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() — this refreshes the session token.
  // Do NOT call getSession() here; it can return stale data from cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Protected routes: redirect to login if not authenticated ──
  const protectedPaths = [
    '/dashboard',
    '/workspace',
    '/notes',
    '/files',
    '/chat',
    '/search',
    '/settings',
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth pages: redirect logged-in users to dashboard ──
  // BUG FIX: was using array.includes() which only matches exact strings.
  // /auth/callback was NOT in the list so OAuth callbacks were being redirected
  // back to dashboard mid-flow, breaking Google/GitHub OAuth.
  // FIX: only redirect the specific login/signup pages, never /auth/callback.
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/';

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
