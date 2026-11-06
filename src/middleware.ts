import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets and Next.js internal files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is configured with real credentials, handle server-side session & protection
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicRoute = pathname === '/login' || pathname === '/';

    // 1. Unauthenticated user trying to access protected dashboards
    if (!user && (pathname.startsWith('/teacher') || pathname.startsWith('/parent'))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }

    // 2. Authenticated user
    if (user) {
      const role = (user.user_metadata?.role as string) || 'TEACHER';

      // Redirect away from login if already authenticated
      if (isPublicRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = role === 'TEACHER' ? '/teacher/dashboard' : '/parent/dashboard';
        return NextResponse.redirect(redirectUrl);
      }

      // Enforce strict role boundary (PARENT cannot access /teacher routes)
      if (role === 'PARENT' && pathname.startsWith('/teacher')) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/parent/dashboard';
        return NextResponse.redirect(redirectUrl);
      }

      // Teacher accessing parent routes
      if (role === 'TEACHER' && pathname.startsWith('/parent')) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/teacher/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
