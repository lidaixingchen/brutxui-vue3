import { cva } from 'class-variance-authority';
import { treeNodeBaseClasses, treeSelectedClass } from '@/lib/tree-variants';
import { brutalHoverLift } from '@/lib/brutal-interaction-variants'

export const treeItemVariants = cva(
    [
        ...treeNodeBaseClasses,
        'hover:border-brutal',
        brutalHoverLift,
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
