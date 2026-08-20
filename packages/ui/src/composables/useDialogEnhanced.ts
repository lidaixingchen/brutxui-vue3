import {
    useDialogGeometry,
    isInteractiveElement,
    type UseDialogGeometryOptions,
    type UseDialogGeometryReturn,
    type DraggableDialogOptions,
    type ResizableDialogOptions,
    type ResizeCorner,
} from './useDialogGeometry'

export type {
    UseDialogGeometryOptions as UseDialogEnhancedOptions,
    UseDialogGeometryReturn as UseDialogEnhancedReturn,
    DraggableDialogOptions,
    ResizableDialogOptions,
    ResizeCorner,
}

export { isInteractiveElement }

/**
 * @deprecated 请使用 {@link useDialogGeometry}。
 * 空间几何状态与业务关闭控制流已彻底解耦。
 */
export const useDialogEnhanced = useDialogGeometry
