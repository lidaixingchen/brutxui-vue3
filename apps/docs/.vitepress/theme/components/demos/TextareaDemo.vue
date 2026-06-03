<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

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
                <Textarea v-model="value" placeholder="Default textarea" />
                <Textarea v-model="errorValue" variant="error" placeholder="Error textarea" />
                <Textarea v-model="successValue" variant="success" placeholder="Success textarea" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex flex-col gap-3">
                <Textarea textarea-size="sm" placeholder="Small textarea" />
                <Textarea textarea-size="default" placeholder="Default textarea" />
                <Textarea textarea-size="lg" placeholder="Large textarea" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">States</p>
            <div class="flex flex-col gap-3">
                <Textarea disabled placeholder="Disabled textarea" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">v-model Binding</p>
            <div class="flex flex-col gap-2">
                <Textarea v-model="modelValue" placeholder="Type something..." />
                <p class="text-xs font-medium text-brutal-fg">Value: {{ modelValue }}</p>
            </div>
        </div>
    </div>
</template>
