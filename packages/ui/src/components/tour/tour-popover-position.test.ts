import { describe, expect, it } from 'vitest'
import { calculateTourPopoverPosition } from './tour-popover-position'

describe('calculateTourPopoverPosition', () => {
    it('uses the default bottom placement when there is enough room', () => {
        expect(calculateTourPopoverPosition({
            target: { left: 120, top: 100, width: 40, height: 30 },
            popover: { width: 200, height: 100 },
            viewport: { width: 390, height: 844 },
        })).toEqual({ left: 40, top: 142 })
    })

    it('prefers the opposite placement before trying a perpendicular side', () => {
        expect(calculateTourPopoverPosition({
            target: { left: 300, top: 380, width: 60, height: 40 },
            popover: { width: 280, height: 230 },
            viewport: { width: 390, height: 844 },
            placement: 'right',
        })).toEqual({ left: 8, top: 285 })
    })

    it('moves a side placement to an available perpendicular side on a narrow viewport', () => {
        expect(calculateTourPopoverPosition({
            target: { left: 157, top: 402, width: 78, height: 40 },
            popover: { width: 280, height: 230 },
            viewport: { width: 390, height: 844 },
            placement: 'right',
        })).toEqual({ left: 56, top: 160 })
    })

    it('selects the position with the least target overlap when no side fits', () => {
        expect(calculateTourPopoverPosition({
            target: { left: 300, top: 110, width: 20, height: 20 },
            popover: { width: 300, height: 220 },
            viewport: { width: 320, height: 240 },
            placement: 'right',
        })).toEqual({ left: 8, top: 10 })
    })
})
