<script setup lang="ts">
import { provide, computed, useSlots, cloneVNode, Fragment, type VNode } from 'vue'
import { cn } from '@/lib/utils'
import { timelineOrientationKey, timelineAlternateKey, type TimelineOrientation } from './timeline-key'
import { useLocale } from '@/composables/useLocale'
import TimelineItem from './TimelineItem.vue'

interface TimelineProps {
    orientation?: TimelineOrientation
    alternate?: boolean
    class?: string
}

const props = withDefaults(defineProps<TimelineProps>(), {
    orientation: 'vertical',
    alternate: false,
    class: undefined,
})

const { t } = useLocale()

provide(timelineOrientationKey, computed(() => props.orientation))
provide(timelineAlternateKey, computed(() => props.alternate && props.orientation === 'vertical'))

const slots = useSlots()

function flattenVNodes(vnodes: VNode[]): VNode[] {
    const result: VNode[] = []
    for (const vnode of vnodes) {
        if (vnode.type === Fragment || vnode.type === Symbol.for('v-fgt')) {
            if (Array.isArray(vnode.children)) {
                result.push(...flattenVNodes(vnode.children as VNode[]))
            }
        } else {
            result.push(vnode)
        }
    }
    return result
}

const RenderItems = () => {
    const raw = slots.default?.() ?? []
    const vnodes = flattenVNodes(Array.isArray(raw) ? raw : [raw])
    let itemIndex = 0
    return vnodes.map((vnode: VNode) => {
        if (vnode.type === TimelineItem) {
            const explicitIndex = vnode.props?.index
            return cloneVNode(vnode, {
                index: explicitIndex !== undefined ? explicitIndex : itemIndex++,
            })
        }
        return vnode
    })
}

const classes = computed(() =>
    cn(
        'flex w-full min-w-0',
        props.orientation === 'vertical' ? 'flex-col gap-6' : 'flex-row gap-6 items-start overflow-x-auto',
        props.class
    )
)
</script>

<template>
    <div :class="classes" role="list" :aria-label="t('timeline.label')">
        <RenderItems />
    </div>
</template>
