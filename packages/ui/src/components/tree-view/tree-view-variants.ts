import { cva } from 'class-variance-authority';
import { collectionItemVariants } from '@/lib/collection-item-variants'
import { treeNodeBaseClasses } from '@/lib/tree-variants';

export const treeItemVariants = cva(
    [
        ...treeNodeBaseClasses,
        collectionItemVariants({ variant: 'default' }),
    ],
);
