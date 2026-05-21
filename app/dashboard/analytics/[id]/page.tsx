'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	Loader,
	TrendingUp,
	Users,
	CheckCircle,
	BarChart3,
	Download,
	ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function DatasetAnalyticsPage() {
	const { id } = useParams<{ id: string }>();
	const { data: session } = useSession();
	const [analytics, setAnalytics] = useState<any>(null);
	const [datasetName, setDatasetName] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [exporting, setExporting] = useState(false);

	const token = (session as any)?.token as string;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

	useEffect(() => {
		if (!id || !token) return;

		Promise.all([
			fetch(`${apiUrl}/api/datasets/${id}/analytics`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
			fetch(`${apiUrl}/api/datasets/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
		])
			.then(([analyticsData, datasetData]) => {
				setAnalytics(analyticsData);
				setDatasetName(datasetData.name ?? 'Dataset');
			})
			.catch(() => setError('Failed to load analytics'))
			.finally(() => setLoading(false));
	}, [id, token]);

	const handleExport = async (format: 'csv' | 'json') => {
		setExporting(true);
		try {
			const res = await fetch(
				`${apiUrl}/api/datasets/${id}/export?format=${format}&consensusOnly=true`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			if (!res.ok) throw new Error('Export failed');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${datasetName}-export.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err: any) {
			alert(err.message || 'Export failed');
		} finally {
			setExporting(false);
		}
	};

	if (loading)
		return (
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2 text-teal-600' />
				<p className='text-slate-600'>Loading analytics...</p>
			</div>
		);

	if (error)
		return (
			<div className='p-6'>
				<Card className='border-red-200 bg-red-50'>
					<CardBody>
						<p className='text-red-700'>{error}</p>
					</CardBody>
				</Card>
			</div>
		);

	const { overview, quality, labelDistribution, dailyActivity } =
		analytics ?? {};
	const maxLabelCount = Math.max(
		...Object.values(labelDistribution ?? {}).map(Number),
		1,
	);
	const maxDailyCount = Math.max(
		...Object.values(dailyActivity ?? {}).map(Number),
		1,
	);

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<Link
						href='/dashboard/analytics'
						className='flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 mb-3 transition-colors'
					>
						<ArrowLeft className='w-4 h-4' /> Back to Analytics
					</Link>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-slate-900'>
								{datasetName}
							</h1>
							<p className='text-slate-600 mt-1'>
								Dataset analytics and export
							</p>
						</div>
						<div className='flex gap-2'>
							<button
								onClick={() => handleExport('csv')}
								disabled={exporting}
								className='flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
							>
								<Download className='w-4 h-4' />
								{exporting ? 'Exporting...' : 'Export CSV'}
							</button>
							<button
								onClick={() => handleExport('json')}
								disabled={exporting}
								className='flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-teal-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
							>
								<Download className='w-4 h-4' />
								Export JSON
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
				{/* Overview stats */}
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
					{[
						{
							label: 'Total Items',
							value: overview?.totalItems ?? 0,
							icon: BarChart3,
							color: 'bg-blue-50 text-blue-600',
						},
						{
							label: 'Labeled',
							value: `${overview?.labelingPercent ?? 0}%`,
							icon: TrendingUp,
							color: 'bg-teal-50 text-teal-600',
						},
						{
							label: 'Verified',
							value: `${overview?.completionPercent ?? 0}%`,
							icon: CheckCircle,
							color: 'bg-green-50 text-green-600',
						},
						{
							label: 'Contributors',
							value: quality?.uniqueContributors ?? 0,
							icon: Users,
							color: 'bg-purple-50 text-purple-600',
						},
					].map(stat => {
						const Icon = stat.icon;
						return (
							<Card key={stat.label}>
								<CardBody className='flex items-center justify-between'>
									<div>
										<p className='text-slate-500 text-xs mb-1'>{stat.label}</p>
										<p className='text-2xl font-bold text-slate-900'>
											{stat.value}
										</p>
									</div>
									<div
										className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
									>
										<Icon className='w-5 h-5' />
									</div>
								</CardBody>
							</Card>
						);
					})}
				</div>

				{/* Quality metrics */}
				<Card>
					<CardHeader title='Quality Metrics' />
					<CardBody>
						<div className='grid grid-cols-2 gap-6'>
							<div>
								<p className='text-sm text-slate-600 mb-2'>
									Inter-annotator Agreement
								</p>
								<div className='flex items-center gap-3'>
									<div className='flex-1 bg-slate-200 rounded-full h-3'>
										<div
											className='bg-teal-500 h-3 rounded-full transition-all'
											style={{ width: `${quality?.avgAgreementPercent ?? 0}%` }}
										/>
									</div>
									<span className='font-bold text-slate-900 w-12 text-right'>
										{quality?.avgAgreementPercent ?? 0}%
									</span>
								</div>
								<p className='text-xs text-slate-400 mt-1'>
									How often labelers agree on the same item
								</p>
							</div>
							<div>
								<p className='text-sm text-slate-600 mb-2'>
									Verification Approval Rate
								</p>
								<div className='flex items-center gap-3'>
									<div className='flex-1 bg-slate-200 rounded-full h-3'>
										<div
											className='bg-green-500 h-3 rounded-full transition-all'
											style={{ width: `${quality?.approvalRatePercent ?? 0}%` }}
										/>
									</div>
									<span className='font-bold text-slate-900 w-12 text-right'>
										{quality?.approvalRatePercent ?? 0}%
									</span>
								</div>
								<p className='text-xs text-slate-400 mt-1'>
									Labels approved vs rejected by verifiers
								</p>
							</div>
						</div>

						<div className='grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100'>
							{[
								{ label: 'Total Labels', value: quality?.totalLabels ?? 0 },
								{
									label: 'Total Verifications',
									value: quality?.totalVerifications ?? 0,
								},
								{
									label: 'Pending Verification',
									value: overview?.pendingVerification ?? 0,
								},
							].map(s => (
								<div key={s.label} className='text-center'>
									<p className='text-2xl font-bold text-slate-900'>{s.value}</p>
									<p className='text-xs text-slate-500 mt-1'>{s.label}</p>
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				{/* Label distribution */}
				{labelDistribution && Object.keys(labelDistribution).length > 0 && (
					<Card>
						<CardHeader title='Label Distribution' />
						<CardBody>
							<div className='space-y-3'>
								{Object.entries(labelDistribution)
									.sort(([, a], [, b]) => Number(b) - Number(a))
									.map(([label, count]) => (
										<div key={label} className='flex items-center gap-3'>
											<span className='text-sm font-medium text-slate-700 w-32 truncate shrink-0'>
												{label}
											</span>
											<div className='flex-1 bg-slate-100 rounded-full h-7 relative'>
												<div
													className='bg-teal-500 h-7 rounded-full transition-all flex items-center justify-end pr-3'
													style={{
														width: `${Math.max((Number(count) / maxLabelCount) * 100, 10)}%`,
													}}
												>
													<span className='text-xs text-white font-semibold'>
														{String(count)}
													</span>
												</div>
											</div>
										</div>
									))}
							</div>
						</CardBody>
					</Card>
				)}

				{/* Daily activity */}
				{dailyActivity && Object.keys(dailyActivity).length > 0 && (
					<Card>
						<CardHeader title='Labeling Activity (Last 7 Days)' />
						<CardBody>
							<div className='flex items-end gap-2 h-36'>
								{Object.entries(dailyActivity)
									.sort(([a], [b]) => a.localeCompare(b))
									.map(([day, count]) => (
										<div
											key={day}
											className='flex-1 flex flex-col items-center gap-1'
										>
											<span className='text-xs text-slate-500 font-medium'>
												{String(count)}
											</span>
											<div
												className='w-full bg-teal-500 rounded-t transition-all min-h-1'
												style={{
													height: `${Math.max((Number(count) / maxDailyCount) * 100, 4)}%`,
												}}
												title={`${count} labels on ${day}`}
											/>
											<span className='text-xs text-slate-400'>
												{day.slice(5)}
											</span>
										</div>
									))}
							</div>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
}
