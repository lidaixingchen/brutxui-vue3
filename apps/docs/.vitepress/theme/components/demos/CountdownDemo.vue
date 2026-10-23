<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const HALF_HOUR_IN_MINUTES = 30
const COUNTDOWN_DURATION_MS = (HOURS_PER_DAY * MINUTES_PER_HOUR + HALF_HOUR_IN_MINUTES)
    * SECONDS_PER_MINUTE
    * MILLISECONDS_PER_SECOND

const targetTime = ref<number | null>(null)
const demoRoot = ref<HTMLElement | null>(null)
const compactWidthProbe = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const compactWidth = ref(0)
const precisionSize = computed(() => containerWidth.value < compactWidth.value ? 'sm' : 'default')
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
    targetTime.value = Date.now() + COUNTDOWN_DURATION_MS

    const root = demoRoot.value
    const probe = compactWidthProbe.value
    if (!root || !probe) return

    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === root) containerWidth.value = entry.contentRect.width
            if (entry.target === probe) compactWidth.value = entry.contentRect.width
        }
    })
    resizeObserver.observe(root)
    resizeObserver.observe(probe)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
    <div ref="demoRoot" class="relative w-full space-y-6">
        <span
            ref="compactWidthProbe"
            class="pointer-events-none absolute invisible block"
            style="width: var(--container-2xs)"
            aria-hidden="true"
        />
        <div
            class="grid w-full gap-4"
            style="grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--container-2xs)), 1fr))"
        >
            <Countdown
                title="发版倒计时"
                :value="targetTime"
                variant="card"
                size="lg"
            />
            <Countdown
                title="精准计时"
                :value="targetTime"
                format="HH:mm:ss.SSS"
                variant="card"
                :size="precisionSize"
            />
        </div>
    </div>
</template>
