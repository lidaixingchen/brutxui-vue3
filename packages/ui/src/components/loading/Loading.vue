<script setup lang="ts">
import { computed } from 'vue'
import Spinner from '../spinner/Spinner.vue'
import Skeleton from '../skeleton/Skeleton.vue'
import Progress from '../progress/Progress.vue'
import { cn } from '@/lib/utils'

interface LoadingProps {
    loading?: boolean
    text?: string
    background?: string
    customClass?: string
    page?: boolean
    fullscreen?: boolean
    title?: string
    description?: string
    progress?: number
    class?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
    loading: false,
    text: undefined,
    background: undefined,
    customClass: undefined,
    page: false,
    fullscreen: false,
    title: undefined,
    description: undefined,
    progress: undefined,
    class: undefined,
})

const maskStyles = computed(() => {
    if (props.background) {
        return { backgroundColor: props.background }
    }
    return {}
})

const isPageMode = computed(() => props.page || props.fullscreen)
const rootClasses = computed(() =>
    cn(isPageMode.value ? 'min-h-screen flex items-center justify-center bg-brutal-bg p-4' : 'relative', props.class)
)
const hasProgress = computed(() => props.progress !== undefined)
</script>

<template>
    <div v-if="isPageMode" :class="rootClasses">
        <div class="w-full max-w-lg text-center relative">
            <slot name="header" />

            <div class="relative border-3 border-brutal bg-brutal-bg shadow-brutal p-8 sm:p-12">
                <Skeleton variant="accent" class="absolute -top-3 -left-3 h-6 w-24" />
                <Skeleton variant="secondary" class="absolute -bottom-3 -right-3 h-6 w-32" />

                <div class="flex justify-center mb-6">
                    <Spinner size="lg" variant="primary" />
                </div>

                <h1 v-if="title" class="text-2xl sm:text-3xl font-black tracking-tight text-brutal-fg">
                    {{ title }}
                </h1>

                <p v-if="description" class="mt-3 text-brutal-muted-foreground font-medium">
                    {{ description }}
                </p>

                <slot />

                <div v-if="hasProgress" class="mt-6">
                    <Progress :model-value="progress" />
                </div>

                <slot name="footer" />
            </div>
        </div>
    </div>

    <div v-else :class="rootClasses">
        <slot />

        <Transition
            enter-active-class="transition-opacity duration-150 ease-out"
            leave-active-class="transition-opacity duration-150 ease-in"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <div
                v-if="loading"
                :class="cn(
                    'absolute inset-0 flex flex-col items-center justify-center z-50 select-none bg-white/80 dark:bg-brutal-black/80',
                    customClass
                )"
                :style="maskStyles"
            >
                <div class="flex flex-col items-center gap-3">
                    <Spinner size="lg" variant="default" />
                    <span 
                        v-if="text" 
                        class="text-sm font-black text-brutal-black dark:text-white uppercase tracking-wider bg-brutal-yellow px-2 py-0.5 border border-brutal-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {{ text }}
                    </span>
                </div>
            </div>
        </Transition>
    </div>
</template>
