import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
						apiToken: data.token, // store as apiToken to avoid conflicts
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
			// On initial credentials sign-in
			if (user) {
				token.id = user.id;
				token.apiToken = (user as any).apiToken;
			}

			// On OAuth sign-in — sync with backend
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
						token.apiToken = data.token; // your sync-user route needs to return token too
					}
				} catch (error) {
					console.error('Failed to sync user with backend:', error);
				}
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
			}
			session.apiToken = token.apiToken as string;
			return session;
		},
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	secret: process.env.NEXTAUTH_SECRET,
});
