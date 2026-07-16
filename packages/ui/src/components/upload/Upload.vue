<script setup lang="ts">
import { ref, watch } from 'vue'
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

// 内部文件列表
const internalFileList = ref<UploadFile[]>([...props.fileList])

// 生成唯一 ID
let fileIdCounter = 0
function generateId(): string {
    return `file-${Date.now()}-${++fileIdCounter}`
}

// 同步外部 fileList（引用变化时同步，避免 deep 监听在进度更新时频繁触发）
watch(() => props.fileList, (newList) => {
    internalFileList.value = [...newList]
})

const { validateFileSize, matchesAccept } = useUpload({
    maxSize: () => props.maxSize,
    accept: () => props.accept,
})

// 检查文件数量
function validateFileCount(count: number): boolean {
    if (props.limit === undefined) return true
    return internalFileList.value.length + count <= props.limit
}

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
async function doUpload(file: UploadFile): Promise<void> {
    if (!props.httpRequest) return

    file.status = 'uploading'
    file.progress = 0

    const abortController = new AbortController()
    file.abortController = abortController

    // 防止 onError 回调与 catch 同时处理导致 file-error 重复触发
    let settled = false
    // 文件被移除后中止上传，回调中跳过已取消的文件，避免触发 file-success/file-error
    const isCancelled = () => abortController.signal.aborted

    try {
        await props.httpRequest({
            file: file.raw!,
            signal: abortController.signal,
            onProgress: (percent) => {
                if (isCancelled()) return
                file.progress = percent
            },
            onSuccess: () => {
                if (settled || isCancelled()) return
                settled = true
                file.status = 'success'
                file.progress = 100
                emit('file-success', file)
            },
            onError: (error) => {
                if (settled || isCancelled()) return
                settled = true
                file.status = 'error'
                file.error = error
                emit('file-error', file, error)
                props.onError?.(error, file)
            },
        })
    } catch (error) {
        if (settled || isCancelled()) return
        settled = true
        const uploadError: UploadError = {
            message: error instanceof Error ? error.message : 'Upload failed',
        }
        file.status = 'error'
        file.error = uploadError
        emit('file-error', file, uploadError)
        props.onError?.(uploadError, file)
    }
}

// 重试上传
async function retryUpload(file: UploadFile): Promise<void> {
    if (props.maxRetries !== undefined && (file.retryCount ?? 0) >= props.maxRetries) {
        return
    }
    if (file.status === 'uploading') {
        file.abortController?.abort()
    }
    file.retryCount = (file.retryCount ?? 0) + 1
    file.error = undefined
    await doUpload(file)
}

// 处理文件选择
async function handleFileSelect(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files)

    // 验证文件数量
    if (!validateFileCount(fileArray.length)) {
        const error: UploadError = {
            message: `最多只能上传 ${props.limit} 个文件`,
        }
        props.onError?.(error, {
            id: '',
            name: '',
            size: 0,
            type: '',
            status: 'error',
            progress: 0,
            error,
        })
        return
    }

    const pendingUploads: UploadFile[] = []

    for (const file of fileArray) {
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

        // 执行 beforeUpload 钩子
        if (props.beforeUpload) {
            const result = await props.beforeUpload(file)
            if (result === false) continue
        }

        const uploadFile = createUploadFile(file)
        internalFileList.value.push(uploadFile)
        emit('update:fileList', [...internalFileList.value])
        emit('file-change', uploadFile)
        pendingUploads.push(uploadFile)
    }

    // 统一启动上传，不阻塞列表渲染
    if (props.autoUpload) {
        for (const uploadFile of pendingUploads) {
            await doUpload(uploadFile)
        }
    }
}

// 删除文件
async function handleFileRemove(file: UploadFile): Promise<void> {
    if (props.beforeRemove) {
        const result = await props.beforeRemove(file)
        if (result === false) return
    }

    // 中止进行中的上传，避免移除后仍触发 file-success/file-error
    file.abortController?.abort()

    const index = internalFileList.value.findIndex(f => f.id === file.id)
    if (index > -1) {
        internalFileList.value.splice(index, 1)
        emit('update:fileList', [...internalFileList.value])
        emit('file-remove', file)
    }
}

// 暴露方法
defineExpose({
    handleFileSelect,
    handleFileRemove,
    retryUpload,
})
</script>

<template>
    <div :class="cn('w-full', props.class)">
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
