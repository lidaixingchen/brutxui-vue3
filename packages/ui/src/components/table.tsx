import * as React from 'react';
import { cn } from '../lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto">
            <table
                ref={ref}
                className={cn(
                    'w-full caption-bottom text-sm',
                    'border-3 border-brutal',
                    className
                )}
                {...props}
            />
        </div>
    )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn(
            'bg-[#FFE66D] dark:bg-gray-800 text-black dark:text-white',
            '[&_tr]:border-b-3 [&_tr]:border-brutal',
            className
        )}
        {...props}
    />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn(
            '[&_tr:last-child]:border-0',
            '[&_tr:nth-child(even)]:bg-gray-50 dark:[&_tr:nth-child(even)]:bg-gray-800',
            'dark:text-white',
            className
        )}
        {...props}
    />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            'border-t-3 border-brutal',
            'bg-[#4ECDC4] dark:bg-gray-700',
            'font-bold dark:text-white',
            '[&>tr]:last:border-b-0',
            className
        )}
        {...props}
    />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                'border-b-3 border-brutal transition-colors',
                'hover:bg-[#FFE66D]/30',
                'data-[state=selected]:bg-[#FFE66D]',
                className
            )}
            {...props}
        />
    )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-12 px-4 text-left align-middle font-black tracking-wide text-black',
            '[&:_has([role=checkbox])]:pr-0',
            'border-r-3 border-[var(--brutal-border-color,#000)] last:border-r-0',
            className
        )}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'p-4 align-middle font-medium',
            '[&:_has([role=checkbox])]:pr-0',
            'border-r-3 border-brutal last:border-r-0',
            className
        )}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
    HTMLTableCaptionElement,
    React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn('mt-4 text-sm font-bold text-gray-600 dark:text-gray-400', className)}
        {...props}
    />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
