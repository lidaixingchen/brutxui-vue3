<script setup lang="ts">
import type { ConcreteComponent, Component } from 'vue'
import { cn } from '@/lib/utils'

interface InputAdornmentProps {
    /** 前置元素 */
    prepend?: string
    /** 后置元素 */
    append?: string
    /** 前置图标 */
    prefixIcon?: ConcreteComponent | (() => Component)
    /** 后缀图标 */
    suffixIcon?: ConcreteComponent | (() => Component)
    /** 是否禁用 */
    disabled?: boolean
    /** 是否只读 */
    readonly?: boolean
    class?: string
}

const props = withDefaults(defineProps<InputAdornmentProps>(), {
    prepend: undefined,
    append: undefined,
    prefixIcon: undefined,
    suffixIcon: undefined,
    disabled: false,
    readonly: false,
    class: undefined,
})
</script>

<template>
    <div
        :class="cn(
            'flex items-stretch',
            props.class,
        )"
    >
        <!-- 前置元素 -->
        <div
            v-if="prepend"
            class="flex items-center px-3 border-3 border-r-0 rounded-l-brutal bg-brutal-muted text-brutal-fg font-medium"
        >
            {{ prepend }}
        </div>

        <!-- 主体容器 -->
        <div class="relative flex-1 flex items-center">
            <!-- 前缀图标 -->
            <div
                v-if="prefixIcon"
                class="absolute left-3 flex items-center justify-center text-brutal-placeholder"
            >
                <component :is="prefixIcon" class="h-4 w-4" />
            </div>

            <!-- 默认插槽 - 包裹目标组件 -->
            <slot />

            <!-- 后缀图标 -->
            <div
                v-if="suffixIcon"
                class="absolute right-3 flex items-center justify-center text-brutal-placeholder"
            >
                <component :is="suffixIcon" class="h-4 w-4" />
            </div>
        </div>

        <!-- 后置元素 -->
        <div
            v-if="append"
            class="flex items-center px-3 border-3 border-l-0 rounded-r-brutal bg-brutal-muted text-brutal-fg font-medium"
        >
            {{ append }}
        </div>
    </div>
</template>
