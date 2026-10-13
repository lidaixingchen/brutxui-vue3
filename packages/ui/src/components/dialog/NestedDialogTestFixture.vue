<script setup lang="ts">
import { ref } from 'vue'
import {
    DialogRoot,
    DialogTrigger,
    PopoverRoot,
    PopoverTrigger,
} from 'reka-ui'
import DialogContent from './DialogContent.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'
import PopoverContent from '@/components/popover/PopoverContent.vue'

const outerOpen = ref(false)
const innerOpen = ref(false)
const innerPopoverOpen = ref(false)
const rootPopoverOpen = ref(false)

defineExpose({
    outerOpen,
    innerOpen,
    innerPopoverOpen,
    rootPopoverOpen,
})
</script>

<template>
    <div>
        <PopoverRoot v-model:open="rootPopoverOpen">
            <PopoverTrigger as-child>
                <button id="root-popover-trigger">Open Root Popover</button>
            </PopoverTrigger>
            <PopoverContent data-testid="root-popover-content">
                Root popover
            </PopoverContent>
        </PopoverRoot>
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
                                <PopoverRoot v-model:open="innerPopoverOpen">
                                    <PopoverTrigger as-child>
                                        <button id="inner-popover-trigger">Open Inner Popover</button>
                                    </PopoverTrigger>
                                    <PopoverContent data-testid="inner-dialog-popover">
                                        Inner popover
                                    </PopoverContent>
                                </PopoverRoot>
                            </div>
                        </DialogContent>
                    </DialogRoot>
                </div>
            </DialogContent>
        </DialogRoot>
    </div>
</template>
