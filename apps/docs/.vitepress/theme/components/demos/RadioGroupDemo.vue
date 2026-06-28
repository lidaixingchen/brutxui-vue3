<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroup, RadioGroupItem } from 'brutx-ui-vue'

const selected = ref('option-1')
</script>

<template>
    <RadioGroup v-model="selected" default-value="option-1">
        <div class="flex items-center gap-3">
            <RadioGroupItem value="option-1" />
            <span class="text-sm font-bold">默认</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="option-2" variant="secondary" />
            <span class="text-sm font-bold">次要</span>
        </div>
        <div class="flex items-center gap-3">
            <RadioGroupItem value="option-3" variant="danger" />
            <span class="text-sm font-bold">危险</span>
        </div>
    </RadioGroup>
</template>
