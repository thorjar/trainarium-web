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
} from 'lucide-react';
import { datasetApi, verificationApi } from '@/lib/api-client';

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
	const userId = session?.user?.id;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	useEffect(() => {
		if (!datasetId || !token) return;
		loadQueue();
	}, [datasetId, token, page]);

	const loadQueue = async () => {
		setLoading(true);
		setError(null);
		try {
			// Fetch dataset, items, and my verifications all at once
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

			// Fetch labels for each item in parallel
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
						_id: itemId, // ensure string
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

			// Show items that have labels — temporarily show all for testing
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
				datasetId, // ← add this
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
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2 text-green-600' />
				<p className='text-slate-600'>Loading verification queue...</p>
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
		<div className='p-6 space-y-4 max-w-4xl mx-auto'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<div className='flex items-center gap-2'>
						<CheckCircle className='w-6 h-6 text-green-600' />
						<h1 className='text-2xl font-bold text-slate-900'>
							{dataset?.name ?? 'Verify Dataset'}
						</h1>
					</div>
					{dataset?.description && (
						<p className='text-sm text-slate-500 mt-1 ml-8'>
							{dataset.description}
						</p>
					)}
				</div>
				<div className='text-right'>
					<p className='text-2xl font-bold text-green-600'>{verifiedCount}</p>
					<p className='text-xs text-slate-500'>verified this session</p>
				</div>
			</div>

			{/* Progress */}
			{items.length > 0 && (
				<div className='bg-white border border-slate-200 rounded-lg p-4'>
					<div className='flex justify-between text-sm text-slate-600 mb-2'>
						<span>{pendingItems.length} pending on this page</span>
						<span>{doneItems.length} reviewed</span>
					</div>
					<div className='w-full bg-slate-200 rounded-full h-2'>
						<div
							className='bg-green-500 h-2 rounded-full transition-all'
							style={{
								width: `${Math.round((doneItems.length / Math.max(items.length, 1)) * 100)}%`,
							}}
						/>
					</div>
				</div>
			)}

			{items.length === 0 ? (
				<Card>
					<CardBody className='text-center py-12'>
						<CheckCircle className='w-12 h-12 text-green-300 mx-auto mb-4' />
						<h3 className='text-lg font-semibold text-slate-900 mb-2'>
							All caught up!
						</h3>
						<p className='text-slate-600'>
							No labeled items to verify on this page.
						</p>
					</CardBody>
				</Card>
			) : (
				<div className='space-y-4'>
					{items.map(item => (
						<Card
							key={item._id}
							className={
								item.decision === 'approved'
									? 'border-green-300 bg-green-50/30'
									: item.decision === 'rejected'
										? 'border-red-300 bg-red-50/30'
										: ''
							}
						>
							<CardBody>
								{/* Decision banner */}
								{item.decision !== null && (
									<div
										className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
											item.decision === 'approved'
												? 'bg-green-100 text-green-700'
												: 'bg-red-100 text-red-700'
										}`}
									>
										{item.decision === 'approved' ? (
											<>
												<ThumbsUp className='w-4 h-4' /> You approved this label
											</>
										) : (
											<>
												<ThumbsDown className='w-4 h-4' /> You rejected this
												label
											</>
										)}
									</div>
								)}

								{/* Item content */}
								<div className='bg-slate-50 rounded-lg p-3 mb-4'>
									{typeof item.content === 'object' && item.content !== null ? (
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

								{/* Labels */}
								<div className='mb-4'>
									<p className='text-xs font-medium text-slate-500 mb-2'>
										Submitted labels ({item.labels.length})
									</p>
									<div className='flex flex-wrap gap-2'>
										{item.labels.map(label => (
											<div
												key={label.id}
												className='flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2'
											>
												{label.user?.image ? (
													<img
														src={label.user.image}
														alt=''
														className='w-5 h-5 rounded-full'
													/>
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
									<div className='mb-3'>
										<button
											onClick={() =>
												updateItem(item._id, { showComment: !item.showComment })
											}
											className='flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors'
										>
											<MessageSquare className='w-3 h-3' />
											{item.showComment
												? 'Hide comment'
												: 'Add comment (optional)'}
										</button>
										{item.showComment && (
											<input
												type='text'
												value={item.comment}
												onChange={e =>
													updateItem(item._id, { comment: e.target.value })
												}
												placeholder='Explain your decision...'
												className='input-field text-sm mt-2'
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
											className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50'
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
											className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50'
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
					))}
				</div>
			)}

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
		</div>
	);
}
