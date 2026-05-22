'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { datasetApi } from '@/lib/api-client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Loader, Globe, Users, Lock, UserPlus, Trash2, Settings, CheckCircle, Circle } from 'lucide-react';

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
			loadDataset();
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

	const visibilityBadge = (v: string) => {
		if (v === 'PUBLIC') return 'badge-teal';
		if (v === 'TEAM') return 'badge-blue';
		return 'badge-slate';
	};

	const VisibilityIcon = visibility === 'PUBLIC' ? Globe : visibility === 'TEAM' ? Users : Lock;

	const statusBadge = (status: string) => {
		if (status === 'VERIFIED') return 'badge-green';
		if (status === 'LABELED') return 'badge-teal';
		return 'badge-slate';
	};

	const tabs = [
		{ id: 'items' as const, label: 'Items', ownerOnly: false },
		{ id: 'members' as const, label: `Members (${members.length})`, ownerOnly: false },
		{ id: 'settings' as const, label: 'Settings', ownerOnly: true },
	];

	if (error) return (
		<div className='p-6'>
			<Card className='border-red-200 bg-red-50'><CardBody><p className='text-red-700'>{error}</p></CardBody></Card>
		</div>
	);

	return (
		<div className='p-4 sm:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in'>
			{/* Header */}
			<Card>
				<CardBody>
					<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
						<div>
							<h1 className='text-2xl font-bold text-slate-900'>
								{dataset?.name ?? 'Dataset'}
							</h1>
							{dataset?.description && (
								<p className='text-sm text-slate-500 mt-1'>
									{dataset.description}
								</p>
							)}
							<div className='flex items-center gap-2.5 mt-2'>
								{dataset?.visibility && (
									<span className={visibilityBadge(dataset.visibility)}>
										<VisibilityIcon className='w-3 h-3' />
										{dataset.visibility}
									</span>
								)}
								{isOwner && <span className='badge-teal'>Owner</span>}
							</div>
						</div>
						{pagination && (
							<div className='text-right'>
								<p className='text-2xl font-bold text-slate-900'>
									{pagination.total}
								</p>
								<p className='text-xs text-slate-500'>total items</p>
							</div>
						)}
					</div>
				</CardBody>
			</Card>

			{/* Tabs */}
			<div className='flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit'>
				{tabs.map(tab => {
					if (tab.ownerOnly && !isOwner) return null;
					const isTabActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
								isTabActive
									? 'bg-white text-teal-600 shadow-soft'
									: 'text-slate-600 hover:text-slate-900'
							}`}
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
						<div className='text-center py-16'>
							<Loader className='w-8 h-8 animate-spin mx-auto mb-4 text-teal-600' />
							<p className='text-slate-500'>Loading items...</p>
						</div>
					) : items.length === 0 ? (
						<Card>
							<CardBody className='text-center py-12'>
								<p className='text-slate-500'>No items found in this dataset</p>
							</CardBody>
						</Card>
					) : (
						<div className='space-y-3'>
							{items.map(item => (
								<Card
									key={item._id}
									className={
										statusBadge(item.status) === 'badge-green'
											? 'border-green-200'
											: statusBadge(item.status) === 'badge-teal'
												? 'border-teal-200'
												: ''
									}
								>
									<CardBody>
										<div className='flex items-start justify-between gap-4'>
											<div className='flex-1 min-w-0'>
												{typeof item.content === 'object' &&
												item.content !== null ? (
													<div className='space-y-1.5'>
														{Object.entries(item.content).map(
															([key, value]) => (
																<div key={key} className='flex gap-2 text-sm'>
																	<span className='font-medium text-slate-600 min-w-28 shrink-0'>
																		{key}:
																	</span>
																	<span className='text-slate-700 break-words'>
																		{String(value)}
																	</span>
																</div>
															),
														)}
													</div>
												) : (
													<p className='text-sm text-slate-700 whitespace-pre-wrap break-words'>
														{String(item.content)}
													</p>
												)}
											</div>
											<span className={statusBadge(item.status)}>
												{item.status === 'VERIFIED' ? (
													<CheckCircle className='w-3 h-3' />
												) : item.status === 'LABELED' ? (
													<CheckCircle className='w-3 h-3' />
												) : (
													<Circle className='w-3 h-3' />
												)}
												{item.status}
											</span>
										</div>
									</CardBody>
								</Card>
							))}
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
								{Array.from(
									{ length: Math.min(pagination.pages, 5) },
									(_, i) => {
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
									},
								)}
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

			{/* Members tab */}
			{activeTab === 'members' && (
				<div className='space-y-4'>
					{isOwner && (
						<Card>
							<CardHeader title='Invite Member' />
							<CardBody>
								<form
									onSubmit={handleInvite}
									className='flex flex-col sm:flex-row gap-3'
								>
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
										className='select-field w-full sm:w-36'
									>
										<option value='LABELER'>Labeler</option>
										<option value='VERIFIER'>Verifier</option>
										<option value='BOTH'>Labeler + Verifier</option>
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
						<CardBody className='p-0'>
							{members.length === 0 ? (
								<p className='text-slate-500 text-center py-8'>
									No team members yet. {isOwner ? 'Invite someone above.' : ''}
								</p>
							) : (
								<div className='divide-y divide-slate-100'>
									{members.map((member: Member) => (
										<div
											key={member.id}
											className='flex items-center justify-between px-6 py-4'
										>
											<div className='flex items-center gap-3 min-w-0 flex-1'>
												{member.user.image ? (
													<img
														src={member.user.image}
														alt=''
														className='w-9 h-9 rounded-full ring-2 ring-slate-100'
													/>
												) : (
													<div className='w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium text-sm ring-2 ring-teal-50'>
														{member.user.name?.[0] ?? '?'}
													</div>
												)}
												<div className='min-w-0'>
													<p className='font-medium text-slate-900 text-sm truncate'>
														{member.user.name}
													</p>
													<p className='text-xs text-slate-500 truncate'>
														{member.user.email}
													</p>
												</div>
											</div>
											<div className='flex items-center gap-3 flex-shrink-0 ml-4'>
												<span className='badge-slate text-xs'>
													{member.role}
												</span>
												{isOwner && (
													<button
														onClick={() => handleRemoveMember(member.user.id)}
														className='p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all'
														title='Remove member'
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
							<div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
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
									const isVisActive = visibility === opt.value;
									return (
										<button
											key={opt.value}
											type='button'
											onClick={() => setVisibility(opt.value)}
											className={`p-4 rounded-xl border-2 text-left transition-all ${
												isVisActive
													? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
													: 'border-slate-200 hover:border-slate-300 bg-white'
											}`}
										>
											<Icon
												className={`w-5 h-5 mb-2 ${isVisActive ? 'text-teal-600' : 'text-slate-400'}`}
											/>
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