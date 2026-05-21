'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/card';
import { Settings, User, Lock, Bell, LogOut, Loader, Check } from 'lucide-react';
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
	}, [session?.user?.name]);

	const handleSaveName = async () => {
		if (!name.trim()) return;
		setSaving(true);
		setSaveError('');
		setSaveSuccess('');

		try {
			await usersApi.updateMe({ name: name.trim() }, (session as any).apiToken);
			await update();
			setSaveSuccess('Name updated successfully');
			setEditingName(false);
		} catch (err: any) {
			setSaveError(err.message || 'Failed to update name');
		} finally {
			setSaving(false);
		}
	};

	const tabs = [
		{ id: 'profile' as const, label: 'Profile', icon: User },
		{ id: 'security' as const, label: 'Security', icon: Lock },
		{ id: 'notifications' as const, label: 'Notifications', icon: Bell },
	];

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg'>
							<Settings className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Settings</h1>
					</div>
					<p className='page-subtitle'>Manage your account and preferences</p>
				</div>
			</div>

			<div className='section-container py-8'>
				{/* Tabs */}
				<div className='flex gap-1 mb-8 p-1 bg-slate-100 rounded-2xl w-fit'>
					{tabs.map(tab => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
									isActive
										? 'bg-white text-teal-600 shadow-soft'
										: 'text-slate-600 hover:text-slate-900'
								}`}
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
								<div className='bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm'>
									{saveError}
								</div>
							)}
							{saveSuccess && (
								<div className='bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm flex items-center gap-2'>
									<Check className='w-4 h-4' /> {saveSuccess}
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
											className='btn-primary flex items-center gap-1.5'
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
									<div className='flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200'>
										<div className='flex items-center gap-3'>
											{session?.user?.image ? (
												<img src={session.user.image} alt="" className='w-10 h-10 rounded-full' />
											) : (
												<div className='w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center'>
													<User className='w-5 h-5 text-teal-600' />
												</div>
											)}
											<div>
												<p className='font-medium text-slate-900'>{session?.user?.name}</p>
												<p className='text-sm text-slate-500'>{session?.user?.email}</p>
											</div>
										</div>
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
								<div className='flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200'>
									<span className='text-slate-700'>{session?.user?.email}</span>
									<span className='badge-green'>Verified</span>
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{activeTab === 'security' && (
					<Card>
						<CardHeader title='Security Settings' />
						<CardBody className='space-y-6'>
							<div className='p-5 bg-slate-50 rounded-xl border border-slate-200'>
								<h3 className='font-medium text-slate-900 mb-2'>Password</h3>
								<p className='text-sm text-slate-500 mb-4'>
									Update your password regularly to keep your account secure
								</p>
								<button className='btn-secondary'>Change Password</button>
							</div>
							<div className='p-5 bg-slate-50 rounded-xl border border-slate-200'>
								<h3 className='font-medium text-slate-900 mb-2'>Two-Factor Authentication</h3>
								<p className='text-sm text-slate-500 mb-4'>
									Add an extra layer of security to your account
								</p>
								<button className='btn-secondary'>Enable 2FA</button>
							</div>
							<div className='p-5 bg-slate-50 rounded-xl border border-slate-200'>
								<h3 className='font-medium text-slate-900 mb-2'>Active Sessions</h3>
								<div className='flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200'>
									<div>
										<p className='font-medium text-slate-900'>Current Device</p>
										<p className='text-xs text-slate-500'>Active session</p>
									</div>
									<span className='badge-green'>Active</span>
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{activeTab === 'notifications' && (
					<Card>
						<CardHeader title='Notification Preferences' />
						<CardBody className='space-y-3'>
							{[
								{ label: 'Email Notifications', description: 'Receive updates via email' },
								{ label: 'Labeling Reminders', description: 'Get reminded about pending labeling tasks' },
								{ label: 'Verification Alerts', description: 'Be notified when labels need verification' },
								{ label: 'Team Updates', description: 'Receive team activity notifications' },
							].map(notification => (
								<div key={notification.label} className='flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200'>
									<div>
										<p className='font-medium text-slate-900'>{notification.label}</p>
										<p className='text-sm text-slate-500'>{notification.description}</p>
									</div>
									<label className='relative inline-flex items-center cursor-pointer'>
										<input type='checkbox' defaultChecked className='sr-only peer' />
										<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
									</label>
								</div>
							))}
						</CardBody>
					</Card>
				)}

				{/* Logout */}
				<Card className='mt-8 border-red-200 bg-red-50/50'>
					<CardHeader title='Logout' />
					<CardBody>
						<p className='text-slate-600 mb-4'>Sign out from your account</p>
					</CardBody>
					<CardFooter className='bg-transparent border-t-red-100'>
						<button
							onClick={() => signOut({ redirectTo: '/' })}
							className='btn-danger flex items-center gap-2'
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