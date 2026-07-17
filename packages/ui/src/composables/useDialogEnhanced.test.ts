import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { isInteractiveElement, useDialogEnhanced } from './useDialogEnhanced'

// Helper: create a mock DOMRect with all required properties
function mockDOMRect(rect: { width: number; height: number; top: number; left: number; right: number; bottom: number }): DOMRect {
    return { ...rect, x: rect.left, y: rect.top, toJSON: () => rect }
}

// Helper: create a minimal wrapper component that calls useDialogEnhanced
function createWrapper(options: Parameters<typeof useDialogEnhanced>[0] = {}) {
    let result: ReturnType<typeof useDialogEnhanced>
    const Wrapper = defineComponent({
        setup() {
            result = useDialogEnhanced(options)
            return result
        },
        render: () => h('div', { ref: 'contentRef' }),
    })
    const wrapper = mount(Wrapper)
    return { wrapper, result: result! }
}

// ── isInteractiveElement ─────────────────────────────────────────

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
})

// ── useDialogEnhanced ────────────────────────────────────────────

describe('useDialogEnhanced', () => {
    let rafSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Mock requestAnimationFrame
        rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0)
            return 0
        })
    })

    afterEach(() => {
        rafSpy.mockRestore()
        vi.restoreAllMocks()
    })

    // ── Return Value ──────────────────────────────────────────────

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
        expect(result.handleClose).toBeInstanceOf(Function)
        expect(result.initPosition).toBeInstanceOf(Function)
        expect(result.initSize).toBeInstanceOf(Function)
    })

    // ── Initialization ────────────────────────────────────────────

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
        result.position.value = { x: 200, y: 300 }
        result.initPosition()
        expect(result.position.value).toEqual({ x: 0, y: 0 })
    })

    it('initPosition sets initialPosition when provided', () => {
        const { result } = createWrapper({ initialPosition: { x: 10, y: 20 } })
        result.position.value = { x: 0, y: 0 }
        result.initPosition()
        expect(result.position.value).toEqual({ x: 10, y: 20 })
    })

    it('initSize reads bounding rect from contentRef', () => {
        const { result } = createWrapper()
        // contentRef is set by the wrapper component's ref
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

    it('initSize does not update size when rect has zero dimensions', () => {
        const { result } = createWrapper()
        result.contentRef.value = {
            getBoundingClientRect: () => mockDOMRect({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
        } as unknown as HTMLElement
        result.initSize()
        expect(result.size.value).toEqual({ width: 0, height: 0 })
    })

    it('initSize cancels pending rAF when called again before previous fires', () => {
        // 重置同步 rAF mock，改用延迟版本以便观察取消行为
        rafSpy.mockRestore()
        const callbacks: FrameRequestCallback[] = []
        rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            callbacks.push(cb)
            return callbacks.length
        })
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

        const { result } = createWrapper()
        result.contentRef.value = {
            getBoundingClientRect: () => mockDOMRect({ width: 400, height: 300, top: 0, left: 0, right: 400, bottom: 300 }),
        } as unknown as HTMLElement

        // createWrapper 的 onMounted 已调度第一个 rAF（id=1）
        const initialCount = callbacks.length
        expect(initialCount).toBeGreaterThanOrEqual(1)

        // 显式调用 initSize：应取消前一个 rAF，调度新的 rAF
        result.initSize()
        expect(cancelSpy).toHaveBeenCalled()
        expect(callbacks.length).toBe(initialCount + 1)

        // 再次调用：应再次取消
        const lastId = callbacks.length
        result.initSize()
        expect(cancelSpy).toHaveBeenCalledWith(lastId)
        expect(callbacks.length).toBe(lastId + 1)

        // 触发最后一个回调：size 应反映 contentRef 当前尺寸
        callbacks[callbacks.length - 1](0)
        expect(result.size.value).toEqual({ width: 400, height: 300 })

        cancelSpy.mockRestore()
    })

    // ── Content Style (draggable) ─────────────────────────────────

    it('contentStyle has transform and fixed positioning when draggable=true', () => {
        const { result } = createWrapper({ draggable: true })
        result.position.value = { x: 30, y: 60 }
        const style = result.contentStyle.value
        expect(style.transform).toBe('translate(calc(-50% + 30px), calc(-50% + 60px))')
        expect(style.position).toBe('fixed')
        expect(style.top).toBe('50%')
        expect(style.left).toBe('50%')
        expect(style.margin).toBe('0')
    })

    it('contentStyle has no transform when draggable=false', () => {
        const { result } = createWrapper({ draggable: false })
        const style = result.contentStyle.value
        expect(style.transform).toBeUndefined()
    })

    // ── Content Style (resizable) ─────────────────────────────────

    it('contentStyle includes width/height when resizable with positive size', () => {
        const { result } = createWrapper({ resizable: true })
        result.size.value = { width: 500, height: 400 }
        const style = result.contentStyle.value
        expect(style.width).toBe('500px')
        expect(style.height).toBe('400px')
    })

    it('contentStyle omits width/height when resizable but size is zero', () => {
        const { result } = createWrapper({ resizable: true })
        result.size.value = { width: 0, height: 0 }
        const style = result.contentStyle.value
        expect(style.width).toBeUndefined()
        expect(style.height).toBeUndefined()
    })

    it('contentStyle omits width/height when resizable=false', () => {
        const { result } = createWrapper({ resizable: false })
        result.size.value = { width: 500, height: 400 }
        const style = result.contentStyle.value
        expect(style.width).toBeUndefined()
        expect(style.height).toBeUndefined()
    })

    it('contentStyle combines draggable and resizable styles', () => {
        const { result } = createWrapper({ draggable: true, resizable: true })
        result.position.value = { x: 10, y: 20 }
        result.size.value = { width: 300, height: 200 }
        const style = result.contentStyle.value
        expect(style.transform).toBe('translate(calc(-50% + 10px), calc(-50% + 20px))')
        expect(style.width).toBe('300px')
        expect(style.height).toBe('200px')
    })

    // ── onDragStart ───────────────────────────────────────────────

    it('onDragStart does nothing when draggable is false', () => {
        const { result } = createWrapper({ draggable: false })
        const div = document.createElement('div')
        result.contentRef.value = div
        const e = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        Object.defineProperty(e, 'target', { value: div })
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(false)
    })

    it('onDragStart does nothing for interactive elements', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        const input = document.createElement('input')
        div.appendChild(input)
        result.contentRef.value = div
        const e = new MouseEvent('mousedown', { clientX: 50, clientY: 50 })
        Object.defineProperty(e, 'target', { value: input })
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(false)
    })

    it('onDragStart activates dragging on non-interactive element', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        const addSpy = vi.spyOn(document, 'addEventListener')
        const e = new MouseEvent('mousedown', { clientX: 100, clientY: 200 })
        Object.defineProperty(e, 'target', { value: div })
        vi.spyOn(e, 'preventDefault')
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(true)
        expect(e.preventDefault).toHaveBeenCalled()
        expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
        addSpy.mockRestore()
    })

    it('onDragStart respects string dragHandle selector', () => {
        const { result } = createWrapper({ draggable: true, dragHandle: '.handle' })
        const div = document.createElement('div')
        const handle = document.createElement('div')
        handle.classList.add('handle')
        div.appendChild(handle)
        result.contentRef.value = div

        // Click on div outside the handle - should not start drag
        const eOutside = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(eOutside, 'target', { value: div })
        result.onDragStart(eOutside)
        expect(result.isDragging.value).toBe(false)

        // Click on handle - should start drag
        const eOnHandle = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(eOnHandle, 'target', { value: handle })
        vi.spyOn(eOnHandle, 'preventDefault')
        result.onDragStart(eOnHandle)
        expect(result.isDragging.value).toBe(true)
    })

    it('onDragStart respects HTMLElement dragHandle', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        const handle = document.createElement('div')
        handle.classList.add('custom-handle')
        div.appendChild(handle)
        result.contentRef.value = div

        // Re-create with HTMLElement handle
        const { result: result2 } = createWrapper({
            draggable: true,
            dragHandle: handle,
        })
        result2.contentRef.value = div

        // Click on the handle
        const e = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(e, 'target', { value: handle })
        vi.spyOn(e, 'preventDefault')
        result2.onDragStart(e)
        expect(result2.isDragging.value).toBe(true)
    })

    it('onDragStart does nothing when target is not HTMLElement', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        const textNode = document.createTextNode('text')
        const e = new MouseEvent('mousedown')
        Object.defineProperty(e, 'target', { value: textNode })
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(false)
    })

    // ── onDragMove (via public API) ───────────────────────────────

    it('drag flow updates position', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        // Mock getBoundingClientRect for constrainPosition
        div.getBoundingClientRect = () => mockDOMRect({
            width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100,
        })

        // Start drag
        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)
        expect(result.isDragging.value).toBe(true)

        // Move
        const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 130 })
        // onDragMove is registered via addEventListener, so we dispatch on document
        document.dispatchEvent(moveEvent)
        // Position should have been updated: newX = 150 - 100 = 50, newY = 130 - 100 = 30
        // Constrained to viewport
        expect(result.position.value.x).toBe(50)
        expect(result.position.value.y).toBe(30)
    })

    it('onDragMove does nothing when not dragging', () => {
        const { result } = createWrapper({ draggable: true })
        // Dispatch move without starting drag
        const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200 })
        document.dispatchEvent(moveEvent)
        // Position should remain unchanged
        expect(result.position.value).toEqual({ x: 0, y: 0 })
    })

    // ── onDragEnd ─────────────────────────────────────────────────

    it('onDragEnd resets isDragging and removes listeners', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        const removeSpy = vi.spyOn(document, 'removeEventListener')

        // Start then end
        const startEvent = new MouseEvent('mousedown', { clientX: 50, clientY: 50 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)

        document.dispatchEvent(new MouseEvent('mouseup'))
        expect(result.isDragging.value).toBe(false)
        expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
        removeSpy.mockRestore()
    })

    // ── constrainPosition branches ────────────────────────────────

    it('constrainPosition clamps to viewport bounds', () => {
        const { result } = createWrapper({ draggable: true, bounds: 'viewport' })
        const div = document.createElement('div')
        div.getBoundingClientRect = () => mockDOMRect({
            width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100,
        })
        result.contentRef.value = div

        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
        Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })

        // Drag to extreme position
        const startEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)

        // Move far right
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 9000, clientY: 0 }))
        // Should be clamped: x = min(9000, 800 - 100) = 700, y = max(-50, 0 - 50) = -50
        expect(result.position.value.x).toBeLessThanOrEqual(800 - 100)
        expect(result.position.value.y).toBeGreaterThanOrEqual(-50)
    })

    it('constrainPosition clamps to parent bounds', () => {
        const { result } = createWrapper({ draggable: true, bounds: 'parent' })
        const parent = document.createElement('div')
        const div = document.createElement('div')
        parent.appendChild(div)
        result.contentRef.value = div

        parent.getBoundingClientRect = () => mockDOMRect({
            width: 500, height: 400, top: 0, left: 0, right: 500, bottom: 400,
        })
        div.getBoundingClientRect = () => mockDOMRect({
            width: 200, height: 100, top: 50, left: 50, right: 250, bottom: 150,
        })

        const startEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 500 }))
        // Position should be constrained within parent
        expect(result.position.value.x).toBeLessThanOrEqual(500 - 100)
    })

    it('constrainPosition clamps to custom bounds object', () => {
        const customBounds = { top: 10, left: 10, right: 400, bottom: 300 }
        const { result } = createWrapper({ draggable: true, bounds: customBounds })
        const div = document.createElement('div')
        div.getBoundingClientRect = () => mockDOMRect({
            width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100,
        })
        result.contentRef.value = div

        const startEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000, clientY: 5000 }))
        expect(result.position.value.x).toBeLessThanOrEqual(400 - 100)
        expect(result.position.value.y).toBeLessThanOrEqual(300 - 50)
    })

    it('constrainPosition returns raw position when no contentRef rect', () => {
        const { result } = createWrapper({ draggable: true, bounds: 'viewport' })
        result.contentRef.value = null

        const startEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
        // target must be HTMLElement for the drag to start, but getDragHandle returns contentRef which is null
        // so handle check will fail and drag won't start. We test the fallback indirectly via the
        // contentRef=null guard in getDragHandle.
        const div = document.createElement('div')
        Object.defineProperty(startEvent, 'target', { value: div })
        // getDragHandle returns null since draggable is true but contentRef is null
        // So handle is null, and `handle && !handle.contains(target)` is false, so drag proceeds
        // But constrainPosition won't have rect
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)
        // Drag starts, then move
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
        // Without rect, position should be raw: 100 - 0 = 100
        expect(result.position.value).toEqual({ x: 100, y: 100 })
    })

    // ── onResizeStart ─────────────────────────────────────────────

    it('onResizeStart does nothing when resizable is false', () => {
        const { result } = createWrapper({ resizable: false })
        const e = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        result.onResizeStart(e, 'se')
        expect(result.isResizing.value).toBe(false)
    })

    it('onResizeStart activates resizing on se corner', () => {
        const { result } = createWrapper({ resizable: true })
        result.size.value = { width: 300, height: 200 }
        const addSpy = vi.spyOn(document, 'addEventListener')
        const e = new MouseEvent('mousedown', { clientX: 50, clientY: 50 })
        vi.spyOn(e, 'preventDefault')
        vi.spyOn(e, 'stopPropagation')
        result.onResizeStart(e, 'se')
        expect(result.isResizing.value).toBe(true)
        expect(e.preventDefault).toHaveBeenCalled()
        expect(e.stopPropagation).toHaveBeenCalled()
        expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
        addSpy.mockRestore()
    })

    // ── onResizeMove (via public API) ─────────────────────────────

    it('resize flow with se corner increases width/height', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 100, minHeight: 50 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'se')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 130 }))
        // se: width = 300 + 50 = 350, height = 200 + 30 = 230
        expect(result.size.value.width).toBe(350)
        expect(result.size.value.height).toBe(230)
    })

    it('resize flow with sw corner decreases width, increases height', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 100, minHeight: 50 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'sw')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 130 }))
        // sw: width = 300 - 50 = 250, height = 200 + 30 = 230
        expect(result.size.value.width).toBe(250)
        expect(result.size.value.height).toBe(230)
    })

    it('resize flow with ne corner increases width, decreases height', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 100, minHeight: 50 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'ne')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 130 }))
        // ne: width = 300 + 50 = 350, height = 200 - 30 = 170
        expect(result.size.value.width).toBe(350)
        expect(result.size.value.height).toBe(170)
    })

    it('resize flow with nw corner decreases width/height', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 100, minHeight: 50 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'nw')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 130 }))
        // nw: width = 300 - 50 = 250, height = 200 - 30 = 170
        expect(result.size.value.width).toBe(250)
        expect(result.size.value.height).toBe(170)
    })

    it('resize enforces minWidth and minHeight', () => {
        const { result } = createWrapper({ resizable: true, minWidth: 200, minHeight: 100 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'nw')

        // Drag significantly to shrink
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 500 }))
        // nw: width = 300 - 400 = -100, clamped to 200; height = 200 - 400 = -200, clamped to 100
        expect(result.size.value.width).toBeGreaterThanOrEqual(200)
        expect(result.size.value.height).toBeGreaterThanOrEqual(100)
    })

    it('resize enforces maxWidth and maxHeight', () => {
        const { result } = createWrapper({ resizable: true, maxWidth: 400, maxHeight: 300 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'se')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))
        // se: width = 300 + 200 = 500, clamped to 400; height = 200 + 200 = 400, clamped to 300
        expect(result.size.value.width).toBeLessThanOrEqual(400)
        expect(result.size.value.height).toBeLessThanOrEqual(300)
    })

    it('resize applies aspectRatio', () => {
        const { result } = createWrapper({ resizable: true, aspectRatio: 2 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'se')

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
        // se: width = 300 + 100 = 400, height = 400 / 2 = 200
        expect(result.size.value.width).toBe(400)
        expect(result.size.value.height).toBe(200)
    })

    it('resize with aspectRatio clamps height to minHeight', () => {
        const { result } = createWrapper({ resizable: true, aspectRatio: 10, minHeight: 50 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'nw')

        // Shrink width a lot: width = 300 - 280 = 20, clamped to minWidth(150 default)
        // height = 150 / 10 = 15, clamped to minHeight 50
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 380, clientY: 380 }))
        expect(result.size.value.height).toBeGreaterThanOrEqual(50)
    })

    it('resize with aspectRatio clamps height to maxHeight', () => {
        const { result } = createWrapper({ resizable: true, aspectRatio: 1, maxHeight: 250 })
        result.size.value = { width: 300, height: 200 }

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'se')

        // Increase a lot: width = 300 + 200 = 500, height = 500 / 1 = 500, clamped to 250
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))
        expect(result.size.value.height).toBeLessThanOrEqual(250)
    })

    it('onResizeMove does nothing when not resizing', () => {
        const { result } = createWrapper({ resizable: true })
        result.size.value = { width: 300, height: 200 }
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
        expect(result.size.value).toEqual({ width: 300, height: 200 })
    })

    // ── onResizeEnd ───────────────────────────────────────────────

    it('onResizeEnd resets isResizing and removes listeners', () => {
        const { result } = createWrapper({ resizable: true })
        const removeSpy = vi.spyOn(document, 'removeEventListener')

        const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
        vi.spyOn(startEvent, 'preventDefault')
        vi.spyOn(startEvent, 'stopPropagation')
        result.onResizeStart(startEvent, 'se')

        document.dispatchEvent(new MouseEvent('mouseup'))
        expect(result.isResizing.value).toBe(false)
        expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
        expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
        removeSpy.mockRestore()
    })

    // ── handleClose ───────────────────────────────────────────────

    it('handleClose calls onClose and onUpdateOpen when no beforeClose', async () => {
        const onClose = vi.fn()
        const onUpdateOpen = vi.fn()
        const { result } = createWrapper({ onClose, onUpdateOpen })
        await result.handleClose()
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onUpdateOpen).toHaveBeenCalledWith(false)
    })

    it('handleClose with promise-mode beforeClose that returns true', async () => {
        const onClose = vi.fn()
        const onUpdateOpen = vi.fn()
        const beforeClose = vi.fn(async () => true)
        const { result } = createWrapper({ beforeClose, onClose, onUpdateOpen })
        await result.handleClose()
        expect(beforeClose).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onUpdateOpen).toHaveBeenCalledWith(false)
    })

    it('handleClose with promise-mode beforeClose that returns false', async () => {
        const onClose = vi.fn()
        const onUpdateOpen = vi.fn()
        const beforeClose = vi.fn(async () => false)
        const { result } = createWrapper({ beforeClose, onClose, onUpdateOpen })
        await result.handleClose()
        expect(beforeClose).toHaveBeenCalledTimes(1)
        expect(onClose).not.toHaveBeenCalled()
        expect(onUpdateOpen).not.toHaveBeenCalled()
    })

    it('handleClose with promise-mode beforeClose that returns undefined (treated as truthy)', async () => {
        const onClose = vi.fn()
        const onUpdateOpen = vi.fn()
        const beforeClose = vi.fn(async () => undefined as unknown as boolean)
        const { result } = createWrapper({ beforeClose, onClose, onUpdateOpen })
        await result.handleClose()
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onUpdateOpen).toHaveBeenCalledWith(false)
    })

    it('handleClose guards against concurrent invocation during async beforeClose', async () => {
        // 场景：用户双击关闭按钮，handleClose 被并发调用两次。
        // 修复后：第二次调用应在 isClosing 检查处直接返回，beforeClose 仅执行一次。
        const onClose = vi.fn()
        const onUpdateOpen = vi.fn()
        let resolveBeforeClose!: (val: boolean) => void
        const beforeClose = vi.fn(() => new Promise<boolean>((resolve) => {
            resolveBeforeClose = resolve
        }))
        const { result } = createWrapper({ beforeClose, onClose, onUpdateOpen })

        // 第一次调用：进入 isClosing=true，await beforeClose（pending）
        const promise1 = result.handleClose()
        // 让微任务执行，确保 promise1 已执行到 await
        await Promise.resolve()

        // 第二次调用：isClosing=true，应直接 return，不触发 beforeClose
        const promise2 = result.handleClose()
        await Promise.resolve()

        // beforeClose 仅被第一个调用触发
        expect(beforeClose).toHaveBeenCalledTimes(1)

        // 解析 beforeClose promise，让第一个调用完成
        resolveBeforeClose(true)
        await promise1
        await promise2

        // performClose 仅执行一次
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(onUpdateOpen).toHaveBeenCalledTimes(1)

        // 守卫释放后，后续 handleClose 可正常调用
        // 注意：beforeClose 每次调用都会创建新的 Promise，需再次 resolve 才能完成
        const promise3 = result.handleClose()
        await Promise.resolve()
        resolveBeforeClose(true)
        await promise3
        expect(beforeClose).toHaveBeenCalledTimes(2)
        expect(onClose).toHaveBeenCalledTimes(2)
    })

    // ── Lifecycle ─────────────────────────────────────────────────

    it('calls onOpen on mount', () => {
        const onOpen = vi.fn()
        createWrapper({ onOpen })
        expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('cleans up event listeners on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener')
        const { wrapper } = createWrapper({ draggable: true, resizable: true })
        wrapper.unmount()
        // Should remove drag and resize listeners
        expect(removeSpy).toHaveBeenCalled()
        removeSpy.mockRestore()
    })

    // ── getDragHandle branches ────────────────────────────────────

    it('getDragHandle returns null when draggable is false', () => {
        const { result } = createWrapper({ draggable: false })
        const div = document.createElement('div')
        result.contentRef.value = div
        // onDragStart returns early when draggable is false
        const e = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(e, 'target', { value: div })
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(false)
    })

    it('getDragHandle returns contentRef when no dragHandle specified', () => {
        const { result } = createWrapper({ draggable: true })
        const div = document.createElement('div')
        result.contentRef.value = div
        // Should allow drag on contentRef itself
        const e = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(e, 'target', { value: div })
        vi.spyOn(e, 'preventDefault')
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(true)
    })

    it('getDragHandle returns null for string selector with no match', () => {
        const { result } = createWrapper({ draggable: true, dragHandle: '.no-match' })
        const div = document.createElement('div')
        result.contentRef.value = div
        // getDragHandle returns null, so `handle && !handle.contains(target)` is false
        // Drag proceeds (handle is null, so no containment check)
        const e = new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
        Object.defineProperty(e, 'target', { value: div })
        vi.spyOn(e, 'preventDefault')
        result.onDragStart(e)
        expect(result.isDragging.value).toBe(true)
    })

    it('constrainPosition falls through when bounds=parent and no parentElement', () => {
        const { result } = createWrapper({ draggable: true, bounds: 'parent' })
        const div = document.createElement('div')
        // No parent element - contentRef.value.parentElement is null
        result.contentRef.value = div
        div.getBoundingClientRect = () => mockDOMRect({
            width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100,
        })

        const startEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
        Object.defineProperty(startEvent, 'target', { value: div })
        vi.spyOn(startEvent, 'preventDefault')
        result.onDragStart(startEvent)

        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 250 }))
        // Falls through to raw position: 300 - 0 = 300, 250 - 0 = 250
        expect(result.position.value).toEqual({ x: 300, y: 250 })
    })

    // ── Default options ───────────────────────────────────────────

    it('works with default empty options', () => {
        const { result } = createWrapper()
        expect(result.isDragging.value).toBe(false)
        expect(result.isResizing.value).toBe(false)
        expect(result.position.value).toEqual({ x: 0, y: 0 })
        expect(result.size.value).toEqual({ width: 0, height: 0 })
    })

    it('works without any options argument', () => {
        const result = useDialogEnhanced()
        expect(result.isDragging).toBeDefined()
        expect(result.isResizing).toBeDefined()
    })
})
