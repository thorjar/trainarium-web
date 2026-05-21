import React from 'react';

interface CardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
}

export function Card({
	children,
	className = '',
	onClick,
	hoverable = false,
}: CardProps) {
	return (
		<div
			className={`
        bg-white rounded-2xl border border-slate-200/80 shadow-soft
        ${hoverable ? 'hover-lift cursor-pointer' : ''}
        ${className}
      `}
			onClick={onClick}
		>
			{children}
		</div>
	);
}

interface CardHeaderProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function CardHeader({ title, description, action, className = '' }: CardHeaderProps) {
	return (
		<div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-start gap-4 ${className}`}>
			<div className='min-w-0'>
				<h3 className='text-lg font-semibold text-slate-900'>{title}</h3>
				{description && (
					<p className='text-sm text-slate-500 mt-1'>{description}</p>
				)}
			</div>
			{action && <div className='flex-shrink-0'>{action}</div>}
		</div>
	);
}

export function CardBody({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function CardFooter({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`px-6 py-4 border-t border-slate-100 flex justify-between items-center ${className}`}
		>
			{children}
		</div>
	);
}