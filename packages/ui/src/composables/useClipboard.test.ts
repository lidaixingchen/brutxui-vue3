import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useClipboard, DEFAULT_COPIED_DURATION } from './useClipboard'

describe('useClipboard', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('isSupported returns true when clipboard API is available', () => {
        vi.stubGlobal('navigator', {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        })

        const { isSupported } = useClipboard()
        expect(isSupported.value).toBe(true)
    })

    it('isSupported returns false when clipboard API is not available', () => {
        vi.stubGlobal('navigator', {})

        const { isSupported } = useClipboard()
        expect(isSupported.value).toBe(false)
    })

    it('calls writeText with the clipboard receiver and shows success feedback', async () => {
        const clipboard = {
            writeText: vi.fn(function (this: unknown) {
                if (this !== clipboard) throw new TypeError('Illegal invocation')
                return Promise.resolve()
            }),
        }
        vi.stubGlobal('navigator', {
            clipboard,
        })

        const { copy, copied } = useClipboard()
        const result = await copy('Hello World')

        expect(result).toBe(true)
        expect(clipboard.writeText).toHaveBeenCalledWith('Hello World')
        expect(copied.value).toBe(true)
    })

    it('copied resets to false after duration', async () => {
        vi.stubGlobal('navigator', {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        })

        const { copy, copied } = useClipboard()
        await copy('Test')

        expect(copied.value).toBe(true)

        await vi.advanceTimersByTimeAsync(DEFAULT_COPIED_DURATION)
        expect(copied.value).toBe(false)
    })

    it('copied resets after custom duration', async () => {
        vi.stubGlobal('navigator', {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        })

        const { copy, copied } = useClipboard({ duration: 1000 })
        await copy('Test')

        expect(copied.value).toBe(true)

        await vi.advanceTimersByTimeAsync(999)
        expect(copied.value).toBe(true)

        await vi.advanceTimersByTimeAsync(1)
        expect(copied.value).toBe(false)
    })

    it('copy returns false when clipboard API is not supported', async () => {
        vi.stubGlobal('navigator', {})

        const { copy } = useClipboard()
        const result = await copy('Test')

        expect(result).toBe(false)
    })

    it('copy returns false when writeText fails', async () => {
        vi.stubGlobal('navigator', {
            clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
        })

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const { copy, copied } = useClipboard()
        const result = await copy('Test')

        expect(result).toBe(false)
        expect(copied.value).toBe(false)
        consoleSpy.mockRestore()
    })
})
