'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Star, Loader, Trophy, TrendingUp } from 'lucide-react';

const RANKS = [
	{
		label: 'Expert',
		min: 200,
		color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
	},
	{
		label: 'Senior',
		min: 150,
		color: 'text-purple-600 bg-purple-50 border-purple-200',
	},
	{
		label: 'Regular',
		min: 100,
		color: 'text-teal-600 bg-teal-50 border-teal-200',
	},
	{
		label: 'Newcomer',
		min: 0,
		color: 'text-slate-600 bg-slate-50 border-slate-200',
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
			<div className='p-10 text-center'>
				<Loader className='animate-spin mx-auto mb-2' />
				<p className='text-slate-600'>Loading reputation...</p>
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

	const score = reputation?.reputation?.score ?? 100;
	const rank = getRank(score);
	const nextRank = RANKS.find(r => r.min > score);
	const pointsToNext = nextRank ? nextRank.min - score : null;

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<Star className='w-8 h-8 text-yellow-500' />
						<h1 className='text-3xl font-bold text-slate-900'>Reputation</h1>
					</div>
					<p className='text-slate-600'>
						Your standing in the Trainarium community
					</p>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
				{/* My reputation card */}
				<Card>
					<CardBody>
						<div className='flex items-center gap-6'>
							<div className='w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0'>
								{score}
							</div>
							<div className='flex-1'>
								<div className='flex items-center gap-2 mb-1'>
									<span
										className={`text-sm font-semibold px-3 py-1 rounded-full border ${rank.color}`}
									>
										{rank.label}
									</span>
								</div>
								<p className='text-slate-600 text-sm mb-3'>
									{pointsToNext
										? `${pointsToNext} points until ${nextRank?.label}`
										: 'You have reached the highest rank!'}
								</p>
								{/* Progress bar to next rank */}
								{nextRank && (
									<div>
										<div className='flex justify-between text-xs text-slate-500 mb-1'>
											<span>{score}</span>
											<span>{nextRank.min}</span>
										</div>
										<div className='w-full bg-slate-200 rounded-full h-2'>
											<div
												className='bg-teal-500 h-2 rounded-full transition-all'
												style={{
													width: `${Math.min(100, ((score - (RANKS.find(r => r.min <= score && (!RANKS[RANKS.indexOf(r) - 1] || RANKS[RANKS.indexOf(r) - 1].min > score))?.min ?? 0)) / (nextRank.min - (RANKS.find(r => r.min <= score)?.min ?? 0))) * 100)}%`,
												}}
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
								},
								{
									action: 'Verification submitted',
									points: '+1',
									color: 'text-teal-600',
								},
								{
									action: 'Label rejected by consensus',
									points: '-5',
									color: 'text-red-600',
								},
							].map(item => (
								<div
									key={item.action}
									className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
								>
									<p className='text-sm text-slate-700'>{item.action}</p>
									<span className={`font-bold text-sm ${item.color}`}>
										{item.points}
									</span>
								</div>
							))}
						</div>
						<div className='mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg'>
							<p className='text-sm text-teal-800'>
								Higher reputation unlocks premium datasets with higher pay rates
								and priority task assignment.
							</p>
						</div>
					</CardBody>
				</Card>

				{/* Leaderboard */}
				<Card>
					<CardHeader
						title='Leaderboard'
						description='Top 20 labelers by reputation score'
					/>
					<CardBody>
						{leaderboard.length === 0 ? (
							<p className='text-slate-500 text-center py-8'>
								No data yet — be the first to label!
							</p>
						) : (
							<div className='space-y-2'>
								{leaderboard.map((entry: any, index: number) => {
									const isMe = entry.user?.id === userId;
									const entryRank = getRank(entry.score);
									return (
										<div
											key={entry.id}
											className={`flex items-center gap-4 p-3 rounded-lg border ${
												isMe ? 'border-teal-300 bg-teal-50' : 'border-slate-200'
											}`}
										>
											{/* Position */}
											<div
												className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
													index === 0
														? 'bg-yellow-100 text-yellow-700'
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
													className='w-8 h-8 rounded-full flex-shrink-0'
												/>
											) : (
												<div className='w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 text-sm font-bold flex-shrink-0'>
													{entry.user?.name?.[0] ?? '?'}
												</div>
											)}

											{/* Name */}
											<div className='flex-1 min-w-0'>
												<p className='font-medium text-slate-900 truncate'>
													{entry.user?.name ?? 'Anonymous'}
													{isMe && (
														<span className='ml-2 text-xs text-teal-600 font-normal'>
															(you)
														</span>
													)}
												</p>
												<span
													className={`text-xs px-2 py-0.5 rounded-full border ${entryRank.color}`}
												>
													{entryRank.label}
												</span>
											</div>

											{/* Score */}
											<div className='text-right flex-shrink-0'>
												<p className='font-bold text-slate-900'>
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
