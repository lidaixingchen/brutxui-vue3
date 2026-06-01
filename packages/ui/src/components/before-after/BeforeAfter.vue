<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '../../lib/utils'

interface BeforeAfterProps {
    before: string
    after: string
    beforeAlt?: string
    afterAlt?: string
    defaultValue?: number
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<BeforeAfterProps>(), {
    beforeAlt: 'Before',
    afterAlt: 'After',
    defaultValue: 50,
    disabled: false,
    class: '',
})

const sliderVal = ref(props.defaultValue)

const clipStyle = computed(() => {
    return {
        clipPath: `inset(0 0 0 ${sliderVal.value}%)`,
    }
})

const sliderStyle = computed(() => {
    return {
        left: `${sliderVal.value}%`,
    }
})
</script>

<template>
    <div :class="cn('relative overflow-hidden w-full aspect-video border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal select-none', props.class)">
        <!-- Before Image (Base layer) -->
        <img
            :src="before"
            :alt="beforeAlt"
            class="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <!-- After Image (Overlay, clipped from the left based on slider position) -->
        <div
            class="absolute inset-0 w-full h-full pointer-events-none"
            :style="clipStyle"
        >
            <img
                :src="after"
                :alt="afterAlt"
                class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
        </div>

        <!-- Divider Bar Line -->
        <div
            class="absolute top-0 bottom-0 w-[4px] bg-brutal-fg -translate-x-1/2 pointer-events-none z-10"
            :style="sliderStyle"
        />

        <!-- Slider Drag Handle -->
        <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 border-3 border-brutal bg-brutal-primary rounded-brutal shadow-brutal-sm flex items-center justify-center pointer-events-none z-20 select-none"
            :style="sliderStyle"
        >
            <!-- Double arrow indicator icon -->
            <span class="flex items-center justify-center font-black text-xs text-brutal-fg">
                ◀▶
            </span>
        </div>

        <!-- Native Range Input overlay to capture all touch/mouse drag gestures -->
        <input
            type="range"
            min="0"
            max="100"
            v-model="sliderVal"
            :disabled="disabled"
            class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 disabled:cursor-not-allowed"
        />
    </div>
</template>
