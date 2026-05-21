'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Star, Loader, Trophy } from 'lucide-react';

const RANKS = [
	{
		label: 'Expert',
		min: 200,
		gradient: 'from-amber-400 to-orange-500',
		badge: 'bg-amber-100 text-amber-700 border-amber-200',
	},
	{
		label: 'Senior',
		min: 150,
		gradient: 'from-purple-400 to-purple-600',
		badge: 'bg-purple-100 text-purple-700 border-purple-200',
	},
	{
		label: 'Regular',
		min: 100,
		gradient: 'from-teal-400 to-teal-600',
		badge: 'bg-teal-100 text-teal-700 border-teal-200',
	},
	{
		label: 'Newcomer',
		min: 0,
		gradient: 'from-slate-400 to-slate-500',
		badge: 'bg-slate-100 text-slate-600 border-slate-200',
	},
];

function getRank(score: number) {
	return RANKS.find(r => score >= r.min) ?? RANKS[RANKS.length - 1];
}

export default function ReputationPage() {
	const { data: session } = useSession();
	const [reputation, setReputation] = useState<any>(null);
	const [leaderboard, setLeaderboard] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const token = (session as any)?.apiToken;
	const userId = session?.user?.id;

	useEffect(() => {
		if (!token) return;
		Promise.all([
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reputation/me`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reputation/leaderboard`, {
				headers: { Authorization: `Bearer ${token}` },
			}).then(r => r.json()),
		])
			.then(([rep, board]) => {
				setReputation(rep);
				setLeaderboard(Array.isArray(board) ? board : []);
			})
			.catch(() => setError('Failed to load reputation'))
			.finally(() => setLoading(false));
	}, [token]);

	if (loading)
		return (
			<div className='text-center py-24'>
				<Loader className='w-8 h-8 animate-spin mx-auto mb-4 text-teal-600' />
				<p className='text-slate-500'>Loading reputation...</p>
			</div>
		);

	if (error)
		return (
			<div className='section-container py-12'>
				<Card className='border-red-200 bg-red-50'>
					<CardBody>
						<p className='text-red-700'>{error}</p>
					</CardBody>
				</Card>
			</div>
		);

	const score = reputation?.reputation?.score ?? 100;
	const rank = getRank(score);
	const nextRank = RANKS.find(r => r.min > score);
	const pointsToNext = nextRank ? nextRank.min - score : null;
	const currentMin = RANKS.find(r => r.min <= score && (!RANKS[RANKS.indexOf(r) - 1] || RANKS[RANKS.indexOf(r) - 1].min > score))?.min ?? 0;
	const progressInRank = nextRank ? Math.min(100, ((score - currentMin) / (nextRank.min - currentMin)) * 100) : 100;

	return (
		<div className='min-h-screen'>
			{/* Header */}
			<div className='section-header'>
				<div className='section-container py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20'>
							<Star className='w-5 h-5 text-white' />
						</div>
						<h1 className='page-title'>Reputation</h1>
					</div>
					<p className='page-subtitle'>
						Your standing in the Trainarium community
					</p>
				</div>
			</div>

			<div className='section-container py-8 space-y-6'>
				{/* My reputation card */}
				<Card>
					<CardBody>
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
							<div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg`}>
								{score}
							</div>
							<div className='flex-1 w-full'>
								<div className='flex items-center gap-2.5 mb-1'>
									<span className={`text-sm font-semibold px-3 py-1 rounded-full border ${rank.badge}`}>
										{rank.label}
									</span>
								</div>
								<p className='text-slate-500 text-sm mb-4'>
									{pointsToNext
										? `${pointsToNext} points until ${nextRank?.label}`
										: '🏆 You have reached the highest rank!'}
								</p>
								{/* Progress bar to next rank */}
								{nextRank && (
									<div>
										<div className='flex justify-between text-xs text-slate-500 mb-1.5'>
											<span>{currentMin} pts</span>
											<span className='font-medium text-slate-700'>{rank.label}</span>
											<span>{nextRank.min} pts</span>
										</div>
										<div className='progress-bar h-2.5'>
											<div
												className={`progress-fill bg-gradient-to-r ${rank.gradient}`}
												style={{ width: `${progressInRank}%` }}
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardBody>
				</Card>

				{/* How reputation works */}
				<Card>
					<CardHeader title='How Reputation Works' />
					<CardBody>
						<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
							{[
								{
									action: 'Label approved by consensus',
									points: '+2',
									color: 'text-green-600',
									bg: 'bg-green-50 border-green-200',
								},
								{
									action: 'Verification submitted',
									points: '+1',
									color: 'text-teal-600',
									bg: 'bg-teal-50 border-teal-200',
								},
								{
									action: 'Label rejected by consensus',
									points: '-5',
									color: 'text-red-600',
									bg: 'bg-red-50 border-red-200',
								},
							].map(item => (
								<div
									key={item.action}
									className={`flex items-center justify-between p-4 rounded-xl border ${item.bg}`}
								>
									<p className='text-sm text-slate-700 font-medium'>{item.action}</p>
									<span className={`font-bold text-sm ${item.color} ml-3 flex-shrink-0`}>
										{item.points}
									</span>
								</div>
							))}
						</div>
						<div className='mt-5 p-4 bg-teal-50 border border-teal-200 rounded-xl'>
							<div className='flex items-start gap-3'>
								<Trophy className='w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0' />
								<p className='text-sm text-teal-800'>
									Higher reputation unlocks premium datasets with higher pay rates
									and priority task assignment.
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Leaderboard */}
				<Card>
					<CardHeader
						title='Leaderboard'
						description='Top labelers by reputation score'
					/>
					<CardBody className='p-0'>
						{leaderboard.length === 0 ? (
							<div className='text-center py-12'>
								<div className='w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
									<Trophy className='w-7 h-7 text-slate-400' />
								</div>
								<p className='text-slate-500'>No data yet — be the first to label!</p>
							</div>
						) : (
							<div className='divide-y divide-slate-100'>
								{leaderboard.map((entry: any, index: number) => {
									const isMe = entry.user?.id === userId;
									const entryRank = getRank(entry.score);
									return (
										<div
											key={entry.id}
											className={`flex items-center gap-4 px-6 py-4 ${
												isMe ? 'bg-teal-50/50' : ''
											}`}
										>
											{/* Position */}
											<div
												className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
													index === 0
														? 'bg-amber-100 text-amber-700'
														: index === 1
															? 'bg-slate-200 text-slate-700'
															: index === 2
																? 'bg-orange-100 text-orange-700'
																: 'bg-slate-100 text-slate-500'
												}`}
											>
												{index === 0 ? (
													<Trophy className='w-4 h-4' />
												) : (
													index + 1
												)}
											</div>

											{/* Avatar */}
											{entry.user?.image ? (
												<img
													src={entry.user.image}
													alt=''
													className='w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-slate-100'
												/>
											) : (
												<div className='w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-bold flex-shrink-0 ring-2 ring-teal-50'>
													{entry.user?.name?.[0] ?? '?'}
												</div>
											)}

											{/* Name */}
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-2'>
													<p className='font-medium text-slate-900 truncate'>
														{entry.user?.name ?? 'Anonymous'}
													</p>
													{isMe && (
														<span className='badge-teal text-[10px] px-2 py-0.5'>
															you
														</span>
													)}
												</div>
												<span className={`badge ${entryRank.badge} mt-0.5`}>
													{entryRank.label}
												</span>
											</div>

											{/* Score */}
											<div className='text-right flex-shrink-0 ml-4'>
												<p className='text-lg font-bold text-slate-900'>
													{entry.score}
												</p>
												<p className='text-xs text-slate-500'>pts</p>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}