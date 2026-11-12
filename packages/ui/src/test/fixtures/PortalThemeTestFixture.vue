<script setup lang="ts">
import { ref } from 'vue'
import {
    PopoverRoot,
    PopoverTrigger,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValue,
} from 'reka-ui'
import PopoverContent from '@/components/popover/PopoverContent.vue'
import SelectContent from '@/components/select/SelectContent.vue'
import ColorPicker from '@/components/color-picker/ColorPicker.vue'

const props = withDefaults(defineProps<{ initiallyOpen?: boolean }>(), { initiallyOpen: true })
const rootPopoverOpen = ref(props.initiallyOpen)
const rootSelectOpen = ref(props.initiallyOpen)
const pastelPopoverOpen = ref(props.initiallyOpen)
const pastelSelectOpen = ref(props.initiallyOpen)
const nestedParentPopoverOpen = ref(props.initiallyOpen)
const nestedPopoverOpen = ref(props.initiallyOpen)
const monoPopoverOpen = ref(props.initiallyOpen)
const monoSelectOpen = ref(props.initiallyOpen)
const color = ref('#cc3366')

</script>

<template>
    <main>
        <section id="root-scope">
            <PopoverRoot v-model:open="rootPopoverOpen">
                <PopoverTrigger as-child>
                    <button id="root-popover-trigger" class="portal-theme-test-trigger">Root popover</button>
                </PopoverTrigger>
                <PopoverContent data-theme-content="root-popover">Root popover content</PopoverContent>
            </PopoverRoot>
            <SelectRoot v-model:open="rootSelectOpen" default-value="one">
                <SelectTrigger id="root-select-trigger" class="portal-theme-test-trigger">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent data-theme-content="root-select">
                    <SelectItem value="one">One</SelectItem>
                </SelectContent>
            </SelectRoot>
        </section>

        <section id="pastel-scope" class="theme-pastel dark">
            <PopoverRoot v-model:open="pastelPopoverOpen">
                <PopoverTrigger as-child>
                    <button id="pastel-popover-trigger" class="portal-theme-test-trigger">Pastel popover</button>
                </PopoverTrigger>
                <PopoverContent data-theme-content="pastel-popover">Pastel popover content</PopoverContent>
            </PopoverRoot>
            <PopoverRoot v-model:open="pastelPopoverOpen">
                <PopoverTrigger as-child>
                    <button id="pastel-override-trigger" class="portal-theme-test-trigger">Override popover</button>
                </PopoverTrigger>
                <PopoverContent
                    data-theme-content="pastel-override"
                    class="portal-theme-class-override"
                    style="--brutal-fg: rgb(78, 90, 123)"
                >
                    Override content
                </PopoverContent>
            </PopoverRoot>
            <SelectRoot v-model:open="pastelSelectOpen" default-value="one">
                <SelectTrigger id="pastel-select-trigger" class="portal-theme-test-trigger">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent data-theme-content="pastel-select">
                    <SelectItem value="one">One</SelectItem>
                </SelectContent>
            </SelectRoot>
            <PopoverRoot v-model:open="nestedParentPopoverOpen">
                <PopoverTrigger as-child>
                    <button id="pastel-nested-root-trigger" class="portal-theme-test-trigger">Nested parent</button>
                </PopoverTrigger>
                <PopoverContent data-theme-content="nested-parent-popover">
                    <PopoverRoot v-model:open="nestedPopoverOpen">
                        <PopoverTrigger as-child>
                            <button id="nested-popover-trigger" class="portal-theme-test-trigger">Nested child</button>
                        </PopoverTrigger>
                        <PopoverContent data-theme-content="nested-popover">Nested content</PopoverContent>
                    </PopoverRoot>
                </PopoverContent>
            </PopoverRoot>
            <div id="color-picker-scope">
                <ColorPicker v-model="color" />
            </div>
        </section>

        <section id="mono-scope" class="theme-mono">
            <PopoverRoot v-model:open="monoPopoverOpen">
                <PopoverTrigger as-child>
                    <button id="mono-popover-trigger" class="portal-theme-test-trigger">Mono popover</button>
                </PopoverTrigger>
                <PopoverContent data-theme-content="mono-popover">
                    <button type="button">Mono popover action</button>
                </PopoverContent>
            </PopoverRoot>
            <SelectRoot v-model:open="monoSelectOpen" default-value="one">
                <SelectTrigger id="mono-select-trigger" class="portal-theme-test-trigger">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent data-theme-content="mono-select" position="item-aligned">
                    <SelectItem value="one">One</SelectItem>
                </SelectContent>
            </SelectRoot>
        </section>
    </main>
</template>

<style>
.portal-theme-test-trigger {
    background: var(--brutal-bg, #ffffff);
    border: var(--brutal-border-width, 3px) solid var(--brutal-border-color, #000000);
    border-radius: var(--brutal-radius, 0px);
    color: var(--brutal-fg, #000000);
}

.portal-theme-class-override {
    --brutal-bg: rgb(17, 34, 51);
    --brutal-border-width: 5px;
    --brutal-radius: 14px;
}
</style>
