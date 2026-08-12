<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, type ComponentPublicInstance } from 'vue'
import { ListboxItem, useId } from 'reka-ui'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { commandItemVariants } from './command-variants'
import { injectCommandRootContext, injectCommandGroupContext } from './command-context'

interface CommandItemProps {
    value: string
    disabled?: boolean
    class?: ClassValue
}

const props = defineProps<CommandItemProps>()

const emit = defineEmits<{ select: [value: string] }>()

const rootContext = injectCommandRootContext()
const groupContext = injectCommandGroupContext(null)
const id = useId(undefined, 'brutx-command-item')

const itemRef = ref<ComponentPublicInstance | null>(null)

// setup 阶段同步注册（先以 value 兜底索引文本）：
// - 让过滤计算在首次渲染前即可看到本项，消除「未注册即放行」与闪烁窗口；
// - 条目元素随后按 v-if 卸载（隐藏）时 CommandItem 组件仍保持挂载，索引不会随隐藏丢失。
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

const isRender = computed(() => {
    if (!rootContext.filterSearch.value) return true
    const items = rootContext.filterState.value.items
    // disableFilter 或过滤计算尚未产出条目（防御分支）时不做过滤
    if (items.size === 0) return true
    return (items.get(id) ?? 0) > 0
})

// 索引文本读取：递归收集可见文本节点，跳过 hidden 属性 / aria-hidden="true" / sr-only 的
// 子元素（如仅 hover 显示的快捷键、装饰徽标），避免把屏幕不可见文本计入搜索索引——这是
// 原 innerText 语义（只取渲染可见文本）在 v-if 卸载改造后的延续。不做 getComputedStyle
// 判定：那会触发强制同步布局，违背用 textContent 换性能的初衷；纯 CSS display:none 的
// 隐藏内容仍会被计入，属已接受的行为边界。
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

function syncIndexText() {
    const el = itemRef.value?.$el as HTMLElement | undefined
    if (!el) return
    // 条目已由 v-show 改为 v-if：隐藏项被卸载、itemRef 为 null，隐藏项不再残留 DOM。
    // 读取时跳过显式隐藏子元素并 trim，避免把不可见文本计入搜索索引
    const text = getSearchableText(el).trim() || props.value
    if (rootContext.allItems.value.get(id) !== text)
        rootContext.allItems.value.set(id, text)
}

const classes = computed(() =>
    cn(commandItemVariants(), props.class)
)

// onMounted 覆盖首次挂载：初始 filterSearch 为空时全部条目可见、itemRef 可用，同步插槽显示文本；
// 否则索引停留在 setup 的 value 兜底，显示文本与 value 不一致时按显示文本搜索会漏匹配
// onUpdated 覆盖后续插槽内容变化（异步请求 / 国际化切换 / 条件渲染）时的索引同步；
// 隐藏条目 itemRef 为 null 会提前返回，重新可见时随 v-if 重新挂载再次同步、可自愈
onMounted(syncIndexText)
onUpdated(syncIndexText)

// 条目元素用 v-if 而非 v-show：display:none 的项仍会被 reka Listbox 键盘导航命中，
// 卸载可见性不匹配的项可使其从导航集合中移除（setup 同步注册保证隐藏后索引仍在，无死锁）。
onBeforeUnmount(() => {
    rootContext.allItems.value.delete(id)
    const groupId = groupContext?.id
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
        v-if="isRender"
        :id="id"
        ref="itemRef"
        :value="value"
        :disabled="disabled"
        :class="classes"
        data-slot="command-item"
        @select="emit('select', value)"
    >
        <slot />
    </ListboxItem>
</template>
