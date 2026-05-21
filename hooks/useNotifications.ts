// hooks/useNotifications.ts
// SSE hook — connect once per session and receive real-time notifications

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
	id: string;
	type:
		| 'consensus_approved'
		| 'consensus_rejected'
		| 'verification_rewarded'
		| 'connected';
	message: string;
	data?: any;
	timestamp: Date;
	read: boolean;
}

export function useNotifications() {
	const { data: session } = useSession();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [connected, setConnected] = useState(false);

	const token = (session as any)?.apiToken;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	// Load recent notifications from DB on mount
	useEffect(() => {
		if (!token) return;
		fetch(`${apiUrl}/api/notifications`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(r => r.json())
			.then((data: any[]) => {
				if (!Array.isArray(data)) return;
				setNotifications(
					data.map(n => ({
						...n,
						timestamp: new Date(n.resolvedAt ?? Date.now()),
						read: false,
					})),
				);
			})
			.catch(() => {});
	}, [token]);

	// Connect to SSE stream
	useEffect(() => {
		if (!token) return;

		const url = `${apiUrl}/api/notifications/stream`;
		const eventSource = new EventSource(`${url}?token=${token}`);

		eventSource.onopen = () => setConnected(true);

		eventSource.onmessage = event => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'connected') return;

				setNotifications(prev =>
					[
						{
							id: Math.random().toString(36).slice(2),
							type: data.type,
							message: data.message,
							data: data.data,
							timestamp: new Date(),
							read: false,
						},
						...prev,
					].slice(0, 50),
				); // keep last 50
			} catch {}
		};

		eventSource.onerror = () => {
			setConnected(false);
			eventSource.close();
		};

		return () => {
			eventSource.close();
			setConnected(false);
		};
	}, [token]);

	const markAllRead = useCallback(() => {
		setNotifications(prev => prev.map(n => ({ ...n, read: true })));
	}, []);

	const unreadCount = notifications.filter(n => !n.read).length;

	return { notifications, unreadCount, connected, markAllRead };
}
