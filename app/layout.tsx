import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { auth } from '@/app/auth';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Trainarium - Gamified Data Labeling',
	description:
		'A collaborative platform for labeling and verifying training data for ML models',
	icons: {
		icon: [{ url: '/favicon.svg' }],
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<html lang='en'>
			<body className={inter.className}>
				<Providers session={session}>{children}</Providers>
			</body>
		</html>
	);
}
