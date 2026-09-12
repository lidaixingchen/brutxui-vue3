import { cva } from 'class-variance-authority'

export type FormLayoutPosition = 'left' | 'right' | 'top'
export type FormLayoutSize = 'sm' | 'default' | 'lg'

const horizontalFormItemLayout = 'grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-3'

export const formItemVariants = cva(
    [],
    {
        variants: {
            labelPosition: {
                left: horizontalFormItemLayout,
                right: horizontalFormItemLayout,
                top: 'space-y-2',
            },
            size: {
                sm: 'gap-y-1',
                default: 'gap-y-2',
                lg: 'gap-y-3',
            },
        },
        compoundVariants: [
            { labelPosition: 'top', size: 'sm', class: 'space-y-1' },
            { labelPosition: 'top', size: 'default', class: 'space-y-2' },
            { labelPosition: 'top', size: 'lg', class: 'space-y-3' },
        ],
        defaultVariants: {
            labelPosition: 'top',
            size: 'default',
        },
    },
)

export const formLabelVariants = cva(
    [],
    {
        variants: {
            labelPosition: {
                left: 'col-start-1 row-start-1 justify-self-start',
                right: 'col-start-1 row-start-1 justify-self-end',
                top: '',
            },
        },
        defaultVariants: {
            labelPosition: 'top',
        },
    },
)

export const formControlVariants = cva(
    [],
    {
        variants: {
            labelPosition: {
                left: 'col-start-2 row-start-1',
                right: 'col-start-2 row-start-1',
                top: '',
            },
        },
        defaultVariants: {
            labelPosition: 'top',
        },
    },
)

export const formDescriptionVariants = cva(
    [
        'text-brutal-muted-foreground font-medium',
    ],
    {
        variants: {
            labelPosition: {
                left: 'col-start-2',
                right: 'col-start-2',
                top: '',
            },
            size: {
                sm: 'text-xs',
                default: 'text-sm',
                lg: 'text-base',
            },
        },
        defaultVariants: {
            labelPosition: 'top',
            size: 'default',
        },
    },
)

export const formMessageVariants = cva(
    [
        'font-black text-brutal-destructive',
    ],
    {
        variants: {
            labelPosition: {
                left: 'col-start-2',
                right: 'col-start-2',
                top: '',
            },
            size: {
                sm: 'text-xs',
                default: 'text-sm',
                lg: 'text-base',
            },
        },
        defaultVariants: {
            labelPosition: 'top',
            size: 'default',
        },
    },
)
