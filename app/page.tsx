import { auth } from '@/app/auth';
import { Header } from '@/components/header';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Users, Zap } from 'lucide-react';

interface Feature {
	title: string;
	desc: string;
	num: string;
}

export default async function Home() {
	const session = await auth();
	if (session) redirect('/dashboard');

	const features: Feature[] = [
		{
			title: 'UPLOAD DATA',
			desc: 'Ingest raw datasets into isolated, high-speed project containers.',
			num: '01',
		},
		{
			title: 'LABEL DATA',
			desc: 'Collaborative annotation engine built for distributed teams.',
			num: '02',
		},
		{
			title: 'VERIFY QUALITY',
			desc: 'Automated validation gates to ensure 99.9% annotation accuracy.',
			num: '03',
		},
	];

	const modernFeatures = [
		{
			icon: Zap,
			title: 'Fast & Easy',
			desc: 'Optimized labeling pipeline for maximum throughput. Get more done in less time.',
		},
		{
			icon: Users,
			title: 'Collaborative',
			desc: 'Multi-user sync with real-time verification. Built for teams of any size.',
		},
		{
			icon: CheckCircle,
			title: 'Quality Assured',
			desc: 'Automated logic gates for error detection. Maintain high data integrity with ease.',
		},
	];

	return (
		<div className='bg-zinc-50 min-h-screen text-black font-sans'>
			<Header />

			<main className='max-w-[1440px] mx-auto mt-20 px-6 md:px-12'>
				<section className='mb-32'>
					<div className='flex flex-col md:flex-row items-center justify-center md:justify-start gap-12 md:gap-20 pl-0 md:pl-20'>
						{/* Branding */}
						<header className='shrink-0 text-center md:text-left'>
							<h1 className='text-[clamp(4.5rem,6vw,5rem)] font-black uppercase tracking-tight leading-[0.9]'>
								TRAINARIUM
								<br />
								<span className='text-[#32BA99]'>LABS.</span>
							</h1>
						</header>

						{/* Feature List - Glossy Glass-morphism */}
						<div className='w-full md:max-w-md space-y-4 mt-12'>
							{features.map((item, idx) => (
								<div
									key={idx}
									className='group bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-[#32BA99]/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
								>
									<div className='flex gap-4 items-center'>
										<div className='text-[#32BA99] font-mono text-2xl font-bold mb-6 opacity-50 group-hover:opacity-100 transition-opacity duration-500'>
											{item.num}
										</div>
										<div>
											<h3 className='font-bold text-teal-400'>{item.title}</h3>
											<p className='text-zinc-600 text-sm leading-relaxed'>
												{item.desc}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className='mb-8'>
					<div className='max-w-[1440px] mx-auto px-6 md:px-12'>
						<div className='grid md:grid-cols-3 gap-6'>
							{modernFeatures.map((item, i) => (
								<div
									key={i}
									className='relative group overflow-hidden transition-all duration-500'
									style={{
										backfaceVisibility: 'hidden',

										willChange: 'transform',
									}}
								>
									{/* The Gradient Border */}

									<div className='absolute inset-0 bg-gradient-to-br from-[#32BA99] via-zinc-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

									{/* The Inset (Controls Thickness) */}

									<div className='absolute inset-[3px] bg-zinc-50' />

									{/* The Content */}

									<div className='relative p-8 min-h-[22rem]'>
										<div className='text-[#32BA99]  text-4xl font-bold mb-6 opacity-50 group-hover:opacity-100 transition-opacity duration-500'>
											<item.icon className='w-12 h-12' />
										</div>

										<h3 className='text-xl font-bold uppercase mb-4 text-black'>
											{item.title}
										</h3>

										<p className='text-zinc-600 text-sm leading-relaxed'>
											{item.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Responsive Bento Grid */}
				<section className='grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[minmax(280px,auto)]'>
					{/* Hero Card - Spans 2x2 */}
					<div className='md:col-span-2 md:row-span-2 relative group p-[1px] bg-zinc-300 transition-all duration-500 hover:bg-transparent'>
						{/* Glow Layer */}
						<div className='absolute inset-0 bg-gradient-to-br from-[#32BA99] via-emerald-500 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

						{/* Content */}
						<div className='relative h-full p-6 md:p-10 flex flex-col justify-between bg-zinc-50 transition-colors duration-500 group-hover:bg-zinc-50/95'>
							<div className='mb-8'>
								<h2 className='text-3xl md:text-5xl font-bold mb-6 tracking-tight'>
									High Performance Data Engineering.
								</h2>
								<p className='text-zinc-600 text-base md:text-lg leading-relaxed max-w-md'>
									Trainarium is an advanced annotation environment. We combine
									low-latency infrastructure with precise human-in-the-loop
									verification to accelerate your machine learning roadmap.
								</p>
							</div>

							<div className='flex flex-col sm:flex-row gap-3'>
								<Link
									href='/auth/signup'
									className='px-6 py-4 bg-black text-white font-bold text-center hover:bg-[#32BA99] transition-all'
								>
									GET STARTED
								</Link>
								<Link
									href='/auth/login'
									className='px-6 py-4 border border-black text-center hover:bg-zinc-100 transition-all'
								>
									SIGN IN
								</Link>
							</div>
						</div>
					</div>

					{/* Feature Card 1 */}
					<div className='md:col-span-2 relative group p-[1px] bg-zinc-300 transition-all duration-500 hover:bg-transparent'>
						<div className='absolute inset-0 bg-gradient-to-br from-[#32BA99] via-emerald-500 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
						<div className='relative h-full p-6 md:p-8 bg-zinc-50 transition-colors duration-500 group-hover:bg-zinc-50/95'>
							<h3 className='text-xl md:text-2xl font-bold uppercase mb-4'>
								Fast Pipeline
							</h3>
							<p className='text-zinc-600 text-sm md:text-base'>
								Our proprietary engine ensures sub-millisecond interaction
								feedback. Built for datasets that require extreme speed without
								compromising on annotation integrity.
							</p>
						</div>
					</div>

					{/* Feature Card 2 */}
					<div className='relative group p-[1px] bg-zinc-300 transition-all duration-500 hover:bg-transparent'>
						<div className='absolute inset-0 bg-gradient-to-br from-[#32BA99] via-emerald-500 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
						<div className='relative h-full p-6 md:p-8 bg-zinc-50 transition-colors duration-500 group-hover:bg-zinc-50/95'>
							<h3 className='text-lg md:text-xl font-bold uppercase mb-3'>
								Collab
							</h3>
							<p className='text-zinc-600 text-xs md:text-sm'>
								Distributed team workflows for massive scale.
							</p>
						</div>
					</div>

					{/* Feature Card 3 */}
					<div className='relative group p-[1px] bg-zinc-300 transition-all duration-500 hover:bg-transparent'>
						<div className='absolute inset-0 bg-gradient-to-br from-[#32BA99] via-emerald-500 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
						<div className='relative h-full p-6 md:p-8 bg-zinc-50 transition-colors duration-500 group-hover:bg-zinc-50/95'>
							<h3 className='text-lg md:text-xl font-bold uppercase mb-3'>
								Verify
							</h3>
							<p className='text-zinc-600 text-xs md:text-sm'>
								Automated quality assurance gates included.
							</p>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className='mt-20 py-16 bg-gradient-to-r from-teal-500 to-teal-600 text-white'>
					<div className='max-w-4xl mx-auto px-4 text-center'>
						<h2 className='text-4xl font-bold mb-6'>
							Ready to Build Better ML Models?
						</h2>
						<p className='text-xl mb-8 opacity-90'>
							Start labeling data with your team today
						</p>
						<Link
							href='/about'
							className='inline-block px-8 py-4 bg-white text-teal-600 font-bold rounded-lg hover:bg-slate-100 transition-colors'
						>
							Learn More
						</Link>
					</div>
				</section>
			</main>
		</div>
	);
}
