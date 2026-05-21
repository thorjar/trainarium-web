import { auth } from '@/app/auth';
import { Header } from '@/components/header';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Users, Zap } from 'lucide-react';

export default async function Home() {
	const session = await auth();

	if (session) {
		redirect('/dashboard');
	}

	return (
		<>
			<Header />
			<main className='min-h-screen'>
				{/* Hero Section */}
				<section className='bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
						<div className='grid md:grid-cols-2 gap-12 items-center'>
							<div>
								<h1 className='text-5xl md:text-6xl font-bold mb-6 leading-tight'>
									Gamify Your Data{' '}
									<span className='text-teal-400'>Labeling</span>
								</h1>
								<p className='text-xl text-slate-300 mb-8'>
									Trainarium makes data labeling collaborative, fun, and
									efficient. Upload data, label it, verify quality, and build
									better ML models together.
								</p>
								<div className='flex gap-4'>
									<Link
										href='/auth/signup'
										className='px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition-colors'
									>
										Get Started
									</Link>
									<Link
										href='/auth/login'
										className='px-6 py-3 border-2 border-teal-500 text-teal-400 rounded-lg font-medium hover:bg-teal-500/10 transition-colors'
									>
										Sign In
									</Link>
								</div>
							</div>
							<div className='bg-slate-800 rounded-lg p-8 border border-slate-700'>
								<div className='space-y-6'>
									<div className='flex gap-4'>
										<div className='w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0'>
											<Zap className='w-6 h-6 text-white' />
										</div>
										<div>
											<h3 className='font-semibold mb-1'>Fast & Easy</h3>
											<p className='text-slate-400 text-sm'>
												Quick labeling interface designed for speed
											</p>
										</div>
									</div>
									<div className='flex gap-4'>
										<div className='w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0'>
											<Users className='w-6 h-6 text-white' />
										</div>
										<div>
											<h3 className='font-semibold mb-1'>Collaborative</h3>
											<p className='text-slate-400 text-sm'>
												Team-based labeling with quality verification
											</p>
										</div>
									</div>
									<div className='flex gap-4'>
										<div className='w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0'>
											<CheckCircle className='w-6 h-6 text-white' />
										</div>
										<div>
											<h3 className='font-semibold mb-1'>Quality Assured</h3>
											<p className='text-slate-400 text-sm'>
												Built-in verification to ensure accuracy
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className='py-20 bg-slate-50'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
						<h2 className='text-4xl font-bold text-center mb-16 text-slate-900'>
							How It Works
						</h2>

						<div className='grid md:grid-cols-3 gap-8'>
							{[
								{
									title: 'Upload Data',
									description:
										'Easily upload your raw datasets in various formats. Organize them into projects for better management.',
									number: '1',
								},
								{
									title: 'Label Data',
									description:
										'Collaborate with your team to label data points. Track progress and contribute to the labeling process.',
									number: '2',
								},
								{
									title: 'Verify Quality',
									description:
										'Review labeled data for accuracy. Ensure high-quality annotations before using for model training.',
									number: '3',
								},
							].map(feature => (
								<div
									key={feature.number}
									className='bg-white p-8 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow'
								>
									<div className='w-12 h-12 bg-teal-500 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4'>
										{feature.number}
									</div>
									<h3 className='text-xl font-semibold text-slate-900 mb-3'>
										{feature.title}
									</h3>
									<p className='text-slate-600'>{feature.description}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className='py-16 bg-gradient-to-r from-teal-500 to-teal-600 text-white'>
					<div className='max-w-4xl mx-auto px-4 text-center'>
						<h2 className='text-4xl font-bold mb-6'>
							Ready to Build Better ML Models?
						</h2>
						<p className='text-xl mb-8 opacity-90'>
							Start labeling data with your team today
						</p>
						<Link
							href='/auth/signup'
							className='inline-block px-8 py-4 bg-white text-teal-600 font-bold rounded-lg hover:bg-slate-100 transition-colors'
						>
							Create Your Account
						</Link>
					</div>
				</section>
			</main>
		</>
	);
}
