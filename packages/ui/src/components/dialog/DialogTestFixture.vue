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

const open = ref(false)
const inputVal = ref('')

defineExpose({
    open,
})
</script>

<template>
    <div class="p-4">
        <DialogRoot v-model:open="open">
            <DialogTrigger as-child>
                <button id="trigger-btn">Open Dialog</button>
            </DialogTrigger>
            <DialogContent>
                <div id="dialog-content">
                    <DialogHeader>
                        <DialogTitle>Test Dialog</DialogTitle>
                        <DialogDescription class="sr-only">Dialog description for accessibility</DialogDescription>
                    </DialogHeader>
                    <input id="dialog-input-1" v-model="inputVal" placeholder="Input 1" />
                    <input id="dialog-input-2" placeholder="Input 2" />
                </div>
            </DialogContent>
        </DialogRoot>
    </div>
</template>
