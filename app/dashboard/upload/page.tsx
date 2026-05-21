'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
	Upload,
	FileUp,
	AlertCircle,
	Loader,
	Plus,
	X,
	Lock,
	Users,
	Globe,
} from 'lucide-react';
import Papa from 'papaparse';
import { datasetApi } from '@/lib/api-client';

type Visibility = 'PRIVATE' | 'TEAM' | 'PUBLIC';

const VISIBILITY_OPTIONS = [
	{
		value: 'PRIVATE' as Visibility,
		label: 'Private',
		desc: 'Only you can see and label this dataset',
		icon: Lock,
		color: 'border-slate-300 bg-slate-50 text-slate-700',
		activeColor: 'border-slate-600 bg-slate-100 text-slate-900',
	},
	{
		value: 'TEAM' as Visibility,
		label: 'Team',
		desc: 'Invite specific people to label this dataset',
		icon: Users,
		color: 'border-blue-200 bg-blue-50 text-blue-700',
		activeColor: 'border-blue-500 bg-blue-100 text-blue-900',
	},
	{
		value: 'PUBLIC' as Visibility,
		label: 'Public',
		desc: 'Anyone on Trainarium can label and verify',
		icon: Globe,
		color: 'border-teal-200 bg-teal-50 text-teal-700',
		activeColor: 'border-teal-500 bg-teal-100 text-teal-900',
	},
];

export default function UploadDataPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [file, setFile] = useState<File | null>(null);
	const [datasetName, setDatasetName] = useState('');
	const [description, setDescription] = useState('');
	const [labelClasses, setLabelClasses] = useState<string[]>([]);
	const [labelInput, setLabelInput] = useState('');
	const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
	const [rewardPerItem, setRewardPerItem] = useState('0.05');
	const [consensusRequired, setConsensusRequired] = useState('3');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [preview, setPreview] = useState<any[]>([]);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;
		setError('');
		setFile(selectedFile);
		if (
			selectedFile.name.endsWith('.csv') ||
			selectedFile.type === 'text/csv'
		) {
			Papa.parse(selectedFile, {
				header: true,
				skipEmptyLines: true,
				preview: 5,
				complete: (results: any) => setPreview(results.data),
				error: () => setError('Failed to parse CSV file'),
			});
		} else {
			setPreview([]);
		}
	};

	const addLabelClass = () => {
		const trimmed = labelInput.trim();
		if (!trimmed || labelClasses.includes(trimmed)) {
			setLabelInput('');
			return;
		}
		setLabelClasses(prev => [...prev, trimmed]);
		setLabelInput('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!file) {
			setError('Please select a file');
			return;
		}
		if (!datasetName.trim()) {
			setError('Please enter a dataset name');
			return;
		}
		const token = (session as any)?.apiToken;
		if (!token) {
			setError('Not authenticated. Please sign in again.');
			return;
		}

		setLoading(true);
		try {
			const dataset = await datasetApi.create(
				datasetName.trim(),
				description || undefined,
				token,
				labelClasses.length > 0 ? labelClasses : undefined,
				visibility,
				parseFloat(rewardPerItem) || 0.05,
				parseInt(consensusRequired) || 3,
			);

			let rows: any[] = [];
			if (file.name.endsWith('.csv') || file.type === 'text/csv') {
				rows = await new Promise((resolve, reject) => {
					Papa.parse(file, {
						header: true,
						skipEmptyLines: true,
						complete: (results: any) => resolve(results.data),
						error: reject,
					});
				});
			} else if (file.name.endsWith('.json')) {
				const text = await file.text();
				const parsed = JSON.parse(text);
				if (!Array.isArray(parsed))
					throw new Error('JSON must be an array of objects');
				rows = parsed;
			}

			for (let i = 0; i < rows.length; i += 50) {
				await datasetApi.uploadItems(dataset.id, rows.slice(i, i + 50), token);
			}

			setSuccess(`Dataset created with ${rows.length} items! Redirecting...`);
			setTimeout(() => router.push('/dashboard/label'), 1500);
		} catch (err: any) {
			setError(err.message || 'An error occurred during upload');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-slate-50'>
			<div className='border-b border-slate-200 bg-white'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='flex items-center gap-3 mb-2'>
						<Upload className='w-8 h-8 text-teal-600' />
						<h1 className='text-3xl font-bold text-slate-900'>Upload Data</h1>
					</div>
					<p className='text-slate-600'>
						Create a new labeling project by uploading your dataset
					</p>
				</div>
			</div>

			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<Card className='mb-8'>
					<CardHeader
						title='Dataset Information'
						description='Provide details about your dataset'
					/>
					<CardBody>
						<form onSubmit={handleSubmit} className='space-y-6'>
							{error && (
								<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3'>
									<AlertCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
									<span>{error}</span>
								</div>
							)}
							{success && (
								<div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg'>
									✓ {success}
								</div>
							)}

							<div>
								<label className='block text-sm font-medium text-slate-900 mb-2'>
									Dataset Name *
								</label>
								<input
									type='text'
									value={datasetName}
									onChange={e => setDatasetName(e.target.value)}
									placeholder='e.g., Support Email Sentiment'
									className='input-field'
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-slate-900 mb-2'>
									Description (Optional)
								</label>
								<textarea
									value={description}
									onChange={e => setDescription(e.target.value)}
									placeholder='Describe what this dataset contains and how it should be labeled...'
									className='input-field resize-none'
									rows={3}
								/>
							</div>

							{/* Visibility */}
							<div>
								<label className='block text-sm font-medium text-slate-900 mb-3'>
									Visibility
								</label>
								<div className='grid grid-cols-3 gap-3'>
									{VISIBILITY_OPTIONS.map(opt => {
										const Icon = opt.icon;
										const isActive = visibility === opt.value;
										return (
											<button
												key={opt.value}
												type='button'
												onClick={() => setVisibility(opt.value)}
												className={`p-4 rounded-lg border-2 text-left transition-all ${isActive ? opt.activeColor + ' border-2' : 'border-slate-200 bg-white hover:border-slate-300'}`}
											>
												<Icon
													className={`w-5 h-5 mb-2 ${isActive ? '' : 'text-slate-400'}`}
												/>
												<div className='font-medium text-sm'>{opt.label}</div>
												<div className='text-xs text-slate-500 mt-0.5'>
													{opt.desc}
												</div>
											</button>
										);
									})}
								</div>
								{visibility === 'PUBLIC' && (
									<p className='text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mt-2'>
										Public datasets appear in the community labeling queue.
										Anyone can label and verify your data and earn rewards.
									</p>
								)}
								{visibility === 'TEAM' && (
									<p className='text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2'>
										After creating, you can invite team members by email from
										the dataset settings page.
									</p>
								)}
							</div>

							{/* Label Classes */}
							<div>
								<label className='block text-sm font-medium text-slate-900 mb-1'>
									Label Classes (Optional)
								</label>
								<p className='text-xs text-slate-500 mb-3'>
									Define allowed labels. Leave empty for free-text labeling.
								</p>
								{labelClasses.length > 0 && (
									<div className='flex flex-wrap gap-2 mb-3'>
										{labelClasses.map(label => (
											<span
												key={label}
												className='flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 text-sm px-3 py-1 rounded-full'
											>
												{label}
												<button
													type='button'
													onClick={() =>
														setLabelClasses(p => p.filter(l => l !== label))
													}
													className='hover:text-red-600 ml-1'
												>
													<X className='w-3 h-3' />
												</button>
											</span>
										))}
									</div>
								)}
								<div className='flex gap-2'>
									<input
										type='text'
										value={labelInput}
										onChange={e => setLabelInput(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addLabelClass();
											}
										}}
										placeholder='e.g., positive, negative, neutral'
										className='input-field flex-1'
									/>
									<button
										type='button'
										onClick={addLabelClass}
										disabled={!labelInput.trim()}
										className='btn-secondary flex items-center gap-1 disabled:opacity-50'
									>
										<Plus className='w-4 h-4' /> Add
									</button>
								</div>
							</div>

							{/* Advanced settings */}
							<div>
								<button
									type='button'
									onClick={() => setShowAdvanced(p => !p)}
									className='text-sm text-slate-500 hover:text-slate-700 underline'
								>
									{showAdvanced ? 'Hide' : 'Show'} advanced settings
								</button>
								{showAdvanced && (
									<div className='mt-4 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200'>
										<div>
											<label className='block text-sm font-medium text-slate-900 mb-1'>
												Reward per item (USD)
											</label>
											<input
												type='number'
												step='0.01'
												min='0'
												value={rewardPerItem}
												onChange={e => setRewardPerItem(e.target.value)}
												className='input-field'
											/>
											<p className='text-xs text-slate-500 mt-1'>
												Amount paid to labelers per approved label
											</p>
										</div>
										<div>
											<label className='block text-sm font-medium text-slate-900 mb-1'>
												Consensus required
											</label>
											<input
												type='number'
												min='1'
												max='10'
												value={consensusRequired}
												onChange={e => setConsensusRequired(e.target.value)}
												className='input-field'
											/>
											<p className='text-xs text-slate-500 mt-1'>
												Verifications needed to approve a label
											</p>
										</div>
									</div>
								)}
							</div>

							{/* File upload */}
							<div>
								<label className='block text-sm font-medium text-slate-900 mb-3'>
									Upload File *
								</label>
								<div className='border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors'>
									<input
										type='file'
										onChange={handleFileChange}
										accept='.csv,.json'
										id='file-input'
										className='hidden'
									/>
									<label
										htmlFor='file-input'
										className='cursor-pointer flex flex-col items-center'
									>
										<FileUp className='w-12 h-12 text-slate-400 mb-3' />
										<span className='font-medium text-slate-900'>
											{file ? file.name : 'Click to upload or drag and drop'}
										</span>
										<span className='text-sm text-slate-600 mt-1'>
											CSV or JSON files
										</span>
									</label>
								</div>
							</div>

							{preview.length > 0 && (
								<div>
									<label className='block text-sm font-medium text-slate-900 mb-3'>
										Preview (First 5 rows)
									</label>
									<div className='overflow-x-auto rounded-lg border border-slate-200'>
										<table className='w-full text-sm'>
											<thead>
												<tr className='border-b border-slate-200 bg-slate-50'>
													{Object.keys(preview[0]).map(key => (
														<th
															key={key}
															className='px-4 py-2 text-left font-medium text-slate-900'
														>
															{key}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{preview.map((row, idx) => (
													<tr
														key={idx}
														className='border-b border-slate-100 hover:bg-slate-50'
													>
														{Object.values(row).map((value: any, i) => (
															<td key={i} className='px-4 py-2 text-slate-600'>
																{String(value).substring(0, 50)}
																{String(value).length > 50 ? '...' : ''}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							<div className='flex justify-end gap-4 pt-4 border-t border-slate-200'>
								<button
									type='button'
									className='btn-secondary'
									onClick={() => router.push('/dashboard')}
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={loading || !file || !datasetName}
									className='btn-primary flex items-center gap-2'
								>
									{loading ? (
										<>
											<Loader className='w-4 h-4 animate-spin' /> Uploading...
										</>
									) : (
										<>
											<Upload className='w-4 h-4' /> Create Dataset
										</>
									)}
								</button>
							</div>
						</form>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
