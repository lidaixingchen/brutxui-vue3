<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

onMounted(() => {
    targetTime.value = Date.now() + COUNTDOWN_DURATION_MS
})
</script>

<template>
    <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                size="lg"
            />
        </div>
    </div>
</template>
