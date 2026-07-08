export { default as Upload } from './Upload.vue'
export { default as UploadTrigger } from './UploadTrigger.vue'
export { default as UploadFileList } from './UploadFileList.vue'
export { default as UploadFileItem } from './UploadFileItem.vue'

export interface UploadFile {
    id: string
    name: string
    size: number
    type: string
    status: 'ready' | 'uploading' | 'success' | 'error'
    progress: number
    url?: string
    raw?: File
    error?: UploadError
    retryCount?: number
    abortController?: AbortController
}

export interface UploadError {
    message: string
    code?: string
    status?: number
}

export interface UploadRequestOptions {
    file: File
    signal: AbortSignal
    onProgress: (percent: number) => void
    onSuccess: (response: unknown) => void
    onError: (error: UploadError) => void
}
