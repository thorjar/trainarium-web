'use client';

import { SessionProvider, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setOn401Handler } from '@/lib/api-client';
import type { Session } from 'next-auth';

function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	useEffect(() => {
		setOn401Handler(async () => {
			await signOut({ redirect: false });
			router.push('/auth/login?reason=expired');
		});
	}, [router]);

	return <>{children}</>;
}

export function Providers({
	children,
	session,
}: {
	children: React.ReactNode;
	session: Session | null;
}) {
	return (
		<SessionProvider session={session}>
			<AuthGuard>{children}</AuthGuard>
		</SessionProvider>
	);
}
