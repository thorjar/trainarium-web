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
			next: { revalidate: 60 }, // cache for 60s
		})
			.then(r => r.json())
			.catch(() => null),
		fetch(`${apiUrl}/api/compensation/summary`, {
			headers: { Authorization: `Bearer ${token}` },
			next: { revalidate: 60 }, // cache for 60s
		})
			.then(r => r.json())
			.catch(() => null),
	]);

	const recentDatasets = datasets.slice(0, 5);
	const reputationScore = reputation?.reputation?.score ?? 100;
	const reputationRank = reputation?.rank ?? 'Newcomer';
	const totalEarned = compensation?.totalEarned ?? 0;

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<h1 className='text-3xl font-bold text-slate-900'>
						Welcome, {session?.user?.name || 'User'}!
					</h1>
					<p className='text-slate-600 mt-2'>
						Here&apos;s what&apos;s happening with your labeling projects
					</p>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Main stats */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					{[
						{
							label: 'Active Datasets',
							value: stats?.totalDatasets ?? datasets.length,
							icon: BarChart3,
							color: 'bg-blue-50 text-blue-600',
						},
						{
							label: 'Total Data Items',
							value: stats?.totalItems ?? 0,
							icon: Upload,
							color: 'bg-purple-50 text-purple-600',
						},
						{
							label: 'Labels Created',
							value: stats?.totalLabels ?? 0,
							icon: Tag,
							color: 'bg-teal-50 text-teal-600',
						},
						{
							label: 'Verifications',
							value: stats?.totalVerifications ?? 0,
							icon: CheckCircle,
							color: 'bg-green-50 text-green-600',
						},
					].map(stat => {
						const Icon = stat.icon;
						return (
							<Card
								key={stat.label}
								className='hover:shadow-md transition-shadow'
							>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='text-slate-600 text-sm mb-2'>{stat.label}</p>
										<p className='text-3xl font-bold text-slate-900'>
											{stat.value}
										</p>
									</div>
									<div
										className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
									>
										<Icon className='w-6 h-6' />
									</div>
								</CardBody>
							</Card>
						);
					})}
				</div>

				{/* Reputation + Earnings */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
					<Link href='/dashboard/reputation'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardBody className='flex items-center gap-4'>
								<div className='w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0'>
									{reputationScore}
								</div>
								<div className='flex-1'>
									<p className='text-slate-600 text-sm'>Reputation Score</p>
									<p className='text-xl font-bold text-slate-900'>
										{reputationRank}
									</p>
									<p className='text-xs text-slate-500 mt-0.5'>
										View leaderboard →
									</p>
								</div>
								<Star className='w-6 h-6 text-yellow-500 flex-shrink-0' />
							</CardBody>
						</Card>
					</Link>

					<Link href='/dashboard/earnings'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardBody className='flex items-center gap-4'>
								<div className='w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0'>
									$
								</div>
								<div className='flex-1'>
									<p className='text-slate-600 text-sm'>Total Earned</p>
									<p className='text-xl font-bold text-slate-900'>
										${totalEarned.toFixed(2)}
									</p>
									<p className='text-xs text-slate-500 mt-0.5'>
										View earnings →
									</p>
								</div>
								<DollarSign className='w-6 h-6 text-teal-500 flex-shrink-0' />
							</CardBody>
						</Card>
					</Link>
				</div>

				{/* Quick actions */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
					<Link href='/dashboard/upload'>
						<Card hoverable className='h-full'>
							<CardBody className='flex flex-col items-center justify-center text-center py-8'>
								<div className='w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center mb-4'>
									<Upload className='w-7 h-7 text-blue-600' />
								</div>
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									Upload Data
								</h3>
								<p className='text-slate-600 text-sm'>
									Import new datasets for labeling
								</p>
							</CardBody>
						</Card>
					</Link>

					<Link href='/dashboard/label'>
						<Card hoverable className='h-full'>
							<CardBody className='flex flex-col items-center justify-center text-center py-8'>
								<div className='w-14 h-14 bg-teal-50 rounded-lg flex items-center justify-center mb-4'>
									<Tag className='w-7 h-7 text-teal-600' />
								</div>
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									Label Data
								</h3>
								<p className='text-slate-600 text-sm'>
									Contribute to labeling projects
								</p>
							</CardBody>
						</Card>
					</Link>

					<Link href='/dashboard/verify'>
						<Card hoverable className='h-full'>
							<CardBody className='flex flex-col items-center justify-center text-center py-8'>
								<div className='w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center mb-4'>
									<CheckCircle className='w-7 h-7 text-green-600' />
								</div>
								<h3 className='text-lg font-semibold text-slate-900 mb-2'>
									Verify Labels
								</h3>
								<p className='text-slate-600 text-sm'>
									Review and validate labeled data
								</p>
							</CardBody>
						</Card>
					</Link>
				</div>

				{/* Recent datasets */}
				{recentDatasets.length > 0 ? (
					<Card>
						<CardHeader
							title='Recent Projects'
							description='Your most recent labeling projects'
						/>
						<CardBody>
							<div className='space-y-4'>
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
										>
											<div className='flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'>
												<div>
													<h4 className='font-medium text-slate-900'>
														{dataset.name}
													</h4>
													<p className='text-sm text-slate-600 mt-1'>
														{dataset.totalItems} items · {dataset.labeledItems}{' '}
														labeled · {dataset.verifiedItems} verified
													</p>
												</div>
												<div className='flex items-center gap-4'>
													<div className='text-right'>
														<div className='text-2xl font-bold text-slate-900'>
															{progress}%
														</div>
														<p className='text-xs text-slate-600'>Complete</p>
													</div>
													<svg
														className='w-6 h-6 text-slate-400'
														fill='none'
														stroke='currentColor'
														viewBox='0 0 24 24'
													>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															strokeWidth={2}
															d='M9 5l7 7-7 7'
														/>
													</svg>
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						</CardBody>
					</Card>
				) : (
					<Card>
						<CardBody className='text-center py-12'>
							<BarChart3 className='w-12 h-12 text-slate-300 mx-auto mb-4' />
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>
								No projects yet
							</h3>
							<p className='text-slate-600 mb-6'>
								Create your first labeling project by uploading data
							</p>
							<Link
								href='/dashboard/upload'
								className='btn-primary inline-block'
							>
								Upload Your First Dataset
							</Link>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
}
