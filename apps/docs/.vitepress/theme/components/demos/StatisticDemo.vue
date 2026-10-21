<script setup lang="ts">
import { Statistic } from 'brutx-ui-vue'
</script>

<template>
    <div class="w-full min-w-0 space-y-6">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--container-2xs)),1fr))] gap-4">
            <Statistic
                title="活跃用户"
                :value="112893"
                variant="card"
                trend="up"
            />
            <Statistic
                title="月度成交额"
                :value="938204.5"
                prefix="¥"
                :precision="2"
                variant="card"
            />
            <Statistic
                title="系统故障率"
                :value="0.0012"
                suffix="%"
                :precision="4"
                trend="down"
                variant="card"
            />
        </div>
    </div>
</template>
