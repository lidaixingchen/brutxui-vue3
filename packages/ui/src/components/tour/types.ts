/* global ScrollIntoViewOptions */

export interface TourStep {
    target: string | HTMLElement
    title?: string
    description?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    mask?: boolean
}

export interface TourProps {
    steps: TourStep[]
    mask?: boolean
    scrollIntoViewOptions?: ScrollIntoViewOptions
}
