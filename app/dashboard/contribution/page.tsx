'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	TrendingUp,
	Loader,
	Tag,
	CheckCircle,
	Clock,
	XCircle,
} from 'lucide-react';

export default function ContributionsPage() {
	const { data: session } = useSession();
	const [data, setData] = useState<{
		contributions: any[];
		summary: any;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState<'ALL' | 'LABEL' | 'VERIFICATION'>('ALL');

	const token = (session as any)?.apiToken;

	useEffect(() => {
		if (!token) return;
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contributions/my`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(r => r.json())
			.then(setData)
			.catch(() => setError('Failed to load contributions'))
			.finally(() => setLoading(false));
	}, [token]);

	if (loading)
		return (
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2' />
				<p className='text-slate-600'>Loading contributions...</p>
			</div>
		);

	if (error)
		return (
			<div className='p-6'>
				<Card className='border-red-200 bg-red-50'>
					<CardBody>
						<p className='text-red-700'>{error}</p>
					</CardBody>
				</Card>
			</div>
		);

	const summary = data?.summary;
	const contributions = (data?.contributions ?? []).filter(
		c => filter === 'ALL' || c.type === filter,
	);

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<TrendingUp className='w-8 h-8 text-teal-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Contributions</h1>
					</div>
					<p className='text-slate-600'>
						Your complete labeling and verification history
					</p>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
				{/* Summary */}
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
					{[
						{
							label: 'Total',
							value: summary?.total ?? 0,
							icon: TrendingUp,
							color: 'bg-slate-50 text-slate-600',
						},
						{
							label: 'Approved',
							value: summary?.approved ?? 0,
							icon: CheckCircle,
							color: 'bg-green-50 text-green-600',
						},
						{
							label: 'Pending',
							value: summary?.pending ?? 0,
							icon: Clock,
							color: 'bg-yellow-50 text-yellow-600',
						},
						{
							label: 'Rejected',
							value: summary?.rejected ?? 0,
							icon: XCircle,
							color: 'bg-red-50 text-red-600',
						},
					].map(stat => {
						const Icon = stat.icon;
						return (
							<Card key={stat.label}>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='text-slate-500 text-xs mb-1'>{stat.label}</p>
										<p className='text-2xl font-bold text-slate-900'>
											{stat.value}
										</p>
									</div>
									<div
										className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}
									>
										<Icon className='w-4 h-4' />
									</div>
								</CardBody>
							</Card>
						);
					})}
				</div>

				{/* Filter tabs */}
				<div className='flex gap-2'>
					{(['ALL', 'LABEL', 'VERIFICATION'] as const).map(f => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								filter === f
									? 'bg-teal-500 text-white'
									: 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400'
							}`}
						>
							{f === 'ALL' ? 'All' : f === 'LABEL' ? 'Labels' : 'Verifications'}
						</button>
					))}
				</div>

				{/* Contribution list */}
				<Card>
					<CardHeader title='History' />
					<CardBody>
						{contributions.length === 0 ? (
							<div className='text-center py-12'>
								<TrendingUp className='w-12 h-12 text-slate-200 mx-auto mb-3' />
								<p className='text-slate-500'>No contributions yet.</p>
								<p className='text-sm text-slate-400 mt-1'>
									Start labeling datasets to build your history.
								</p>
							</div>
						) : (
							<div className='space-y-2'>
								{contributions.map((c: any) => (
									<div
										key={c.id}
										className='flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
									>
										{/* Type icon */}
										<div
											className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
												c.type === 'LABEL'
													? 'bg-teal-50 text-teal-600'
													: 'bg-green-50 text-green-600'
											}`}
										>
											{c.type === 'LABEL' ? (
												<Tag className='w-4 h-4' />
											) : (
												<CheckCircle className='w-4 h-4' />
											)}
										</div>

										{/* Details */}
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-slate-900'>
												{c.type === 'LABEL'
													? 'Label submitted'
													: 'Verification submitted'}
											</p>
											<p className='text-xs text-slate-500 truncate'>
												{c.dataset?.name ?? 'Unknown dataset'} ·{' '}
												{new Date(c.createdAt).toLocaleDateString()}
											</p>
										</div>

										{/* Status */}
										<div className='flex items-center gap-2 flex-shrink-0'>
											<span
												className={`text-xs font-medium px-2 py-1 rounded-full ${
													c.status === 'APPROVED'
														? 'bg-green-100 text-green-700'
														: c.status === 'REJECTED'
															? 'bg-red-100 text-red-700'
															: 'bg-yellow-100 text-yellow-700'
												}`}
											>
												{c.status}
											</span>
											{c.status === 'APPROVED' && (
												<span className='text-sm font-bold text-teal-600'>
													+${c.earnings.toFixed(3)}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
