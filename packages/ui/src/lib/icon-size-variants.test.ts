import { describe, it, expect } from 'vitest'
import { iconSizeVariants } from './icon-size-variants'

describe('iconSizeVariants', () => {
    it('returns default size classes when no size is provided', () => {
        expect(iconSizeVariants()).toBe('h-4 w-4')
    })

    it('returns default size classes for explicit default size', () => {
        expect(iconSizeVariants({ size: 'default' })).toBe('h-4 w-4')
    })

    it('returns xs size classes', () => {
        expect(iconSizeVariants({ size: 'xs' })).toBe('h-2.5 w-2.5')
    })

    it('returns sm size classes matching Button loader and Checkbox indicator', () => {
        expect(iconSizeVariants({ size: 'sm' })).toBe('h-3 w-3')
    })

    it('returns lg size classes matching Button loader and Checkbox indicator', () => {
        expect(iconSizeVariants({ size: 'lg' })).toBe('h-5 w-5')
    })

    it('returns xl size classes matching Button loader', () => {
        expect(iconSizeVariants({ size: 'xl' })).toBe('h-6 w-6')
    })

    it('returns 2xl size classes', () => {
        expect(iconSizeVariants({ size: '2xl' })).toBe('h-8 w-8')
    })
})
