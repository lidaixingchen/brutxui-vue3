<script setup lang="ts">
import { ref } from 'vue'
import { Toggle } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from 'lucide-vue-next'

const boldPressed = ref(false)
const italicPressed = ref(false)
const outlinePressed = ref(false)
const outlineSmPressed = ref(false)
const outlineLgPressed = ref(false)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Default Variant</p>
            <div class="flex gap-2">
                <Toggle v-model:pressed="boldPressed" aria-label="Bold">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle v-model:pressed="italicPressed" aria-label="Italic">
                    <Italic class="h-4 w-4" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Outline Variant</p>
            <div class="flex gap-2">
                <Toggle v-model:pressed="outlinePressed" variant="outline" aria-label="Underline">
                    <Underline class="h-4 w-4" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex items-center gap-2">
                <Toggle size="sm" aria-label="Small">
                    <Bold class="h-3 w-3" />
                </Toggle>
                <Toggle size="default" aria-label="Default">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle size="lg" aria-label="Large">
                    <Bold class="h-5 w-5" />
                </Toggle>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Disabled</p>
            <div class="flex items-center gap-2">
                <Toggle disabled aria-label="Disabled">
                    <Bold class="h-4 w-4" />
                </Toggle>
                <Toggle disabled :pressed="true" aria-label="Disabled pressed">
                    <Italic class="h-4 w-4" />
                </Toggle>
            </div>
        </div>
    </div>
</template>
