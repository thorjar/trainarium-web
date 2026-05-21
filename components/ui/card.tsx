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
        bg-white rounded-lg border border-slate-200 shadow-sm
        ${hoverable ? 'hover:shadow-md cursor-pointer transition-shadow' : ''}
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
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
	return (
		<div className='px-6 py-4 border-b border-slate-200 flex justify-between items-start'>
			<div>
				<h3 className='text-lg font-semibold text-slate-900'>{title}</h3>
				{description && (
					<p className='text-sm text-slate-500 mt-1'>{description}</p>
				)}
			</div>
			{action}
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
	return <div className={`px-6 py-4 ${className}`}>{children}</div>;
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
			className={`px-6 py-4 border-t border-slate-200 flex justify-between items-center ${className}`}
		>
			{children}
		</div>
	);
}
