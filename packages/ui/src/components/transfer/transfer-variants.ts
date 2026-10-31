import { cva } from 'class-variance-authority'
import { collectionItemVariants } from '@/lib/collection-item-variants'

export const transferItemVariants = cva([
    collectionItemVariants({ variant: 'default' }),
    'flex cursor-pointer select-none items-center gap-3 rounded-brutal border-3 border-transparent px-3 py-2',
])
