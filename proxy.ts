import { auth } from '@/app/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
	const session = await auth();
	const pathname = request.nextUrl.pathname;

	// Protect dashboard routes
	if (pathname.startsWith('/dashboard')) {
		if (!session) {
			return NextResponse.redirect(
				new URL(`/auth/login?callbackUrl=${pathname}`, request.url),
			);
		}
	}

	// Redirect authenticated users away from auth pages
	if (pathname.startsWith('/auth') && session) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/:path*', '/auth/:path*'],
};
