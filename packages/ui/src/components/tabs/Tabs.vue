<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { TabsRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'
import TabsContent from './TabsContent.vue'
import Card from '../card/Card.vue'
import Result from '../result/Result.vue'
import { type TabItem, TABS_ORIENTATION_KEY } from './types'

export type { TabItem }

interface TabsProps {
    modelValue?: string
    defaultValue?: string
    tabs?: TabItem[]
    orientation?: 'horizontal' | 'vertical'
    class?: string
}

const props = withDefaults(defineProps<TabsProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    tabs: undefined,
    orientation: 'horizontal',
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useLocale()

const orientation = computed(() => props.orientation)
provide(TABS_ORIENTATION_KEY, orientation)

const internalValue = ref<string>(props.defaultValue ?? props.tabs?.[0]?.value ?? '')

const activeValue = computed<string | undefined>(() => {
    if (props.modelValue !== undefined) return props.modelValue
    if (props.tabs && props.tabs.length > 0) {
        // 非受控模式下校验 internalValue 是否仍存在于最新 tabs 中，
        // 若父组件已删除/替换当前选中项，则回退到 defaultValue 或首项，避免激活不存在的 tab
        const current = internalValue.value
        const exists = current !== '' && props.tabs.some(tab => tab.value === current)
        return exists ? current : (props.defaultValue ?? props.tabs[0].value)
    }
    return internalValue.value || props.defaultValue || undefined
})

// 只跟踪 tab value，选项身份变化时同步非受控值，文案更新不会影响当前选择。
watch(
    () => props.tabs?.map(tab => tab.value),
    (values) => {
        if (props.modelValue !== undefined) return
        const current = internalValue.value
        const exists = current !== '' && !!values?.includes(current)
        if (!exists) {
            internalValue.value = props.defaultValue ?? props.tabs?.[0]?.value ?? ''
        }
    },
)

function handleUpdateModelValue(value: string) {
    if (props.modelValue === undefined) {
        internalValue.value = value
    }
    emit('update:modelValue', value)
}

const wrapperClasses = computed(() => cn('w-full max-w-4xl mx-auto', props.class))
const rootClasses = computed(() => cn(props.class))
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
            <TabsList :class="orientation === 'vertical' ? 'w-fit' : 'w-full'">
                <TabsTrigger
                    v-for="tab in tabs"
                    :key="tab.value"
                    :value="tab.value"
                    :disabled="tab.disabled"
                    :class="orientation === 'horizontal' ? 'flex-1 shrink-0' : 'w-full'"
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
        :model-value="activeValue"
        :orientation="orientation"
        :class="rootClasses"
        @update:model-value="(val) => { if (typeof val === 'string') handleUpdateModelValue(val) }"
    >
        <slot />
    </TabsRoot>
</template>
