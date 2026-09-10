<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronDown, ChevronRight, X, Copy, Check } from '@lucide/vue'
import apiManifest from '../../api-manifest.json'

interface ComponentPropMeta {
    name: string
    type: string
    required: boolean
    default: string
    description: string
}

interface ComponentEventMeta {
    name: string
    payload: string
    description: string
}

interface ComponentSlotMeta {
    name: string
    props: string
    description: string
}

interface ComponentExposeMeta {
    name: string
    type: string
    description: string
}

interface ComponentDocMeta {
    name: string
    kebabName: string
    dirName: string
    category: string
    description: string
    filePath: string
    props: ComponentPropMeta[]
    events: ComponentEventMeta[]
    slots: ComponentSlotMeta[]
    exposes: ComponentExposeMeta[]
}

interface ComponentGroupDoc {
    name: string
    category: string
    components: ComponentDocMeta[]
}

interface ApiManifestData {
    generatedAt: string
    totalComponents: number
    totalGroups: number
    groups: Record<string, ComponentGroupDoc>
    components: Record<string, ComponentDocMeta>
}

const manifest = apiManifest as unknown as ApiManifestData

interface Props {
    name: string
    subcomponent?: string
    hideSubcomponents?: boolean
    defaultTab?: 'all' | 'props' | 'events' | 'slots' | 'exposes'
}

const props = withDefaults(defineProps<Props>(), {
    subcomponent: undefined,
    hideSubcomponents: false,
    defaultTab: 'all',
})

// 搜索关键词
const searchQuery = ref('')
// 当前激活的一级分类 Tab ('all' | 'props' | 'events' | 'slots' | 'exposes')
const activeSection = ref<'all' | 'props' | 'events' | 'slots' | 'exposes'>(props.defaultTab)

// 各区块独立展开折叠状态
const isPropsExpanded = ref(true)
const isEventsExpanded = ref(true)
const isSlotsExpanded = ref(true)
const isExposesExpanded = ref(true)

// 复制提示状态记录
const copiedPropKey = ref<string | null>(null)

function copyToClipboard(text: string, key: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            copiedPropKey.value = key
            setTimeout(() => {
                if (copiedPropKey.value === key) {
                    copiedPropKey.value = null
                }
            }, 1500)
        }).catch(() => {})
    }
}

// 解析可用的组件列表
const resolvedComponents = computed<ComponentDocMeta[]>(() => {
    const rawName = props.name.trim()
    const lowerName = rawName.toLowerCase()
    const kebabName = rawName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

    // 1. 尝试从 groups 寻找组件组（如 "button", "alert", "dialog"）
    const group = manifest.groups[lowerName] || manifest.groups[kebabName] || manifest.groups[rawName]
    if (group && group.components.length > 0) {
        return group.components
    }

    // 2. 尝试从 components 单一组件表寻找
    const single = manifest.components[rawName] || manifest.components[lowerName] || manifest.components[kebabName]
    if (single) {
        return [single]
    }

    return []
})

// 当前选中的子组件名称
const activeComponentName = ref<string>('')

// 初始化与同步选中组件
const currentComponent = computed<ComponentDocMeta | null>(() => {
    const list = resolvedComponents.value
    if (list.length === 0) return null

    if (props.subcomponent) {
        const found = list.find(
            c => c.name.toLowerCase() === props.subcomponent?.toLowerCase()
        )
        if (found) return found
    }

    if (activeComponentName.value) {
        const found = list.find(c => c.name === activeComponentName.value)
        if (found) return found
    }

    return list[0]
})

// 过滤后的 Props
const filteredProps = computed<ComponentPropMeta[]>(() => {
    const comp = currentComponent.value
    if (!comp) return []
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return comp.props
    return comp.props.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.type.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q)
    )
})

// 过滤后的 Events
const filteredEvents = computed<ComponentEventMeta[]>(() => {
    const comp = currentComponent.value
    if (!comp) return []
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return comp.events
    return comp.events.filter(
        e => e.name.toLowerCase().includes(q) ||
             e.payload.toLowerCase().includes(q) ||
             e.description.toLowerCase().includes(q)
    )
})

// 过滤后的 Slots
const filteredSlots = computed<ComponentSlotMeta[]>(() => {
    const comp = currentComponent.value
    if (!comp) return []
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return comp.slots
    return comp.slots.filter(
        s => s.name.toLowerCase().includes(q) ||
             s.props.toLowerCase().includes(q) ||
             s.description.toLowerCase().includes(q)
    )
})

// 过滤后的 Exposes
const filteredExposes = computed<ComponentExposeMeta[]>(() => {
    const comp = currentComponent.value
    if (!comp) return []
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return comp.exposes
    return comp.exposes.filter(
        exp => exp.name.toLowerCase().includes(q) ||
               exp.type.toLowerCase().includes(q) ||
               exp.description.toLowerCase().includes(q)
    )
})

// 统计总命中数
const totalMatchesCount = computed<number>(() => {
    return (
        filteredProps.value.length +
        filteredEvents.value.length +
        filteredSlots.value.length +
        filteredExposes.value.length
    )
})

// 类型解析为徽标与字面量集合
function parseTypeChips(typeStr: string): { isUnion: boolean; parts: string[] } {
    const trimmed = typeStr.trim()
    const unionParts = trimmed.split(/\s*\|\s*/).map(p => p.trim()).filter(Boolean)
    const isUnion = unionParts.length > 1 && unionParts.every(p => /^'[^']*'|"[^"]*"|boolean|number|string$/.test(p))
    return {
        isUnion,
        parts: isUnion ? unionParts : [trimmed],
    }
}

function getTypeBadgeStyle(type: string): string {
    const t = type.toLowerCase()
    if (t === 'boolean') {
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-500'
    }
    if (t === 'string' || t.startsWith("'") || t.startsWith('"')) {
        return 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-500'
    }
    if (t === 'number') {
        return 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 border-sky-500'
    }
    if (t.includes('=>') || t.includes('function')) {
        return 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border-rose-500'
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-zinc-400'
}
</script>

<template>
    <div class="component-api-root vp-raw my-8 text-black dark:text-zinc-100 font-sans">
        <!-- 未找到元数据警示框 -->
        <div
            v-if="resolvedComponents.length === 0"
            class="p-4 border-3 border-black dark:border-white bg-amber-200 dark:bg-amber-950 text-black dark:text-amber-100 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]"
        >
            <div class="font-black text-base flex items-center gap-2">
                <span>⚠️</span>
                <span>未找到组件 "{{ name }}" 的 API 元数据</span>
            </div>
            <p class="mt-2 text-sm">
                请确认组件名称无误（大小写敏感或 kebab-case），或在项目根目录运行
                <code class="px-1.5 py-0.5 font-mono bg-black text-white dark:bg-white dark:text-black">pnpm --filter brutx-ui-vue docs:manifest</code>
                更新元数据缓存。
            </p>
        </div>

        <div v-else class="border-3 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[5px_5px_0px_0px_#000] dark:shadow-[5px_5px_0px_0px_#fff]">
            <!-- 顶栏：子组件切换 Tabs（若多于 1 个且未被隐藏） -->
            <div
                v-if="resolvedComponents.length > 1 && !hideSubcomponents"
                class="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 border-b-3 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800"
            >
                <span class="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1 select-none">
                    组件成员:
                </span>
                <button
                    v-for="comp in resolvedComponents"
                    :key="comp.name"
                    type="button"
                    class="px-3 py-1 text-xs font-mono font-bold tracking-tight border-2 border-black dark:border-white transition-transform active:translate-x-0.5 active:translate-y-0.5"
                    :class="currentComponent?.name === comp.name
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]'
                        : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
                    @click="activeComponentName = comp.name"
                >
                    &lt;{{ comp.name }} /&gt;
                </button>
            </div>

            <!-- 工具栏：搜索筛选与分类过滤 -->
            <div class="p-4 border-b-2 border-black/80 dark:border-white/80 bg-zinc-50 dark:bg-zinc-900/90 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <!-- 搜索框 -->
                <div class="relative flex-1 max-w-md">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400 pointer-events-none" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="搜索属性、事件、插槽或类型..."
                        class="w-full pl-9 pr-8 py-1.5 text-xs font-mono border-2 border-black dark:border-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brutal-ring shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] placeholder:text-zinc-400"
                    />
                    <button
                        v-if="searchQuery"
                        type="button"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-black dark:hover:text-white"
                        @click="searchQuery = ''"
                    >
                        <X class="w-3.5 h-3.5" />
                    </button>
                </div>

                <!-- 分类过滤 Chips -->
                <div class="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
                    <button
                        type="button"
                        class="px-2 py-1 border border-black dark:border-white transition-all"
                        :class="activeSection === 'all'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'"
                        @click="activeSection = 'all'"
                    >
                        全部 ({{ totalMatchesCount }})
                    </button>
                    <button
                        type="button"
                        class="px-2 py-1 border border-black dark:border-white transition-all"
                        :class="activeSection === 'props'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'"
                        @click="activeSection = 'props'"
                    >
                        Props ({{ filteredProps.length }})
                    </button>
                    <button
                        v-if="currentComponent?.events.length || filteredEvents.length"
                        type="button"
                        class="px-2 py-1 border border-black dark:border-white transition-all"
                        :class="activeSection === 'events'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'"
                        @click="activeSection = 'events'"
                    >
                        Events ({{ filteredEvents.length }})
                    </button>
                    <button
                        v-if="currentComponent?.slots.length || filteredSlots.length"
                        type="button"
                        class="px-2 py-1 border border-black dark:border-white transition-all"
                        :class="activeSection === 'slots'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'"
                        @click="activeSection = 'slots'"
                    >
                        Slots ({{ filteredSlots.length }})
                    </button>
                    <button
                        v-if="currentComponent?.exposes.length || filteredExposes.length"
                        type="button"
                        class="px-2 py-1 border border-black dark:border-white transition-all"
                        :class="activeSection === 'exposes'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'"
                        @click="activeSection = 'exposes'"
                    >
                        Expose ({{ filteredExposes.length }})
                    </button>
                </div>
            </div>

            <!-- 空搜索状态 -->
            <div
                v-if="totalMatchesCount === 0"
                class="p-8 text-center bg-white dark:bg-zinc-900"
            >
                <div class="text-zinc-400 font-mono text-sm">未匹配到包含 "{{ searchQuery }}" 的 API 项目</div>
                <button
                    type="button"
                    class="mt-3 px-3 py-1 text-xs font-mono font-bold border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                    @click="searchQuery = ''"
                >
                    清空筛选
                </button>
            </div>

            <!-- 数据表格区 -->
            <div v-else class="divide-y-3 divide-black dark:divide-white">
                <!-- 1. Props 区块 -->
                <section v-if="(activeSection === 'all' || activeSection === 'props') && filteredProps.length > 0">
                    <button
                        type="button"
                        class="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 flex items-center justify-between font-black text-xs uppercase tracking-wider text-left border-b border-black dark:border-white select-none transition-colors"
                        @click="isPropsExpanded = !isPropsExpanded"
                    >
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-amber-400 inline-block border border-black dark:border-white" />
                            <span>Props 属性 ({{ filteredProps.length }})</span>
                        </div>
                        <component :is="isPropsExpanded ? ChevronDown : ChevronRight" class="w-4 h-4" />
                    </button>

                    <div v-show="isPropsExpanded" class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                                    <th class="py-2.5 px-4 w-44">属性名</th>
                                    <th class="py-2.5 px-4 min-w-[200px]">说明</th>
                                    <th class="py-2.5 px-4 min-w-[220px]">类型</th>
                                    <th class="py-2.5 px-4 w-40">默认值</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
                                <tr
                                    v-for="prop in filteredProps"
                                    :key="prop.name"
                                    class="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                                >
                                    <!-- 属性名 -->
                                    <td class="py-3 px-4 font-mono align-top">
                                        <div class="flex items-center gap-1.5">
                                            <span class="font-bold text-black dark:text-white">{{ prop.name }}</span>
                                            <span
                                                v-if="prop.required"
                                                class="px-1 text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white border border-black dark:border-white shadow-[1px_1px_0px_0px_#000]"
                                                title="必填属性"
                                            >
                                                必填
                                            </span>
                                            <button
                                                type="button"
                                                class="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-black dark:hover:text-white p-0.5 transition-opacity"
                                                title="复制属性名"
                                                @click="copyToClipboard(prop.name, `prop-${prop.name}`)"
                                            >
                                                <component :is="copiedPropKey === `prop-${prop.name}` ? Check : Copy" class="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>

                                    <!-- 说明 -->
                                    <td class="py-3 px-4 text-zinc-700 dark:text-zinc-300 align-top leading-relaxed">
                                        <div v-html="prop.description" />
                                    </td>

                                    <!-- 类型 -->
                                    <td class="py-3 px-4 font-mono align-top">
                                        <div class="flex flex-wrap gap-1 items-center">
                                            <template v-if="parseTypeChips(prop.type).isUnion">
                                                <span
                                                    v-for="chip in parseTypeChips(prop.type).parts"
                                                    :key="chip"
                                                    class="px-1.5 py-0.5 border text-[11px] font-bold rounded-none"
                                                    :class="getTypeBadgeStyle(chip)"
                                                >
                                                    {{ chip }}
                                                </span>
                                            </template>
                                            <template v-else>
                                                <span
                                                    class="px-1.5 py-0.5 border text-[11px] font-bold rounded-none break-all"
                                                    :class="getTypeBadgeStyle(prop.type)"
                                                >
                                                    {{ prop.type }}
                                                </span>
                                            </template>
                                        </div>
                                    </td>

                                    <!-- 默认值 -->
                                    <td class="py-3 px-4 font-mono align-top text-zinc-600 dark:text-zinc-400">
                                        <span
                                            v-if="prop.default !== '-'"
                                            class="px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold break-all"
                                        >
                                            {{ prop.default }}
                                        </span>
                                        <span v-else class="text-zinc-400 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- 2. Events 区块 -->
                <section v-if="(activeSection === 'all' || activeSection === 'events') && filteredEvents.length > 0">
                    <button
                        type="button"
                        class="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 flex items-center justify-between font-black text-xs uppercase tracking-wider text-left border-b border-black dark:border-white select-none transition-colors"
                        @click="isEventsExpanded = !isEventsExpanded"
                    >
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-400 inline-block border border-black dark:border-white" />
                            <span>Events 事件 ({{ filteredEvents.length }})</span>
                        </div>
                        <component :is="isEventsExpanded ? ChevronDown : ChevronRight" class="w-4 h-4" />
                    </button>

                    <div v-show="isEventsExpanded" class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                                    <th class="py-2.5 px-4 w-44">事件名</th>
                                    <th class="py-2.5 px-4 min-w-[200px]">说明</th>
                                    <th class="py-2.5 px-4 min-w-[220px]">参数定义 (Payload)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
                                <tr
                                    v-for="event in filteredEvents"
                                    :key="event.name"
                                    class="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                                >
                                    <td class="py-3 px-4 font-mono font-bold text-black dark:text-white align-top">
                                        @{{ event.name }}
                                    </td>
                                    <td class="py-3 px-4 text-zinc-700 dark:text-zinc-300 align-top leading-relaxed">
                                        <div v-html="event.description" />
                                    </td>
                                    <td class="py-3 px-4 font-mono align-top">
                                        <span class="px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold break-all">
                                            {{ event.payload }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- 3. Slots 区块 -->
                <section v-if="(activeSection === 'all' || activeSection === 'slots') && filteredSlots.length > 0">
                    <button
                        type="button"
                        class="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 flex items-center justify-between font-black text-xs uppercase tracking-wider text-left border-b border-black dark:border-white select-none transition-colors"
                        @click="isSlotsExpanded = !isSlotsExpanded"
                    >
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-sky-400 inline-block border border-black dark:border-white" />
                            <span>Slots 插槽 ({{ filteredSlots.length }})</span>
                        </div>
                        <component :is="isSlotsExpanded ? ChevronDown : ChevronRight" class="w-4 h-4" />
                    </button>

                    <div v-show="isSlotsExpanded" class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                                    <th class="py-2.5 px-4 w-44">插槽名</th>
                                    <th class="py-2.5 px-4 min-w-[200px]">说明</th>
                                    <th class="py-2.5 px-4 min-w-[220px]">作用域参数 (Props)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
                                <tr
                                    v-for="slot in filteredSlots"
                                    :key="slot.name"
                                    class="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                                >
                                    <td class="py-3 px-4 font-mono font-bold text-black dark:text-white align-top">
                                        #{{ slot.name }}
                                    </td>
                                    <td class="py-3 px-4 text-zinc-700 dark:text-zinc-300 align-top leading-relaxed">
                                        <div v-html="slot.description" />
                                    </td>
                                    <td class="py-3 px-4 font-mono align-top">
                                        <span
                                            v-if="slot.props !== '-'"
                                            class="px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold break-all"
                                        >
                                            {{ slot.props }}
                                        </span>
                                        <span v-else class="text-zinc-400 dark:text-zinc-600">-</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- 4. Expose 区块 -->
                <section v-if="(activeSection === 'all' || activeSection === 'exposes') && filteredExposes.length > 0">
                    <button
                        type="button"
                        class="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 flex items-center justify-between font-black text-xs uppercase tracking-wider text-left border-b border-black dark:border-white select-none transition-colors"
                        @click="isExposesExpanded = !isExposesExpanded"
                    >
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-rose-400 inline-block border border-black dark:border-white" />
                            <span>Expose 暴露方法与属性 ({{ filteredExposes.length }})</span>
                        </div>
                        <component :is="isExposesExpanded ? ChevronDown : ChevronRight" class="w-4 h-4" />
                    </button>

                    <div v-show="isExposesExpanded" class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                                    <th class="py-2.5 px-4 w-44">方法 / 属性名</th>
                                    <th class="py-2.5 px-4 min-w-[200px]">说明</th>
                                    <th class="py-2.5 px-4 min-w-[220px]">签名 / 类型</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-sans">
                                <tr
                                    v-for="expose in filteredExposes"
                                    :key="expose.name"
                                    class="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                                >
                                    <td class="py-3 px-4 font-mono font-bold text-black dark:text-white align-top">
                                        {{ expose.name }}
                                    </td>
                                    <td class="py-3 px-4 text-zinc-700 dark:text-zinc-300 align-top leading-relaxed">
                                        <div v-html="expose.description" />
                                    </td>
                                    <td class="py-3 px-4 font-mono align-top">
                                        <span class="px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold break-all">
                                            {{ expose.type }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>
