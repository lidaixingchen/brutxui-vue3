import { cva } from 'class-variance-authority';
import { treeNodeBaseClasses, treeNodeDisabledClass, treeNodeFocusedClass, treeNodeUnselectedClass, treeSelectedClass } from '@/lib/tree-variants';
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
            disabled: {
                true: treeNodeDisabledClass,
                false: '',
            },
            focused: {
                true: treeNodeFocusedClass,
                false: '',
            },
        },
        defaultVariants: {
            selected: false,
            disabled: false,
            focused: false,
        },
    }
);
