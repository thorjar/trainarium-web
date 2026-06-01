'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Menu, X, ChevronDown, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
	const { data: session } = useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const profileRef = useRef<HTMLDivElement>(null);

	// Close profile dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				profileRef.current &&
				!profileRef.current.contains(event.target as Node)
			) {
				setProfileOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<header className='fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					{/* Logo */}
					<Link
						href={session ? '/dashboard' : '/'}
						className='flex items-center gap-2.5 flex-shrink-0'
					>
						<img
							src='/logo-header.png'
							alt='Trainarium'
							className='h-8 sm:h-12 w-auto'
						/>
					</Link>

					{/* Desktop Navigation */}
					<nav className='hidden md:flex items-center gap-6'>
						{!session ? (
							<>
								<Link
									href='/auth/login'
									className='text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors'
								>
									Login
								</Link>
								<Link href='/auth/signup' className='btn-primary text-sm'>
									Sign Up
								</Link>
							</>
						) : (
							<div className='flex items-center gap-4'>
								{/* Profile Dropdown */}
								<div className='relative' ref={profileRef}>
									<button
										onClick={() => setProfileOpen(!profileOpen)}
										className='flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200'
									>
										{session.user?.image ? (
											<img
												src={session.user.image}
												alt={session.user.name || 'User'}
												className='w-8 h-8 rounded-full ring-2 ring-slate-200'
											/>
										) : (
											<div className='w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center ring-2 ring-slate-200'>
												<User className='w-4 h-4 text-teal-600' />
											</div>
										)}
										<div className='hidden lg:block text-left'>
											<p className='text-sm font-medium text-slate-900 leading-tight'>
												{session.user?.name}
											</p>
											<p className='text-xs text-slate-500 leading-tight'>
												{session.user?.email}
											</p>
										</div>
										<ChevronDown
											className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
										/>
									</button>

									{/* Dropdown Menu */}
									{profileOpen && (
										<div className='absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl-soft py-2 animate-scale-in origin-top-right'>
											<div className='px-4 py-2 border-b border-slate-100 lg:hidden'>
												<p className='text-sm font-medium text-slate-900'>
													{session.user?.name}
												</p>
												<p className='text-xs text-slate-500'>
													{session.user?.email}
												</p>
											</div>
											<Link
												href='/dashboard/settings'
												onClick={() => setProfileOpen(false)}
												className='flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors'
											>
												<User className='w-4 h-4 text-slate-400' />
												Settings
											</Link>
											<div className='border-t border-slate-100 mt-1 pt-1'>
												<button
													onClick={() => {
														setProfileOpen(false);
														signOut({ redirectTo: '/' });
													}}
													className='flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
												>
													<LogOut className='w-4 h-4' />
													Logout
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</nav>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className='md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all'
						aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
					>
						{mobileMenuOpen ? (
							<X className='w-5 h-5' />
						) : (
							<Menu className='w-5 h-5' />
						)}
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<nav className='md:hidden pb-5 animate-slide-up'>
						<div className='border-t border-slate-100 pt-4'>
							{!session ? (
								<div className='space-y-2'>
									<Link
										href='/auth/login'
										className='block py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors'
										onClick={() => setMobileMenuOpen(false)}
									>
										Login
									</Link>
									<Link
										href='/auth/signup'
										className='block py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors'
										onClick={() => setMobileMenuOpen(false)}
									>
										Sign Up
									</Link>
								</div>
							) : (
								<div className='space-y-1'>
									{session.user?.image && (
										<div className='flex items-center gap-3 pb-4 border-b border-slate-100 mb-2'>
											<img
												src={session.user.image}
												alt={session.user.name || 'User'}
												className='w-10 h-10 rounded-full'
											/>
											<div>
												<p className='text-sm font-medium text-slate-900'>
													{session.user.name}
												</p>
												<p className='text-xs text-slate-500'>
													{session.user.email}
												</p>
											</div>
										</div>
									)}
									<Link
										href='/dashboard/settings'
										className='block py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors'
										onClick={() => setMobileMenuOpen(false)}
									>
										Settings
									</Link>
									<button
										onClick={() => {
											setMobileMenuOpen(false);
											signOut({ redirectTo: '/' });
										}}
										className='block w-full text-left py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-lg'
									>
										Logout
									</button>
								</div>
							)}
						</div>
					</nav>
				)}
			</div>
		</header>
	);
}
