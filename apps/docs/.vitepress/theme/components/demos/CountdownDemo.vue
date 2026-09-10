<script setup lang="ts">
import { ref } from 'vue'
import { Countdown } from 'brutx-ui-vue'

const targetTime = ref(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 30)
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
