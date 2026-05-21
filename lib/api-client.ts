/**
 * API Client for Trainarium Backend
 * Handles all communication with the trainarium-api server
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface RequestOptions extends RequestInit {
	token?: string;
}

// Global 401 handler — called when any request gets an invalid/expired token
let on401: (() => void) | null = null;
export function setOn401Handler(handler: () => void) {
	on401 = handler;
}

async function fetchApi<T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	const { token, ...fetchOptions } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(fetchOptions.headers as Record<string, string>),
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	let res: Response;

	try {
		res = await fetch(`${API_URL}${endpoint}`, {
			...fetchOptions,
			headers,
		});
	} catch (err) {
		throw new Error('Network error — backend may be offline');
	}

	// Handle session expiry globally
	if (res.status === 401) {
		if (on401) on401();
		throw new Error('Session expired. Please sign in again.');
	}

	let data: any;
	try {
		data = await res.json();
	} catch {
		data = null;
	}

	if (!res.ok) {
		const message =
			data?.details?.map((d: any) => d.message).join(', ') ||
			data?.error ||
			`Request failed (${res.status})`;
		throw new Error(message);
	}

	return data;
}

export const authApi = {
	register: (name: string, email: string, password: string): Promise<any> =>
		fetchApi('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({ name, email, password }),
		}),

	login: (email: string, password: string): Promise<any> =>
		fetchApi('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		}),

	syncUser: (email: string, name?: string, image?: string): Promise<any> =>
		fetchApi('/api/auth/sync-user', {
			method: 'POST',
			body: JSON.stringify({ email, name, image }),
		}),
};

export const datasetApi = {
	list: (token: string): Promise<any[]> =>
		fetchApi<any[]>('/api/datasets', { token }),

	get: (id: string, token: string): Promise<any> =>
		fetchApi<any>(`/api/datasets/${id}`, { token }),

	create: (
		name: string,
		description: string | undefined,
		token: string,
		labelClasses?: string[],
		visibility?: string,
		rewardPerItem?: number,
		consensusRequired?: number,
	): Promise<{ id: string; [key: string]: any }> =>
		// Fixed: Explicitly typed return shape
		fetchApi<{ id: string; [key: string]: any }>('/api/datasets', {
			method: 'POST',
			token,
			body: JSON.stringify({
				name,
				description,
				labelClasses,
				visibility,
				rewardPerItem,
				consensusRequired,
			}),
		}),

	getItems: (
		id: string,
		page = 1,
		limit = 20,
		token: string,
		status?: string,
	): Promise<{ items: any[]; pagination: any }> =>
		fetchApi<{ items: any[]; pagination: any }>(
			`/api/datasets/${id}/items?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
			{ token },
		),

	uploadItems: (datasetId: string, items: any[], token: string): Promise<any> =>
		fetchApi(`/api/datasets/${datasetId}/items`, {
			method: 'POST',
			token,
			body: JSON.stringify({ items }),
		}),

	delete: (id: string, token: string): Promise<void> =>
		fetchApi(`/api/datasets/${id}`, { method: 'DELETE', token }),
};

export const labelApi = {
	create: (
		itemId: string,
		datasetId: string,
		value: string,
		token: string,
		confidence?: number,
	): Promise<any> =>
		fetchApi('/api/labels', {
			method: 'POST',
			token,
			body: JSON.stringify({ itemId, datasetId, value, confidence }),
		}),

	getByItem: (itemId: string, token: string): Promise<any[]> =>
		fetchApi(`/api/labels/item/${itemId}`, { token }),

	getMy: (token: string): Promise<any[]> =>
		fetchApi('/api/labels/my', { token }),

	delete: (id: string, token: string): Promise<void> =>
		fetchApi(`/api/labels/${id}`, { method: 'DELETE', token }),
};

export const verificationApi = {
	submit: (
		itemId: string,
		approved: boolean,
		token: string,
		comments?: string,
		datasetId?: string,
	): Promise<any> =>
		fetchApi('/api/verifications', {
			method: 'POST',
			token,
			body: JSON.stringify({ itemId, datasetId, approved, comments }),
		}),

	getQueue: (token: string): Promise<any> =>
		fetchApi('/api/verifications/queue', { token }),

	getMy: (token: string): Promise<any> =>
		fetchApi('/api/verifications/my', { token }),
};

export const statsApi = {
	get: (
		token: string,
	): Promise<{
		totalDatasets: number;
		totalItems: number;
		totalLabels: number;
		totalVerifications: number;
	}> =>
		fetchApi<{
			totalDatasets: number;
			totalItems: number;
			totalLabels: number;
			totalVerifications: number;
		}>('/api/stats', { token }),
};

export const usersApi = {
	getMe: (token: string): Promise<{ user: any; stats: any }> =>
		fetchApi<{ user: any; stats: any }>('/api/users/me', { token }),

	updateMe: (
		data: { name?: string; image?: string },
		token: string,
	): Promise<any> =>
		fetchApi('/api/users/me', {
			method: 'PATCH',
			token,
			body: JSON.stringify(data),
		}),
};

export const analyticsApi = {
	getAnalytics: async (datasetId: string, token: string): Promise<any> => {
		return fetchApi(`/api/analytics/${datasetId}`, { token });
	},
};

export const exportApi = {
	exportDataset: async (
		datasetId: string,
		format: 'json' | 'csv',
		token: string,
	): Promise<Blob> => {
		const response = await fetch(
			`${API_URL}/api/datasets/${datasetId}/export?format=${format}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);
		if (!response.ok) throw new Error('Export failed');
		return response.blob();
	},
};

export default {
	auth: authApi,
	datasets: datasetApi,
	labels: labelApi,
	verifications: verificationApi,
	stats: statsApi,
	users: usersApi,
	analytics: analyticsApi,
	export: exportApi,
};
