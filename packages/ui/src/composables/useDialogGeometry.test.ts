import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { isInteractiveElement, useDialogGeometry } from './useDialogGeometry'

function mockDOMRect(rect: { width: number; height: number; top: number; left: number; right: number; bottom: number }): DOMRect {
    return { ...rect, x: rect.left, y: rect.top, toJSON: () => rect }
}

function createWrapper(options: Parameters<typeof useDialogGeometry>[0] = {}) {
    let result: ReturnType<typeof useDialogGeometry>
    const Wrapper = defineComponent({
        setup() {
            result = useDialogGeometry(options)
            return result
        },
        render: () => h('div', { ref: 'contentRef' }),
    })
    const wrapper = mount(Wrapper)
    return { wrapper, result: result! }
}

describe('isInteractiveElement', () => {
    it('returns true for INPUT element', () => {
        const el = document.createElement('input')
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns true for TEXTAREA element', () => {
        const el = document.createElement('textarea')
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns true for SELECT element', () => {
        const el = document.createElement('select')
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns true for BUTTON element', () => {
        const el = document.createElement('button')
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns true for A element', () => {
        const el = document.createElement('a')
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns true for contentEditable element', () => {
        const el = document.createElement('div')
        el.contentEditable = 'true'
        expect(isInteractiveElement(el)).toBe(true)
    })

    it('returns false for non-interactive DIV', () => {
        const el = document.createElement('div')
        expect(isInteractiveElement(el)).toBe(false)
    })

    it('returns false for SPAN', () => {
        const el = document.createElement('span')
        expect(isInteractiveElement(el)).toBe(false)
    })

    it('returns true for nested elements inside interactive buttons or links', () => {
        const button = document.createElement('button')
        const span = document.createElement('span')
        button.appendChild(span)
        expect(isInteractiveElement(span)).toBe(true)
    })
})

describe('useDialogGeometry', () => {
    let rafSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0)
            return 0
        })
    })

    afterEach(() => {
        rafSpy.mockRestore()
        vi.restoreAllMocks()
    })

    it('returns all expected refs and functions', () => {
        const { result } = createWrapper()
        expect(result.contentRef).toBeDefined()
        expect(result.isDragging).toBeDefined()
        expect(result.isResizing).toBeDefined()
        expect(result.position).toBeDefined()
        expect(result.size).toBeDefined()
        expect(result.contentStyle).toBeDefined()
        expect(result.onDragStart).toBeInstanceOf(Function)
        expect(result.onResizeStart).toBeInstanceOf(Function)
        expect(result.initPosition).toBeInstanceOf(Function)
        expect(result.initSize).toBeInstanceOf(Function)
        expect(result.setPosition).toBeInstanceOf(Function)
        expect(result.setSize).toBeInstanceOf(Function)
    })

    it('initializes position to {0,0} when no initialPosition', () => {
        const { result } = createWrapper()
        expect(result.position.value).toEqual({ x: 0, y: 0 })
    })

    it('initializes position from initialPosition option', () => {
        const { result } = createWrapper({ initialPosition: { x: 50, y: 100 } })
        expect(result.position.value).toEqual({ x: 50, y: 100 })
    })

    it('initPosition resets to {0,0} when no initialPosition', () => {
        const { result } = createWrapper()
        result.setPosition({ x: 200, y: 300 })
        result.initPosition()
        expect(result.position.value).toEqual({ x: 0, y: 0 })
    })

    it('initPosition sets initialPosition when provided', () => {
        const { result } = createWrapper({ initialPosition: { x: 10, y: 20 } })
        result.setPosition({ x: 0, y: 0 })
        result.initPosition()
        expect(result.position.value).toEqual({ x: 10, y: 20 })
    })

    it('initSize reads bounding rect from contentRef', () => {
        const { result } = createWrapper()
        result.contentRef.value = {
            getBoundingClientRect: () => mockDOMRect({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
        } as unknown as HTMLElement
        result.initSize()
        expect(result.size.value).toEqual({ width: 400, height: 300 })
    })

    it('initSize does nothing when contentRef is null', () => {
        const { result } = createWrapper()
        result.contentRef.value = null
        result.initSize()
        expect(result.size.value).toEqual({ width: 0, height: 0 })
    })

    it('setPosition and setSize update state and reject non-finite numbers', () => {
        const { result } = createWrapper()
        result.setPosition({ x: 120, y: 240 })
        expect(result.position.value).toEqual({ x: 120, y: 240 })

        result.setPosition({ x: NaN, y: 240 })
        expect(result.position.value).toEqual({ x: 120, y: 240 })

        result.setSize({ width: 500, height: 400 })
        expect(result.size.value).toEqual({ width: 500, height: 400 })

        result.setSize({ width: Infinity, height: 400 })
        expect(result.size.value).toEqual({ width: 500, height: 400 })
    })

    it('handles dragging correctly', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        div.getBoundingClientRect = () => mockDOMRect({ width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100 })

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)
        expect(result.isDragging.value).toBe(true)

        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 120 }))
        document.dispatchEvent(new PointerEvent('pointerup'))
        expect(result.isDragging.value).toBe(false)
    })

    it('handles resizing correctly', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 100, minHeight: 100 })
        const div = document.createElement('div')
        result.contentRef.value = div
        result.setSize({ width: 200, height: 200 })

        const resizeEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 200 })
        vi.spyOn(resizeEvent, 'preventDefault')
        vi.spyOn(resizeEvent, 'stopPropagation')
        result.onResizeStart(resizeEvent, 'se')
        expect(result.isResizing.value).toBe(true)

        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 250, clientY: 260 }))
        expect(result.size.value.width).toBe(250)
        expect(result.size.value.height).toBe(260)

        document.dispatchEvent(new PointerEvent('pointerup'))
        expect(result.isResizing.value).toBe(false)
    })

    it('ignores non-left-click on onDragStart', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div

        const rightClickEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100, button: 2 })
        Object.defineProperty(rightClickEvent, 'target', { value: div })
        result.onDragStart(rightClickEvent)
        expect(result.isDragging.value).toBe(false)
    })

    it('preserves aspectRatio when maxWidth constraint is active', () => {
        const { result } = createWrapper({ resizable: true, aspectRatio: 2, maxWidth: 300 })
        const div = document.createElement('div')
        result.contentRef.value = div
        result.setSize({ width: 200, height: 100 })

        const resizeEvent = new MouseEvent('mousedown', { clientX: 200, clientY: 100 })
        Object.defineProperty(resizeEvent, 'target', { value: div })
        result.onResizeStart(resizeEvent, 'se')

        // 尝试缩放到宽度 400，高度 200，但受 maxWidth: 300 限制，宽度应为 300，高度应为 150
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 200 }))
        expect(result.size.value.width).toBe(300)
        expect(result.size.value.height).toBe(150)

        document.dispatchEvent(new PointerEvent('pointerup'))
    })

    it('works without options', () => {
        const result = useDialogGeometry()
        expect(result.isDragging.value).toBe(false)
        expect(result.isResizing.value).toBe(false)
    })
})
