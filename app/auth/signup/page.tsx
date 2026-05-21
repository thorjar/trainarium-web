'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api-client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import {
	Mail,
	Lock,
	User,
	Loader,
	AlertCircle,
	CheckCircle,
	ArrowRight,
} from 'lucide-react';

export default function SignupPage() {
	const router = useRouter();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

	const validatePassword = (pwd: string) => {
		const errors: string[] = [];
		if (pwd.length < 8) errors.push('At least 8 characters');
		if (!/[A-Z]/.test(pwd)) errors.push('One uppercase letter');
		if (!/[a-z]/.test(pwd)) errors.push('One lowercase letter');
		if (!/[0-9]/.test(pwd)) errors.push('One number');
		setPasswordErrors(errors);
		return errors.length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (!validatePassword(password)) {
			setError('Password does not meet requirements');
			return;
		}

		setLoading(true);

		try {
			await authApi.register(name, email, password);

			setSuccess('Account created! Redirecting to login...');
			setTimeout(() => router.push('/auth/login'), 2000);
		} catch (err: any) {
			setError(err.message || 'An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			await signIn('google', { redirectTo: '/dashboard' });
		} catch (err) {
			setError('Google sign-up failed');
			setLoading(false);
		}
	};

	return (
		<>
			<Header />
			<main className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12'>
				<div className='w-full max-w-md animate-fade-in-up'>
					{/* Card */}
					<div className='bg-white rounded-3xl border border-slate-200/80 shadow-xl-soft p-8 sm:p-10'>
						{/* Header */}
						<div className='text-center mb-8'>
							<div className='w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/20'>
								<img
									src='/logo-icon.png'
									alt='Trainarium'
									className='w-10 h-10 brightness-0 invert'
								/>
							</div>
							<h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mb-2'>
								Create Account
							</h1>
							<p className='text-slate-500'>
								Join Trainarium and start labeling
							</p>
						</div>

						{error && (
							<div className='bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl mb-6 text-sm flex items-start gap-3'>
								<AlertCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
								<span>{error}</span>
							</div>
						)}

						{success && (
							<div className='bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-2xl mb-6 text-sm flex items-start gap-3'>
								<CheckCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
								<span>{success}</span>
							</div>
						)}

						{/* Signup Form */}
						<form onSubmit={handleSubmit} className='space-y-4 mb-6'>
							<div>
								<label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
									<User className='w-4 h-4 text-teal-500' />
									Full Name
								</label>
								<div>
									<input
										type='text'
										value={name}
										onChange={e => setName(e.target.value)}
										placeholder='John Doe'
										className='input-field'
										required
									/>
								</div>
							</div>

							<div>
								<label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
									<Mail className='w-4 h-4 text-teal-500' />
									Email Address
								</label>
								<div>
									<input
										type='email'
										value={email}
										onChange={e => setEmail(e.target.value)}
										placeholder='you@example.com'
										className='input-field'
										required
									/>
								</div>
							</div>

							<div>
								<label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
									<Lock className='w-4 h-4 text-teal-500' />
									Password
								</label>
								<div>
									<input
										type='password'
										value={password}
										onChange={e => {
											setPassword(e.target.value);
											if (e.target.value) validatePassword(e.target.value);
										}}
										placeholder='••••••••'
										className='input-field'
										required
									/>
								</div>
								{passwordErrors.length > 0 && (
									<div className='mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl'>
										<p className='text-xs font-medium text-amber-800 mb-2'>Password must include:</p>
										<ul className='space-y-1.5'>
											{passwordErrors.map(err => (
												<li key={err} className='text-xs text-amber-700 flex items-center gap-2'>
													<span className='w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0' />
													{err}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>

							<div>
								<label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
									<Lock className='w-4 h-4 text-teal-500' />
									Confirm Password
								</label>
								<div>
									<input
										type='password'
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										placeholder='••••••••'
										className='input-field'
										required
									/>
								</div>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='w-full btn-primary flex items-center justify-center gap-2 py-3'
							>
								{loading && <Loader className='w-4 h-4 animate-spin' />}
								{loading ? 'Creating Account...' : 'Create Account'}
								{!loading && <ArrowRight className='w-4 h-4' />}
							</button>
						</form>

						{/* Divider */}
						<div className='relative mb-6'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-slate-200'></div>
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-4 bg-white text-slate-400'>
									Or sign up with
								</span>
							</div>
						</div>

						{/* Google Sign Up */}
						<button
							type='button'
							onClick={handleGoogleSignIn}
							disabled={loading}
							className='w-full btn-secondary flex items-center justify-center gap-3 py-3'
						>
							<svg className='w-5 h-5 flex-shrink-0' viewBox='0 0 24 24'>
								<path
									fill='#4285F4'
									d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
								/>
								<path
									fill='#34A853'
									d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
								/>
								<path
									fill='#FBBC05'
									d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
								/>
								<path
									fill='#EA4335'
									d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
								/>
							</svg>
							Sign up with Google
						</button>

						{/* Footer */}
						<p className='text-center text-sm text-slate-500 mt-6'>
							Already have an account?{' '}
							<Link
								href='/auth/login'
								className='text-teal-600 hover:text-teal-700 font-semibold'
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</main>
		</>
	);
}