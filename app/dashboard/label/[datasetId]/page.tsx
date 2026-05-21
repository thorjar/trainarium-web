'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Loader, Tag, Trash2, CheckCircle, Circle, ChevronLeft } from 'lucide-react';
import { datasetApi, labelApi } from '@/lib/api-client';
import Link from 'next/link';

interface DataItem {
	_id: string;
	status: string;
	content: any;
}

interface Label {
	id: string;
	value: string;
	confidence?: number;
	userId: string;
	createdAt: string;
	user?: { name: string; image?: string };
}

interface ItemWithLabels extends DataItem {
	labels: Label[];
	submitting: boolean;
	labelInput: string;
}

export default function LabelDatasetPage() {
	const { data: session } = useSession();
	const params = useParams();
	const datasetId = params.datasetId as string;

	const [dataset, setDataset] = useState<any>(null);
	const [items, setItems] = useState<ItemWithLabels[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);

	const token = (session as any)?.apiToken as string;
	const userId = session?.user?.id;
	const labelClasses: string[] = dataset?.labelClasses ?? [];

	useEffect(() => {
		if (!datasetId || !token) return;
		loadAll();
	}, [datasetId, token, page]);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [ds, res] = await Promise.all([
				datasetApi.get(datasetId, token),
				datasetApi.getItems(datasetId, page, 10, token),
			]);

			setDataset(ds);
			setPagination(res.pagination ?? null);

			const rawItems: DataItem[] = res.items ?? [];

			const withLabels = await Promise.all(
				rawItems.map(async item => {
					const labels = await labelApi
						.getByItem(item._id, token)
						.catch(() => []);
					return { ...item, labels, submitting: false, labelInput: '' };
				}),
			);

			setItems(withLabels);
		} catch (err: any) {
			setError(err.message || 'Failed to load items');
		} finally {
			setLoading(false);
		}
	};

	const updateItem = (itemId: string, patch: Partial<ItemWithLabels>) => {
		setItems(prev =>
			prev.map(i => (i._id === itemId ? { ...i, ...patch } : i)),
		);
	};

	const submitLabel = async (item: ItemWithLabels, value: string) => {
		if (!value.trim()) return;
		updateItem(item._id, { submitting: true });
		try {
			const res = await labelApi.create(
				item._id,
				datasetId,
				value.trim(),
				token,
			);
			updateItem(item._id, {
				labels: [...item.labels, res.label ?? res],
				labelInput: '',
				submitting: false,
				status: 'LABELED',
			});
		} catch (err: any) {
			alert(err.message || 'Failed to submit label');
			updateItem(item._id, { submitting: false });
		}
	};

	const deleteLabel = async (item: ItemWithLabels, labelId: string) => {
		if (!confirm('Delete this label?')) return;
		try {
			await labelApi.delete(labelId, token);
			updateItem(item._id, {
				labels: item.labels.filter(l => l.id !== labelId),
			});
		} catch (err: any) {
			alert(err.message || 'Failed to delete label');
		}
	};

	if (loading) {
		return (
			<div className='text-center py-24'>
				<Loader className='w-8 h-8 animate-spin mx-auto mb-4 text-teal-600' />
				<p className='text-slate-500'>Loading items...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='p-6'>
				<Card className='border-red-200 bg-red-50'>
					<CardBody>
						<p className='text-red-700'>{error}</p>
					</CardBody>
				</Card>
			</div>
		);
	}

	return (
		<div className='p-4 sm:p-6 space-y-5 max-w-4xl mx-auto animate-fade-in'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
				<div>
					<div className='flex items-center gap-3'>
						<Link href='/dashboard/label' className='p-2 rounded-xl hover:bg-slate-100 transition-colors'>
							<ChevronLeft className='w-5 h-5 text-slate-400' />
						</Link>
						<div>
							<h1 className='text-2xl font-bold text-slate-900'>
								{dataset?.name ?? 'Label Dataset'}
							</h1>
							{dataset?.description && (
								<p className='text-sm text-slate-500 mt-0.5'>{dataset.description}</p>
							)}
						</div>
					</div>
				</div>
				{pagination && (
					<p className='text-sm text-slate-500 ml-12 sm:ml-0'>
						{pagination.total} items total
					</p>
				)}
			</div>

			{/* Label class legend */}
			{labelClasses.length > 0 && (
				<div className='bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4'>
					<p className='text-sm font-medium text-teal-800 mb-2.5'>Label classes:</p>
					<div className='flex flex-wrap gap-2'>
						{labelClasses.map(cls => (
							<span key={cls} className='badge-teal'>
								{cls}
							</span>
						))}
					</div>
				</div>
			)}

			{items.length === 0 ? (
				<Card>
					<CardBody className='text-center py-16'>
						<div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
							<Tag className='w-8 h-8 text-slate-400' />
						</div>
						<p className='text-slate-500'>No items found in this dataset</p>
					</CardBody>
				</Card>
			) : (
				<>
					<div className='space-y-4'>
						{items.map((item, index) => {
							const itemNumber = ((page - 1) * 10) + index + 1;
							const borderClass = item.status === 'VERIFIED'
								? 'border-green-200'
								: item.status === 'LABELED'
									? 'border-teal-200'
									: '';
							return (
								<Card key={item._id ?? index} className={borderClass}>
									<CardBody>
										{/* Header row with item number and status */}
										<div className='flex items-center gap-2.5 mb-3'>
											<span className='text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg'>
												#{itemNumber}
											</span>
											{item.status !== 'UNLABELED' ? (
												<CheckCircle className='w-4 h-4 text-teal-500' />
											) : (
												<Circle className='w-4 h-4 text-slate-300' />
											)}
											<span className={`badge ${
												item.status === 'VERIFIED'
													? 'badge-green'
													: item.status === 'LABELED'
														? 'badge-teal'
														: 'badge-slate'
											}`}>
												{item.status}
											</span>
										</div>

										{/* Item content */}
										<div className='bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100'>
											{typeof item.content === 'object' && item.content !== null ? (
												<div className='space-y-1.5'>
													{Object.entries(item.content).map(([key, value]) => (
														<div key={key} className='flex gap-2 text-sm'>
															<span className='font-medium text-slate-600 min-w-28 shrink-0'>{key}:</span>
															<span className='text-slate-700'>{String(value)}</span>
														</div>
													))}
												</div>
											) : (
												<p className='text-sm text-slate-700 whitespace-pre-wrap'>
													{String(item.content)}
												</p>
											)}
										</div>

										{/* Existing labels */}
										{item.labels.length > 0 && (
											<div className='mb-4'>
												<p className='text-xs font-medium text-slate-500 mb-2'>
													Labels ({item.labels.length})
												</p>
												<div className='flex flex-wrap gap-2'>
													{item.labels.map(label => (
														<div
															key={label.id}
															className='flex items-center gap-1.5 badge-teal'
														>
															{label.user?.image ? (
																<img src={label.user.image} alt='' className='w-3.5 h-3.5 rounded-full' />
															) : null}
															<span>{label.value}</span>
															{label.userId === userId && (
																<button
																	onClick={() => deleteLabel(item, label.id)}
																	className='ml-0.5 hover:text-red-600 transition-colors'
																	title='Delete label'
																>
																	<Trash2 className='w-3 h-3' />
																</button>
															)}
														</div>
													))}
												</div>
											</div>
										)}

										{/* Label input */}
										{labelClasses.length > 0 ? (
											<div className='flex flex-wrap gap-2'>
												{labelClasses.map(cls => {
													const alreadyLabeled = item.labels.some(
														l => l.value === cls && l.userId === userId,
													);
													return (
														<button
															key={cls}
															onClick={() => !alreadyLabeled && submitLabel(item, cls)}
															disabled={item.submitting || alreadyLabeled}
															className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
																alreadyLabeled
																	? 'bg-teal-500 text-white border-teal-500 cursor-default shadow-soft'
																	: 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/30 disabled:opacity-50'
															}`}
														>
															{item.submitting ? (
																<Loader className='w-4 h-4 animate-spin' />
															) : (
																cls
															)}
														</button>
													);
												})}
											</div>
										) : (
											<div className='flex gap-2'>
												<input
													type='text'
													value={item.labelInput}
													onChange={e => updateItem(item._id, { labelInput: e.target.value })}
													onKeyDown={e => e.key === 'Enter' && submitLabel(item, item.labelInput)}
													placeholder='Enter a label...'
													className='input-field flex-1 text-sm'
													disabled={item.submitting}
												/>
												<button
													onClick={() => submitLabel(item, item.labelInput)}
													disabled={item.submitting || !item.labelInput.trim()}
													className='btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50'
												>
													{item.submitting ? (
														<Loader className='w-4 h-4 animate-spin' />
													) : (
														<Tag className='w-4 h-4' />
													)}
													Label
												</button>
											</div>
										)}
									</CardBody>
								</Card>
							);
						})}
					</div>

					{/* Pagination */}
					{pagination && pagination.pages > 1 && (
						<div className='flex items-center justify-center gap-3 pt-4'>
							<button
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
								className='btn-secondary disabled:opacity-50'
							>
								Previous
							</button>
							<div className='flex items-center gap-1.5'>
								{Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
									const pageNum = i + 1;
									return (
										<button
											key={pageNum}
											onClick={() => setPage(pageNum)}
											className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
												page === pageNum
													? 'bg-teal-500 text-white'
													: 'text-slate-600 hover:bg-slate-100'
											}`}
										>
											{pageNum}
										</button>
									);
								})}
							</div>
							<button
								onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
								disabled={page === pagination.pages}
								className='btn-secondary disabled:opacity-50'
							>
								Next
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}