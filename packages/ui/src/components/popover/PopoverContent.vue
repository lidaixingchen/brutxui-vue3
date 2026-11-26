<script setup lang="ts">
import { cloneVNode, Comment, computed, defineComponent, Fragment, h, ref, useTemplateRef, watch, type ComponentPublicInstance, type VNode } from 'vue'
import type { PopoverContentProps as RekaPopoverContentProps } from 'reka-ui'
import {
    PopoverPortal as PopoverPortalPrimitive,
    PopoverContent as PopoverContentPrimitive,
    Primitive,
    injectPopoverRootContext,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { getMutationObserverCtor } from '@/lib/env'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { popoverContentVariants } from './popover-variants'
import { useFloatingOverlay } from '@/lib/overlay-layer'

defineOptions({ inheritAttrs: false })

interface PopoverContentProps {
    as?: RekaPopoverContentProps['as']
    asChild?: boolean
    align?: 'center' | 'start' | 'end'
    sideOffset?: number
    collisionPadding?: RekaPopoverContentProps['collisionPadding']
    class?: string
}

const props = withDefaults(defineProps<PopoverContentProps>(), {
    as: 'div',
    align: 'center',
    sideOffset: floatingContentSideOffsets.popover,
    collisionPadding: floatingContentSideOffsets.popover,
    class: undefined,
})

const rootContext = injectPopoverRootContext()
const triggerId = ref<string>()

watch(rootContext.triggerElement, (element, _, onCleanup) => {
    triggerId.value = undefined
    if (!element) return

    const syncTriggerId = () => {
        // 插槽可以显式清除继承的 ID。此时用原语的稳定 ID 补齐引用。
        if (!element.id && rootContext.triggerId) element.id = rootContext.triggerId
        triggerId.value = element.id || undefined
    }

    syncTriggerId()
    const Observer = getMutationObserverCtor()
    if (!Observer) return

    const observer = new Observer(syncTriggerId)
    observer.observe(element, { attributeFilter: ['id'] })
    onCleanup(() => observer.disconnect())
}, { immediate: true, flush: 'post' })

const contentRef = useTemplateRef<ComponentPublicInstance>('content')
const hasContentLabel = ref(false)

watch(contentRef, (component, _, onCleanup) => {
    hasContentLabel.value = false
    if (!component) return

    let observedRoot: Node | undefined
    const Observer = getMutationObserverCtor()
    const syncLabel = () => {
        const root = component.$el as Node
        const element = root instanceof HTMLElement ? root : undefined
        hasContentLabel.value = Boolean(element?.getAttribute('aria-label')?.trim())
        if (observedRoot === root) return

        observedRoot = root
        observer?.disconnect()
        if (element) observer?.observe(element, { attributeFilter: ['aria-label'] })
        if (root?.parentNode) observer?.observe(root.parentNode, { childList: true })
    }
    const observer = Observer ? new Observer(syncLabel) : undefined
    syncLabel()
    onCleanup(() => observer?.disconnect())
}, { flush: 'post' })

function flattenSlot(nodes: VNode[]): VNode[] {
    return nodes.flatMap(node => node.type === Fragment ? flattenSlot(node.children as VNode[]) : [node])
}

const ContentElement = defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
        return () => {
            const primitiveProps = { ...attrs, as: props.as, asChild: props.asChild }
            if (!props.asChild) return h(Primitive, primitiveProps, slots)

            const nodes = flattenSlot(slots.default?.() ?? [])
            const index = nodes.findIndex(node => node.type !== Comment)
            const node = nodes[index]
            if (node?.props && 'aria-labelledby' in node.props && !node.props['aria-labelledby']) {
                const cloned = cloneVNode(node)
                cloned.props = { ...node.props }
                delete cloned.props['aria-labelledby']
                nodes[index] = cloned
            }
            return h(Primitive, primitiveProps, { default: () => nodes })
        }
    },
})

const { style: overlayLayerStyle, ref: floatingLayerRef } = useFloatingOverlay('popover', {
    anchor: () => rootContext.triggerElement.value,
    open: rootContext.open,
})

const classes = computed(() =>
    cn(popoverContentVariants(), props.class)
)
</script>

<template>
    <PopoverPortalPrimitive>
        <PopoverContentPrimitive
            :ref="floatingLayerRef"
            v-bind="$attrs"
            as-child
            :align="align"
            :side-offset="sideOffset"
            :collision-padding="collisionPadding"
            :class="classes"
            :style="[overlayLayerStyle, $attrs.style]"
        >
            <ContentElement
                ref="content"
                :aria-labelledby="$attrs['aria-labelledby'] ?? (hasContentLabel ? undefined : triggerId)"
            >
                <slot />
            </ContentElement>
        </PopoverContentPrimitive>
    </PopoverPortalPrimitive>
</template>
