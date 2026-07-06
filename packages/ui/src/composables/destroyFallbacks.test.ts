import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToast } from './useToast'
import { useTheme } from './useTheme'
import { useMessage, messageStore } from './useMessage'
import { destroyBrutxFallbacks } from './destroyFallbacks'

const mockMatchMedia = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

describe('destroyBrutxFallbacks', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
        })
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        })
        destroyBrutxFallbacks()
    })

    afterEach(() => {
        destroyBrutxFallbacks()
        warnSpy.mockRestore()
        vi.useRealTimers()
    })

    it('clears toast, theme, and message singleton state together', () => {
        const toast = useToast()
        toast.addToast({ title: 'Toast', duration: 1000 })

        const theme = useTheme()
        const themeDestroySpy = vi.spyOn(theme, 'destroy')

        const message = useMessage()
        message.show({ title: 'Message', duration: 1000 })

        expect(toast.toasts.value).toHaveLength(1)
        expect(messageStore.value).toHaveLength(1)

        destroyBrutxFallbacks()

        expect(themeDestroySpy).toHaveBeenCalledOnce()
        expect(toast.toasts.value).toHaveLength(0)
        expect(messageStore.value).toHaveLength(0)

        vi.advanceTimersByTime(1000)

        expect(toast.toasts.value).toHaveLength(0)
        expect(messageStore.value).toHaveLength(0)

        const nextToast = useToast()
        const nextTheme = useTheme()

        expect(nextToast).not.toBe(toast)
        expect(nextToast.toasts.value).toHaveLength(0)
        expect(nextTheme).not.toBe(theme)
    })
})
