import { cva } from 'class-variance-authority'
import { brutalDestructiveTextClasses } from '@/lib/semantic-text-variants'

export const formWizardRootVariants = cva(
    [
        'flex flex-col gap-6',
    ],
)

export const formWizardNavigationVariants = cva(
    [
        'flex items-center justify-between gap-4 pt-4 border-t-3 border-brutal',
    ],
)

export const formWizardStepInfoVariants = cva(
    [
        'flex items-center gap-2',
    ],
)

export const formWizardStepCounterVariants = cva(
    [
        'text-sm font-medium text-brutal-fg/60',
    ],
)

export const formWizardErrorPanelVariants = cva(
    [
        'p-4 border-3 border-brutal bg-brutal-destructive/10',
        brutalDestructiveTextClasses,
    ],
)

export const formWizardErrorTitleVariants = cva(
    [
        'font-bold',
    ],
)
