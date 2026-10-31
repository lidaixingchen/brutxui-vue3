import { describe, expect, it } from 'vitest'
import { isReadonly } from 'vue'
import { useCommandFocus } from './command-focus'

describe('useCommandFocus', () => {
    it('switches modes for list navigation and pointer movement', () => {
        const focus = useCommandFocus()

        expect(focus.mode.value).toBe('pointer')

        focus.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
        expect(focus.mode.value).toBe('keyboard')

        focus.handlePointerMove()
        expect(focus.mode.value).toBe('pointer')
    })

    it('leaves text editing and composition events in pointer mode', () => {
        const focus = useCommandFocus()

        focus.handleKeydown(new KeyboardEvent('keydown', { key: 'a' }))
        expect(focus.mode.value).toBe('pointer')

        const searchInput = document.createElement('input')
        searchInput.setAttribute('role', 'searchbox')
        const textEvent = new KeyboardEvent('keydown', { key: 'a', shiftKey: true })
        Object.defineProperty(textEvent, 'target', { value: searchInput })
        focus.handleKeydown(textEvent)
        expect(focus.mode.value).toBe('pointer')

        const compositionEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
        Object.defineProperty(compositionEvent, 'isComposing', { value: true })
        Object.defineProperty(compositionEvent, 'target', { value: searchInput })
        focus.handleKeydown(compositionEvent)
        expect(focus.mode.value).toBe('pointer')
    })

    it.each(['ArrowUp', 'ArrowDown', 'Home', 'End'])('tracks searchbox %s navigation', (key) => {
        const focus = useCommandFocus()
        const searchInput = document.createElement('input')
        searchInput.setAttribute('role', 'searchbox')
        const event = new KeyboardEvent('keydown', { key })
        Object.defineProperty(event, 'target', { value: searchInput })

        focus.handleKeydown(event)

        expect(focus.mode.value).toBe('keyboard')
    })

    it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)('tracks searchbox ArrowDown with %s', (modifier) => {
        const focus = useCommandFocus()
        const searchInput = document.createElement('input')
        searchInput.setAttribute('role', 'searchbox')
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', [modifier]: true })
        Object.defineProperty(event, 'target', { value: searchInput })

        focus.handleKeydown(event)

        expect(focus.mode.value).toBe('keyboard')
    })

    it('exposes runtime readonly input mode', () => {
        expect(isReadonly(useCommandFocus().mode)).toBe(true)
    })
})
