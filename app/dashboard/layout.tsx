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
			<div className='flex min-h-screen pt-16'>
				<Sidebar />
				<main className='flex-1 md:ml-64 pb-16 md:pb-0'>
					<div className='animate-fade-in'>
						{children}
					</div>
				</main>
			</div>
		</>
	);
}