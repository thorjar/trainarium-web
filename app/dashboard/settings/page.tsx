'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/card';
import { Settings, User, Lock, Bell, LogOut, Loader } from 'lucide-react';
import { usersApi } from '@/lib/api-client';

export default function SettingsPage() {
	const { data: session, update } = useSession();
	const [activeTab, setActiveTab] = useState<
		'profile' | 'security' | 'notifications'
	>('profile');
	const [name, setName] = useState('');
	const [editingName, setEditingName] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const [saveSuccess, setSaveSuccess] = useState('');

	useEffect(() => {
		if (session?.user?.name) {
			setName(session.user.name);
		}
	}, [session?.user?.name]); // ← sync when session loads

	const handleSaveName = async () => {
		if (!name.trim()) return;
		setSaving(true);
		setSaveError('');
		setSaveSuccess('');

		try {
			// Update via API
			await usersApi.updateMe({ name: name.trim() }, (session as any).apiToken);

			// Force NextAuth session refresh
			await update(); // ← triggers re-fetch from server

			setSaveSuccess('Name updated successfully');
			setEditingName(false);
		} catch (err: any) {
			setSaveError(err.message || 'Failed to update name');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<Settings className='w-8 h-8 text-slate-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Settings</h1>
					</div>
					<p className='text-slate-600'>Manage your account and preferences</p>
				</div>
			</div>

			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<div className='flex gap-4 mb-8 border-b border-slate-200'>
					{[
						{ id: 'profile' as const, label: 'Profile', icon: User },
						{ id: 'security' as const, label: 'Security', icon: Lock },
						{
							id: 'notifications' as const,
							label: 'Notifications',
							icon: Bell,
						},
					].map(tab => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
							>
								<Icon className='w-4 h-4' />
								{tab.label}
							</button>
						);
					})}
				</div>

				{activeTab === 'profile' && (
					<Card>
						<CardHeader title='Profile Information' />
						<CardBody className='space-y-6'>
							{saveError && (
								<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
									{saveError}
								</div>
							)}
							{saveSuccess && (
								<div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm'>
									✓ {saveSuccess}
								</div>
							)}
							<div>
								<label className='block text-sm font-medium text-slate-900 mb-2'>
									Full Name
								</label>
								{editingName ? (
									<div className='flex items-center gap-2'>
										<input
											type='text'
											value={name}
											onChange={e => setName(e.target.value)}
											className='input-field flex-1'
											autoFocus
										/>
										<button
											onClick={handleSaveName}
											disabled={saving}
											className='btn-primary flex items-center gap-1'
										>
											{saving && <Loader className='w-3 h-3 animate-spin' />}
											Save
										</button>
										<button
											onClick={() => setEditingName(false)}
											className='btn-secondary'
										>
											Cancel
										</button>
									</div>
								) : (
									<div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200'>
										<span>{session?.user?.name}</span>
										<button
											onClick={() => {
												setName(session?.user?.name || '');
												setEditingName(true);
											}}
											className='text-teal-600 hover:text-teal-700 text-sm font-medium'
										>
											Edit
										</button>
									</div>
								)}
							</div>
							<div>
								<label className='block text-sm font-medium text-slate-900 mb-2'>
									Email Address
								</label>
								<div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200'>
									<span>{session?.user?.email}</span>
									<span className='text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded'>
										Verified
									</span>
								</div>
							</div>
							{session?.user?.image && (
								<div>
									<label className='block text-sm font-medium text-slate-900 mb-2'>
										Avatar
									</label>
									<img
										src={session.user.image}
										alt='Profile'
										className='w-16 h-16 rounded-full'
									/>
								</div>
							)}
						</CardBody>
					</Card>
				)}

				{activeTab === 'security' && (
					<Card>
						<CardHeader title='Security Settings' />
						<CardBody className='space-y-6'>
							<div>
								<h3 className='font-medium text-slate-900 mb-4'>Password</h3>
								<p className='text-slate-600 text-sm mb-4'>
									Update your password regularly to keep your account secure
								</p>
								<button className='btn-secondary'>Change Password</button>
							</div>
							<div className='border-t border-slate-200 pt-6'>
								<h3 className='font-medium text-slate-900 mb-4'>
									Two-Factor Authentication
								</h3>
								<p className='text-slate-600 text-sm mb-4'>
									Add an extra layer of security to your account
								</p>
								<button className='btn-secondary'>Enable 2FA</button>
							</div>
							<div className='border-t border-slate-200 pt-6'>
								<h3 className='font-medium text-slate-900 mb-4'>
									Active Sessions
								</h3>
								<div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200'>
									<div>
										<p className='font-medium text-slate-900'>Current Device</p>
										<p className='text-xs text-slate-600'>Active session</p>
									</div>
									<span className='text-xs font-medium text-green-600'>
										Active
									</span>
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{activeTab === 'notifications' && (
					<Card>
						<CardHeader title='Notification Preferences' />
						<CardBody className='space-y-4'>
							{[
								{
									label: 'Email Notifications',
									description: 'Receive updates via email',
								},
								{
									label: 'Labeling Reminders',
									description: 'Get reminded about pending labeling tasks',
								},
								{
									label: 'Verification Alerts',
									description: 'Be notified when labels need verification',
								},
								{
									label: 'Team Updates',
									description: 'Receive team activity notifications',
								},
							].map(notification => (
								<div
									key={notification.label}
									className='flex items-center justify-between p-4 border border-slate-200 rounded-lg'
								>
									<div>
										<p className='font-medium text-slate-900'>
											{notification.label}
										</p>
										<p className='text-sm text-slate-600'>
											{notification.description}
										</p>
									</div>
									<input
										type='checkbox'
										defaultChecked
										className='w-4 h-4 accent-teal-500'
									/>
								</div>
							))}
						</CardBody>
					</Card>
				)}

				<Card className='mt-8 border-red-200 bg-red-50'>
					<CardHeader title='Logout' />
					<CardBody>
						<p className='text-slate-600 mb-4'>Sign out from your account</p>
					</CardBody>
					<CardFooter className='bg-red-50'>
						<button
							onClick={() => signOut({ redirectTo: '/' })}
							className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium'
						>
							<LogOut className='w-4 h-4' />
							Logout
						</button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
