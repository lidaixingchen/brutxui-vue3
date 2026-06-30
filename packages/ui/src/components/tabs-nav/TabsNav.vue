<script setup lang="ts">
import { computed, ref } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import TabsList from '../tabs/TabsList.vue'
import TabsTrigger from '../tabs/TabsTrigger.vue'
import TabsContent from '../tabs/TabsContent.vue'
import Card from '../card/Card.vue'
import EmptyState from '../empty-state/EmptyState.vue'

export interface TabItem {
    label: string
    value: string
}

interface TabsNavProps {
    tabs?: TabItem[]
    modelValue?: string
    class?: string
}

const props = withDefaults(defineProps<TabsNavProps>(), {
    tabs: () => [],
    modelValue: undefined,
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const { t } = useLocale()

const rootClasses = computed(() => cn('w-full max-w-4xl mx-auto', props.class))

const internalValue = ref<string>('')

const activeValue = computed(() => {
    if (props.modelValue !== undefined) return props.modelValue
    if (internalValue.value) return internalValue.value
    if (props.tabs.length > 0) return props.tabs[0].value
    return ''
})

function handleUpdateModelValue(value: string) {
    internalValue.value = value
    emit('update:modelValue', value)
}
</script>

<template>
    <div :class="rootClasses">
        <slot name="header" />

        <template v-if="tabs.length > 0">
            <TabsRoot :model-value="activeValue" class="w-full" @update:model-value="handleUpdateModelValue">
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
        </template>
        <EmptyState v-else :title="t('tabsNav.emptyTitle')" />

        <slot name="footer" />
    </div>
</template>
