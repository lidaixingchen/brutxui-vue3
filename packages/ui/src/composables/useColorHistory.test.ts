import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useColorHistory } from './useColorHistory'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = {} }),
    }
})()

describe('useColorHistory', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', localStorageMock)
        localStorageMock.clear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('addToHistory adds a color to history', () => {
        const { history, addToHistory } = useColorHistory()
        addToHistory('#ff0000')
        expect(history.value).toContain('#ff0000')
    })

    it('addToHistory normalizes colors', () => {
        const { history, addToHistory } = useColorHistory()
        addToHistory('#ff0000')
        addToHistory('#FF0000')
        // Both should normalize to the same color
        expect(history.value.length).toBe(1)
    })

    it('addToHistory deduplicates colors', () => {
        const { history, addToHistory } = useColorHistory()
        addToHistory('#ff0000')
        addToHistory('#ff0000')
        addToHistory('#ff0000')
        expect(history.value.length).toBe(1)
    })

    it('addToHistory moves duplicate to front', () => {
        const { history, addToHistory } = useColorHistory()
        addToHistory('#ff0000')
        addToHistory('#00ff00')
        addToHistory('#ff0000')
        expect(history.value[0]).toBe('#ff0000')
        expect(history.value.length).toBe(2)
    })

    it('addToHistory respects maxItems', () => {
        const { history, addToHistory } = useColorHistory({ maxItems: 3 })
        addToHistory('#ff0000')
        addToHistory('#00ff00')
        addToHistory('#0000ff')
        addToHistory('#ffff00')
        expect(history.value.length).toBe(3)
        expect(history.value[0]).toBe('#ffff00')
        expect(history.value).not.toContain('#ff0000')
    })

    it('clearHistory empties the history', () => {
        const { history, addToHistory, clearHistory } = useColorHistory()
        addToHistory('#ff0000')
        addToHistory('#00ff00')
        expect(history.value.length).toBe(2)
        clearHistory()
        expect(history.value.length).toBe(0)
    })

    it('persists to localStorage when storageKey is provided', () => {
        const { addToHistory } = useColorHistory({ storageKey: 'test-colors' })
        addToHistory('#ff0000')
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'test-colors',
            expect.any(String)
        )
    })

    it('loads from localStorage when storageKey is provided', () => {
        localStorageMock.setItem('test-colors', JSON.stringify(['#ff0000', '#00ff00']))

        const { history } = useColorHistory({ storageKey: 'test-colors' })
        expect(history.value).toEqual(['#ff0000', '#00ff00'])
    })

    it('handles invalid localStorage data gracefully', () => {
        localStorageMock.setItem('test-colors', 'invalid json')

        const { history } = useColorHistory({ storageKey: 'test-colors' })
        expect(history.value).toEqual([])
    })

    it('history is readonly', () => {
        const { history, addToHistory } = useColorHistory()
        addToHistory('#ff0000')
        const originalLength = history.value.length
        // @ts-expect-error testing readonly
        history.value = []
        // Readonly refs don't throw, they just don't update
        expect(history.value.length).toBe(originalLength)
    })
})
