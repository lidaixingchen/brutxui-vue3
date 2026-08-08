import { cva } from 'class-variance-authority';
import { treeNodeBaseClasses, treeNodeUnselectedClass, treeSelectedClass } from '@/lib/tree-variants';
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
                false: treeNodeUnselectedClass,
            },
        },
        defaultVariants: {
            selected: false,
        },
    }
);
