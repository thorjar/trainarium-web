'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
	const { data: session } = useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className='sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					{/* Logo */}
					<Link
						href={session ? '/dashboard' : '/'}
						className='flex items-center gap-2'
					>
						<img
							src='/logo-header.png'
							alt='Trainarium'
							className='h-8 sm:h-9 w-auto flex-shrink-0'
						/>
					</Link>

					{/* Desktop Navigation */}
					<nav className='hidden md:flex items-center gap-8'>
						{!session ? (
							<>
								<Link
									href='/auth/login'
									className='text-slate-700 hover:text-teal-600 transition-colors'
								>
									Login
								</Link>
								<Link href='/auth/signup' className='btn-primary'>
									Sign Up
								</Link>
							</>
						) : (
							<>
								<Link
									href='/dashboard'
									className='text-slate-700 hover:text-teal-600 transition-colors'
								>
									Dashboard
								</Link>
								<div className='flex items-center gap-4'>
									<span className='text-sm text-slate-600'>
										{session.user?.name}
									</span>
									{session.user?.image && (
										<img
											src={session.user.image}
											alt={session.user.name || 'User'}
											className='w-8 h-8 rounded-full'
										/>
									)}
									<button
										onClick={() => signOut({ redirectTo: '/' })}
										className='flex items-center gap-2 text-slate-700 hover:text-red-600 transition-colors'
									>
										<LogOut className='w-4 h-4' />
										<span className='text-sm'>Logout</span>
									</button>
								</div>
							</>
						)}
					</nav>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className='md:hidden text-slate-700'
					>
						{mobileMenuOpen ? (
							<X className='w-6 h-6' />
						) : (
							<Menu className='w-6 h-6' />
						)}
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<nav className='md:hidden pb-4 border-t border-slate-200'>
						{!session ? (
							<>
								<Link
									href='/auth/login'
									className='block py-2 text-slate-700 hover:text-teal-600'
								>
									Login
								</Link>
								<Link
									href='/auth/signup'
									className='block py-2 text-slate-700 hover:text-teal-600'
								>
									Sign Up
								</Link>
							</>
						) : (
							<>
								<Link
									href='/dashboard'
									className='block py-2 text-slate-700 hover:text-teal-600'
								>
									Dashboard
								</Link>
								<button
									onClick={() => signOut({ redirectTo: '/' })}
									className='block w-full text-left py-2 text-slate-700 hover:text-red-600'
								>
									Logout
								</button>
							</>
						)}
					</nav>
				)}
			</div>
		</header>
	);
}
