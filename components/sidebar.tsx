'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	BarChart3,
	Upload,
	Tag,
	CheckCircle,
	Settings,
	HelpCircle,
	PieChart,
} from 'lucide-react';

const navItems = [
	{
		label: 'Overview',
		href: '/dashboard',
		icon: BarChart3,
	},
	{
		label: 'Upload Data',
		href: '/dashboard/upload',
		icon: Upload,
	},
	{
		label: 'Label Data',
		href: '/dashboard/label',
		icon: Tag,
	},
	{
		label: 'Verify Labels',
		href: '/dashboard/verify',
		icon: CheckCircle,
	},
	{
		label: 'Analytics',
		href: '/dashboard/analytics',
		icon: PieChart,
	},
	{
		label: 'Settings',
		href: '/dashboard/settings',
		icon: Settings,
	},
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className='fixed left-0 top-16 hidden md:flex flex-col w-64 h-[calc(100vh-64px)] bg-slate-900 border-r border-slate-800/50 z-40'>
				<nav className='flex-1 px-3 py-5 space-y-1 overflow-y-auto'>
					{navItems.map(item => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href || pathname.startsWith(item.href + '/');

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`
									flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
									${
										isActive
											? 'bg-teal-500/10 text-teal-400 font-medium'
											: 'text-slate-400 hover:text-white hover:bg-slate-800/60'
									}
								`}
							>
								<Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
								<span>{item.label}</span>
								{isActive && (
									<div className='ml-auto w-1.5 h-1.5 rounded-full bg-teal-400' />
								)}
							</Link>
						);
					})}
				</nav>

				{/* Help Section */}
				<div className='border-t border-slate-800/50 px-4 py-5'>
					<div className='bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30'>
						<div className='flex items-center gap-2.5 mb-2'>
							<div className='w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center'>
								<HelpCircle className='w-4 h-4 text-teal-400' />
							</div>
							<h3 className='font-medium text-sm text-slate-200'>Need Help?</h3>
						</div>
						<p className='text-xs text-slate-500 mb-3 leading-relaxed'>
							Check our documentation or contact support
						</p>
						<button className='w-full text-xs font-medium bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]'>
							Get Help
						</button>
					</div>
				</div>
			</aside>

			{/* Mobile Bottom Navigation */}
			<nav className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom'>
				<div className='flex items-center justify-around px-2 py-1'>
					{navItems.slice(0, 5).map(item => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href || pathname.startsWith(item.href + '/');

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-0 ${
									isActive
										? 'text-teal-600'
										: 'text-slate-400 hover:text-slate-600'
								}`}
							>
								<Icon className='w-5 h-5' />
								<span className='text-[10px] font-medium leading-tight truncate max-w-full'>
									{item.label === 'Upload Data' ? 'Upload' : item.label === 'Verify Labels' ? 'Verify' : item.label}
								</span>
							</Link>
						);
					})}
				</div>
			</nav>

			{/* Spacer for mobile bottom nav */}
			<div className='md:hidden h-16' />
		</>
	);
}