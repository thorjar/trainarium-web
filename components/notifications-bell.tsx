// components/notifications-bell.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, DollarSign, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationsBell() {
	const { notifications, unreadCount, markAllRead } = useNotifications();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const handleOpen = () => {
		setOpen(p => !p);
		if (!open) markAllRead();
	};

	const iconForType = (type: string) => {
		if (type === 'consensus_approved' || type === 'verification_rewarded')
			return <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />;
		if (type === 'consensus_rejected')
			return <XCircle className='w-4 h-4 text-red-500 flex-shrink-0' />;
		return <DollarSign className='w-4 h-4 text-teal-500 flex-shrink-0' />;
	};

	return (
		<div ref={ref} className='relative'>
			<button
				onClick={handleOpen}
				className='relative p-2 rounded-lg hover:bg-slate-100 transition-colors'
				title='Notifications'
			>
				<Bell className='w-5 h-5 text-slate-600' />
				{unreadCount > 0 && (
					<span className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold'>
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className='absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50'>
					<div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
						<h3 className='font-semibold text-slate-900 text-sm'>
							Notifications
						</h3>
						<button
							onClick={() => setOpen(false)}
							className='text-slate-400 hover:text-slate-600'
						>
							<X className='w-4 h-4' />
						</button>
					</div>

					<div className='max-h-80 overflow-y-auto'>
						{notifications.length === 0 ? (
							<div className='text-center py-8 text-slate-500 text-sm'>
								No notifications yet
							</div>
						) : (
							notifications.map(n => (
								<div
									key={n.id}
									className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
								>
									{iconForType(n.type)}
									<div className='flex-1 min-w-0'>
										<p className='text-sm text-slate-800 leading-snug'>
											{n.message}
										</p>
										<p className='text-xs text-slate-400 mt-0.5'>
											{n.timestamp.toLocaleTimeString()}
										</p>
									</div>
								</div>
							))
						)}
					</div>

					{notifications.length > 0 && (
						<div className='px-4 py-2 border-t border-slate-100'>
							<a
								href='/dashboard/earnings'
								className='text-xs text-teal-600 hover:underline'
							>
								View all earnings →
							</a>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
