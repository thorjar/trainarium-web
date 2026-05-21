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
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<BarChart3 className='w-8 h-8 text-teal-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Analytics</h1>
					</div>
					<p className='text-slate-600'>
						View quality metrics, label distribution and export data for your
						datasets
					</p>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{loading && (
					<div className='text-center py-12'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-teal-600 mb-4' />
						<p className='text-slate-600'>Loading datasets...</p>
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
						<CardBody className='text-center py-12'>
							<BarChart3 className='w-12 h-12 text-slate-300 mx-auto mb-4' />
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>
								No datasets yet
							</h3>
							<p className='text-slate-600 mb-6'>
								Upload a dataset to start tracking analytics
							</p>
							<Link
								href='/dashboard/upload'
								className='btn-primary inline-block'
							>
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
						<CardBody>
							<div className='space-y-2'>
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
										>
											<div className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 hover:border-teal-500 transition-all group cursor-pointer'>
												<div className='flex items-center justify-between mb-3'>
													<div className='flex-1'>
														<div className='flex items-center gap-2 mb-0.5'>
															<h3 className='font-semibold text-slate-900 group-hover:text-teal-600 transition-colors'>
																{dataset.name}
															</h3>
															<span
																className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
																	dataset.visibility === 'PUBLIC'
																		? 'text-teal-600 bg-teal-50 border-teal-200'
																		: dataset.visibility === 'TEAM'
																			? 'text-blue-600 bg-blue-50 border-blue-200'
																			: 'text-slate-500 bg-slate-50 border-slate-200'
																}`}
															>
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
													<ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0' />
												</div>

												<div className='grid grid-cols-3 gap-4 text-sm'>
													<div>
														<p className='text-slate-500 text-xs mb-1'>
															Total Items
														</p>
														<p className='font-semibold text-slate-900'>
															{dataset.totalItems}
														</p>
													</div>
													<div>
														<p className='text-slate-500 text-xs mb-1'>
															Labeled
														</p>
														<p className='font-semibold text-teal-600'>
															{labelPct}%
														</p>
													</div>
													<div>
														<p className='text-slate-500 text-xs mb-1'>
															Verified
														</p>
														<p className='font-semibold text-green-600'>
															{verifyPct}%
														</p>
													</div>
												</div>

												<div className='w-full bg-slate-200 rounded-full h-1.5 mt-3'>
													<div
														className='bg-green-500 h-1.5 rounded-full transition-all'
														style={{ width: `${verifyPct}%` }}
													/>
												</div>
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
