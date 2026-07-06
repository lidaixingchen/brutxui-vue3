<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import Loading from '../loading/Loading.vue'

interface LoadingPageProps {
    title?: string
    description?: string
    progress?: number
    class?: string
}

const props = withDefaults(defineProps<LoadingPageProps>(), {
    title: undefined,
    description: undefined,
    progress: undefined,
    class: undefined,
})

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('loadingPage.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('loadingPage.defaultDescription'))
</script>

<template>
    <Loading
        page
        :title="resolvedTitle"
        :description="resolvedDescription"
        :progress="progress"
        :class="props.class"
    >
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>

        <slot />

        <template v-if="$slots.footer" #footer>
            <slot name="footer" />
        </template>
    </Loading>
</template>
