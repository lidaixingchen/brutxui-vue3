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
    select: [files: File[], source: 'browse' | 'drop']
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
    // target.files 是随 input 实时变化的 FileList，重置前先拷贝成数组；
    // 否则消费方持有该引用稍后读取时，拿到的是被清空的空列表
    const files = Array.from(target.files ?? [])
    if (files.length > 0) {
        emit('select', files, 'browse')
        target.value = '' // 重置 input
    }
}

// 拖拽处理
function handleDragEnter(event: DragEvent) {
    // drag=false 或 disabled 时不再绑定拖拽行为
    if (!props.drag || props.disabled) return
    event.preventDefault()
    isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
    if (!props.drag || props.disabled) {
        // drag 在拖拽过程中变 false 时，需复位高亮态，避免残留
        isDragging.value = false
        return
    }
    event.preventDefault()
    const el = event.currentTarget
    if (el instanceof HTMLElement) {
        const related = event.relatedTarget
        if (related instanceof Node && el.contains(related)) return
    }
    isDragging.value = false
}

function handleDragOver(event: DragEvent) {
    if (!props.drag || props.disabled) return
    event.preventDefault()
}

function handleDrop(event: DragEvent) {
    if (!props.drag || props.disabled) {
        // drag 在拖拽过程中变 false 时，需复位高亮态，避免残留
        isDragging.value = false
        return
    }
    event.preventDefault()
    isDragging.value = false

    // dataTransfer.files 同样是实时 FileList，拷贝成数组后再 emit
    let files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length > 0) {
        if (!props.multiple && files.length > 1) {
            files = files.slice(0, 1)
        }
        emit('select', files, 'drop')
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
        role="button"
        :tabindex="disabled ? -1 : 0"
        :aria-disabled="disabled"
        @click="triggerFileInput"
        @keydown.enter="triggerFileInput"
        @keydown.space.prevent="triggerFileInput"
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
            @click.stop
            @change="handleFileChange"
        >

        <!-- 默认触发区域 -->
        <slot :is-dragging="isDragging" :trigger-file-input="triggerFileInput">
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
