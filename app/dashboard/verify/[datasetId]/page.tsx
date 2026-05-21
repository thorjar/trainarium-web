'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import {
	Loader,
	CheckCircle,
	XCircle,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	ChevronLeft,
} from 'lucide-react';
import { datasetApi, verificationApi } from '@/lib/api-client';
import Link from 'next/link';

interface Label {
	id: string;
	value: string;
	userId: string;
	user?: { id: string; name: string; image?: string };
}

interface QueueItem {
	_id: string;
	content: any;
	status: string;
	labels: Label[];
	submitting: boolean;
	decision: 'approved' | 'rejected' | null;
	comment: string;
	showComment: boolean;
}

export default function VerifyDatasetPage() {
	const { data: session } = useSession();
	const params = useParams();
	const datasetId = params.datasetId as string;

	const [dataset, setDataset] = useState<any>(null);
	const [items, setItems] = useState<QueueItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);
	const [verifiedCount, setVerifiedCount] = useState(0);

	const token = (session as any)?.apiToken as string;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	useEffect(() => {
		if (!datasetId || !token) return;
		loadQueue();
	}, [datasetId, token, page]);

	const loadQueue = async () => {
		setLoading(true);
		setError(null);
		try {
			const [ds, itemsRes, myVerificationsRaw] = await Promise.all([
				datasetApi.get(datasetId, token),
				datasetApi.getItems(datasetId, page, 10, token, 'LABELED'),
				fetch(`${apiUrl}/api/verifications/my`, {
					headers: { Authorization: `Bearer ${token}` },
				})
					.then(r => r.json())
					.catch(() => []),
			]);

			setDataset(ds);
			setPagination(itemsRes.pagination ?? null);

			const myVerifications: any[] = Array.isArray(myVerificationsRaw)
				? myVerificationsRaw
				: [];
			const verifiedMap: Record<string, any> = {};
			for (const v of myVerifications) {
				verifiedMap[v.itemId] = v;
			}

			const rawItems: any[] = itemsRes.items ?? [];

			const withLabels: QueueItem[] = await Promise.all(
				rawItems.map(async (item: any) => {
					const itemId =
						typeof item._id === 'object' ? item._id.toString() : item._id;

					const labels: Label[] = await fetch(
						`${apiUrl}/api/labels/item/${itemId}`,
						{ headers: { Authorization: `Bearer ${token}` } },
					)
						.then(r => r.json())
						.catch(() => []);

					const myVerification = verifiedMap[itemId] ?? null;

					return {
						...item,
						_id: itemId,
						labels: Array.isArray(labels) ? labels : [],
						submitting: false,
						decision: myVerification
							? myVerification.approved
								? 'approved'
								: 'rejected'
							: null,
						comment: '',
						showComment: false,
					};
				}),
			);

			const queue = withLabels.filter(item => item.labels.length > 0);
			setItems(queue);
		} catch (err: any) {
			setError(err.message || 'Failed to load verification queue');
		} finally {
			setLoading(false);
		}
	};

	const updateItem = (itemId: string, patch: Partial<QueueItem>) => {
		setItems(prev =>
			prev.map(i => (i._id === itemId ? { ...i, ...patch } : i)),
		);
	};

	const submitVerification = async (item: QueueItem, approved: boolean) => {
		if (item.decision !== null) return;
		updateItem(item._id, { submitting: true });
		try {
			await verificationApi.submit(
				item._id,
				approved,
				token,
				item.comment || undefined,
				datasetId,
			);
			updateItem(item._id, {
				decision: approved ? 'approved' : 'rejected',
				submitting: false,
				showComment: false,
			});
			setVerifiedCount(c => c + 1);
		} catch (err: any) {
			alert(err.message || 'Failed to submit verification');
			updateItem(item._id, { submitting: false });
		}
	};

	if (loading)
		return (
			<div className='text-center py-24'>
				<Loader className='w-8 h-8 animate-spin mx-auto mb-4 text-green-600' />
				<p className='text-slate-500'>Loading verification queue...</p>
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

	const pendingItems = items.filter(i => i.decision === null);
	const doneItems = items.filter(i => i.decision !== null);

	return (
		<div className='p-4 sm:p-6 space-y-5 max-w-4xl mx-auto animate-fade-in'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
				<div>
					<div className='flex items-center gap-3'>
						<Link href='/dashboard/verify' className='p-2 rounded-xl hover:bg-slate-100 transition-colors'>
							<ChevronLeft className='w-5 h-5 text-slate-400' />
						</Link>
						<div>
							<h1 className='text-2xl font-bold text-slate-900'>
								{dataset?.name ?? 'Verify Dataset'}
							</h1>
							{dataset?.description && (
								<p className='text-sm text-slate-500 mt-0.5'>{dataset.description}</p>
							)}
						</div>
					</div>
				</div>
				<div className='text-right ml-12 sm:ml-0'>
					<p className='text-2xl font-bold text-green-600'>{verifiedCount}</p>
					<p className='text-xs text-slate-500'>verified this session</p>
				</div>
			</div>

			{/* Progress */}
			{items.length > 0 && (
				<div className='bg-white rounded-2xl border border-slate-200 p-5 shadow-soft'>
					<div className='flex justify-between text-sm text-slate-600 mb-2.5'>
						<span>{pendingItems.length} pending</span>
						<span className='font-medium text-green-600'>{doneItems.length} reviewed</span>
					</div>
					<div className='progress-bar h-2.5'>
						<div
							className='progress-fill bg-gradient-to-r from-green-400 to-green-500'
							style={{
								width: `${Math.round((doneItems.length / Math.max(items.length, 1)) * 100)}%`,
							}}
						/>
					</div>
				</div>
			)}

			{items.length === 0 ? (
				<Card>
					<CardBody className='text-center py-16'>
						<div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5'>
							<CheckCircle className='w-8 h-8 text-green-400' />
						</div>
						<h3 className='text-xl font-semibold text-slate-900 mb-2'>
							All caught up!
						</h3>
						<p className='text-slate-500'>
							No labeled items to verify on this page.
						</p>
					</CardBody>
				</Card>
			) : (
				<div className='space-y-4'>
					{items.map((item, index) => {
						const itemNumber = ((page - 1) * 10) + index + 1;
						return (
							<Card
								key={item._id}
								className={
									item.decision === 'approved'
										? 'border-green-200 bg-green-50/20'
										: item.decision === 'rejected'
											? 'border-red-200 bg-red-50/20'
											: ''
								}
							>
								<CardBody>
									{/* Item number */}
									<div className='flex items-center gap-2 mb-3'>
										<span className='text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg'>
											#{itemNumber}
										</span>
										{item.decision === null && (
											<span className='badge-yellow'>Pending review</span>
										)}
									</div>

									{/* Decision banner */}
									{item.decision !== null && (
										<div
											className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${
												item.decision === 'approved'
													? 'bg-green-100 text-green-700'
													: 'bg-red-100 text-red-700'
											}`}
										>
											{item.decision === 'approved' ? (
												<><ThumbsUp className='w-4 h-4' /> You approved this label</>
											) : (
												<><ThumbsDown className='w-4 h-4' /> You rejected this label</>
											)}
										</div>
									)}

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

									{/* Labels */}
									<div className='mb-4'>
										<p className='text-xs font-medium text-slate-500 mb-2.5'>
											Submitted labels ({item.labels.length})
										</p>
										<div className='flex flex-wrap gap-2'>
											{item.labels.map(label => (
												<div
													key={label.id}
													className='flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-soft'
												>
													{label.user?.image ? (
														<img src={label.user.image} alt='' className='w-5 h-5 rounded-full' />
													) : (
														<div className='w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-xs text-teal-700 font-medium'>
															{label.user?.name?.[0] ?? '?'}
														</div>
													)}
													<span className='text-sm font-semibold text-slate-800'>
														{label.value}
													</span>
													<span className='text-xs text-slate-400'>
														— {label.user?.name ?? 'Unknown'}
													</span>
												</div>
											))}
										</div>
									</div>

									{/* Optional comment */}
									{item.decision === null && (
										<div className='mb-4'>
											<button
												onClick={() => updateItem(item._id, { showComment: !item.showComment })}
												className='flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors'
											>
												<MessageSquare className='w-3.5 h-3.5' />
												{item.showComment ? 'Hide comment' : 'Add comment (optional)'}
											</button>
											{item.showComment && (
												<input
													type='text'
													value={item.comment}
													onChange={e => updateItem(item._id, { comment: e.target.value })}
													placeholder='Explain your decision...'
													className='input-field text-sm mt-2'
													autoFocus
												/>
											)}
										</div>
									)}

									{/* Approve / Reject buttons */}
									{item.decision === null && (
										<div className='flex gap-3'>
											<button
												onClick={() => submitVerification(item, true)}
												disabled={item.submitting}
												className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white rounded-xl font-medium transition-all duration-200 shadow-soft disabled:opacity-50'
											>
												{item.submitting ? (
													<Loader className='w-4 h-4 animate-spin' />
												) : (
													<ThumbsUp className='w-4 h-4' />
												)}
												Approve
											</button>
											<button
												onClick={() => submitVerification(item, false)}
												disabled={item.submitting}
												className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-xl font-medium transition-all duration-200 shadow-soft disabled:opacity-50'
											>
												{item.submitting ? (
													<Loader className='w-4 h-4 animate-spin' />
												) : (
													<XCircle className='w-4 h-4' />
												)}
												Reject
											</button>
										</div>
									)}
								</CardBody>
							</Card>
						);
					})}
				</div>
			)}

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
											? 'bg-green-500 text-white'
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
		</div>
	);
}