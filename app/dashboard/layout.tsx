import { auth } from '@/app/auth';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session) {
		redirect('/auth/login?callbackUrl=/dashboard');
	}

	return (
		<>
			<Header />
			<div className='flex'>
				<Sidebar />
				<main className='flex-1 md:ml-64 pt-16 md:pt-0'>{children}</main>
			</div>
		</>
	);
}
