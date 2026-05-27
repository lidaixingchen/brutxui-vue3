import * as React from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    actionText?: string;
    onActionClick?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({
    title = 'No active deployments found',
    description = 'You haven\'t launched any brutalist web projects on this cluster node. Deploy your first static directory in seconds.',
    actionText = 'Deploy New App',
    onActionClick,
    icon,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border-3 border-brutal bg-white dark:bg-gray-800 rounded-none shadow-brutal transition-colors duration-200 ${className || ''}`}
            {...props}
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-brutal-accent translate-x-2 translate-y-2 border-3 border-brutal" />
                <div className="relative z-10 h-16 w-16 bg-white dark:bg-gray-700 border-3 border-brutal flex items-center justify-center text-brutal-fg">
                    {icon || <FolderOpen className="h-8 w-8 stroke-[2.5]" />}
                </div>
            </div>

            <h3 className="text-2xl font-black mb-3 tracking-tight text-brutal-fg leading-none">
                {title}
            </h3>

            <p className="max-w-[440px] text-sm font-bold text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {description}
            </p>

            <Button
                variant="primary"
                className="font-black text-sm gap-2"
                onClick={onActionClick}
            >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>{actionText}</span>
            </Button>
        </div>
    );
}
