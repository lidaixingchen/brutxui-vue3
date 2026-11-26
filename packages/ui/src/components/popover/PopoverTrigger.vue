<script setup lang="ts">
import { cloneVNode, Comment, computed, defineComponent, Fragment, h, type VNode } from 'vue'
import type { PopoverTriggerProps as RekaPopoverTriggerProps } from 'reka-ui'
import { injectPopoverRootContext, PopoverTrigger as PopoverTriggerPrimitive, Primitive } from 'reka-ui'

interface PopoverTriggerProps extends RekaPopoverTriggerProps {
    /** 触发器 ID，同时用于弹出内容的名称引用。 */
    id?: string
}

const props = defineProps<PopoverTriggerProps>()
const rootContext = injectPopoverRootContext()
const triggerId = computed(() => props.id?.trim())
let assignedFallback: { element: HTMLElement; id: string } | undefined

function connectTriggerElement(vnode: VNode) {
    const element = vnode.el
    if (!(element instanceof HTMLElement)) return

    const hasAssignedFallback = assignedFallback?.element === element && assignedFallback.id === element.id
    if (!element.id || (hasAssignedFallback && !vnode.props?.id)) {
        const id = triggerId.value || rootContext.triggerId
        if (element.id !== id) element.id = id
        assignedFallback = { element, id }
    } else {
        assignedFallback = undefined
    }
    rootContext.triggerElement.value = element
}

function disconnectTriggerElement(vnode: VNode) {
    const element = vnode.el
    if (assignedFallback?.element === element) assignedFallback = undefined
    if (rootContext.triggerElement.value === element) rootContext.triggerElement.value = undefined
}

const triggerHooks = {
    onVnodeMounted: connectTriggerElement,
    onVnodeUpdated: connectTriggerElement,
    onVnodeBeforeUnmount: disconnectTriggerElement,
}

function flattenSlot(nodes: VNode[]): VNode[] {
    return nodes.flatMap(node => node.type === Fragment ? flattenSlot(node.children as VNode[]) : [node])
}

// Reka 将属性交给插槽中的第一个节点，因此注册也跟随该节点的生命周期。
const TriggerElement = defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
        return () => {
            const primitiveProps = { as: props.as ?? 'button', asChild: props.asChild, ...(triggerId.value ? { id: triggerId.value } : {}) }
            const rekaProps = { ...attrs, as: props.as, asChild: true }
            if (!props.asChild) {
                return h(PopoverTriggerPrimitive, rekaProps, () => h(Primitive, { ...primitiveProps, ...triggerHooks }, slots))
            }

            const nodes = flattenSlot(slots.default?.() ?? [])
            const index = nodes.findIndex(node => node.type !== Comment)
            const node = nodes[index]
            if (!node || typeof node.type === 'symbol') return nodes

            nodes[index] = cloneVNode(node, triggerHooks)
            return h(PopoverTriggerPrimitive, rekaProps, () => h(Primitive, primitiveProps, { default: () => nodes }))
        }
    },
})
</script>

<template>
    <TriggerElement>
        <slot />
    </TriggerElement>
</template>
