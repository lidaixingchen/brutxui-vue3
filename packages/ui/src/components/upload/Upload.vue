<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { cn } from '@/lib/utils'
import type { UploadFile, UploadError, UploadRequestOptions } from './index'

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

// 同步外部 fileList
watch(() => props.fileList, (newList) => {
    internalFileList.value = [...newList]
}, { deep: true })

// 检查文件大小
function validateFileSize(file: File): boolean {
    if (props.maxSize === undefined) return true
    return file.size <= props.maxSize
}

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
async function uploadFile(uploadFile: UploadFile): Promise<void> {
    if (!props.httpRequest) return

    uploadFile.status = 'uploading'
    uploadFile.progress = 0

    try {
        await props.httpRequest({
            file: uploadFile.raw!,
            onProgress: (percent) => {
                uploadFile.progress = percent
            },
            onSuccess: (response) => {
                uploadFile.status = 'success'
                uploadFile.progress = 100
                emit('file-success', uploadFile)
            },
            onError: (error) => {
                uploadFile.status = 'error'
                uploadFile.error = error
                emit('file-error', uploadFile, error)
                props.onError?.(error, uploadFile)
            },
        })
    } catch (error) {
        const uploadError: UploadError = {
            message: error instanceof Error ? error.message : 'Upload failed',
        }
        uploadFile.status = 'error'
        uploadFile.error = uploadError
        emit('file-error', uploadFile, uploadError)
        props.onError?.(uploadError, uploadFile)
    }
}

// 重试上传
async function retryUpload(uploadFile: UploadFile): Promise<void> {
    uploadFile.error = undefined
    await uploadFile(uploadFile)
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

        // 执行 beforeUpload 钩子
        if (props.beforeUpload) {
            const result = await props.beforeUpload(file)
            if (result === false) continue
        }

        const uploadFile = createUploadFile(file)
        internalFileList.value.push(uploadFile)
        emit('update:fileList', [...internalFileList.value])
        emit('file-change', uploadFile)

        // 自动上传
        if (props.autoUpload) {
            await uploadFile(uploadFile)
        }
    }
}

// 删除文件
async function handleFileRemove(file: UploadFile): Promise<void> {
    if (props.beforeRemove) {
        const result = await props.beforeRemove(file)
        if (result === false) return
    }

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
