<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Search, X } from '@lucide/vue'
import { Button, Input } from 'brutx-ui-vue'
import { API_KINDS, type ApiGroup, type ApiKind } from '../../api-types'
import ComponentApiMember from './ComponentApiMember.vue'
import {
    getApiComponentAnchorId,
    getApiKindAnchorId,
    getApiMemberAnchorId,
    isLongApiType,
    matchesApiMember,
    matchesApiName,
    type ComponentApiMemberLabels,
} from './component-api-view'

type ApiSelection = ApiKind | 'all'
type CopyState = 'idle' | 'copied' | 'failed'

interface ComponentApiLabels {
    title: string
    search: string
    searchPlaceholder: string
    clearSearch: string
    componentFilter: string
    allComponents: string
    kinds: Record<ApiSelection, string>
    matchCount: string
    nameColumn: string
    descriptionColumn: string
    typeColumn: string
    defaultColumn: string
    noMetadata: string
    noApi: string
    missingSubcomponent: string
    noSearchMatches: string
    noKindMatches: string
    clearFilters: string
}

interface Props {
    name: string
    data: ApiGroup
    subcomponent?: string
    defaultTab?: ApiSelection
    instance?: string
}

const props = withDefaults(defineProps<Props>(), {
    subcomponent: undefined,
    defaultTab: 'all',
    instance: undefined,
})

const labels = computed(() => getLabels(props.data.locale))
const searchId = 'component-api-search-' + useId()
const searchQuery = ref('')
const activeKind = ref<ApiSelection>('all')
const selectedComponentId = ref('all')
const collapsedSections = ref(new Set<string>())
const collapsedTypes = ref(new Set<string>())
const copyStates = ref<Record<string, CopyState>>({})
const isHydrated = ref(false)
const copyTimers = new Map<string, ReturnType<typeof setTimeout>>()
const copyOperations = new Map<string, number>()
let pageGeneration = 0

const isNameResolved = computed(() => matchesApiName(props.name, props.data))
const fixedComponent = computed(() => {
    if (!props.subcomponent) return undefined
    const requestedName = props.subcomponent.trim().toLocaleLowerCase()
    return props.data.components.find(component =>
        component.name.trim().toLocaleLowerCase() === requestedName ||
        component.id.trim().toLocaleLowerCase() === requestedName,
    )
})

const baseComponents = computed(() => {
    if (!isNameResolved.value) return []
    if (props.subcomponent) return fixedComponent.value ? [fixedComponent.value] : []
    return props.data.components
})

const scopedComponents = computed(() => {
    if (selectedComponentId.value === 'all') return baseComponents.value
    return baseComponents.value.filter(component => component.id === selectedComponentId.value)
})

const allScopedMembers = computed(() => scopedComponents.value.flatMap(component =>
    component.members.map(member => ({ component, member, anchorId: getApiMemberAnchorId(member, props.instance) })),
))

const anchorableMembers = computed(() => baseComponents.value.flatMap(component =>
    component.members.map(member => ({ component, member, anchorId: getApiMemberAnchorId(member, props.instance) })),
))

const searchMatchedMembers = computed(() => allScopedMembers.value.filter(({ member }) =>
    matchesApiMember(member, searchQuery.value),
))

const kindCounts = computed<Record<ApiKind, number>>(() => Object.fromEntries(
    API_KINDS.map(kind => [kind, searchMatchedMembers.value.filter(item => item.member.kind === kind).length]),
) as Record<ApiKind, number>)

const visibleMembers = computed(() => activeKind.value === 'all'
    ? searchMatchedMembers.value
    : searchMatchedMembers.value.filter(item => item.member.kind === activeKind.value),
)

const hasMembersInScope = computed(() => scopedComponents.value.some(component => component.members.length > 0))
const isSubcomponentMissing = computed(() => !!props.subcomponent && !!isNameResolved.value && !fixedComponent.value)
const isEmptyApi = computed(() => isNameResolved.value && !isSubcomponentMissing.value && !hasMembersInScope.value)
const showSearchEmpty = computed(() => hasMembersInScope.value && searchQuery.value.trim().length > 0 && searchMatchedMembers.value.length === 0)
const showKindEmpty = computed(() => hasMembersInScope.value && !showSearchEmpty.value && visibleMembers.value.length === 0)
const showComponentName = computed(() => !props.subcomponent && props.data.components.length > 1)

const componentSections = computed(() => scopedComponents.value.map(component => {
    const kinds = API_KINDS.map(kind => {
        const sectionId = getApiKindAnchorId(component, kind, props.instance)
        const members = searchMatchedMembers.value.filter(item =>
            item.component.id === component.id &&
            item.member.kind === kind &&
            (activeKind.value === 'all' || activeKind.value === kind),
        )
        return {
            kind,
            sectionId,
            tableId: sectionId + '-members',
            members,
        }
    }).filter(section => section.members.length > 0)

    return {
        component,
        headingId: getApiComponentAnchorId(component, props.instance),
        kinds,
    }
}).filter(section => section.kinds.length > 0))

const visibleCountText = computed(() => labels.value.matchCount.replace('{count}', String(visibleMembers.value.length)))

function getLabels(locale: ApiGroup['locale']): ComponentApiLabels {
    if (locale === 'en') {
        return {
            title: 'API reference',
            search: 'Search API members',
            searchPlaceholder: 'Search names, types, or descriptions',
            clearSearch: 'Clear search',
            componentFilter: 'Filter by component',
            allComponents: 'All components',
            kinds: { all: 'All', props: 'Props', events: 'Events', slots: 'Slots', exposes: 'Exposes' },
            matchCount: '{count} matching API members',
            nameColumn: 'Name',
            descriptionColumn: 'Description',
            typeColumn: 'Type',
            defaultColumn: 'Default',
            noMetadata: 'API metadata could not be resolved for “{name}”.',
            noApi: 'This component group has no API members yet.',
            missingSubcomponent: 'The requested component “{name}” is not part of this API group.',
            noSearchMatches: 'No API members match “{query}”.',
            noKindMatches: 'No members in this category match the current filters.',
            clearFilters: 'Clear filters',
        }
    }

    return {
        title: 'API 参考',
        search: '搜索 API 成员',
        searchPlaceholder: '搜索名称、类型或说明',
        clearSearch: '清空搜索',
        componentFilter: '按组件筛选',
        allComponents: '全部组件',
        kinds: { all: '全部', props: '属性', events: '事件', slots: '插槽', exposes: '暴露成员' },
        matchCount: '匹配 {count} 项 API 成员',
        nameColumn: '名称',
        descriptionColumn: '说明',
        typeColumn: '类型',
        defaultColumn: '默认值',
        noMetadata: '无法解析“{name}”的 API 元数据。',
        noApi: '此组件组暂时没有 API 成员。',
        missingSubcomponent: '组件“{name}”不属于此 API 组。',
        noSearchMatches: '没有匹配“{query}”的 API 成员。',
        noKindMatches: '当前分类中没有符合筛选条件的成员。',
        clearFilters: '清空筛选',
    }
}

const memberLabels = computed<ComponentApiMemberLabels>(() => {
    if (props.data.locale === 'en') {
        return {
            required: 'Required',
            nullable: 'Nullable',
            readonly: 'Readonly',
            notApplicable: '—',
            notDeclared: 'Not declared',
            declaration: 'Declaration',
            resolution: 'Resolved value',
            fallback: 'Runtime fallback',
            source: 'Source',
            typeReferences: 'Referenced types',
            typeReferenceDefinition: 'Type definition',
            locateTypeReference: 'Locate {name} type definition',
            copyName: 'Copy member name',
            copyType: 'Copy full type',
            copied: 'Copied',
            copyFailed: 'Copy failed',
            expandType: 'Show full type',
            collapseType: 'Collapse type',
            typeLiterals: 'Literal values',
        }
    }

    return {
        required: '必填',
        nullable: '可空',
        readonly: '只读',
        notApplicable: '—',
        notDeclared: '未声明默认值',
        declaration: '声明',
        resolution: '解析值',
        fallback: '运行时回退',
        source: '来源',
        typeReferences: '关联类型',
        typeReferenceDefinition: '类型定义',
        locateTypeReference: '定位 {name} 类型定义',
        copyName: '复制成员名称',
        copyType: '复制完整类型',
        copied: '已复制',
        copyFailed: '复制失败',
        expandType: '展开完整类型',
        collapseType: '收起类型',
        typeLiterals: '字面量',
    }
})

function chooseKind(kind: ApiSelection) {
    if (kind !== 'all' && kindCounts.value[kind] === 0) return
    activeKind.value = kind
}

function isSectionExpanded(sectionId: string): boolean {
    return !collapsedSections.value.has(sectionId)
}

function toggleSection(sectionId: string) {
    const next = new Set(collapsedSections.value)
    if (next.has(sectionId)) next.delete(sectionId)
    else next.add(sectionId)
    collapsedSections.value = next
}

function isTypeCollapsed(anchorId: string): boolean {
    return collapsedTypes.value.has(anchorId)
}

function toggleType(anchorId: string) {
    const next = new Set(collapsedTypes.value)
    if (next.has(anchorId)) next.delete(anchorId)
    else next.add(anchorId)
    collapsedTypes.value = next
}

function collapseLongTypes() {
    collapsedTypes.value = new Set(props.data.components.flatMap(component =>
        component.members
            .filter(member => isLongApiType(member.type.text))
            .map(member => getApiMemberAnchorId(member, props.instance)),
    ))
}

function applyDefaultKind() {
    const requestedKind = props.defaultTab
    activeKind.value = requestedKind && requestedKind !== 'all' && kindCounts.value[requestedKind] > 0
        ? requestedKind
        : 'all'
}

function clearCopyTimer(key: string) {
    const timer = copyTimers.get(key)
    if (timer) clearTimeout(timer)
    copyTimers.delete(key)
}

async function copyToClipboard(text: string, key: string) {
    clearCopyTimer(key)
    const generation = pageGeneration
    const operation = (copyOperations.get(key) ?? 0) + 1
    copyOperations.set(key, operation)

    try {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            throw new Error('Clipboard API unavailable')
        }
        await navigator.clipboard.writeText(text)
        if (generation !== pageGeneration || copyOperations.get(key) !== operation) return
        copyStates.value = { ...copyStates.value, [key]: 'copied' }
    } catch {
        if (generation !== pageGeneration || copyOperations.get(key) !== operation) return
        copyStates.value = { ...copyStates.value, [key]: 'failed' }
    }

    copyTimers.set(key, setTimeout(() => {
        if (generation !== pageGeneration || copyOperations.get(key) !== operation) return
        const next = { ...copyStates.value }
        delete next[key]
        copyStates.value = next
        copyTimers.delete(key)
        copyOperations.delete(key)
    }, COPY_FEEDBACK_DURATION_MS))
}

function clearCopyFeedback() {
    pageGeneration += 1
    copyOperations.clear()
    for (const timer of copyTimers.values()) clearTimeout(timer)
    copyTimers.clear()
}

function decodeHash(value: string): string {
    const raw = value.startsWith('#') ? value.slice(1) : value
    try {
        return decodeURIComponent(raw)
    } catch {
        return raw
    }
}

function matchesHash(anchor: string, hash: string): boolean {
    return anchor === hash || decodeHash(anchor) === hash
}

function revealHashTarget(): boolean {
    if (typeof window === 'undefined' || !window.location.hash) return false
    const hash = decodeHash(window.location.hash)
    const member = anchorableMembers.value.find(item => matchesHash(item.anchorId, hash))
    const component = baseComponents.value.find(item =>
        matchesHash(getApiComponentAnchorId(item, props.instance), hash) ||
        API_KINDS.some(kind => matchesHash(getApiKindAnchorId(item, kind, props.instance), hash)),
    )
    const componentAnchors = component ? [getApiComponentAnchorId(component, props.instance), ...API_KINDS.map(kind => getApiKindAnchorId(component, kind, props.instance))] : []
    const targetId = member?.anchorId ?? componentAnchors.find(anchor => matchesHash(anchor, hash))
    if (!targetId) return false

    searchQuery.value = ''
    selectedComponentId.value = 'all'
    activeKind.value = 'all'
    collapsedSections.value = new Set()
    if (member) {
        const next = new Set(collapsedTypes.value)
        next.delete(member.anchorId)
        collapsedTypes.value = next
    }

    void nextTick(() => {
        const target = document.getElementById(targetId)
        if (!target) return

        target.focus({ preventScroll: true })
        const targetTop = window.scrollY + target.getBoundingClientRect().top - HASH_TARGET_TOP_OFFSET_PX
        if (Math.abs(targetTop - window.scrollY) > HASH_TARGET_SCROLL_THRESHOLD_PX) {
            window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' })
        }
    })
    return true
}

function resetPageState() {
    searchQuery.value = ''
    selectedComponentId.value = 'all'
    activeKind.value = 'all'
    collapsedSections.value = new Set()
    collapsedTypes.value = new Set()
    copyStates.value = {}
    clearCopyFeedback()

    if (isHydrated.value) {
        collapseLongTypes()
        if (!revealHashTarget()) applyDefaultKind()
    }
}

function handleHashChange() {
    if (!revealHashTarget()) return
}

watch(
    () => [props.name, props.data, props.data.id, props.data.locale, props.subcomponent, props.defaultTab, props.instance] as const,
    resetPageState,
)

watch([searchQuery, selectedComponentId], () => {
    if (activeKind.value !== 'all' && kindCounts.value[activeKind.value] === 0) activeKind.value = 'all'
})

onMounted(() => {
    isHydrated.value = true
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    collapseLongTypes()
    if (!revealHashTarget()) applyDefaultKind()
})

onBeforeUnmount(() => {
    window.removeEventListener('hashchange', handleHashChange)
    window.removeEventListener('popstate', handleHashChange)
    clearCopyFeedback()
})

const COPY_FEEDBACK_DURATION_MS = 1800
const HASH_TARGET_TOP_OFFSET_PX = 96
const HASH_TARGET_SCROLL_THRESHOLD_PX = 4
</script>

<template>
    <section class="component-api-root vp-raw my-8 overflow-hidden border-3 border-brutal rounded-brutal bg-brutal-bg text-brutal-fg shadow-brutal">
        <header class="border-b-3 border-brutal bg-brutal-muted px-4 py-3 sm:px-5">
            <h2 class="font-black tracking-tight text-lg sm:text-xl">{{ labels.title }}</h2>
            <p class="mt-1 text-sm text-brutal-muted-foreground">{{ props.data.name || props.name }}</p>
        </header>

        <div v-if="!isNameResolved" class="p-5" role="status">
            <p class="font-bold">{{ labels.noMetadata.replace('{name}', props.name) }}</p>
        </div>
        <div v-else-if="isSubcomponentMissing" class="p-5" role="status">
            <p class="font-bold">{{ labels.missingSubcomponent.replace('{name}', props.subcomponent || '') }}</p>
        </div>
        <div v-else-if="isEmptyApi" class="p-5" role="status">
            <p class="font-bold">{{ labels.noApi }}</p>
        </div>
        <template v-else>
            <div class="flex flex-col gap-4 border-b-2 border-brutal bg-brutal-muted px-4 py-4 md:flex-row md:items-end md:justify-between sm:px-5">
                <div class="min-w-0 flex-1">
                    <label :for="searchId" class="mb-2 block text-sm font-bold">{{ labels.search }}</label>
                    <div class="relative max-w-2xl">
                        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brutal-muted-foreground" aria-hidden="true" />
                        <Input
                            :id="searchId"
                            v-model="searchQuery"
                            type="search"
                            variant="default"
                            size="sm"
                            :placeholder="labels.searchPlaceholder"
                            :aria-labelledby="searchId + '-label'"
                            :class="searchQuery ? 'pr-12 pl-10' : 'pl-10'"
                        />
                        <span :id="searchId + '-label'" class="sr-only">{{ labels.search }}</span>
                        <Button
                            v-if="searchQuery"
                            size="icon"
                            variant="ghost"
                            class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                            :aria-label="labels.clearSearch"
                            :title="labels.clearSearch"
                            @click="searchQuery = ''"
                        >
                            <X class="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
                <p class="shrink-0 text-sm font-bold text-brutal-muted-foreground" role="status" aria-live="polite">
                    {{ visibleCountText }}
                </p>
            </div>

            <div v-if="!props.subcomponent && props.data.components.length > 1" class="border-b-2 border-brutal px-4 py-3 sm:px-5">
                <p class="mb-2 text-sm font-bold">{{ labels.componentFilter }}</p>
                <div class="flex flex-wrap gap-2" role="group" :aria-label="labels.componentFilter">
                    <Button
                        size="sm"
                        :variant="selectedComponentId === 'all' ? 'primary' : 'outline'"
                        :aria-pressed="selectedComponentId === 'all'"
                        @click="selectedComponentId = 'all'"
                    >
                        {{ labels.allComponents }}
                    </Button>
                    <Button
                        v-for="component in props.data.components"
                        :key="component.id"
                        size="sm"
                        :variant="selectedComponentId === component.id ? 'primary' : 'outline'"
                        :aria-pressed="selectedComponentId === component.id"
                        @click="selectedComponentId = component.id"
                    >
                        {{ component.name }}
                    </Button>
                </div>
            </div>

            <nav class="flex flex-wrap gap-2 border-b-2 border-brutal px-4 py-3 sm:px-5" :aria-label="labels.title">
                <Button
                    size="sm"
                    :variant="activeKind === 'all' ? 'secondary' : 'outline'"
                    :aria-pressed="activeKind === 'all'"
                    @click="chooseKind('all')"
                >
                    {{ labels.kinds.all }} ({{ searchMatchedMembers.length }})
                </Button>
                <Button
                    v-for="kind in API_KINDS"
                    :key="kind"
                    size="sm"
                    :variant="activeKind === kind ? 'secondary' : 'outline'"
                    :aria-pressed="activeKind === kind"
                    @click="chooseKind(kind)"
                >
                    {{ labels.kinds[kind] }} ({{ kindCounts[kind] }})
                </Button>
            </nav>

            <div v-if="showSearchEmpty" class="p-6 text-center" role="status">
                <p class="font-bold">{{ labels.noSearchMatches.replace('{query}', searchQuery.trim()) }}</p>
                <Button size="sm" variant="outline" class="mt-3" @click="searchQuery = ''">{{ labels.clearFilters }}</Button>
            </div>
            <div v-else-if="showKindEmpty" class="p-6 text-center" role="status">
                <p class="font-bold">{{ labels.noKindMatches }}</p>
                <Button size="sm" variant="outline" class="mt-3" @click="chooseKind('all')">{{ labels.kinds.all }}</Button>
            </div>
            <div v-else class="divide-y-3 divide-brutal">
                <section v-for="section in componentSections" :key="section.component.id" :id="section.headingId" tabindex="-1" class="component-api-group">
                    <h3 class="border-b-2 border-brutal bg-brutal-accent px-4 py-3 font-black tracking-tight text-brutal-accent-foreground sm:px-5">
                        {{ section.component.name }}
                    </h3>
                    <section v-for="kindSection in section.kinds" :key="kindSection.kind" :id="kindSection.sectionId" class="component-api-kind">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            class="component-api-kind-toggle !h-auto w-full justify-between rounded-brutal border-b-2 border-brutal bg-brutal-muted px-4 py-3 text-left font-bold transition-colors hover:bg-brutal-secondary sm:px-5"
                            :aria-expanded="isSectionExpanded(kindSection.sectionId)"
                            :aria-controls="kindSection.tableId"
                            @click="toggleSection(kindSection.sectionId)"
                        >
                            <span>{{ labels.kinds[kindSection.kind] }} ({{ kindSection.members.length }})</span>
                            <span aria-hidden="true">{{ isSectionExpanded(kindSection.sectionId) ? '−' : '+' }}</span>
                        </Button>
                        <table v-show="isSectionExpanded(kindSection.sectionId)" :id="kindSection.tableId" class="component-api-table w-full text-left">
                            <caption class="sr-only">{{ section.component.name }} — {{ labels.kinds[kindSection.kind] }}</caption>
                            <thead class="bg-brutal-bg text-sm font-bold">
                                <tr>
                                    <th scope="col">{{ labels.nameColumn }}</th>
                                    <th scope="col">{{ labels.descriptionColumn }}</th>
                                    <th scope="col">{{ labels.typeColumn }}</th>
                                    <th scope="col">{{ labels.defaultColumn }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ComponentApiMember
                                    v-for="item in kindSection.members"
                                    :key="item.anchorId"
                                    :member="item.member"
                                    :component="item.component"
                                    :locale="props.data.locale"
                                    :anchor-id="item.anchorId"
                                    :type-id="item.anchorId + '-type'"
                                    :show-component="showComponentName"
                                    :type-collapsed="isTypeCollapsed(item.anchorId)"
                                    :name-copy-state="copyStates[item.anchorId + '-name'] || 'idle'"
                                    :type-copy-state="copyStates[item.anchorId + '-type-copy'] || 'idle'"
                                    :labels="memberLabels"
                                    @copy="copyToClipboard"
                                    @toggle-type="toggleType"
                                />
                            </tbody>
                        </table>
                    </section>
                </section>
            </div>
        </template>
    </section>
</template>

<style scoped>
.component-api-root {
    --vp-code-color: var(--brutal-fg);
}

.component-api-root :deep(a) {
    color: var(--brutal-fg);
}

.component-api-table {
    table-layout: fixed;
    border-collapse: collapse;
}

.component-api-table th,
.component-api-table td {
    min-width: 0;
    overflow-wrap: anywhere;
}

.component-api-table th {
    border-bottom: 2px solid var(--brutal-border-color);
    padding: 0.75rem;
    text-align: left;
}

.component-api-table th:nth-child(1) {
    width: 18%;
}

.component-api-table th:nth-child(2) {
    width: 34%;
}

.component-api-table th:nth-child(3) {
    width: 32%;
}

.component-api-table th:nth-child(4) {
    width: 16%;
}

.component-api-table :deep(.component-api-member + .component-api-member) {
    border-top: 1px solid color-mix(in srgb, var(--brutal-border-color) 28%, transparent);
}

.component-api-table :deep(.component-api-member),
.component-api-group,
.component-api-kind {
    scroll-margin-top: 6rem;
}

@media (max-width: 48rem) {
    .component-api-table,
    .component-api-table tbody {
        display: block;
        width: 100%;
    }

    .component-api-table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .component-api-table :deep(tr.component-api-member) {
        display: flex;
        flex-direction: column;
        margin: 0.75rem;
        border: 3px solid var(--brutal-border-color);
        background: var(--brutal-bg);
    }

    .component-api-table :deep(tr.component-api-member td) {
        display: grid;
        grid-template-columns: minmax(5.5rem, 24%) minmax(0, 1fr);
        gap: 0.75rem;
        border-bottom: 1px solid color-mix(in srgb, var(--brutal-border-color) 28%, transparent);
    }

    .component-api-table :deep(tr.component-api-member td::before) {
        content: attr(data-label);
        color: var(--brutal-muted-foreground);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .component-api-table :deep(tr.component-api-member td:last-child) {
        border-bottom: 0;
    }
}
</style>
