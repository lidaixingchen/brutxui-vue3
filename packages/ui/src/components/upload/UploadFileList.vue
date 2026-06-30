<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { UploadFile } from './index'
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
</script>

<template>
    <div
        v-if="files.length > 0"
        :class="cn(
            'mt-4',
            listType === 'picture-card' && 'flex flex-wrap gap-2',
            props.class,
        )"
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
