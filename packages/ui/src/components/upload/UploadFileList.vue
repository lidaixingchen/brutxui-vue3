<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { UploadFile } from './upload-types'
import UploadFileItem from './UploadFileItem.vue'

interface UploadFileListProps {
    /** 文件列表 */
    files: UploadFile[]
    /** 列表类型 */
    listType?: 'text' | 'picture' | 'picture-card'
    class?: string
}

const props = withDefaults(defineProps<UploadFileListProps>(), {
    listType: 'text',
    class: undefined,
})

const emit = defineEmits<{
    remove: [file: UploadFile]
    retry: [file: UploadFile]
}>()

const containerClasses = computed(() =>
    cn(
        'mt-4',
        props.listType === 'picture-card' && 'flex flex-wrap gap-2',
        props.class,
    )
)
</script>

<template>
    <div
        v-if="files.length > 0"
        :class="containerClasses"
    >
        <UploadFileItem
            v-for="file in files"
            :key="file.id"
            :file="file"
            :list-type="listType"
            @remove="emit('remove', file)"
            @retry="emit('retry', file)"
        />
    </div>
</template>
