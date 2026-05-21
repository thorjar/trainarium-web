import { auth } from '@/app/auth';
import { datasetApi, statsApi } from '@/lib/api-client';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	BarChart3,
	Upload,
	Tag,
	CheckCircle,
	DollarSign,
	Star,
	ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/auth/login');
	}

	const token = (session as any).apiToken as string;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	// All fetches in parallel — no sequential blocking
	const [datasets, stats, reputation, compensation] = await Promise.all([
		datasetApi.list(token).catch(() => [] as any[]),
		statsApi.get(token).catch(() => null),
		fetch(`${apiUrl}/api/reputation/me`, {
			headers: { Authorization: `Bearer ${token}` },
			next: { revalidate: 60 },
		})
			.then(r => r.json())
			.catch(() => null),
		fetch(`${apiUrl}/api/compensation/summary`, {
			headers: { Authorization: `Bearer ${token}` },
			next: { revalidate: 60 },
		})
			.then(r => r.json())
			.catch(() => null),
	]);

	const recentDatasets = datasets.slice(0, 5);
	const reputationScore = reputation?.reputation?.score ?? 100;
	const reputationRank = reputation?.rank ?? 'Newcomer';
	const totalEarned = compensation?.totalEarned ?? 0;

	const statsCards = [
		{
			label: 'Active Datasets',
			value: stats?.totalDatasets ?? datasets.length,
			icon: BarChart3,
			gradient: 'from-blue-500 to-blue-600',
			bg: 'bg-blue-50',
		},
		{
			label: 'Total Data Items',
			value: stats?.totalItems ?? 0,
			icon: Upload,
			gradient: 'from-purple-500 to-purple-600',
			bg: 'bg-purple-50',
		},
		{
			label: 'Labels Created',
			value: stats?.totalLabels ?? 0,
			icon: Tag,
			gradient: 'from-teal-500 to-teal-600',
			bg: 'bg-teal-50',
		},
		{
			label: 'Verifications',
			value: stats?.totalVerifications ?? 0,
			icon: CheckCircle,
			gradient: 'from-green-500 to-green-600',
			bg: 'bg-green-50',
		},
	];

	const quickActions = [
		{
			label: 'Upload Data',
			href: '/dashboard/upload',
			icon: Upload,
			gradient: 'from-blue-500 to-blue-600',
			description: 'Import new datasets for labeling',
		},
		{
			label: 'Label Data',
			href: '/dashboard/label',
			icon: Tag,
			gradient: 'from-teal-500 to-teal-600',
			description: 'Contribute to labeling projects',
		},
		{
			label: 'Verify Labels',
			href: '/dashboard/verify',
			icon: CheckCircle,
			gradient: 'from-green-500 to-green-600',
			description: 'Review and validate labeled data',
		},
	];

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div>
							<h1 className='page-title'>
								Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
							</h1>
							<p className='page-subtitle'>
								Here's what's happening with your labeling projects
							</p>
						</div>
						<Link href='/dashboard/upload' className='btn-primary inline-flex items-center gap-2 w-fit'>
							<Upload className='w-4 h-4' />
							New Dataset
						</Link>
					</div>
				</div>
			</div>

			<div className='section-container py-8'>
				{/* Main stats */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8'>
					{statsCards.map(stat => {
						const Icon = stat.icon;
						return (
							<Card key={stat.label} className='hover-lift'>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='stat-label mb-1.5'>{stat.label}</p>
										<p className='stat-value'>{stat.value}</p>
									</div>
									<div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg shadow-${stat.gradient.split(' ')[0]}/20`}>
										<Icon className='w-6 h-6 text-white' />
									</div>
								</CardBody>
							</Card>
						);
					})}
				</div>

				{/* Reputation + Earnings Row */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-8'>
					<Link href='/dashboard/reputation'>
						<Card className='hover-lift cursor-pointer'>
							<CardBody className='flex items-center gap-5'>
								<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg shadow-amber-500/20'>
									{reputationScore}
								</div>
								<div className='flex-1 min-w-0'>
									<p className='stat-label'>Reputation Score</p>
									<p className='text-xl font-bold text-slate-900'>
										{reputationRank}
									</p>
									<p className='text-xs text-teal-600 font-medium mt-1.5 flex items-center gap-1'>
										View leaderboard <ArrowRight className='w-3 h-3' />
									</p>
								</div>
								<Star className='w-6 h-6 text-amber-400 flex-shrink-0' />
							</CardBody>
						</Card>
					</Link>

					<Link href='/dashboard/earnings'>
						<Card className='hover-lift cursor-pointer'>
							<CardBody className='flex items-center gap-5'>
								<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg shadow-teal-500/20'>
									$
								</div>
								<div className='flex-1 min-w-0'>
									<p className='stat-label'>Total Earned</p>
									<p className='text-xl font-bold text-slate-900'>
										${totalEarned.toFixed(2)}
									</p>
									<p className='text-xs text-teal-600 font-medium mt-1.5 flex items-center gap-1'>
										View earnings <ArrowRight className='w-3 h-3' />
									</p>
								</div>
								<DollarSign className='w-6 h-6 text-teal-500 flex-shrink-0' />
							</CardBody>
						</Card>
					</Link>
				</div>

				{/* Quick actions */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-8'>
					{quickActions.map(action => {
						const Icon = action.icon;
						return (
							<Link key={action.href} href={action.href}>
								<Card hoverable className='h-full group'>
									<CardBody className='flex flex-col items-center text-center py-8'>
										<div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
											<Icon className='w-7 h-7 text-white' />
										</div>
										<h3 className='text-lg font-semibold text-slate-900 mb-1.5'>
											{action.label}
										</h3>
										<p className='text-sm text-slate-500'>
											{action.description}
										</p>
									</CardBody>
								</Card>
							</Link>
						);
					})}
				</div>

				{/* Recent datasets */}
				{recentDatasets.length > 0 ? (
					<Card>
						<CardHeader
							title='Recent Projects'
							description='Your most recent labeling projects'
						/>
						<CardBody className='p-0'>
							<div className='divide-y divide-slate-100'>
								{recentDatasets.map((dataset: any) => {
									const progress =
										dataset.totalItems > 0
											? Math.round(
													(dataset.verifiedItems / dataset.totalItems) * 100,
												)
											: 0;
									return (
										<Link
											key={dataset.id}
											href={`/dashboard/datasets/${dataset.id}`}
											className='block px-6 py-4 hover:bg-slate-50 transition-colors group'
										>
											<div className='flex items-center justify-between gap-4'>
												<div className='min-w-0 flex-1'>
													<h4 className='font-medium text-slate-900 group-hover:text-teal-600 transition-colors'>
														{dataset.name}
													</h4>
													<p className='text-sm text-slate-500 mt-0.5'>
														{dataset.totalItems} items · {dataset.labeledItems}{' '}
														labeled · {dataset.verifiedItems} verified
													</p>
												</div>
												<div className='flex items-center gap-4 flex-shrink-0'>
													<div className='text-right'>
														<div className='text-2xl font-bold text-slate-900'>
															{progress}%
														</div>
														<p className='text-xs text-slate-500'>Complete</p>
													</div>
													<div className='w-2 h-2 rounded-full bg-slate-300 group-hover:bg-teal-500 transition-colors' />
												</div>
											</div>
											<div className='mt-3 progress-bar h-1.5'>
												<div
													className='progress-fill bg-teal-500'
													style={{ width: `${progress}%` }}
												/>
											</div>
										</Link>
									);
								})}
							</div>
						</CardBody>
					</Card>
				) : (
					<Card>
						<CardBody className='text-center py-16'>
							<div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5'>
								<BarChart3 className='w-8 h-8 text-slate-400' />
							</div>
							<h3 className='text-xl font-semibold text-slate-900 mb-2'>
								No projects yet
							</h3>
							<p className='text-slate-500 mb-8 max-w-md mx-auto'>
								Create your first labeling project by uploading data. Get started in just a few clicks.
							</p>
							<Link
								href='/dashboard/upload'
								className='btn-primary inline-flex items-center gap-2'
							>
								<Upload className='w-4 h-4' />
								Upload Your First Dataset
							</Link>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
}