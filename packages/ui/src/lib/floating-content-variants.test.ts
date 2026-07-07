import {
    brutalFloatingSurfaceClasses,
    floatingContentSideOffsets,
    inverseFloatingSurfaceClasses,
    tooltipFloatingAnimationClasses,
} from './floating-content-variants'

describe('floating content variants', () => {
    it('keeps default side offsets explicit per primitive', () => {
        expect(floatingContentSideOffsets).toEqual({
            popover: 8,
            dropdownMenu: 6,
            tooltip: 6,
        })
    })

    it('exposes brutal surface classes for floating content', () => {
        expect(brutalFloatingSurfaceClasses.join(' ')).toContain('bg-brutal-bg')
        expect(brutalFloatingSurfaceClasses.join(' ')).toContain('shadow-brutal')
        expect(inverseFloatingSurfaceClasses.join(' ')).toContain('bg-brutal-fg')
    })

    it('keeps tooltip directional motion tokens available', () => {
        expect(tooltipFloatingAnimationClasses).toContain('data-[side=bottom]:slide-in-from-top-2')
    })
})
