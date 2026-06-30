<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from '@lucide/vue'
import { cn } from '@/lib/utils'

interface UploadTriggerProps {
    /** 是否支持拖拽 */
    drag?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 接受的文件类型 */
    accept?: string
    /** 是否支持多选 */
    multiple?: boolean
    class?: string
}

const props = withDefaults(defineProps<UploadTriggerProps>(), {
    drag: true,
    disabled: false,
    accept: undefined,
    multiple: true,
    class: undefined,
})

const emit = defineEmits<{
    select: [files: FileList]
}>()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发文件选择
function triggerFileInput() {
    if (props.disabled) return
    fileInputRef.value?.click()
}

// 处理文件选择
function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        emit('select', target.files)
        target.value = '' // 重置 input
    }
}

// 拖拽处理
function handleDragEnter(event: DragEvent) {
    event.preventDefault()
    if (props.disabled) return
    isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
}

function handleDragOver(event: DragEvent) {
    event.preventDefault()
}

function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false

    if (props.disabled) return

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
        emit('select', files)
    }
}
</script>

<template>
    <div
        :class="cn(
            'relative cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50',
            props.class,
        )"
        @click="triggerFileInput"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
    >
        <!-- 隐藏的文件输入 -->
        <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            :accept="accept"
            :multiple="multiple"
            :disabled="disabled"
            @change="handleFileChange"
        >

        <!-- 默认触发区域 -->
        <slot :is-dragging="isDragging">
            <div
                :class="cn(
                    'flex flex-col items-center justify-center gap-2 p-8',
                    'border-3 border-dashed rounded-brutal',
                    'transition-colors duration-200',
                    isDragging
                        ? 'border-brutal-primary bg-brutal-primary/10'
                        : 'border-brutal hover:border-brutal-primary',
                )"
            >
                <Upload
                    :class="cn(
                        'h-10 w-10',
                        isDragging ? 'text-brutal-primary' : 'text-brutal-placeholder',
                    )"
                />
                <div class="text-center">
                    <p class="font-medium text-brutal-fg">
                        <slot name="text">
                            点击或拖拽文件到此区域上传
                        </slot>
                    </p>
                    <p class="mt-1 text-sm text-brutal-placeholder">
                        <slot name="hint" />
                    </p>
                </div>
            </div>
        </slot>
    </div>
</template>
