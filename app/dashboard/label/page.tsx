'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Tag, ChevronRight, Loader, Trash2, Lock, Users, Globe } from 'lucide-react';
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

const VisibilityBadge = ({ v }: { v: Dataset['visibility'] }) => {
	if (v === 'PUBLIC') return <span className='flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200'><Globe className='w-3 h-3' />Public</span>;
	if (v === 'TEAM') return <span className='flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200'><Users className='w-3 h-3' />Team</span>;
	return <span className='flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200'><Lock className='w-3 h-3' />Private</span>;
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

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<Tag className='w-8 h-8 text-teal-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Label Data</h1>
					</div>
					<p className='text-slate-600'>Select a project and start labeling data</p>
				</div>
			</div>

			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				{loading && (
					<div className='text-center py-12'>
						<Loader className='w-8 h-8 animate-spin mx-auto text-teal-600 mb-4' />
						<p className='text-slate-600'>Loading datasets...</p>
					</div>
				)}
				{error && <Card className='border-red-200 bg-red-50'><CardBody><p className='text-red-700'>{error}</p></CardBody></Card>}

				{!loading && !error && (
					<>
						{/* Filter tabs */}
						<div className='flex gap-2 mb-6'>
							{(['ALL', 'MINE', 'PUBLIC', 'TEAM'] as const).map(f => (
								<button key={f} onClick={() => setFilter(f)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400'}`}>
									{f === 'ALL' ? 'All' : f === 'MINE' ? 'My Datasets' : f === 'PUBLIC' ? 'Public' : 'Team'}
								</button>
							))}
						</div>

						{filtered.length === 0 ? (
							<Card>
								<CardBody className='text-center py-12'>
									<Tag className='w-12 h-12 text-slate-300 mx-auto mb-4' />
									<h3 className='text-lg font-semibold text-slate-900 mb-2'>No datasets available</h3>
									<p className='text-slate-600 mb-6'>Upload a dataset first to start labeling</p>
									<Link href='/dashboard/upload' className='btn-primary inline-block'>Upload Dataset</Link>
								</CardBody>
							</Card>
						) : (
							<Card>
								<CardHeader title='Available Projects' description='Choose a project to start labeling' />
								<CardBody>
									<div className='space-y-2'>
										{filtered.map(dataset => {
											const progressPercent = Math.round((dataset.labeledItems / Math.max(dataset.totalItems, 1)) * 100);
											const isDeleting = deletingId === dataset.id;
											return (
												<div key={dataset.id} className='relative group'>
													<Link href={`/dashboard/label/${dataset.id}`}>
														<div className={`border border-slate-200 rounded-lg p-4 hover:bg-slate-50 hover:border-teal-500 transition-all cursor-pointer pr-14 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
															<div className='flex items-center justify-between mb-2'>
																<div className='flex-1'>
																	<div className='flex items-center gap-2 mb-1'>
																		<h3 className='font-semibold text-slate-900 group-hover:text-teal-600 transition-colors'>{dataset.name}</h3>
																		<VisibilityBadge v={dataset.visibility} />
																		{!dataset.isOwner && <span className='text-xs text-slate-400'>by others</span>}
																	</div>
																	{dataset.description && <p className='text-sm text-slate-600'>{dataset.description}</p>}
																</div>
																<ChevronRight className='w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors' />
															</div>
															<div className='flex items-center justify-between text-sm'>
																<span className='text-slate-600'>{dataset.labeledItems} / {dataset.totalItems} labeled</span>
																<span className='font-medium text-teal-600'>{progressPercent}%</span>
															</div>
															<div className='w-full bg-slate-200 rounded-full h-2 mt-2'>
																<div className='bg-teal-500 h-2 rounded-full transition-all' style={{ width: `${progressPercent}%` }} />
															</div>
														</div>
													</Link>
													{dataset.isOwner && (
														<button onClick={e => handleDelete(e, dataset)} disabled={isDeleting}
															className='absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50'
															title='Delete dataset'>
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