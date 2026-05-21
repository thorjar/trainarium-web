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
		<aside className='fixed left-0 top-16 hidden md:flex flex-col w-64 h-[calc(100vh-64px)] bg-slate-900 text-white border-r border-slate-800'>
			<nav className='flex-1 px-4 py-6 space-y-2'>
				{navItems.map(item => {
					const Icon = item.icon;
					const isActive =
						pathname === item.href || pathname.startsWith(item.href + '/');

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
									isActive
										? 'bg-teal-500 text-white'
										: 'text-slate-300 hover:bg-slate-800 hover:text-white'
								}
              `}
						>
							<Icon className='w-5 h-5' />
							<span className='font-medium'>{item.label}</span>
						</Link>
					);
				})}
			</nav>

			{/* Help Section */}
			<div className='border-t border-slate-800 px-4 py-6 space-y-4'>
				<div className='bg-slate-800 rounded-lg p-4'>
					<div className='flex items-center gap-2 mb-2'>
						<HelpCircle className='w-4 h-4 text-teal-500' />
						<h3 className='font-medium text-sm'>Need Help?</h3>
					</div>
					<p className='text-xs text-slate-400 mb-3'>
						Check our documentation or contact support
					</p>
					<button className='w-full text-xs bg-teal-500 hover:bg-teal-600 text-white py-2 rounded transition-colors'>
						Get Help
					</button>
				</div>
			</div>
		</aside>
	);
}
