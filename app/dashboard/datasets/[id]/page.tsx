'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { datasetApi } from '@/lib/api-client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Loader, Globe, Users, Lock, UserPlus, Trash2, Settings } from 'lucide-react';

interface DataItem {
	_id: string;
	datasetId: string;
	status: string;
	content: any;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

interface Member {
	id: string;
	role: string;
	user: { id: string; name: string; email: string; image?: string };
}

export default function DatasetDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { data: session } = useSession();

	const [dataset, setDataset] = useState<any>(null);
	const [items, setItems] = useState<DataItem[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'items' | 'members' | 'settings'>('items');

	// Members state
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState('LABELER');
	const [inviting, setInviting] = useState(false);
	const [inviteError, setInviteError] = useState('');

	// Settings state
	const [visibility, setVisibility] = useState('PRIVATE');
	const [savingSettings, setSavingSettings] = useState(false);

	const token = (session as any)?.apiToken as string;
	const userId = session?.user?.id;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	useEffect(() => {
		if (!id || !token) return;
		loadDataset();
	}, [id, token]);

	useEffect(() => {
		if (!id || !token) return;
		loadItems();
	}, [id, token, page]);

	const loadDataset = async () => {
		try {
			const ds = await datasetApi.get(id, token);
			setDataset(ds);
			setVisibility(ds.visibility ?? 'PRIVATE');
		} catch (err: any) {
			setError(err.message || 'Failed to load dataset');
		}
	};

	const loadItems = async () => {
		setLoading(true);
		try {
			const res = await datasetApi.getItems(id, page, 20, token);
			setItems(res.items ?? []);
			setPagination(res.pagination ?? null);
		} catch (err: any) {
			setError(err.message || 'Failed to load items');
		} finally {
			setLoading(false);
		}
	};

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setInviteError('');
		setInviting(true);
		try {
			const res = await fetch(`${apiUrl}/api/datasets/${id}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to invite member');
			setInviteEmail('');
			loadDataset(); // refresh members list
		} catch (err: any) {
			setInviteError(err.message);
		} finally {
			setInviting(false);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		if (!confirm('Remove this member?')) return;
		try {
			await fetch(`${apiUrl}/api/datasets/${id}/members/${memberId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			loadDataset();
		} catch {
			alert('Failed to remove member');
		}
	};

	const handleSaveSettings = async () => {
		setSavingSettings(true);
		try {
			await fetch(`${apiUrl}/api/datasets/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ visibility }),
			});
			setDataset((prev: any) => ({ ...prev, visibility }));
		} catch {
			alert('Failed to save settings');
		} finally {
			setSavingSettings(false);
		}
	};

	const isOwner = dataset?.isOwner ?? dataset?.userId === userId;
	const members: Member[] = dataset?.members ?? [];

	const VisibilityIcon = visibility === 'PUBLIC' ? Globe : visibility === 'TEAM' ? Users : Lock;

	if (error) return (
		<div className='p-6'>
			<Card className='border-red-200 bg-red-50'><CardBody><p className='text-red-700'>{error}</p></CardBody></Card>
		</div>
	);

	return (
		<div className='p-6 space-y-4 max-w-5xl mx-auto'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-slate-900'>
						{dataset?.name ?? 'Dataset'}
					</h1>
					{dataset?.description && (
						<p className='text-sm text-slate-500 mt-1'>{dataset.description}</p>
					)}
					<div className='flex items-center gap-2 mt-2'>
						<span
							className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
								dataset?.visibility === 'PUBLIC'
									? 'text-teal-600 bg-teal-50 border-teal-200'
									: dataset?.visibility === 'TEAM'
										? 'text-blue-600 bg-blue-50 border-blue-200'
										: 'text-slate-500 bg-slate-50 border-slate-200'
							}`}
						>
							<VisibilityIcon className='w-3 h-3' />
							{dataset?.visibility ?? 'PRIVATE'}
						</span>
						{isOwner && <span className='text-xs text-slate-400'>Owner</span>}
					</div>
				</div>
				{pagination && (
					<p className='text-sm text-slate-600'>{pagination.total} items</p>
				)}
			</div>

			{/* Tabs */}
			<div className='flex gap-2 border-b border-slate-200'>
				{(
					[
						{ id: 'items', label: 'Items', ownerOnly: false },
						{
							id: 'members',
							label: `Members (${members.length})`,
							ownerOnly: false,
						},
						{ id: 'settings', label: 'Settings', ownerOnly: true },
					] as const
				).map(tab => {
					if (tab.ownerOnly && !isOwner) return null;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
						>
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Items tab */}
			{activeTab === 'items' && (
				<>
					{loading ? (
						<div className='text-center py-12'>
							<Loader className='animate-spin mx-auto mb-2' />
							<p className='text-slate-600'>Loading items...</p>
						</div>
					) : items.length === 0 ? (
						<Card>
							<CardBody className='text-center py-12'>
								<p className='text-slate-600'>No items found</p>
							</CardBody>
						</Card>
					) : (
						<div className='space-y-3'>
							{items.map(item => (
								<Card key={item._id}>
									<CardBody>
										<div className='flex items-start justify-between gap-4'>
											<div className='flex-1'>
												{typeof item.content === 'object' &&
												item.content !== null ? (
													<div className='space-y-1'>
														{Object.entries(item.content).map(
															([key, value]) => (
																<div key={key} className='flex gap-2 text-sm'>
																	<span className='font-medium text-slate-700 min-w-32 shrink-0'>
																		{key}:
																	</span>
																	<span className='text-slate-600'>
																		{String(value)}
																	</span>
																</div>
															),
														)}
													</div>
												) : (
													<pre className='text-sm whitespace-pre-wrap text-slate-700'>
														{String(item.content)}
													</pre>
												)}
											</div>
											<span
												className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
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
									</CardBody>
								</Card>
							))}
						</div>
					)}

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

			{/* Members tab */}
			{activeTab === 'members' && (
				<div className='space-y-4'>
					{isOwner && (
						<Card>
							<CardHeader title='Invite Member' />
							<CardBody>
								<form onSubmit={handleInvite} className='flex gap-3'>
									<input
										type='email'
										value={inviteEmail}
										onChange={e => setInviteEmail(e.target.value)}
										placeholder='Email address'
										className='input-field flex-1'
										required
									/>
									<select
										value={inviteRole}
										onChange={e => setInviteRole(e.target.value)}
										className='input-field w-36'
									>
										<option value='LABELER'>Labeler</option>
										<option value='VERIFIER'>Verifier</option>
									</select>
									<button
										type='submit'
										disabled={inviting}
										className='btn-primary flex items-center gap-2 disabled:opacity-50'
									>
										{inviting ? (
											<Loader className='w-4 h-4 animate-spin' />
										) : (
											<UserPlus className='w-4 h-4' />
										)}
										Invite
									</button>
								</form>
								{inviteError && (
									<p className='text-red-600 text-sm mt-2'>{inviteError}</p>
								)}
							</CardBody>
						</Card>
					)}

					<Card>
						<CardHeader title='Team Members' />
						<CardBody>
							{members.length === 0 ? (
								<p className='text-slate-500 text-center py-6'>
									No team members yet. {isOwner ? 'Invite someone above.' : ''}
								</p>
							) : (
								<div className='space-y-3'>
									{members.map((member: Member) => (
										<div
											key={member.id}
											className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
										>
											<div className='flex items-center gap-3'>
												{member.user.image ? (
													<img
														src={member.user.image}
														alt=''
														className='w-8 h-8 rounded-full'
													/>
												) : (
													<div className='w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium text-sm'>
														{member.user.name?.[0] ?? '?'}
													</div>
												)}
												<div>
													<p className='font-medium text-slate-900 text-sm'>
														{member.user.name}
													</p>
													<p className='text-xs text-slate-500'>
														{member.user.email}
													</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<span className='text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded'>
													{member.role}
												</span>
												{isOwner && (
													<button
														onClick={() => handleRemoveMember(member.user.id)}
														className='text-slate-400 hover:text-red-600 transition-colors'
													>
														<Trash2 className='w-4 h-4' />
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}

			{/* Settings tab — owner only */}
			{activeTab === 'settings' && isOwner && (
				<Card>
					<CardHeader title='Dataset Settings' />
					<CardBody className='space-y-6'>
						<div>
							<label className='block text-sm font-medium text-slate-900 mb-3'>
								Visibility
							</label>
							<div className='grid grid-cols-3 gap-3'>
								{[
									{
										value: 'PRIVATE',
										label: 'Private',
										icon: Lock,
										desc: 'Only you',
									},
									{
										value: 'TEAM',
										label: 'Team',
										icon: Users,
										desc: 'Invited members',
									},
									{
										value: 'PUBLIC',
										label: 'Public',
										icon: Globe,
										desc: 'Anyone',
									},
								].map(opt => {
									const Icon = opt.icon;
									return (
										<button
											key={opt.value}
											type='button'
											onClick={() => setVisibility(opt.value)}
											className={`p-3 rounded-lg border-2 text-left transition-all ${visibility === opt.value ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
										>
											<Icon className='w-4 h-4 mb-1 text-slate-600' />
											<div className='font-medium text-sm text-slate-900'>
												{opt.label}
											</div>
											<div className='text-xs text-slate-500'>{opt.desc}</div>
										</button>
									);
								})}
							</div>
						</div>
						<button
							onClick={handleSaveSettings}
							disabled={savingSettings}
							className='btn-primary flex items-center gap-2 disabled:opacity-50'
						>
							{savingSettings ? (
								<Loader className='w-4 h-4 animate-spin' />
							) : (
								<Settings className='w-4 h-4' />
							)}
							Save Settings
						</button>
					</CardBody>
				</Card>
			)}
		</div>
	);
}