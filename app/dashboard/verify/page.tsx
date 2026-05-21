'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { CheckCircle, ChevronRight, Loader } from 'lucide-react';
import Link from 'next/link';
import { datasetApi } from '@/lib/api-client';

interface Dataset {
	id: string;
	name: string;
	description?: string;
	totalItems: number;
	verifiedItems: number;
	labeledItems: number;
	status: string;
}

export default function VerifyLabelsPage() {
	const { data: session } = useSession();
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if ((session as any)?.apiToken) {
			datasetApi
				.list((session as any).apiToken)
				.then((data: Dataset[]) =>
					setDatasets(data.filter(d => d.labeledItems > 0)),
				)
				.catch(() => setError('Failed to load datasets'))
				.finally(() => setLoading(false));
		}
	}, [session]);

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<CheckCircle className='w-8 h-8 text-green-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Verify Labels</h1>
					</div>
					<p className='text-slate-600'>
						Review and verify labeled data to ensure quality
					</p>
				</div>
			</div>

			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				{loading && (
					<div className='text-center py-12'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-green-600 mb-4' />
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
							<CheckCircle className='w-12 h-12 text-slate-300 mx-auto mb-4' />
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>
								No datasets to verify
							</h3>
							<p className='text-slate-600'>
								Wait for team members to label data first
							</p>
						</CardBody>
					</Card>
				)}
				{!loading && datasets.length > 0 && (
					<Card>
						<CardHeader
							title='Verification Queue'
							description='Review labeled data from your team'
						/>
						<CardBody>
							<div className='space-y-2'>
								{datasets.map(dataset => {
									const remainingToVerify =
										dataset.labeledItems - dataset.verifiedItems;
									const verifyPercent = Math.round(
										(dataset.verifiedItems /
											Math.max(dataset.labeledItems, 1)) *
											100,
									);
									return (
										<Link
											key={dataset.id}
											href={`/dashboard/verify/${dataset.id}`}
										>
											<div className='border border-slate-200 rounded-lg p-4 hover:bg-slate-50 hover:border-green-500 transition-all group cursor-pointer'>
												<div className='flex items-center justify-between mb-3'>
													<div className='flex-1'>
														<h3 className='font-semibold text-slate-900 group-hover:text-green-600 transition-colors'>
															{dataset.name}
														</h3>
														{dataset.description && (
															<p className='text-sm text-slate-600 mt-1'>
																{dataset.description}
															</p>
														)}
													</div>
													<ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors' />
												</div>
												<div className='flex items-center justify-between text-sm mb-2'>
													<span className='text-slate-600'>
														{remainingToVerify} pending review
													</span>
													<span className='font-medium text-green-600'>
														{verifyPercent}% verified
													</span>
												</div>
												<div className='w-full bg-slate-200 rounded-full h-2'>
													<div
														className='bg-green-500 h-2 rounded-full transition-all'
														style={{ width: `${verifyPercent}%` }}
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
