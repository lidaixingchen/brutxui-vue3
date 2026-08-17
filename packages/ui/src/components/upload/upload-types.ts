export interface UploadFile {
    /** 文件唯一标识符 */
    id: string
    /** 文件名 */
    name: string
    /** 文件大小（字节） */
    size: number
    /** 文件 MIME 类型 */
    type: string
    /** 上传状态 */
    status: 'ready' | 'uploading' | 'success' | 'error' | 'canceled'
    /** 上传进度，取值范围 0-100 */
    progress: number
    /** 文件远程访问 URL 或自定义预览地址 */
    url?: string
    /** 原始 File 对象，用于上传请求、重试及本地预览生成 */
    raw?: File
    /** 错误信息 */
    error?: UploadError
    /** 当前已重试次数 */
    retryCount?: number
    /** 上传中止控制器 */
    abortController?: AbortController
}

export interface UploadError {
    /** 错误消息 */
    message: string
    /** 错误代码 */
    code?: string
    /** HTTP 状态码 */
    status?: number
}

export interface UploadRequestOptions {
    /** 待上传的文件 */
    file: File
    /** 中止信号 */
    signal: AbortSignal
    /** 进度回调函数，percent 取值范围 0-100 */
    onProgress: (percent: number) => void
    /** 成功回调函数 */
    onSuccess: (response: unknown) => void
    /** 失败回调函数 */
    onError: (error: UploadError) => void
}

