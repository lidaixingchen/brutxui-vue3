<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useUpload } from '@/composables/useUpload'
import type { UploadFile, UploadError, UploadRequestOptions } from './upload-types'

interface UploadProps {
    /** 文件列表 v-model */
    fileList?: UploadFile[]
    /** 最大文件数量 */
    limit?: number
    /** 是否支持多选 */
    multiple?: boolean
    /** 接受的文件类型 */
    accept?: string
    /** 最大文件大小（字节） */
    maxSize?: number
    /** 最大重试次数 */
    maxRetries?: number
    /** 上传前钩子 */
    beforeUpload?: (file: File) => boolean | Promise<boolean>
    /** 删除前钩子 */
    beforeRemove?: (file: UploadFile) => boolean | Promise<boolean>
    /** 自定义上传实现 */
    httpRequest?: (options: UploadRequestOptions) => Promise<void>
    /** 列表类型 */
    listType?: 'text' | 'picture' | 'picture-card'
    /** 选择后自动上传 */
    autoUpload?: boolean
    /** 是否支持拖拽 */
    drag?: boolean
    /** 错误回调 */
    onError?: (error: UploadError, file: UploadFile) => void
    class?: string
}

const props = withDefaults(defineProps<UploadProps>(), {
    fileList: () => [],
    limit: undefined,
    multiple: true,
    accept: undefined,
    maxSize: undefined,
    maxRetries: 3,
    beforeUpload: undefined,
    beforeRemove: undefined,
    httpRequest: undefined,
    listType: 'text',
    autoUpload: true,
    drag: true,
    onError: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:fileList': [files: UploadFile[]]
    'file-change': [file: UploadFile]
    'file-remove': [file: UploadFile]
    'file-success': [file: UploadFile]
    'file-error': [file: UploadFile, error: UploadError]
}>()

let isUnmounted: boolean = false

// 内部文件列表
const internalFileList = ref<UploadFile[]>([...props.fileList])

interface UploadAttempt {
    readonly file: UploadFile
    request?: {
        readonly controller: AbortController
        readonly onAbort: () => void
    }
}

type UploadResult =
    | { status: 'success' | 'canceled' }
    | { status: 'error', error: UploadError }

const uploadAttempts = new Map<string, UploadAttempt>()

function isCurrentAttempt(attempt: UploadAttempt): boolean {
    return uploadAttempts.get(attempt.file.id) === attempt
}

function releaseUpload(attempt: UploadAttempt): boolean {
    const { file, request } = attempt
    if (!isCurrentAttempt(attempt)) return false

    uploadAttempts.delete(file.id)
    if (request) {
        request.controller.signal.removeEventListener('abort', request.onAbort)
        file.abortController = undefined
    }
    return true
}

function reportUploadError(file: UploadFile, error: UploadError): void {
    file.status = 'error'
    file.error = error
    emit('file-error', file, error)
    props.onError?.(error, file)
}

function finishUpload(attempt: UploadAttempt, result: UploadResult): boolean {
    if (!releaseUpload(attempt)) return false

    const { file } = attempt
    if (result.status === 'error') {
        reportUploadError(file, result.error)
    } else {
        file.status = result.status
        if (result.status === 'success') {
            file.progress = 100
            emit('file-success', file)
        }
    }
    return true
}

function cancelUpload(file: UploadFile): void {
    const attempt = uploadAttempts.get(file.id)
    if (attempt) {
        if (finishUpload(attempt, { status: 'canceled' })) {
            attempt.request?.controller.abort()
        }
    } else if (file.status === 'uploading') {
        const controller = file.abortController
        file.abortController = undefined
        file.status = 'canceled'
        controller?.abort()
    }
}

// 生成唯一 ID
let fileIdCounter = 0
function generateId(): string {
    return `file-${Date.now()}-${++fileIdCounter}-${Math.random().toString(36).slice(2, 9)}`
}

// 同步外部 fileList，按 id 保留已有对象引用，避免覆盖进行中的上传状态
watch(() => props.fileList?.slice() ?? [], (newList): void => {
    const previousList = internalFileList.value
    const nextFileIds = new Set(newList.map(file => file.id))
    const currentMap = new Map(previousList.map(file => [file.id, file]))
    internalFileList.value = newList.map((newFile) => {
        const existing = currentMap.get(newFile.id)
        if (existing) {
            return Object.assign(existing, newFile, {
                status: existing.status === 'uploading' ? existing.status : newFile.status,
                progress: existing.status === 'uploading' ? existing.progress : (newFile.progress ?? existing.progress),
                abortController: existing.abortController,
                raw: existing.raw ?? newFile.raw,
            })
        }
        return newFile
    })
    for (const file of previousList) {
        if (!nextFileIds.has(file.id)) cancelUpload(file)
    }
})

const { validateFileSize, matchesAccept } = useUpload({
    maxSize: () => props.maxSize,
    accept: () => props.accept,
})


// 创建 UploadFile 对象
function createUploadFile(file: File): UploadFile {
    return {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready',
        progress: 0,
        raw: file,
    }
}

// 上传文件
async function startUpload(attempt: UploadAttempt): Promise<void> {
    const { file } = attempt
    const httpRequest = props.httpRequest
    const raw = file.raw
    if (!isCurrentAttempt(attempt)) return
    if (!httpRequest || !raw) {
        releaseUpload(attempt)
        return
    }

    const controller = new AbortController()
    const onAbort = (): void => {
        finishUpload(attempt, { status: 'canceled' })
    }
    attempt.request = { controller, onAbort }
    controller.signal.addEventListener('abort', onAbort)

    // 同步监听器可能在文件字段变更时移除文件或启动新的上传。
    file.progress = 0
    if (!isCurrentAttempt(attempt)) return
    file.abortController = controller
    if (!isCurrentAttempt(attempt)) return
    file.status = 'uploading'
    if (!isCurrentAttempt(attempt)) return

    try {
        await httpRequest({
            file: raw,
            signal: controller.signal,
            onProgress: (percent: number) => {
                if (isCurrentAttempt(attempt)) file.progress = percent
            },
            onSuccess: () => {
                finishUpload(attempt, { status: 'success' })
            },
            onError: (error: UploadError) => {
                finishUpload(attempt, { status: 'error', error })
            },
        })
    } catch (error) {
        finishUpload(attempt, {
            status: 'error',
            error: { message: error instanceof Error ? error.message : 'Upload failed' },
        })
    }
}

// 重试上传
async function retryUpload(uploadFile: UploadFile): Promise<void> {
    const listedFile = internalFileList.value.find(file => file.id === uploadFile.id)
    const file = listedFile ?? uploadAttempts.get(uploadFile.id)?.file ?? uploadFile
    if (isUnmounted || file.status === 'success') return

    const previousAttempt = uploadAttempts.get(file.id)
    if (previousAttempt && !previousAttempt.request) {
        releaseUpload(previousAttempt)
    } else {
        cancelUpload(file)
    }
    if (isUnmounted || uploadAttempts.has(file.id)
        || (listedFile && !internalFileList.value.includes(listedFile))) return

    if (props.maxRetries !== undefined && (file.retryCount ?? 0) >= props.maxRetries) {
        reportUploadError(file, {
            message: `已达到最大重试次数 (${props.maxRetries})`,
        })
        return
    }
    const attempt = { file }
    uploadAttempts.set(file.id, attempt)
    file.retryCount = (file.retryCount ?? 0) + 1
    if (!isCurrentAttempt(attempt)) return
    file.error = undefined
    await startUpload(attempt)
}

// 处理文件选择
async function handleFileSelect(files: FileList | File[]): Promise<void> {
    if (isUnmounted) return
    const fileArray = Array.from(files)
    const pendingUploads: UploadAttempt[] = []

    function reportLimitError(file: File) {
        const error: UploadError = {
            message: `最多只能上传 ${props.limit} 个文件`,
        }
        props.onError?.(error, {
            id: '',
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            progress: 0,
            error,
        })
    }

    try {
        for (const file of fileArray) {
            if (isUnmounted) return

            // 验证文件大小
            if (!validateFileSize(file)) {
                const error: UploadError = {
                    message: `文件 ${file.name} 大小超过限制`,
                }
                props.onError?.(error, {
                    id: '',
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'error',
                    progress: 0,
                    error,
                })
                continue
            }

            if (!matchesAccept(file)) {
                const error: UploadError = {
                    message: `文件 ${file.name} 类型不符合要求`,
                }
                props.onError?.(error, {
                    id: '',
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'error',
                    progress: 0,
                    error,
                })
                continue
            }

            // 预检剩余数量额度（快速失败，避免超限文件触发耗时的 beforeUpload）
            if (props.limit !== undefined && internalFileList.value.length >= props.limit) {
                reportLimitError(file)
                continue
            }

            // 执行 beforeUpload 钩子
            if (props.beforeUpload) {
                const result = await props.beforeUpload(file)
                if (isUnmounted) return
                if (result === false) continue
            }

            // 严格验证剩余数量额度（在 beforeUpload 之后紧邻校验，避免异步挂起期间并发超限）
            if (props.limit !== undefined && internalFileList.value.length >= props.limit) {
                reportLimitError(file)
                continue
            }

            const uploadFile = reactive(createUploadFile(file))
            const attempt = { file: uploadFile }
            uploadAttempts.set(uploadFile.id, attempt)
            pendingUploads.push(attempt)
            internalFileList.value.push(uploadFile)
            emit('update:fileList', [...internalFileList.value])
            if (isUnmounted) return
            if (uploadFile.status === 'ready' && internalFileList.value.includes(uploadFile)) {
                emit('file-change', uploadFile)
            }
            if (isUnmounted) return
        }

        if (pendingUploads.length > 0) {
            // 先同步父组件在文件新增事件中提交的列表，再启动整批上传。
            await nextTick()
            if (props.autoUpload) await Promise.allSettled(pendingUploads.map(startUpload))
        }
    } finally {
        for (const attempt of pendingUploads) {
            if (!attempt.request) releaseUpload(attempt)
        }
    }
}

// 删除文件
async function handleFileRemove(file: UploadFile): Promise<void> {
    if (isUnmounted) return
    const listedFile = internalFileList.value.find(item => item.id === file.id)
    const detachedAttempt = listedFile ? undefined : uploadAttempts.get(file.id)
    if (props.beforeRemove) {
        const result = await props.beforeRemove(file)
        if (isUnmounted) return
        if (result === false) return
    }

    if (!listedFile) {
        if (detachedAttempt && isCurrentAttempt(detachedAttempt)) {
            cancelUpload(detachedAttempt.file)
        }
        return
    }
    const index = internalFileList.value.indexOf(listedFile)
    if (index === -1) return

    internalFileList.value.splice(index, 1)
    cancelUpload(listedFile)
    if (isUnmounted) return
    emit('update:fileList', [...internalFileList.value])
    if (isUnmounted) return
    emit('file-remove', listedFile)
}

// 卸载时中止所有进行中的上传，避免 httpRequest 回调在组件销毁后触发
onBeforeUnmount(() => {
    isUnmounted = true
    for (const { file } of uploadAttempts.values()) {
        cancelUpload(file)
    }
    for (const file of internalFileList.value) {
        cancelUpload(file)
    }
})

const containerClasses = computed(() => cn('w-full', props.class))

// 暴露方法
defineExpose({
    handleFileSelect,
    handleFileRemove,
    retryUpload,
})
</script>

<template>
    <div :class="containerClasses">
        <!-- 触发区域插槽 -->
        <slot
            name="trigger"
            :select-files="handleFileSelect"
            :limit="limit"
            :multiple="multiple"
            :accept="accept"
            :drag="drag"
        />

        <!-- 文件列表插槽 -->
        <slot
            name="file-list"
            :files="internalFileList"
            :list-type="listType"
            :remove="handleFileRemove"
            :retry="retryUpload"
        />

        <!-- 默认插槽 -->
        <slot />
    </div>
</template>
