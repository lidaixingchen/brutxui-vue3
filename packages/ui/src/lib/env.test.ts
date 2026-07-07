import { afterEach, describe, expect, it, vi } from 'vitest'

const originalViewport = {
    width: window.innerWidth,
    height: window.innerHeight,
}

describe('env viewport helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        Object.defineProperty(window, 'innerWidth', { value: originalViewport.width, configurable: true })
        Object.defineProperty(window, 'innerHeight', { value: originalViewport.height, configurable: true })
        vi.resetModules()
    })

    it('reads current browser viewport size', async () => {
        vi.resetModules()
        Object.defineProperty(window, 'innerWidth', { value: 1234, configurable: true })
        Object.defineProperty(window, 'innerHeight', { value: 678, configurable: true })

        const { getViewportSize } = await import('./env')

        expect(getViewportSize()).toEqual({ width: 1234, height: 678 })
    })

    it('falls back to zero size without window', async () => {
        vi.resetModules()
        vi.stubGlobal('window', undefined)

        const { getViewportSize } = await import('./env')

        expect(getViewportSize()).toEqual({ width: 0, height: 0 })
    })
})
