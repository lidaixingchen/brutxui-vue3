<script setup lang="ts">
import { computed } from 'vue'
import Spinner from '../spinner/Spinner.vue'
import { cn } from '@/lib/utils'

interface LoadingProps {
    loading?: boolean
    text?: string
    background?: string
    customClass?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
    loading: false,
    text: undefined,
    background: undefined,
    customClass: undefined,
})

const maskStyles = computed(() => {
    if (props.background) {
        return { backgroundColor: props.background }
    }
    return {}
})
</script>

<template>
    <div class="relative">
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
