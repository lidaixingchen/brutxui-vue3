<script setup lang="ts">
import { defineComponent, h, type VNodeChild } from 'vue'

interface Props {
    text: string
}

const props = defineProps<Props>()

function resolveHref(value: string): string | undefined {
    const href = value.trim()
    if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href
    if (/^(#|\?)/.test(href)) return href
    if (/^\/(?!\/)|^\.\.?\//.test(href)) return href
    return undefined
}

function renderDescription() {
    const nodes: VNodeChild[] = []
    const token = /\[([^\]]+)\]\(([^\s)]+)\)|`([^`]+)`/g
    let cursor = 0

    for (const match of props.text.matchAll(token)) {
        const index = match.index ?? 0
        if (index > cursor) nodes.push(props.text.slice(cursor, index))

        const label = match[1]
        const href = match[2]
        const code = match[3]
        if (label !== undefined && href !== undefined) {
            const safeHref = resolveHref(href)
            if (safeHref) {
                const external = /^https?:\/\//i.test(safeHref)
                nodes.push(h('a', {
                    href: safeHref,
                    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
                    class: 'font-bold underline underline-offset-2 text-brutal-fg',
                }, label))
            } else {
                nodes.push(match[0])
            }
        } else if (code !== undefined) {
            nodes.push(h('code', { class: 'px-1 py-0.5 font-mono text-brutal-fg bg-brutal-muted border border-brutal' }, code))
        } else {
            nodes.push(match[0])
        }
        cursor = index + match[0].length
    }

    if (cursor < props.text.length) nodes.push(props.text.slice(cursor))
    return nodes
}

defineOptions({
    inheritAttrs: false,
})

const DescriptionContent = defineComponent({
    name: 'ComponentApiDescriptionContent',
    setup: () => renderDescription,
})
</script>

<template>
    <span class="component-api-description whitespace-pre-line break-words leading-relaxed">
        <DescriptionContent />
    </span>
</template>
