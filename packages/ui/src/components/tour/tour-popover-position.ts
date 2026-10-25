import type { TourStep } from './types'

export const POPOVER_GAP_PX = 12
export const VIEWPORT_MARGIN_PX = 8

type TourPlacement = NonNullable<TourStep['placement']>

interface TourRect {
    left: number
    top: number
    width: number
    height: number
}

interface TourPopoverPositionOptions {
    target: TourRect
    popover: { width: number; height: number }
    viewport: { width: number; height: number }
    placement?: TourPlacement
}

export interface TourPopoverPosition {
    left: number
    top: number
}

const placementPreference: Record<TourPlacement, readonly TourPlacement[]> = {
    top: ['top', 'bottom', 'right', 'left'],
    bottom: ['bottom', 'top', 'right', 'left'],
    left: ['left', 'right', 'top', 'bottom'],
    right: ['right', 'left', 'top', 'bottom'],
}

function clampPosition(position: number, viewportSize: number, elementSize: number): number {
    const maxPosition = Math.max(VIEWPORT_MARGIN_PX, viewportSize - elementSize - VIEWPORT_MARGIN_PX)
    return Math.min(Math.max(position, VIEWPORT_MARGIN_PX), maxPosition)
}

/** 面板宽高由 Tour 的视口约束控制；定位仅负责方向选择和边缘对齐。 */
export function calculateTourPopoverPosition({
    target,
    popover,
    viewport,
    placement = 'bottom',
}: TourPopoverPositionOptions): TourPopoverPosition {
    let bestPosition: TourPopoverPosition | undefined
    let leastOverlap = Infinity

    for (const candidate of placementPreference[placement]) {
        const vertical = candidate === 'top' || candidate === 'bottom'
        const before = candidate === 'top' || candidate === 'left'
        const mainSize = vertical ? popover.height : popover.width
        const mainTarget = vertical ? target.top : target.left
        const targetSize = vertical ? target.height : target.width
        const mainStart = before ? mainTarget - mainSize - POPOVER_GAP_PX : mainTarget + targetSize + POPOVER_GAP_PX
        const mainLimit = vertical ? viewport.height : viewport.width
        const main = clampPosition(mainStart, mainLimit, mainSize)
        const cross = vertical
            ? clampPosition(target.left + (target.width - popover.width) / 2, viewport.width, popover.width)
            : clampPosition(target.top + (target.height - popover.height) / 2, viewport.height, popover.height)
        const position = vertical ? { left: cross, top: main } : { left: main, top: cross }
        if (mainStart >= VIEWPORT_MARGIN_PX && mainStart + mainSize <= mainLimit - VIEWPORT_MARGIN_PX) {
            return position
        }

        const overlapWidth = Math.max(0, Math.min(position.left + popover.width, target.left + target.width) - Math.max(position.left, target.left))
        const overlapHeight = Math.max(0, Math.min(position.top + popover.height, target.top + target.height) - Math.max(position.top, target.top))
        const overlap = overlapWidth * overlapHeight
        if (overlap < leastOverlap) {
            leastOverlap = overlap
            bestPosition = position
        }
    }
    return bestPosition!
}
