import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, reactive } from 'vue'
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

    it('uses the new storage key when adding a color in the same tick', async () => {
        const oldKey = 'old-colors'
        const newKey = 'new-colors'
        localStorageMock.setItem(oldKey, JSON.stringify(['#0056ff']))
        localStorageMock.setItem(newKey, JSON.stringify(['#0057ff']))
        const options = reactive({ storageKey: oldKey })
        const { history, addToHistory } = useColorHistory(options)

        options.storageKey = newKey
        addToHistory('#ffffff')
        await nextTick()

        expect(history.value).toEqual(['#ffffff', '#0057ff'])
        expect(JSON.parse(localStorageMock.getItem(oldKey)!)).toEqual(['#0056ff'])
        expect(JSON.parse(localStorageMock.getItem(newKey)!)).toEqual(['#ffffff', '#0057ff'])
    })

    it('uses the persisted history after another instance clears the same key', () => {
        const storageKey = 'shared-colors'
        localStorageMock.setItem(storageKey, JSON.stringify(['#0056ff', '#0057ff']))
        const first = useColorHistory({ storageKey })
        const second = useColorHistory({ storageKey })

        first.clearHistory()
        second.addToHistory('#ffffff')
        first.addToHistory('#ff0000')

        const expected = ['#ff0000', '#ffffff']
        expect(first.history.value).toEqual(expected)
        expect(JSON.parse(localStorageMock.getItem(storageKey)!)).toEqual(expected)
    })

    it('does not reintroduce entries trimmed by another instance', async () => {
        const storageKey = 'limited-colors'
        localStorageMock.setItem(storageKey, JSON.stringify(['#0056ff', '#0057ff']))
        const options = reactive({ storageKey, maxItems: 2 })
        useColorHistory(options)
        const second = useColorHistory({ storageKey })

        options.maxItems = 1
        await nextTick()
        second.addToHistory('#ffffff')

        expect(second.history.value).toEqual(['#ffffff', '#0056ff'])
        expect(JSON.parse(localStorageMock.getItem(storageKey)!)).toEqual(['#ffffff', '#0056ff'])
    })

    it('retains recent selections in memory while persistence fails', () => {
        const storageKey = 'unwritable-colors'
        const { history, addToHistory } = useColorHistory({ storageKey })
        localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('Storage unavailable') })
        localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('Storage unavailable') })

        addToHistory('#0056ff')
        addToHistory('#0057ff')
        expect(history.value).toEqual(['#0057ff', '#0056ff'])
        expect(localStorageMock.getItem(storageKey)).toBeNull()

        addToHistory('#ffffff')
        expect(JSON.parse(localStorageMock.getItem(storageKey)!)).toEqual(['#ffffff', '#0057ff', '#0056ff'])
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
