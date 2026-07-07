<script setup lang="ts">
import { computed, provide, ref, type ComputedRef } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'
import TabsContent from './TabsContent.vue'
import Card from '../card/Card.vue'
import Result from '../result/Result.vue'
import type { TabItem } from './types'

export type { TabItem }

interface TabsProps {
    modelValue?: string
    tabs?: TabItem[]
    orientation?: 'horizontal' | 'vertical'
    class?: string
}

const props = withDefaults(defineProps<TabsProps>(), {
    modelValue: undefined,
    tabs: undefined,
    orientation: 'horizontal',
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useLocale()

const orientation = computed(() => props.orientation)
provide<ComputedRef<'horizontal' | 'vertical'>>('brutx-tabs-orientation', orientation)

const internalValue = ref<string>('')

const activeValue = computed<string | undefined>(() => {
    if (props.modelValue !== undefined) return props.modelValue
    if (props.tabs && props.tabs.length > 0) {
        return internalValue.value || props.tabs[0].value
    }
    return undefined
})

function handleUpdateModelValue(value: string) {
    internalValue.value = value
    emit('update:modelValue', value)
}

const wrapperClasses = computed(() => cn('w-full max-w-4xl mx-auto', props.class))
</script>

<template>
    <div v-if="tabs && tabs.length > 0" :class="wrapperClasses">
        <slot name="header" />

        <TabsRoot
            :model-value="activeValue"
            :orientation="orientation"
            class="w-full"
            @update:model-value="handleUpdateModelValue"
        >
            <TabsList class="w-full flex">
                <TabsTrigger
                    v-for="tab in tabs"
                    :key="tab.value"
                    :value="tab.value"
                    class="flex-1"
                >
                    {{ tab.label }}
                </TabsTrigger>
            </TabsList>

            <slot>
                <TabsContent
                    v-for="tab in tabs"
                    :key="tab.value"
                    :value="tab.value"
                >
                    <Card variant="flat">
                        <p class="text-brutal-muted-foreground font-medium">
                            {{ tab.label }}
                        </p>
                    </Card>
                </TabsContent>
            </slot>
        </TabsRoot>

        <slot name="footer" />
    </div>

    <div v-else-if="tabs && tabs.length === 0" :class="wrapperClasses">
        <slot name="header" />
        <Result status="empty" :title="t('tabs.emptyTitle')" />
        <slot name="footer" />
    </div>

    <TabsRoot
        v-else
        :model-value="modelValue"
        :orientation="orientation"
        :class="cn(props.class)"
        @update:model-value="(val) => { if (typeof val === 'string') emit('update:modelValue', val) }"
    >
        <slot />
    </TabsRoot>
</template>
