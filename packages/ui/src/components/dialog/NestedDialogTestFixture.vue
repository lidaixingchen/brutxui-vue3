<script setup lang="ts">
import { ref } from 'vue'
import {
    DialogRoot,
    DialogTrigger,
} from 'reka-ui'
import DialogContent from './DialogContent.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'

const outerOpen = ref(false)
const innerOpen = ref(false)

defineExpose({
    outerOpen,
    innerOpen,
})
</script>

<template>
    <div>
        <DialogRoot v-model:open="outerOpen">
            <DialogTrigger as-child>
                <button id="outer-trigger">Open Outer</button>
            </DialogTrigger>
            <DialogContent>
                <div id="outer-content">
                    <DialogHeader>
                        <DialogTitle>Outer Dialog</DialogTitle>
                        <DialogDescription class="sr-only">Outer description</DialogDescription>
                    </DialogHeader>
                    <DialogRoot v-model:open="innerOpen">
                        <DialogTrigger as-child>
                            <button id="inner-trigger">Open Inner</button>
                        </DialogTrigger>
                        <DialogContent>
                            <div id="inner-content">
                                <DialogTitle>Inner Dialog</DialogTitle>
                                <DialogDescription class="sr-only">Inner description</DialogDescription>
                            </div>
                        </DialogContent>
                    </DialogRoot>
                </div>
            </DialogContent>
        </DialogRoot>
    </div>
</template>
