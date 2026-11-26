<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useTemplateRef, watch, watchEffect, type ComponentPublicInstance } from 'vue'
import { injectListboxRootContext, ListboxItem, Primitive, useId, type PrimitiveProps } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { getMutationObserverCtor } from '@/lib/env'
import { cn } from '@/lib/utils'
import { commandItemVariants } from './command-variants'
import { injectCommandRootContext, injectCommandGroupContext, injectCommandSelectionContext } from './command-context'

interface CommandItemProps {
    value: string
    disabled?: boolean
    class?: ClassValue
}

defineOptions({ inheritAttrs: false })

const props = defineProps<CommandItemProps>()

const emit = defineEmits<{ select: [value: string] }>()

const rootContext = injectCommandRootContext()
const groupContext = injectCommandGroupContext(null)
const selection = injectCommandSelectionContext(null)
const listboxContext = injectListboxRootContext()
const attrs = useAttrs()
const id = useId(undefined, 'brutx-command-item')

const itemRef = useTemplateRef<ComponentPublicInstance>('item')
const itemElement = computed(() => {
    const root = itemRef.value?.$el as Element | CharacterData | undefined
    if (!root) return
    return (root.nodeType === Node.ELEMENT_NODE ? root : root.nextElementSibling) as HTMLElement | null
})

rootContext.allItems.value.set(id, props.value)
const groupId = groupContext?.id
if (groupId) {
    const group = rootContext.allGroups.value.get(groupId)
    if (group) {
        group.add(id)
    }
    else {
        rootContext.allGroups.value.set(groupId, new Set([id]))
    }
}

const isVisible = computed(() =>
    rootContext.filterDisabled.value
    || !rootContext.filterSearch.value
    || (rootContext.filterState.value.items.get(id) ?? 0) > 0
)

function getItemAttrs() {
    const { as: _as, asChild: _asChild, 'as-child': _asChildAttr, ...itemAttrs } = attrs
    return itemAttrs
}

function hasBooleanAttr(value: unknown): boolean {
    return value === '' || Boolean(value)
}

function getSurfaceAttrs(): PrimitiveProps {
    return {
        as: attrs.as as PrimitiveProps['as'],
        asChild: hasBooleanAttr(attrs.asChild ?? attrs['as-child']),
    }
}

function isAvailable() {
    return isVisible.value && !hasBooleanAttr(attrs.hidden) && !hasBooleanAttr(attrs.inert)
}

const selectionAttrs = computed(() => {
    if (!selection) return {}
    const selected = selection(props.value)
    return { 'aria-selected': selected, 'data-state': selected ? 'checked' : 'unchecked' }
})

// 收集插槽显示文本，跳过显式隐藏及读屏专用的子元素。
function getSearchableText(el: HTMLElement): string {
    let text = ''
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? ''
            continue
        }
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        const child = node as HTMLElement
        if (child.hidden || child.getAttribute('aria-hidden') === 'true') continue
        if (child.classList.contains('sr-only')) continue
        text += getSearchableText(child)
    }
    return text
}

watchEffect((onCleanup) => {
    const el = itemElement.value
    if (!el || rootContext.filterDisabled.value) return
    const value = props.value
    const syncIndexText = () => rootContext.allItems.value.set(id, getSearchableText(el).trim() || value)
    syncIndexText()
    const Observer = getMutationObserverCtor()
    if (!Observer) return
    const observer = new Observer(syncIndexText)
    observer.observe(el, {
        subtree: true,
        childList: true,
        characterData: true,
        attributeFilter: ['hidden', 'aria-hidden', 'class'],
    })
    onCleanup(() => observer.disconnect())
}, { flush: 'post' })

const classes = computed(() =>
    cn(commandItemVariants(), props.class)
)

const isFocusVisible = computed(() =>
    rootContext.focusMode.value === 'keyboard'
    && listboxContext.highlightedElement.value === itemElement.value
)

// 原语缓存选项子树，虚拟焦点属性需同步到实际选项元素。
watch([isFocusVisible, itemElement], ([focusVisible, element]) => {
    element?.toggleAttribute('data-focus-visible', focusVisible)
}, { flush: 'post', immediate: true })

function handleSelect() {
    if (isAvailable() && !props.disabled && !listboxContext.disabled.value)
        emit('select', props.value)
}

onBeforeUnmount(() => {
    rootContext.allItems.value.delete(id)
    if (groupId) {
        const group = rootContext.allGroups.value.get(groupId)
        group?.delete(id)
        // 分组内条目清空后同步移除分组键，避免空分组残留在 allGroups 中污染无搜索时的分组集合
        if (group?.size === 0)
            rootContext.allGroups.value.delete(groupId)
    }
})
</script>

<template>
    <ListboxItem
        :id="id"
        v-bind="getItemAttrs()"
        as-child
        :value="value"
        :disabled="disabled || !isAvailable()"
        @select="handleSelect"
    >
        <!-- Reka 导航排除禁用项。隐藏时保留插槽实例供搜索索引追踪显示文案。 -->
        <Primitive
            v-show="isVisible"
            ref="item"
            :class="classes"
            :role="isVisible ? 'option' : undefined"
            :data-slot="isVisible ? 'command-item' : undefined"
            v-bind="{ ...getSurfaceAttrs(), ...selectionAttrs }"
            :hidden="!isVisible || attrs.hidden"
            :inert="!isVisible || attrs.inert"
            :aria-hidden="!isAvailable() || attrs['aria-hidden']"
        >
            <slot />
        </Primitive>
    </ListboxItem>
</template>
