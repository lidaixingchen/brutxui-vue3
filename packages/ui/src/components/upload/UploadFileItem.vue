<script setup lang="ts">
import { computed } from 'vue'
import {
    FileText,
    File,
    Image,
    Video,
    Music,
    X,
    Check,
    AlertCircle,
    RefreshCw,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { UploadFile } from './index'
import { Progress } from '@/components/progress'
import { Button } from '@/components/button'

interface UploadFileItemProps {
    /** 文件信息 */
    file: UploadFile
    /** 列表类型 */
    listType?: 'text' | 'picture' | 'picture-card'
    class?: string
}

const props = withDefaults(defineProps<UploadFileItemProps>(), {
    listType: 'text',
    class: undefined,
})

const emit = defineEmits<{
    remove: []
    retry: []
}>()

// 根据文件类型获取图标
const fileIcon = computed(() => {
    const type = props.file.type
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
    return File
})

// 格式化文件大小
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 是否显示进度条
const showProgress = computed(() => {
    return props.file.status === 'uploading'
})

// 是否显示图片预览
const showImagePreview = computed(() => {
    return props.listType === 'picture' || props.listType === 'picture-card'
})

// 图片预览 URL
const previewUrl = computed(() => {
    if (props.file.url) return props.file.url
    if (props.file.raw && props.file.type.startsWith('image/')) {
        return URL.createObjectURL(props.file.raw)
    }
    return undefined
})
</script>

<template>
    <!-- 图片卡片类型 -->
    <div
        v-if="listType === 'picture-card'"
        :class="cn(
            'relative w-24 h-24 border-2 rounded-brutal overflow-hidden',
            'flex items-center justify-center',
            file.status === 'error' && 'border-brutal-destructive',
            props.class,
        )"
    >
        <!-- 图片预览 -->
        <img
            v-if="showImagePreview && previewUrl"
            :src="previewUrl"
            :alt="file.name"
            class="w-full h-full object-cover"
        >
        <!-- 文件图标 -->
        <component
            v-else
            :is="fileIcon"
            class="h-8 w-8 text-brutal-placeholder"
        />

        <!-- 上传中遮罩 -->
        <div
            v-if="file.status === 'uploading'"
            class="absolute inset-0 bg-brutal-bg/80 flex flex-col items-center justify-center"
        >
            <Progress :value="file.progress" class="w-16 h-1" />
            <span class="text-xs mt-1">{{ file.progress }}%</span>
        </div>

        <!-- 成功状态 -->
        <div
            v-if="file.status === 'success'"
            class="absolute top-1 right-1 bg-brutal-success rounded-full p-0.5"
        >
            <Check class="h-3 w-3 text-white" />
        </div>

        <!-- 错误状态 -->
        <div
            v-if="file.status === 'error'"
            class="absolute inset-0 bg-brutal-destructive/10 flex items-center justify-center"
        >
            <AlertCircle class="h-6 w-6 text-brutal-destructive" />
        </div>

        <!-- 操作按钮 -->
        <div class="absolute inset-0 bg-brutal-bg/0 hover:bg-brutal-bg/60 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
            <Button
                v-if="file.status === 'error'"
                size="sm"
                variant="ghost"
                class="h-6 w-6 p-0"
                @click.stop="emit('retry')"
            >
                <RefreshCw class="h-3 w-3" />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                class="h-6 w-6 p-0"
                @click.stop="emit('remove')"
            >
                <X class="h-3 w-3" />
            </Button>
        </div>

        <!-- 文件名提示 -->
        <div class="absolute bottom-0 left-0 right-0 bg-brutal-bg/80 px-1 py-0.5">
            <p class="text-xs truncate text-brutal-fg">{{ file.name }}</p>
        </div>
    </div>

    <!-- 列表类型（text 和 picture） -->
    <div
        v-else
        :class="cn(
            'flex items-center gap-3 p-3 border-2 rounded-brutal',
            'transition-colors duration-200',
            file.status === 'error' && 'border-brutal-destructive',
            props.class,
        )"
    >
        <!-- 图片预览或文件图标 -->
        <div
            v-if="listType === 'picture'"
            class="w-12 h-12 rounded-brutal overflow-hidden flex-shrink-0"
        >
            <img
                v-if="showImagePreview && previewUrl"
                :src="previewUrl"
                :alt="file.name"
                class="w-full h-full object-cover"
            >
            <div
                v-else
                class="w-full h-full flex items-center justify-center bg-brutal-muted"
            >
                <component :is="fileIcon" class="h-6 w-6 text-brutal-placeholder" />
            </div>
        </div>
        <div
            v-else
            class="flex-shrink-0"
        >
            <component :is="fileIcon" class="h-5 w-5 text-brutal-placeholder" />
        </div>

        <!-- 文件信息 -->
        <div class="flex-1 min-w-0">
            <p class="font-medium text-brutal-fg truncate">{{ file.name }}</p>
            <p class="text-sm text-brutal-placeholder">{{ formatFileSize(file.size) }}</p>

            <!-- 进度条 -->
            <div v-if="showProgress" class="mt-2">
                <Progress :value="file.progress" class="h-1.5" />
                <p class="text-xs text-brutal-placeholder mt-1">{{ file.progress }}%</p>
            </div>

            <!-- 错误信息 -->
            <p
                v-if="file.status === 'error' && file.error"
                class="text-sm text-brutal-destructive mt-1"
            >
                {{ file.error.message }}
            </p>
        </div>

        <!-- 状态图标和操作按钮 -->
        <div class="flex items-center gap-2 flex-shrink-0">
            <!-- 成功状态 -->
            <Check
                v-if="file.status === 'success'"
                class="h-5 w-5 text-brutal-success"
            />

            <!-- 重试按钮 -->
            <Button
                v-if="file.status === 'error'"
                size="sm"
                variant="outline"
                @click.stop="emit('retry')"
            >
                <RefreshCw class="h-3 w-3 mr-1" />
                重试
            </Button>

            <!-- 删除按钮 -->
            <Button
                size="sm"
                variant="ghost"
                class="h-8 w-8 p-0"
                @click.stop="emit('remove')"
            >
                <X class="h-4 w-4" />
            </Button>
        </div>
    </div>
</template>
