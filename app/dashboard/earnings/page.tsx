'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	DollarSign,
	Loader,
	CheckCircle,
	XCircle,
	Clock,
} from 'lucide-react';

export default function EarningsPage() {
	const { data: session } = useSession();
	const [summary, setSummary] = useState<any>(null);
	const [contributions, setContributions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const token = (session as any)?.apiToken;

	useEffect(() => {
		if (!token) return;
		Promise.all([
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compensation/summary`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contributions/my`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
		])
			.then(([comp, contrib]) => {
				setSummary(comp);
				setContributions(contrib.contributions ?? []);
			})
			.catch(() => setError('Failed to load earnings'))
			.finally(() => setLoading(false));
	}, [token]);

	if (loading)
		return (
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2' />
				<p className='text-slate-600'>Loading earnings...</p>
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

	const approved = contributions.filter(c => c.status === 'APPROVED').length;
	const rejected = contributions.filter(c => c.status === 'REJECTED').length;
	const pending = contributions.filter(c => c.status === 'PENDING').length;

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<DollarSign className='w-8 h-8 text-teal-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Earnings</h1>
					</div>
					<p className='text-slate-600'>
						Your labeling and verification earnings
					</p>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
				{/* Summary cards */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
					{[
						{
							label: 'Total Earned',
							value: `$${(summary?.totalEarned ?? 0).toFixed(2)}`,
							icon: DollarSign,
							color: 'bg-teal-50 text-teal-600',
						},
						{
							label: 'Approved',
							value: approved,
							icon: CheckCircle,
							color: 'bg-green-50 text-green-600',
						},
						{
							label: 'Pending',
							value: pending,
							icon: Clock,
							color: 'bg-yellow-50 text-yellow-600',
						},
						{
							label: 'Rejected',
							value: rejected,
							icon: XCircle,
							color: 'bg-red-50 text-red-600',
						},
					].map(stat => {
						const Icon = stat.icon;
						return (
							<Card key={stat.label}>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='text-slate-600 text-sm mb-1'>{stat.label}</p>
										<p className='text-2xl font-bold text-slate-900'>
											{stat.value}
										</p>
									</div>
									<div
										className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
									>
										<Icon className='w-5 h-5' />
									</div>
								</CardBody>
							</Card>
						);
					})}
				</div>

				{/* By dataset */}
				{summary?.byDataset?.length > 0 && (
					<Card>
						<CardHeader title='Earnings by Dataset' />
						<CardBody>
							<div className='space-y-3'>
								{summary.byDataset.map((d: any) => (
									<div
										key={d.datasetId}
										className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
									>
										<div>
											<p className='font-medium text-slate-900'>
												{d.datasetName}
											</p>
											<p className='text-sm text-slate-500'>
												{d.contributions} contributions
											</p>
										</div>
										<span className='font-bold text-teal-600'>
											${d.totalEarned.toFixed(2)}
										</span>
									</div>
								))}
							</div>
						</CardBody>
					</Card>
				)}

				{/* Contribution history */}
				<Card>
					<CardHeader
						title='Contribution History'
						description='All your labeling and verification contributions'
					/>
					<CardBody>
						{contributions.length === 0 ? (
							<p className='text-slate-500 text-center py-8'>
								No contributions yet. Start labeling to earn!
							</p>
						) : (
							<div className='space-y-2'>
								{contributions.map((c: any) => (
									<div
										key={c.id}
										className='flex items-center justify-between p-3 border border-slate-200 rounded-lg'
									>
										<div className='flex items-center gap-3'>
											<span
												className={`w-2 h-2 rounded-full ${
													c.status === 'APPROVED'
														? 'bg-green-500'
														: c.status === 'REJECTED'
															? 'bg-red-500'
															: 'bg-yellow-500'
												}`}
											/>
											<div>
												<p className='text-sm font-medium text-slate-900'>
													{c.type === 'LABEL' ? 'Label' : 'Verification'} —{' '}
													{c.dataset?.name ?? 'Unknown dataset'}
												</p>
												<p className='text-xs text-slate-500'>
													{new Date(c.createdAt).toLocaleDateString()}
												</p>
											</div>
										</div>
										<div className='text-right'>
											<p
												className={`text-sm font-semibold ${
													c.status === 'APPROVED'
														? 'text-teal-600'
														: c.status === 'REJECTED'
															? 'text-red-500'
															: 'text-slate-400'
												}`}
											>
												{c.status === 'APPROVED'
													? `+$${c.earnings.toFixed(3)}`
													: c.status === 'REJECTED'
														? 'Rejected'
														: 'Pending'}
											</p>
											<p className='text-xs text-slate-400 capitalize'>
												{c.status.toLowerCase()}
											</p>
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
