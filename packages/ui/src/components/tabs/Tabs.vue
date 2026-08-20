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

// 非受控模式下，当 tabs 变化导致当前 internalValue 已不存在时，把 internalValue 同步为 defaultValue/首项（或空串），
// 否则 activeValue 仅计算回退、internalValue 仍保留旧值，后续重新加入该 value 时会在无用户操作下自动跳回旧选中项。
// 受控分支（modelValue 优先）不写 internalValue，避免干扰 v-model 场景
watch(() => props.tabs, (tabs) => {
    if (props.modelValue !== undefined) return
    const current = internalValue.value
    const exists = current !== '' && !!tabs && tabs.some(tab => tab.value === current)
    if (!exists) {
        internalValue.value = props.defaultValue ?? tabs?.[0]?.value ?? ''
    }
})

function handleUpdateModelValue(value: string) {
    if (props.modelValue === undefined) {
        internalValue.value = value
    }
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
                    :disabled="tab.disabled"
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
        :model-value="activeValue"
        :orientation="orientation"
        :class="cn(props.class)"
        @update:model-value="(val) => { if (typeof val === 'string') handleUpdateModelValue(val) }"
    >
        <slot />
    </TabsRoot>
</template>
