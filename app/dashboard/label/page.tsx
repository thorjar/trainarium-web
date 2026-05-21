'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Tag, ChevronRight, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { datasetApi } from '@/lib/api-client';

interface Dataset {
	id: string;
	name: string;
	description?: string;
	totalItems: number;
	labeledItems: number;
	status: string;
	visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
	isOwner: boolean;
	createdAt: string;
}

const visibilityBadges: Record<Dataset['visibility'], { label: string; classes: string }> = {
	PUBLIC: { label: 'Public', classes: 'badge-teal' },
	TEAM: { label: 'Team', classes: 'badge-blue' },
	PRIVATE: { label: 'Private', classes: 'badge-slate' },
};

export default function LabelDataPage() {
	const { data: session } = useSession();
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [filter, setFilter] = useState<'ALL' | 'MINE' | 'PUBLIC' | 'TEAM'>('ALL');

	const token = (session as any)?.apiToken as string;

	useEffect(() => {
		if (token) {
			datasetApi.list(token)
				.then(setDatasets)
				.catch(() => setError('Failed to load datasets'))
				.finally(() => setLoading(false));
		}
	}, [session]);

	const handleDelete = async (e: React.MouseEvent, dataset: Dataset) => {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Delete "${dataset.name}"? This will permanently remove all items and labels.`)) return;
		setDeletingId(dataset.id);
		try {
			await datasetApi.delete(dataset.id, token);
			setDatasets(prev => prev.filter(d => d.id !== dataset.id));
		} catch (err: any) {
			alert(err.message || 'Failed to delete dataset');
		} finally {
			setDeletingId(null);
		}
	};

	const filtered = datasets.filter(d => {
		if (filter === 'MINE') return d.isOwner;
		if (filter === 'PUBLIC') return d.visibility === 'PUBLIC';
		if (filter === 'TEAM') return d.visibility === 'TEAM';
		return true;
	});

	const filters = [
		{ id: 'ALL' as const, label: 'All' },
		{ id: 'MINE' as const, label: 'My Datasets' },
		{ id: 'PUBLIC' as const, label: 'Public' },
		{ id: 'TEAM' as const, label: 'Team' },
	];

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20'>
							<Tag className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Label Data</h1>
					</div>
					<p className='page-subtitle'>Select a project and start labeling data</p>
				</div>
			</div>

			<div className='section-container py-8'>
				{loading && (
					<div className='text-center py-16'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-teal-600 mb-4' />
						<p className='text-slate-500'>Loading datasets...</p>
					</div>
				)}
				{error && <Card className='border-red-200 bg-red-50'><CardBody><p className='text-red-700'>{error}</p></CardBody></Card>}

				{!loading && !error && (
					<>
						{/* Filter tabs */}
						<div className='flex gap-2 mb-6 flex-wrap'>
							{filters.map(f => (
								<button
									key={f.id}
									onClick={() => setFilter(f.id)}
									className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
										filter === f.id
											? 'bg-teal-500 text-white shadow-soft'
											: 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600'
									}`}
								>
									{f.label}
								</button>
							))}
						</div>

						{filtered.length === 0 ? (
							<Card>
								<CardBody className='text-center py-16'>
									<div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5'>
										<Tag className='w-8 h-8 text-slate-400' />
									</div>
									<h3 className='text-xl font-semibold text-slate-900 mb-2'>No datasets available</h3>
									<p className='text-slate-500 mb-8'>Upload a dataset first to start labeling</p>
									<Link href='/dashboard/upload' className='btn-primary inline-flex items-center gap-2'>
										<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' /></svg>
										Upload Dataset
									</Link>
								</CardBody>
							</Card>
						) : (
							<Card>
								<CardHeader title='Available Projects' description='Choose a project to start labeling' />
								<CardBody className='p-0'>
									<div className='divide-y divide-slate-100'>
										{filtered.map(dataset => {
											const progressPercent = Math.round((dataset.labeledItems / Math.max(dataset.totalItems, 1)) * 100);
											const isDeleting = deletingId === dataset.id;
											const badge = visibilityBadges[dataset.visibility];
											return (
												<div key={dataset.id} className='relative group'>
													<Link href={`/dashboard/label/${dataset.id}`}>
														<div className={`block px-6 py-5 hover:bg-slate-50 transition-colors pr-14 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
															<div className='flex items-center justify-between gap-4 mb-2'>
																<div className='min-w-0 flex-1'>
																	<div className='flex items-center gap-2.5 mb-1'>
																		<h3 className='font-semibold text-slate-900 group-hover:text-teal-600 transition-colors'>{dataset.name}</h3>
																		<span className={badge.classes}>{badge.label}</span>
																		{!dataset.isOwner && <span className='text-xs text-slate-400'>by others</span>}
																	</div>
																	{dataset.description && <p className='text-sm text-slate-500 truncate'>{dataset.description}</p>}
																</div>
																<ChevronRight className='w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0' />
															</div>
															<div className='flex items-center justify-between text-sm mb-2'>
																<span className='text-slate-500'>{dataset.labeledItems} / {dataset.totalItems} labeled</span>
																<span className='font-medium text-teal-600'>{progressPercent}%</span>
															</div>
															<div className='progress-bar h-2'>
																<div className='progress-fill bg-teal-500' style={{ width: `${progressPercent}%` }} />
															</div>
														</div>
													</Link>
													{dataset.isOwner && (
														<button
															onClick={e => handleDelete(e, dataset)}
															disabled={isDeleting}
															className='absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50'
															title='Delete dataset'
														>
															{isDeleting ? <Loader className='w-4 h-4 animate-spin' /> : <Trash2 className='w-4 h-4' />}
														</button>
													)}
												</div>
											);
										})}
									</div>
								</CardBody>
							</Card>
						)}
					</>
				)}
			</div>
		</div>
	);
}