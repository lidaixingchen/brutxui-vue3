import { showDialog, type ShowDialogOptions } from '@/components/dialog/functional'

export type { ShowDialogOptions }

export interface UseDialogReturn {
    show: (options?: ShowDialogOptions) => { close: () => void; promise: Promise<void> }
}

export function useDialog(): UseDialogReturn {
    return {
        show: (options?: ShowDialogOptions) => showDialog(options),
    }
}
