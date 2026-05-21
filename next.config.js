/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
			},
		],
	},

	async rewrites() {
		return [
			// Keep NextAuth on Vercel
			{
				source: '/api/auth/:path*',
				destination: '/api/auth/:path*',
			},

			// Proxy backend API to Railway
			{
				source: '/api/:path*',
				destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
			},
		];
	},
};

module.exports = nextConfig;
