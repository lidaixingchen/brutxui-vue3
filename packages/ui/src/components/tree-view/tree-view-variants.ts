import { cva } from 'class-variance-authority';
import { treeNodeBaseClasses, treeSelectedClass } from '@/lib/tree-variants';

export const treeItemVariants = cva(
    [
        ...treeNodeBaseClasses,
        'hover:border-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
    ],
    {
        variants: {
            selected: {
                true: treeSelectedClass,
                false: '',
            },
        },
        defaultVariants: {
            selected: false,
        },
    }
);
