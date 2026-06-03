<script setup lang="ts">
import { Textarea } from 'brutx-ui-vue'
</script>

<template>
    <div class="w-full max-w-sm space-y-8">
        <div class="space-y-2">
            <p class="font-black text-sm">Variants</p>
            <div class="space-y-3">
                <Textarea placeholder="Default variant" />
                <Textarea variant="error" placeholder="Error variant" />
                <Textarea variant="success" placeholder="Success variant" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">Sizes</p>
            <div class="space-y-3">
                <Textarea textarea-size="sm" placeholder="Small size" />
                <Textarea textarea-size="default" placeholder="Default size" />
                <Textarea textarea-size="lg" placeholder="Large size" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">Disabled</p>
            <Textarea disabled placeholder="Disabled textarea" />
        </div>
    </div>
</template>
