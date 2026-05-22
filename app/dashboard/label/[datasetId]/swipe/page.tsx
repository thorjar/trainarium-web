'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { datasetApi, labelApi } from '@/lib/api-client';
import {
	ThumbsUp,
	ThumbsDown,
	SkipForward,
	Loader,
	CheckCircle,
	Tag,
	ArrowLeft,
	Keyboard,
	ChevronUp,
	ChevronDown,
	Info,
} from 'lucide-react';

interface DataItem {
	_id: string;
	content: any;
	status: string;
}

type SwipeDecision = 'approve' | 'reject' | 'skip';

// Extract image URL from content regardless of shape
function extractImageUrl(content: any): string | null {
	if (
		typeof content === 'string' &&
		/\.(jpg|jpeg|png|gif|webp|svg)/i.test(content)
	)
		return content;
	if (typeof content === 'object' && content !== null) {
		const urlField =
			content.url ??
			content.image ??
			content.src ??
			content.imageUrl ??
			content.image_url ??
			null;
		if (urlField && typeof urlField === 'string') return urlField;
	}
	return null;
}

// Extract all non-image fields from content as key-value pairs
function extractMetaFields(content: any): { key: string; value: string }[] {
	if (typeof content !== 'object' || content === null) return [];
	const imageKeys = new Set(['url', 'image', 'src', 'imageUrl', 'image_url']);
	return Object.entries(content)
		.filter(([key, value]) => {
			if (imageKeys.has(key)) return false;
			if (
				typeof value === 'string' &&
				/\.(jpg|jpeg|png|gif|webp|svg)/i.test(value)
			)
				return false;
			return true;
		})
		.map(([key, value]) => ({
			key,
			value: typeof value === 'object' ? JSON.stringify(value) : String(value),
		}));
}

// Info panel — slides up from bottom of card
function MetaPanel({
	fields,
	open,
	onToggle,
}: {
	fields: { key: string; value: string }[];
	open: boolean;
	onToggle: () => void;
}) {
	if (fields.length === 0) return null;
	return (
		<div
			className={`absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm rounded-b-2xl transition-all duration-300 ${open ? 'max-h-56' : 'max-h-9'} overflow-hidden`}
			// Stop drag events propagating so panel scroll doesn't trigger card drag
			onMouseDown={e => e.stopPropagation()}
			onTouchStart={e => e.stopPropagation()}
		>
			{/* Toggle handle */}
			<button
				onClick={onToggle}
				className='w-full flex items-center justify-between px-4 py-2 text-slate-300 hover:text-white transition-colors'
			>
				<span className='flex items-center gap-1.5 text-xs font-medium'>
					<Info className='w-3 h-3' />
					{fields.length} field{fields.length !== 1 ? 's' : ''}
				</span>
				{open ? (
					<ChevronDown className='w-3 h-3' />
				) : (
					<ChevronUp className='w-3 h-3' />
				)}
			</button>

			{/* Fields */}
			{open && (
				<div className='px-4 pb-4 space-y-2 overflow-y-auto max-h-40'>
					{fields.map(({ key, value }) => (
						<div key={key} className='flex gap-2 text-xs'>
							<span className='text-slate-400 font-medium shrink-0 capitalize min-w-20'>
								{key.replace(/_/g, ' ')}:
							</span>
							<span className='text-slate-200 break-words line-clamp-2'>
								{value}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function SwipeLabelPage() {
	const { data: session } = useSession();
	const params = useParams();
	const router = useRouter();
	const datasetId = params.datasetId as string;

	const [dataset, setDataset] = useState<any>(null);
	const [queue, setQueue] = useState<DataItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [page, setPage] = useState(1);
	const [done, setDone] = useState(false);
	const [stats, setStats] = useState({ approved: 0, rejected: 0, skipped: 0 });
	const [selectedClass, setSelectedClass] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [showKeys, setShowKeys] = useState(false);
	const [infoOpen, setInfoOpen] = useState(false);

	const [drag, setDrag] = useState({
		active: false,
		startX: 0,
		startY: 0,
		x: 0,
		y: 0,
	});
	const cardRef = useRef<HTMLDivElement>(null);

	const token = (session as any)?.apiToken as string;
	const labelClasses: string[] = dataset?.labelClasses ?? [];
	const currentItem = queue[0] ?? null;
	const nextItem = queue[1] ?? null;

	// Derived content info for current card
	const currentImageUrl = currentItem
		? extractImageUrl(currentItem.content)
		: null;
	const currentMetaFields = currentItem
		? extractMetaFields(currentItem.content)
		: [];
	const currentTextContent =
		currentItem && !currentImageUrl
			? typeof currentItem.content === 'string'
				? currentItem.content
				: Object.entries(currentItem.content ?? {})
						.map(([k, v]) => `${k}: ${v}`)
						.join('\n')
			: null;

	// Load dataset + items
	useEffect(() => {
		if (!datasetId || !token) return;
		Promise.all([
			datasetApi.get(datasetId, token),
			datasetApi.getItems(datasetId, 1, 20, token, 'UNLABELED'),
		])
			.then(([ds, res]) => {
				setDataset(ds);
				setQueue(res.items ?? []);
				if ((res.items ?? []).length === 0) setDone(true);
			})
			.catch(() => setError('Failed to load dataset'))
			.finally(() => setLoading(false));
	}, [datasetId, token]);

	// Load more when queue gets low
	useEffect(() => {
		if (queue.length <= 3 && !done && !loading && token) {
			datasetApi
				.getItems(datasetId, page + 1, 20, token, 'UNLABELED')
				.then(res => {
					const newItems = (res.items ?? []).filter(
						(item: DataItem) => !queue.some(q => q._id === item._id),
					);
					if (newItems.length === 0) setDone(true);
					else {
						setQueue(prev => [...prev, ...newItems]);
						setPage(p => p + 1);
					}
				})
				.catch(() => {});
		}
	}, [queue.length]);

	const submitLabel = useCallback(
		async (decision: SwipeDecision) => {
			if (!currentItem || submitting) return;
			setSubmitting(true);

			const value =
				decision === 'approve'
					? (selectedClass ?? labelClasses[0] ?? 'approved')
					: decision === 'reject'
						? (labelClasses[labelClasses.length - 1] ?? 'rejected')
						: null;

			if (value) {
				try {
					await labelApi.create(currentItem._id, datasetId, value, token);
				} catch {
					/* non-fatal */
				}
			}

			setStats(prev => ({
				approved: decision === 'approve' ? prev.approved + 1 : prev.approved,
				rejected: decision === 'reject' ? prev.rejected + 1 : prev.rejected,
				skipped: decision === 'skip' ? prev.skipped + 1 : prev.skipped,
			}));

			setQueue(prev => prev.slice(1));
			setSelectedClass(null);
			setInfoOpen(false);
			setDrag({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
			setSubmitting(false);
		},
		[currentItem, submitting, selectedClass, labelClasses, datasetId, token],
	);

	// Keyboard controls
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// Don't trigger if typing in an input
			if ((e.target as HTMLElement).tagName === 'INPUT') return;
			if (e.key === 'ArrowRight' || e.key === 'l') submitLabel('approve');
			if (e.key === 'ArrowLeft' || e.key === 'j') submitLabel('reject');
			if (e.key === 'ArrowDown' || e.key === 'k') submitLabel('skip');
			if (e.key === 'i') setInfoOpen(p => !p);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [submitLabel]);

	// Mouse drag
	const onMouseDown = (e: React.MouseEvent) => {
		setDrag({ active: true, startX: e.clientX, startY: e.clientY, x: 0, y: 0 });
	};
	const onMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!drag.active) return;
			setDrag(prev => ({
				...prev,
				x: e.clientX - prev.startX,
				y: e.clientY - prev.startY,
			}));
		},
		[drag.active],
	);
	const onMouseUp = useCallback(() => {
		if (!drag.active) return;
		if (drag.x > 80) submitLabel('approve');
		else if (drag.x < -80) submitLabel('reject');
		else setDrag({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
	}, [drag, submitLabel]);

	useEffect(() => {
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};
	}, [onMouseMove, onMouseUp]);

	// Touch drag
	const onTouchStart = (e: React.TouchEvent) => {
		const t = e.touches[0];
		setDrag({ active: true, startX: t.clientX, startY: t.clientY, x: 0, y: 0 });
	};
	const onTouchMove = (e: React.TouchEvent) => {
		if (!drag.active) return;
		const t = e.touches[0];
		setDrag(prev => ({
			...prev,
			x: t.clientX - prev.startX,
			y: t.clientY - prev.startY,
		}));
	};
	const onTouchEnd = () => {
		if (drag.x > 80) submitLabel('approve');
		else if (drag.x < -80) submitLabel('reject');
		else setDrag({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
	};

	const swipeProgress = Math.min(Math.abs(drag.x) / 80, 1);
	const cardRotation = (drag.x / 20) * (drag.y > 0 ? 1 : -1);
	const cardTransform = drag.active
		? `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${cardRotation}deg)`
		: 'translate(0,0) rotate(0deg)';

	if (loading)
		return (
			<div className='min-h-screen bg-slate-900 flex items-center justify-center'>
				<div className='text-center'>
					<Loader className='w-8 h-8 animate-spin text-teal-400 mx-auto mb-3' />
					<p className='text-slate-400'>Loading items...</p>
				</div>
			</div>
		);

	if (error)
		return (
			<div className='min-h-screen bg-slate-900 flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-red-400 mb-4'>{error}</p>
					<button
						onClick={() => router.back()}
						className='text-teal-400 hover:underline'
					>
						Go back
					</button>
				</div>
			</div>
		);

	const total = stats.approved + stats.rejected + stats.skipped;

	return (
		<div className='min-h-screen bg-slate-900 flex flex-col select-none'>
			{/* Header */}
			<div className='flex items-center justify-between px-6 py-4 border-b border-slate-800'>
				<button
					onClick={() => router.push(`/dashboard/label/${datasetId}`)}
					className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors'
				>
					<ArrowLeft className='w-4 h-4' />
					<span className='text-sm'>Back</span>
				</button>
				<div className='text-center'>
					<h1 className='text-white font-semibold text-sm truncate max-w-48'>
						{dataset?.name ?? 'Label Dataset'}
					</h1>
					<p className='text-slate-500 text-xs'>
						{queue.length} items remaining
					</p>
				</div>
				<button
					onClick={() => setShowKeys(p => !p)}
					className='text-slate-400 hover:text-white transition-colors'
				>
					<Keyboard className='w-4 h-4' />
				</button>
			</div>

			{/* Keyboard shortcut hint */}
			{showKeys && (
				<div className='bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-center gap-6 text-xs text-slate-400'>
					<span>
						<kbd className='bg-slate-700 px-2 py-0.5 rounded'>←</kbd> Reject
					</span>
					<span>
						<kbd className='bg-slate-700 px-2 py-0.5 rounded'>→</kbd> Approve
					</span>
					<span>
						<kbd className='bg-slate-700 px-2 py-0.5 rounded'>↓</kbd> Skip
					</span>
					<span>
						<kbd className='bg-slate-700 px-2 py-0.5 rounded'>I</kbd> Info
					</span>
				</div>
			)}

			{/* Session stats */}
			{total > 0 && (
				<div className='flex items-center justify-center gap-6 pt-3 pb-1'>
					<span className='text-green-400 text-sm font-medium'>
						{stats.approved} ✓
					</span>
					<span className='text-red-400 text-sm font-medium'>
						{stats.rejected} ✗
					</span>
					<span className='text-slate-500 text-sm'>
						{stats.skipped} skipped
					</span>
				</div>
			)}

			{/* Card stack */}
			<div className='flex-1 flex flex-col items-center justify-center px-4 py-4 gap-6'>
				{done || queue.length === 0 ? (
					<div className='text-center space-y-4'>
						<CheckCircle className='w-16 h-16 text-teal-400 mx-auto' />
						<h2 className='text-2xl font-bold text-white'>All done!</h2>
						<p className='text-slate-400'>
							{stats.approved} approved · {stats.rejected} rejected ·{' '}
							{stats.skipped} skipped
						</p>
						<button
							onClick={() => router.push(`/dashboard/label/${datasetId}`)}
							className='mt-4 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors'
						>
							Back to Dataset
						</button>
					</div>
				) : (
					<div className='relative w-full max-w-sm h-[460px]'>
						{/* Back card — simplified, no info panel */}
						{nextItem && (
							<div className='absolute inset-0 rounded-2xl overflow-hidden bg-white shadow-lg scale-95 translate-y-2 z-0'>
								{(() => {
									const imgUrl = extractImageUrl(nextItem.content);
									if (imgUrl)
										return (
											<img
												src={imgUrl}
												alt=''
												className='w-full h-full object-cover opacity-60'
												draggable={false}
											/>
										);
									return (
										<div className='w-full h-full flex items-center justify-center p-8 opacity-50'>
											<p className='text-slate-700 text-base text-center leading-relaxed'>
												{typeof nextItem.content === 'string'
													? nextItem.content
													: Object.values(nextItem.content ?? {}).join(' · ')}
											</p>
										</div>
									);
								})()}
							</div>
						)}

						{/* Main card */}
						<div
							ref={cardRef}
							className='absolute inset-0 rounded-2xl overflow-hidden bg-white shadow-2xl z-10 cursor-grab active:cursor-grabbing'
							style={{
								transform: cardTransform,
								transition: drag.active
									? 'none'
									: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
								userSelect: 'none',
							}}
							onMouseDown={onMouseDown}
							onTouchStart={onTouchStart}
							onTouchMove={onTouchMove}
							onTouchEnd={onTouchEnd}
						>
							{/* Image content */}
							{currentImageUrl ? (
								<img
									src={currentImageUrl}
									alt='Data item'
									className='w-full h-full object-cover'
									draggable={false}
								/>
							) : (
								/* Text / object content */
								<div className='w-full h-full flex items-center justify-center p-8 pb-12'>
									<p className='text-slate-800 text-lg leading-relaxed text-center font-medium whitespace-pre-line'>
										{currentTextContent}
									</p>
								</div>
							)}

							{/* Swipe right indicator */}
							{drag.active && drag.x > 20 && (
								<div
									className='absolute inset-0 bg-green-500/20 flex items-start justify-start p-6 pointer-events-none'
									style={{ opacity: swipeProgress }}
								>
									<span className='text-green-500 font-black text-3xl border-4 border-green-500 px-3 py-1 rounded-xl rotate-[-15deg]'>
										LABEL
									</span>
								</div>
							)}

							{/* Swipe left indicator */}
							{drag.active && drag.x < -20 && (
								<div
									className='absolute inset-0 bg-red-500/20 flex items-start justify-end p-6 pointer-events-none'
									style={{ opacity: swipeProgress }}
								>
									<span className='text-red-500 font-black text-3xl border-4 border-red-500 px-3 py-1 rounded-xl rotate-[15deg]'>
										SKIP
									</span>
								</div>
							)}

							{/* Item ID badge */}
							<div className='absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full pointer-events-none'>
								#{currentItem._id.slice(-6)}
							</div>

							{/* Status badge */}
							{currentItem.status !== 'UNLABELED' && (
								<div className='absolute top-3 left-3 bg-teal-500/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full pointer-events-none'>
									{currentItem.status}
								</div>
							)}

							{/* Metadata panel — slides up from bottom */}
							<MetaPanel
								fields={currentMetaFields}
								open={infoOpen}
								onToggle={() => setInfoOpen(p => !p)}
							/>
						</div>
					</div>
				)}

				{/* Label class selector */}
				{!done && queue.length > 0 && labelClasses.length > 0 && (
					<div className='w-full max-w-sm'>
						<p className='text-slate-500 text-xs text-center mb-2'>
							<Tag className='w-3 h-3 inline mr-1' />
							Select label before swiping right
						</p>
						<div className='flex flex-wrap gap-2 justify-center'>
							{labelClasses.map(cls => (
								<button
									key={cls}
									onClick={() =>
										setSelectedClass(selectedClass === cls ? null : cls)
									}
									className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
										selectedClass === cls
											? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
											: 'bg-slate-800 text-slate-300 hover:bg-slate-700'
									}`}
								>
									{cls}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Action buttons */}
				{!done && queue.length > 0 && (
					<div className='flex items-center gap-4'>
						<button
							onClick={() => submitLabel('reject')}
							disabled={submitting}
							className='w-14 h-14 rounded-full bg-slate-800 border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all disabled:opacity-50 group'
						>
							<ThumbsDown className='w-6 h-6 text-red-400 group-hover:text-red-500' />
						</button>

						<button
							onClick={() => submitLabel('skip')}
							disabled={submitting}
							className='w-11 h-11 rounded-full bg-slate-800 border border-slate-600 hover:border-slate-400 flex items-center justify-center transition-all disabled:opacity-50'
						>
							<SkipForward className='w-4 h-4 text-slate-400' />
						</button>

						<button
							onClick={() => submitLabel('approve')}
							disabled={
								submitting || (labelClasses.length > 0 && !selectedClass)
							}
							className='w-14 h-14 rounded-full bg-slate-800 border-2 border-green-500/50 hover:border-green-500 hover:bg-green-500/10 flex items-center justify-center transition-all disabled:opacity-50 group'
						>
							{submitting ? (
								<Loader className='w-5 h-5 text-slate-400 animate-spin' />
							) : (
								<ThumbsUp className='w-6 h-6 text-green-400 group-hover:text-green-500' />
							)}
						</button>
					</div>
				)}

				{/* Hint */}
				{!done &&
					queue.length > 0 &&
					labelClasses.length > 0 &&
					!selectedClass && (
						<p className='text-yellow-500/70 text-xs text-center'>
							Select a label class to enable approve
						</p>
					)}
			</div>
		</div>
	);
}
