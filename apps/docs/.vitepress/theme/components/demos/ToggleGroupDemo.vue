<script setup lang="ts">
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'

const singleValue = ref('left')
const multipleValue = ref<string[]>([])
const outlineValue = ref('bold')
const smValue = ref('bold')
const lgValue = ref('bold')
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Single (单选)</p>
            <ToggleGroup type="single" v-model="singleValue" variant="default">
                <ToggleGroupItem value="left" aria-label="Align Left">
                    <AlignLeft class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align Center">
                    <AlignCenter class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align Right">
                    <AlignRight class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Multiple (多选)</p>
            <ToggleGroup type="multiple" v-model="multipleValue" variant="default">
                <ToggleGroupItem value="bold" aria-label="Bold">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Outline Variant</p>
            <ToggleGroup type="single" v-model="outlineValue" variant="outline">
                <ToggleGroupItem value="bold" aria-label="Bold">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex items-center gap-4">
                <ToggleGroup type="single" v-model="smValue" size="sm">
                    <ToggleGroupItem value="bold" aria-label="Small">
                        <Bold class="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Small">
                        <Italic class="h-3 w-3" />
                    </ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup type="single" v-model="lgValue" size="lg">
                    <ToggleGroupItem value="bold" aria-label="Large">
                        <Bold class="h-5 w-5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Large">
                        <Italic class="h-5 w-5" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Disabled</p>
            <ToggleGroup type="single" model-value="bold" disabled>
                <ToggleGroupItem value="bold" aria-label="Bold">
                    <Bold class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                    <Italic class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                    <Underline class="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    </div>
</template>
