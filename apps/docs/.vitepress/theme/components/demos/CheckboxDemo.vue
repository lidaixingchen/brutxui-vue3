<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from 'brutx-ui-vue'

const checked = ref(false)
const primaryChecked = ref(true)
const dangerChecked = ref(false)
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="checked" />
            <span class="text-sm font-bold">Default</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="primaryChecked" variant="primary" />
            <span class="text-sm font-bold">Primary</span>
        </div>
        <div class="flex items-center gap-3">
            <Checkbox v-model:checked="dangerChecked" variant="danger" />
            <span class="text-sm font-bold">Danger</span>
        </div>
    </div>
</template>
