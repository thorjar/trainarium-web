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
			<div className='text-center py-24'>
				<Loader className='w-8 h-8 animate-spin mx-auto mb-4 text-teal-600' />
				<p className='text-slate-500'>Loading earnings...</p>
			</div>
		);

	if (error)
		return (
			<div className='section-container py-12'>
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
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20'>
							<DollarSign className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Earnings</h1>
					</div>
					<p className='page-subtitle'>
						Your labeling and verification earnings
					</p>
				</div>
			</div>

			<div className='section-container py-8 space-y-6'>
				{/* Summary cards */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
					{[
						{
							label: 'Total Earned',
							value: `$${(summary?.totalEarned ?? 0).toFixed(2)}`,
							icon: DollarSign,
							gradient: 'from-teal-500 to-teal-600',
						},
						{
							label: 'Approved',
							value: approved,
							icon: CheckCircle,
							gradient: 'from-green-500 to-green-600',
						},
						{
							label: 'Pending',
							value: pending,
							icon: Clock,
							gradient: 'from-amber-500 to-amber-600',
						},
						{
							label: 'Rejected',
							value: rejected,
							icon: XCircle,
							gradient: 'from-red-500 to-red-600',
						},
					].map(stat => {
						const Icon = stat.icon;
						return (
							<Card key={stat.label} className='hover-lift'>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='stat-label mb-1'>{stat.label}</p>
										<p className='stat-value'>{stat.value}</p>
									</div>
									<div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
										<Icon className='w-6 h-6 text-white' />
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
						<CardBody className='p-0'>
							<div className='divide-y divide-slate-100'>
								{summary.byDataset.map((d: any) => (
									<div key={d.datasetId} className='flex items-center justify-between px-6 py-4'>
										<div>
											<p className='font-medium text-slate-900'>
												{d.datasetName}
											</p>
											<p className='text-sm text-slate-500'>
												{d.contributions} contributions
											</p>
										</div>
										<span className='text-lg font-bold text-teal-600'>
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
					<CardBody className='p-0'>
						{contributions.length === 0 ? (
							<div className='text-center py-12'>
								<div className='w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
									<DollarSign className='w-7 h-7 text-slate-400' />
								</div>
								<p className='text-slate-500'>No contributions yet. Start labeling to earn!</p>
							</div>
						) : (
							<div className='divide-y divide-slate-100'>
								{contributions.map((c: any) => (
									<div key={c.id} className='flex items-center justify-between px-6 py-4'>
										<div className='flex items-center gap-4 min-w-0 flex-1'>
											<div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
												c.status === 'APPROVED'
													? 'bg-green-500'
													: c.status === 'REJECTED'
														? 'bg-red-500'
														: 'bg-amber-500'
											}`} />
											<div className='min-w-0'>
												<p className='text-sm font-medium text-slate-900 truncate'>
													{c.type === 'LABEL' ? 'Label' : 'Verification'} —{' '}
													{c.dataset?.name ?? 'Unknown dataset'}
												</p>
												<p className='text-xs text-slate-500'>
													{new Date(c.createdAt).toLocaleDateString(undefined, {
														year: 'numeric',
														month: 'short',
														day: 'numeric',
													})}
												</p>
											</div>
										</div>
										<div className='text-right flex-shrink-0 ml-4'>
											<p className={`text-sm font-semibold ${
												c.status === 'APPROVED'
													? 'text-teal-600'
													: c.status === 'REJECTED'
														? 'text-red-500'
														: 'text-slate-400'
											}`}>
												{c.status === 'APPROVED'
													? `+$${c.earnings.toFixed(3)}`
													: c.status === 'REJECTED'
														? 'Rejected'
														: 'Pending'}
											</p>
											<span className={`badge ${
												c.status === 'APPROVED'
													? 'badge-green'
													: c.status === 'REJECTED'
														? 'badge-red'
														: 'badge-yellow'
											} mt-1`}>
												{c.status === 'APPROVED' ? 'Approved' : c.status === 'REJECTED' ? 'Rejected' : 'Pending'}
											</span>
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