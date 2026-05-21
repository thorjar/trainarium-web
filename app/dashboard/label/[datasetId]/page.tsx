'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Loader, Tag, Trash2, CheckCircle, Circle } from 'lucide-react';
import { datasetApi, labelApi } from '@/lib/api-client';

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
			// Load dataset metadata (for labelClasses) and items in parallel
			const [ds, res] = await Promise.all([
				datasetApi.get(datasetId, token),
				datasetApi.getItems(datasetId, page, 10, token),
			]);

			setDataset(ds);
			setPagination(res.pagination ?? null);

			const rawItems: DataItem[] = res.items ?? [];

			// Fetch labels for each item in parallel
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
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2' />
				<p className='text-slate-600'>Loading items...</p>
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
		<div className='p-6 space-y-4 max-w-4xl mx-auto'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<div className='flex items-center gap-2'>
						<Tag className='w-6 h-6 text-teal-600' />
						<h1 className='text-2xl font-bold text-slate-900'>
							{dataset?.name ?? 'Label Dataset'}
						</h1>
					</div>
					{dataset?.description && (
						<p className='text-sm text-slate-500 mt-1 ml-8'>
							{dataset.description}
						</p>
					)}
				</div>
				{pagination && (
					<p className='text-sm text-slate-600'>
						{pagination.total} items total
					</p>
				)}
			</div>

			{/* Label class legend */}
			{labelClasses.length > 0 && (
				<div className='bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap'>
					<span className='text-sm font-medium text-teal-800'>
						Label classes:
					</span>
					{labelClasses.map(cls => (
						<span
							key={cls}
							className='bg-white border border-teal-300 text-teal-700 text-xs font-medium px-3 py-1 rounded-full'
						>
							{cls}
						</span>
					))}
				</div>
			)}

			{items.length === 0 ? (
				<Card>
					<CardBody className='text-center py-12'>
						<p className='text-slate-600'>No items found in this dataset</p>
					</CardBody>
				</Card>
			) : (
				<>
					<div className='space-y-4'>
						{items.map((item, index) => (
							<Card
								key={item._id ?? index}
								className={
									item.status === 'VERIFIED'
										? 'border-green-300'
										: item.status === 'LABELED'
											? 'border-teal-200'
											: ''
								}
							>
								<CardBody>
									{/* Status badge */}
									<div className='flex items-center gap-2 mb-3'>
										{item.status !== 'UNLABELED' ? (
											<CheckCircle className='w-4 h-4 text-teal-500' />
										) : (
											<Circle className='w-4 h-4 text-slate-300' />
										)}
										<span
											className={`text-xs font-medium px-2 py-0.5 rounded-full ${
												item.status === 'VERIFIED'
													? 'bg-green-100 text-green-700'
													: item.status === 'LABELED'
														? 'bg-teal-100 text-teal-700'
														: 'bg-slate-100 text-slate-600'
											}`}
										>
											{item.status}
										</span>
									</div>

									{/* Item content */}
									<div className='bg-slate-50 rounded-lg p-3 mb-4'>
										{typeof item.content === 'object' &&
										item.content !== null ? (
											<div className='space-y-1'>
												{Object.entries(item.content).map(([key, value]) => (
													<div key={key} className='flex gap-2 text-sm'>
														<span className='font-medium text-slate-700 min-w-32 shrink-0'>
															{key}:
														</span>
														<span className='text-slate-600'>
															{String(value)}
														</span>
													</div>
												))}
											</div>
										) : (
											<pre className='text-sm whitespace-pre-wrap text-slate-700'>
												{String(item.content)}
											</pre>
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
														className='flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 text-sm px-3 py-1 rounded-full'
													>
														<span>{label.value}</span>
														{label.userId === userId && (
															<button
																onClick={() => deleteLabel(item, label.id)}
																className='ml-1 hover:text-red-600 transition-colors'
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

									{/* Label input — buttons if classes defined, text input if not */}
									{labelClasses.length > 0 ? (
										<div className='flex flex-wrap gap-2'>
											{labelClasses.map(cls => {
												const alreadyLabeled = item.labels.some(
													l => l.value === cls && l.userId === userId,
												);
												return (
													<button
														key={cls}
														onClick={() =>
															!alreadyLabeled && submitLabel(item, cls)
														}
														disabled={item.submitting || alreadyLabeled}
														className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
															alreadyLabeled
																? 'bg-teal-500 text-white border-teal-500 cursor-default'
																: 'bg-white text-slate-700 border-slate-300 hover:border-teal-500 hover:text-teal-600 disabled:opacity-50'
														}`}
													>
														{item.submitting ? (
															<Loader className='w-3 h-3 animate-spin' />
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
												onChange={e =>
													updateItem(item._id, { labelInput: e.target.value })
												}
												onKeyDown={e =>
													e.key === 'Enter' &&
													submitLabel(item, item.labelInput)
												}
												placeholder='Enter a label...'
												className='input-field flex-1 text-sm'
												disabled={item.submitting}
											/>
											<button
												onClick={() => submitLabel(item, item.labelInput)}
												disabled={item.submitting || !item.labelInput.trim()}
												className='btn-primary flex items-center gap-1 text-sm disabled:opacity-50'
											>
												{item.submitting ? (
													<Loader className='w-3 h-3 animate-spin' />
												) : (
													<Tag className='w-3 h-3' />
												)}
												Label
											</button>
										</div>
									)}
								</CardBody>
							</Card>
						))}
					</div>

					{/* Pagination */}
					{pagination && pagination.pages > 1 && (
						<div className='flex items-center justify-center gap-2 pt-4'>
							<button
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
								className='btn-secondary disabled:opacity-50'
							>
								Previous
							</button>
							<span className='text-sm text-slate-600'>
								Page {page} of {pagination.pages}
							</span>
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
