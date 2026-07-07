<script setup lang="ts">
import { ref, type Component } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/popover'
import { Button } from '@/components/button'

interface PopconfirmProps {
    /** 确认框标题 */
    title: string
    /** 确认按钮文字 */
    confirmButtonText?: string
    /** 取消按钮文字 */
    cancelButtonText?: string
    /** 确认按钮类型 */
    confirmButtonType?: 'primary' | 'destructive'
    /** 自定义图标 */
    icon?: Component
    /** 是否可取消 */
    cancelable?: boolean
    class?: string
}

const props = withDefaults(defineProps<PopconfirmProps>(), {
    confirmButtonText: undefined,
    cancelButtonText: undefined,
    confirmButtonType: 'primary',
    icon: undefined,
    cancelable: true,
    class: undefined,
})

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()

const { t } = useLocale()
const isOpen = ref(false)

function handleConfirm() {
    isOpen.value = false
    emit('confirm')
}

function handleCancel() {
    isOpen.value = false
    emit('cancel')
}
</script>

<template>
    <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
            <slot />
        </PopoverTrigger>
        <PopoverContent
            :class="props.class"
            align="center"
        >
            <div class="flex gap-3">
                <!-- 图标 -->
                <div class="flex-shrink-0">
                    <slot name="icon">
                        <component
                            :is="icon || TriangleAlert"
                            class="h-5 w-5 text-brutal-warning"
                        />
                    </slot>
                </div>

                <!-- 内容 -->
                <div class="flex-1">
                    <p class="font-medium text-brutal-fg">
                        {{ title }}
                    </p>

                    <!-- 描述 -->
                    <div v-if="$slots.description" class="mt-1">
                        <slot name="description" />
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex justify-end gap-2 mt-3">
                        <Button
                            v-if="cancelable"
                            variant="outline"
                            size="sm"
                            @click="handleCancel"
                        >
                            {{ cancelButtonText || t('popconfirm.cancel') }}
                        </Button>
                        <Button
                            :variant="confirmButtonType === 'destructive' ? 'danger' : 'primary'"
                            size="sm"
                            @click="handleConfirm"
                        >
                            {{ confirmButtonText || t('popconfirm.confirm') }}
                        </Button>
                    </div>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>
