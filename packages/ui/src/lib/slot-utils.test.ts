import { describe, it, expect } from 'vitest'
import { createCommentVNode, createTextVNode, h, Fragment } from 'vue'
import { hasSlotContent } from './slot-utils'

describe('hasSlotContent', () => {
    it('returns false for undefined or empty array', () => {
        expect(hasSlotContent(undefined)).toBe(false)
        expect(hasSlotContent([])).toBe(false)
    })

    it('returns false for single or multiple Comment nodes', () => {
        const comment1 = createCommentVNode('v-if')
        const comment2 = createCommentVNode('another comment')
        expect(hasSlotContent([comment1, comment2])).toBe(false)
    })

    it('returns false for empty or whitespace-only Text nodes', () => {
        const emptyText = createTextVNode('')
        const spaceText = createTextVNode('   \n  \t ')
        expect(hasSlotContent([emptyText, spaceText])).toBe(false)
    })

    it('returns false for element nodes with whitespace-only string children', () => {
        const el = h('div', '   ')
        expect(hasSlotContent([el])).toBe(false)
    })

    it('returns false for nested fragments with comments and empty text', () => {
        const fragment = h(Fragment, [
            createCommentVNode('comment'),
            createTextVNode('   '),
            h(Fragment, [createCommentVNode('nested')]),
        ])
        expect(hasSlotContent([fragment])).toBe(false)
    })

    it('returns true for non-empty Text node', () => {
        const text = createTextVNode('Hello World')
        expect(hasSlotContent([text])).toBe(true)
    })

    it('returns true for element with text content', () => {
        const el = h('span', 'Title Content')
        expect(hasSlotContent([el])).toBe(true)
    })

    it('returns true for elements without children (e.g. icon/img)', () => {
        const img = h('img', { src: 'icon.png' })
        expect(hasSlotContent([img])).toBe(true)
    })

    it('handles raw string entries in VNode array', () => {
        expect(hasSlotContent(['   ' as unknown as import('vue').VNode])).toBe(false)
        expect(hasSlotContent(['Hello' as unknown as import('vue').VNode])).toBe(true)
    })
})
