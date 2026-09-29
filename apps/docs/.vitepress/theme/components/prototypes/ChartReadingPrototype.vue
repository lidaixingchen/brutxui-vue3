<script setup lang="ts">
import { SketchyChart } from 'brutx-ui-vue/sketchy-chart'

interface Reading { label: string; value: number }
interface PrototypeProps { title: string; data: Reading[] }
defineProps<PrototypeProps>()
</script>

<template>
    <SketchyChart :title="title" type="bar" :data="data" description="单位：万元；负数表示净减少。" />
</template>
