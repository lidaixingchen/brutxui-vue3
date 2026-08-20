import { describe, it, expect } from 'vitest'
import { useDialogEnhanced, isInteractiveElement } from './useDialogEnhanced'
import { useDialogGeometry, isInteractiveElement as isInteractiveGeometry } from './useDialogGeometry'

describe('useDialogEnhanced 向后兼容导出', () => {
    it('useDialogEnhanced 引用等于 useDialogGeometry', () => {
        expect(useDialogEnhanced).toBe(useDialogGeometry)
    })

    it('isInteractiveElement 引用等于 useDialogGeometry 的 isInteractiveElement', () => {
        expect(isInteractiveElement).toBe(isInteractiveGeometry)
    })

    it('调用 useDialogEnhanced 返回与 useDialogGeometry 一致的几何控制接口', () => {
        const result = useDialogEnhanced()
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
})
