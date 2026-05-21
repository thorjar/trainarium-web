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
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20'>
							<CheckCircle className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Verify Labels</h1>
					</div>
					<p className='page-subtitle'>
						Review and verify labeled data to ensure quality
					</p>
				</div>
			</div>

			<div className='section-container py-8'>
				{loading && (
					<div className='text-center py-16'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-green-600 mb-4' />
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
								<CheckCircle className='w-8 h-8 text-slate-400' />
							</div>
							<h3 className='text-xl font-semibold text-slate-900 mb-2'>
								No datasets to verify
							</h3>
							<p className='text-slate-500'>
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
						<CardBody className='p-0'>
							<div className='divide-y divide-slate-100'>
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
											className='block px-6 py-5 hover:bg-slate-50 transition-colors group'
										>
											<div className='flex items-center justify-between gap-4 mb-2'>
												<div className='min-w-0 flex-1'>
													<h3 className='font-semibold text-slate-900 group-hover:text-green-600 transition-colors'>
														{dataset.name}
													</h3>
													{dataset.description && (
														<p className='text-sm text-slate-500 mt-0.5 truncate'>
															{dataset.description}
														</p>
													)}
												</div>
												<ChevronRight className='w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors flex-shrink-0' />
											</div>
											<div className='flex items-center justify-between text-sm mb-2'>
												<span className='text-slate-500'>
													{remainingToVerify} pending review
												</span>
												<span className='font-medium text-green-600'>
													{verifyPercent}% verified
												</span>
											</div>
											<div className='progress-bar h-2'>
												<div
													className='progress-fill bg-gradient-to-r from-green-400 to-green-500'
													style={{ width: `${verifyPercent}%` }}
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