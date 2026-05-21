'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	BarChart3,
	ChevronRight,
	Loader,
	Globe,
	Users,
	Lock,
} from 'lucide-react';
import Link from 'next/link';
import { datasetApi } from '@/lib/api-client';

interface Dataset {
	id: string;
	name: string;
	description?: string;
	totalItems: number;
	labeledItems: number;
	verifiedItems: number;
	visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
	isOwner: boolean;
}

const VisibilityIcon = ({ v }: { v: Dataset['visibility'] }) => {
	if (v === 'PUBLIC') return <Globe className='w-3 h-3' />;
	if (v === 'TEAM') return <Users className='w-3 h-3' />;
	return <Lock className='w-3 h-3' />;
};

const visibilityStyles: Record<Dataset['visibility'], string> = {
	PUBLIC: 'badge-teal',
	TEAM: 'badge-blue',
	PRIVATE: 'badge-slate',
};

export default function AnalyticsIndexPage() {
	const { data: session } = useSession();
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const token = (session as any)?.apiToken as string;

	useEffect(() => {
		if (!token) return;
		datasetApi
			.list(token)
			.then(data => setDatasets(data.filter((d: Dataset) => d.isOwner)))
			.catch(() => setError('Failed to load datasets'))
			.finally(() => setLoading(false));
	}, [token]);

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20'>
							<BarChart3 className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Analytics</h1>
					</div>
					<p className='page-subtitle'>
						View quality metrics, label distribution and export data for your datasets
					</p>
				</div>
			</div>

			<div className='section-container py-8'>
				{loading && (
					<div className='text-center py-16'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-teal-600 mb-4' />
						<p className='text-slate-500'>Loading datasets...</p>
					</div>
				)}

				{error && (
					<Card className='border-red-200 bg-red-50'>
						<CardBody>
							<p className='text-red-700'>{error}</p>
						</CardBody>
					</Card>
				)}

				{!loading && !error && datasets.length === 0 && (
					<Card>
						<CardBody className='text-center py-16'>
							<div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5'>
								<BarChart3 className='w-8 h-8 text-slate-400' />
							</div>
							<h3 className='text-xl font-semibold text-slate-900 mb-2'>
								No datasets yet
							</h3>
							<p className='text-slate-500 mb-8'>
								Upload a dataset to start tracking analytics
							</p>
							<Link
								href='/dashboard/upload'
								className='btn-primary inline-flex items-center gap-2'
							>
								<BarChart3 className='w-4 h-4' />
								Upload Dataset
							</Link>
						</CardBody>
					</Card>
				)}

				{!loading && datasets.length > 0 && (
					<Card>
						<CardHeader
							title='Your Datasets'
							description='Select a dataset to view detailed analytics and export data'
						/>
						<CardBody className='p-0'>
							<div className='divide-y divide-slate-100'>
								{datasets.map(dataset => {
									const labelPct = Math.round(
										(dataset.labeledItems / Math.max(dataset.totalItems, 1)) *
											100,
									);
									const verifyPct = Math.round(
										(dataset.verifiedItems / Math.max(dataset.totalItems, 1)) *
											100,
									);

									return (
										<Link
											key={dataset.id}
											href={`/dashboard/analytics/${dataset.id}`}
											className='block px-6 py-5 hover:bg-slate-50 transition-colors group'
										>
											<div className='flex items-center justify-between gap-4 mb-3'>
												<div className='min-w-0 flex-1'>
													<div className='flex items-center gap-2.5 mb-0.5'>
														<h3 className='font-semibold text-slate-900 group-hover:text-teal-600 transition-colors'>
															{dataset.name}
														</h3>
														<span className={visibilityStyles[dataset.visibility]}>
															<VisibilityIcon v={dataset.visibility} />
															{dataset.visibility}
														</span>
													</div>
													{dataset.description && (
														<p className='text-sm text-slate-500'>
															{dataset.description}
														</p>
													)}
												</div>
												<ChevronRight className='w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0' />
											</div>

											<div className='grid grid-cols-3 gap-6 text-sm mb-3'>
												<div>
													<p className='text-xs text-slate-500 mb-0.5'>Total Items</p>
													<p className='font-semibold text-slate-900'>
														{dataset.totalItems}
													</p>
												</div>
												<div>
													<p className='text-xs text-slate-500 mb-0.5'>Labeled</p>
													<p className='font-semibold text-teal-600'>
														{labelPct}%
													</p>
												</div>
												<div>
													<p className='text-xs text-slate-500 mb-0.5'>Verified</p>
													<p className='font-semibold text-green-600'>
														{verifyPct}%
													</p>
												</div>
											</div>

											<div className='progress-bar h-2'>
												<div
													className='progress-fill bg-gradient-to-r from-teal-400 to-green-500'
													style={{ width: `${verifyPct}%` }}
												/>
											</div>
										</Link>
									);
								})}
							</div>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
}