<script setup lang="ts">
import { computed } from 'vue'
import { Upload as UploadIcon } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants'
import { useLocale } from '@/composables/useLocale'
import { useUpload } from '@/composables/useUpload'
import Upload from '../upload/Upload.vue'
import UploadTrigger from '../upload/UploadTrigger.vue'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Button from '../button/Button.vue'
import Progress from '../progress/Progress.vue'
import Spinner from '../spinner/Spinner.vue'

interface UploadCardProps {
    title?: string
    description?: string
    accept?: string
    maxSize?: number
    uploading?: boolean
    progress?: number
    class?: string
}

const props = withDefaults(defineProps<UploadCardProps>(), {
    title: undefined,
    description: undefined,
    accept: undefined,
    maxSize: undefined,
    uploading: false,
    progress: 0,
    class: undefined,
})

const { t } = useLocale()
const { filterValidFiles } = useUpload({
    maxSize: () => props.maxSize,
    accept: () => props.accept,
})

const emit = defineEmits<{
    upload: [files: File[]]
    drop: [files: File[]]
}>()

const rootClasses = computed(() => cn('w-full max-w-lg mx-auto', props.class))

const resolvedTitle = computed(() => props.title ?? t('uploadCard.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('uploadCard.defaultDescription'))
const resolvedBrowseText = computed(() => t('uploadCard.browseText'))
const resolvedDropText = computed(() => t('uploadCard.dropText'))

const uploadClasses = computed(() => cn('w-full'))

function getDropZoneClasses(isDragging: boolean) {
    return cn(
        'flex flex-col items-center justify-center p-8 border-3 border-dashed border-brutal rounded-brutal transition-all cursor-pointer',
        isDragging ? 'bg-brutal-muted shadow-brutal' : 'bg-brutal-bg',
        brutalHoverLiftSmNoX,
        brutalPress,
        props.uploading && 'pointer-events-none'
    )
}

async function handleSelect(
    files: FileList,
    source: 'browse' | 'drop',
    selectFiles: (files: File[]) => Promise<void>,
) {
    const validFiles = filterValidFiles(Array.from(files))
    if (validFiles.length === 0) return

    await selectFiles(validFiles)
    if (source === 'drop') {
        emit('drop', validFiles)
        return
    }
    emit('upload', validFiles)
}

const progressClasses = cn('w-full max-w-xs mb-2')
const iconClasses = cn('h-10 w-10 stroke-[3] text-brutal-muted-foreground mb-4')
</script>

<template>
    <Upload
        :accept="accept"
        :max-size="maxSize"
        :auto-upload="false"
        :class="uploadClasses"
    >
        <template #trigger="{ selectFiles }">
            <Card :class="rootClasses" variant="default">
                <CardContent class="pt-6">
                    <UploadTrigger
                        :accept="accept"
                        :multiple="true"
                        :disabled="uploading"
                        :drag="true"
                        @select="(files, source) => handleSelect(files, source, selectFiles)"
                    >
                        <template #default="{ isDragging, triggerFileInput }">
                            <div
                                :class="getDropZoneClasses(isDragging)"
                                role="button"
                                tabindex="0"
                                @dragover.prevent
                                @keydown.enter="triggerFileInput"
                                @keydown.space.prevent="triggerFileInput"
                            >
                                <template v-if="uploading">
                                    <Spinner size="default" class="mb-4" />
                                    <Progress :model-value="progress" :class="progressClasses" />
                                </template>
                                <template v-else>
                                    <UploadIcon :class="iconClasses" />
                                    <h3 class="text-lg font-black tracking-tight">
{{ resolvedTitle }}
</h3>
                                    <p class="mt-1 text-sm text-brutal-muted-foreground font-medium">
{{ resolvedDescription }}
</p>
                                    <Button variant="primary" size="sm" class="mt-4" @click.stop="triggerFileInput">
                                        {{ resolvedBrowseText }}
                                    </Button>
                                    <p class="mt-2 text-xs text-brutal-muted-foreground font-medium">
{{ resolvedDropText }}
</p>
                                </template>
                            </div>
                        </template>
                    </UploadTrigger>
                    <slot name="actions" />
                </CardContent>
            </Card>
        </template>
    </Upload>
</template>
