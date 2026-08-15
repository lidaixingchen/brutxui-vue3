<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
    DropdownMenuItemIndicator as DropdownMenuItemIndicatorPrimitive,
} from 'reka-ui'
import { Check, Minus } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

interface DropdownMenuCheckboxItemProps {
    modelValue?: boolean | 'indeterminate'
    /** 非受控模式（不传 modelValue）下的初始选中态 */
    defaultChecked?: boolean
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<DropdownMenuCheckboxItemProps>(), {
    modelValue: undefined,
    defaultChecked: false,
    class: undefined,
    iconSize: 'md',
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean | 'indeterminate']
}>()

const isControlled = computed(() => props.modelValue !== undefined)
// 非受控模式：defaultChecked 作为初始值，内部维护选中态（原语不支持 defaultValue）
const internalChecked = ref<boolean | 'indeterminate'>(props.defaultChecked)

const checked = computed<boolean | 'indeterminate' | undefined>(() =>
    isControlled.value ? props.modelValue : internalChecked.value
)

function handleCheckedChange(value: boolean | 'indeterminate') {
    if (isControlled.value) {
        emit('update:modelValue', value)
    } else {
        internalChecked.value = value
    }
}

const isIndeterminate = computed(() => checked.value === 'indeterminate')

const classes = computed(() =>
    cn(dropdownMenuItemVariants(), 'pl-8', props.class)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <DropdownMenuCheckboxItemPrimitive :checked="checked" :class="classes" @update:checked="handleCheckedChange">
        <span class="absolute left-2 flex h-4 w-4 items-center justify-center" aria-hidden="true">
            <!-- 未选中态常驻空复选框边框：与选中/半选的图标反馈对称 -->
            <span v-if="checked === false || checked === undefined" class="h-3 w-3 border-2 border-brutal" />
            <DropdownMenuItemIndicatorPrimitive>
                <Minus v-if="isIndeterminate" :class="iconClasses" />
                <Check v-else :class="iconClasses" />
            </DropdownMenuItemIndicatorPrimitive>
        </span>
        <slot />
    </DropdownMenuCheckboxItemPrimitive>
</template>
