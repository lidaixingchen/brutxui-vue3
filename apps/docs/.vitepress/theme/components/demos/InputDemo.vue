<script setup lang="ts">
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
const errorValue = ref('')
const successValue = ref('')
const modelValue = ref('')
</script>

<template>
    <div class="space-y-6 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Variants</p>
            <div class="flex flex-col gap-3">
                <Input v-model="value" placeholder="Default input" />
                <Input v-model="errorValue" variant="error" placeholder="Error input" />
                <Input v-model="successValue" variant="success" placeholder="Success input" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex flex-col gap-3">
                <Input input-size="sm" placeholder="Small input" />
                <Input input-size="default" placeholder="Default input" />
                <Input input-size="lg" placeholder="Large input" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">States</p>
            <div class="flex flex-col gap-3">
                <Input disabled placeholder="Disabled input" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">v-model Binding</p>
            <div class="flex flex-col gap-2">
                <Input v-model="modelValue" placeholder="Type something..." />
                <p class="text-xs font-medium text-brutal-fg">Value: {{ modelValue }}</p>
            </div>
        </div>
    </div>
</template>
