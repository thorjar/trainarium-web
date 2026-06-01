import Link from 'next/link';
import { Header } from '@/components/header';
import { Book, Workflow, CheckCircle, ArrowLeft } from 'lucide-react';

export default function About() {
	// 1. Manually update version; date updates automatically
	const CURRENT_VERSION = '1.0.0';
	const LAST_UPDATED = new Date().toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

	// 2. Easily edit the manual here
	const sections = [
		{
			id: 'scope',
			title: 'Scope of System',
			icon: <Book size={18} />,
			content:
				'Trainarium Labs is a specialized high-latency-averse annotation environment designed for the preparation of machine learning datasets. This system is engineered to minimize human-in-the-loop bottlenecks.',
		},
		{
			id: 'workflow',
			title: 'Process Workflow',
			icon: <Workflow size={18} />,
			content:
				"Phase I: Ingestion. Initialize a 'New Project Container' and upload raw datasets via the Secure Drop Zone. Phase II: Labeling. Changes are broadcast with < 10ms latency.",
		},
		{
			id: 'quality-gates',
			title: 'Quality Verification',
			icon: <CheckCircle size={18} />,
			content:
				'Verification is governed by data owners, who can assign verifiers that can review and approve labels in real-time. The system supports multi-tiered verification workflows.',
		},
	];

	return (
		<div className='max-w-6xl mx-auto px-6 py-20 font-sans'>
			<Header />

			{/* Back Button */}
			<Link
				href='/'
				className='inline-flex items-center gap-2 text-zinc-500 hover:text-[#32BA99] transition-colors mb-8 font-mono text-sm'
			>
				<ArrowLeft size={16} /> Home
			</Link>

			{/* Header - Added mt-12 for vertical spacing */}
			<header className='mt-2 mb-20 border-b border-zinc-300 pb-10'>
				<h1 className='text-6xl font-black uppercase tracking-tighter mb-4'>
					Operation Manual
				</h1>
				<div className='flex items-center gap-4 text-zinc-500 font-mono text-sm'>
					<span>VERSION: {CURRENT_VERSION}</span>
					<span>|</span>
					<span>LAST UPDATED: {LAST_UPDATED}</span>
				</div>
			</header>

			<div className='grid grid-cols-1 md:grid-cols-4 gap-12'>
				{/* Sidebar Nav */}
				<nav className='md:col-span-1 space-y-4'>
					{sections.map(section => (
						<a
							key={section.id}
							href={`#${section.id}`}
							className='flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-[#32BA99] transition-colors'
						>
							{section.icon} {section.title}
						</a>
					))}
				</nav>

				{/* Main Content */}
				<main className='md:col-span-3 space-y-16'>
					{sections.map((section, idx) => (
						<section key={section.id} id={section.id}>
							<h2 className='text-2xl font-bold mb-6 flex items-center gap-3 underline decoration-[#32BA99] underline-offset-8'>
								{idx + 1}. {section.title}
							</h2>
							<p className='text-zinc-700 leading-relaxed'>{section.content}</p>
						</section>
					))}
				</main>
			</div>
		</div>
	);
}
