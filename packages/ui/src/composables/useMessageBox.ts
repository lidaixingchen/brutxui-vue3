import { showMessageBox, type MessageBoxOptions } from '@/components/dialog/functional'

export type { MessageBoxOptions }

export interface UseMessageBoxReturn {
    show: (options?: MessageBoxOptions) => { close: () => void; promise: Promise<{ value: string } | undefined> }
}

export function useMessageBox(): UseMessageBoxReturn {
    return {
        show: (options?: MessageBoxOptions) => showMessageBox(options),
    }
}
