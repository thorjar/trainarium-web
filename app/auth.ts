import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function refreshApiToken(currentToken: string): Promise<string | null> {
	try {
		const res = await fetch(`${API_URL}/api/auth/refresh`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${currentToken}` },
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data.token ?? null;
	} catch {
		return null;
	}
}

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Invalid credentials');
				}

				try {
					const response = await fetch(`${API_URL}/api/auth/login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							email: credentials.email,
							password: credentials.password,
						}),
					});

					if (!response.ok) {
						throw new Error('Invalid credentials');
					}

					const data = await response.json();

					return {
						id: data.user.id,
						email: data.user.email,
						name: data.user.name,
						image: data.user.image,
						apiToken: data.token,
					};
				} catch (error) {
					throw new Error('Failed to authenticate');
				}
			},
		}),
	],

	pages: {
		signIn: '/auth/login',
		error: '/auth/error',
	},

	callbacks: {
		async jwt({ token, user, account }) {
			// ── Initial credentials sign-in ──────────────────────────────────────
			if (user) {
				token.id = user.id;
				token.apiToken = user.apiToken;
				token.apiTokenExpiry = Date.now() + SEVEN_DAYS_MS;
			}

			// ── Initial Google sign-in — sync with backend ───────────────────────
			if (account?.provider === 'google') {
				try {
					const response = await fetch(`${API_URL}/api/auth/sync-user`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							email: token.email,
							name: token.name,
							image: token.picture,
						}),
					});

					if (response.ok) {
						const data = await response.json();
						token.id = data.user.id;
						token.apiToken = data.token;
						token.apiTokenExpiry = Date.now() + SEVEN_DAYS_MS;
					}
				} catch (error) {
					console.error('Failed to sync user with backend:', error);
				}
			}

			// ── Refresh API token if within 1 day of expiry ──────────────────────
			// Runs on every session access after initial sign-in.
			// Silently re-issues the Express JWT so users never hit token expiry errors.
			const expiry = token.apiTokenExpiry as number | undefined;
			const currentApiToken = token.apiToken as string | undefined;

			if (expiry && currentApiToken && expiry - Date.now() < ONE_DAY_MS) {
				const refreshed = await refreshApiToken(currentApiToken);
				if (refreshed) {
					token.apiToken = refreshed;
					token.apiTokenExpiry = Date.now() + SEVEN_DAYS_MS;
				} else {
					// Refresh failed — clear token to trigger 401 → sign-out flow
					token.apiToken = undefined;
					token.apiTokenExpiry = undefined;
				}
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
			}
			session.apiToken = token.apiToken;
			return session;
		},
	},

	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60, // 7 days — synced with Express JWT lifetime
	},

	secret: process.env.NEXTAUTH_SECRET,
});
