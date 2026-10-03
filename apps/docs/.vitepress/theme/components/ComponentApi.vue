<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { Search, X } from '@lucide/vue'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger } from 'brutx-ui-vue'
import { SelectValue } from 'reka-ui'
import { API_KINDS, type ApiGroup, type ApiKind } from '../../api-types'
import ComponentApiMember from './ComponentApiMember.vue'
import {
    getApiComponentAnchorId,
    getApiKindAnchorId,
    getApiMemberAnchorId,
    getApiTypeReferenceAnchorId,
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
    kindFilter: string
    kinds: Record<ApiSelection, string>
    matchCount: string
    nameColumn: string
    descriptionColumn: string
    typeColumn: string
    signatureColumn: string
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
const rootElement = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const activeKind = ref<ApiSelection>('all')
const selectedComponentId = ref('all')
const collapsedSections = ref(new Set<string>())
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

const availableKinds = computed(() => API_KINDS.filter(kind =>
    scopedComponents.value.some(component => component.members.some(member => member.kind === kind)),
))

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
const showComponentName = computed(() => props.data.components.length > 1)

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
            kindFilter: 'Filter by category',
            kinds: { all: 'All', props: 'Props', events: 'Events', slots: 'Slots', exposes: 'Exposes' },
            matchCount: '{count} matching API members',
            nameColumn: 'Name',
            descriptionColumn: 'Description',
            typeColumn: 'Type',
            signatureColumn: 'Signature or type',
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
        kindFilter: '按分类筛选',
        kinds: { all: '全部', props: '属性', events: '事件', slots: '插槽', exposes: '暴露成员' },
        matchCount: '匹配 {count} 项 API 成员',
        nameColumn: '名称',
        descriptionColumn: '说明',
        typeColumn: '类型',
        signatureColumn: '签名或类型',
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
            notDeclared: 'Not declared',
            details: 'Details',
            rawType: 'Declared type',
            defaultDetails: 'Default value details',
            declaration: 'Declaration',
            resolution: 'Resolved value',
            resolutionExpression: 'Resolution expression',
            fallback: 'Runtime fallback',
            fallbackExplanation: 'Applied by the component under the documented runtime conditions.',
            factoryInstance: 'Factory evaluated per instance',
            source: 'Source',
            typeReferences: 'Referenced types',
            typeReferenceDefinition: 'Type definition',
            locateTypeReference: 'Locate {name} type definition',
            copyName: 'Copy member name',
            copyType: 'Copy full type',
            copied: 'Copied',
            copyFailed: 'Copy failed',
            typeLiterals: 'Literal values',
        }
    }

    return {
        required: '必填',
        nullable: '可空',
        readonly: '只读',
        notDeclared: '未声明默认值',
        details: '详情',
        rawType: '声明类型',
        defaultDetails: '默认值详情',
        declaration: '声明',
        resolution: '解析值',
        resolutionExpression: '解析表达式',
        fallback: '运行时回退',
        fallbackExplanation: '组件在说明的运行条件下采用此回退值。',
        factoryInstance: '按实例调用工厂函数',
        source: '来源',
        typeReferences: '关联类型',
        typeReferenceDefinition: '类型定义',
        locateTypeReference: '定位 {name} 类型定义',
        copyName: '复制成员名称',
        copyType: '复制完整类型',
        copied: '已复制',
        copyFailed: '复制失败',
        typeLiterals: '字面量',
    }
})

function isSectionExpanded(sectionId: string): boolean {
    return !collapsedSections.value.has(sectionId)
}

function toggleSection(sectionId: string) {
    const next = new Set(collapsedSections.value)
    if (next.has(sectionId)) next.delete(sectionId)
    else next.add(sectionId)
    collapsedSections.value = next
}

function applyDefaultKind() {
    const requestedKind = props.defaultTab
    activeKind.value = requestedKind && requestedKind !== 'all' && availableKinds.value.includes(requestedKind)
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
    const typeReference = anchorableMembers.value.flatMap(item => item.member.type.references.map((reference, index) => ({
        member: item,
        targetId: getApiTypeReferenceAnchorId(item.anchorId, index),
    }))).find(reference => matchesHash(reference.targetId, hash))
    const component = baseComponents.value.find(item =>
        matchesHash(getApiComponentAnchorId(item, props.instance), hash) ||
        API_KINDS.some(kind => matchesHash(getApiKindAnchorId(item, kind, props.instance), hash)),
    )
    const componentAnchors = component ? [getApiComponentAnchorId(component, props.instance), ...API_KINDS.map(kind => getApiKindAnchorId(component, kind, props.instance))] : []
    const targetId = typeReference?.targetId ?? member?.anchorId ?? componentAnchors.find(anchor => matchesHash(anchor, hash))
    if (!targetId) return false

    searchQuery.value = ''
    selectedComponentId.value = 'all'
    activeKind.value = 'all'
    collapsedSections.value = new Set()

    void nextTick(() => {
        const target = document.getElementById(targetId)
        if (!target) return

        let ancestor: HTMLElement | null = target
        while (ancestor) {
            if (ancestor.tagName === 'DETAILS') (ancestor as HTMLDetailsElement).open = true
            ancestor = ancestor.parentElement
        }
        target.focus({ preventScroll: true })
        const targetTop = window.scrollY + target.getBoundingClientRect().top - HASH_TARGET_TOP_OFFSET_PX
        if (Math.abs(targetTop - window.scrollY) > HASH_TARGET_SCROLL_THRESHOLD_PX) {
            window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' })
        }
    })
    return true
}

function resetPageState() {
    for (const details of rootElement.value?.querySelectorAll<HTMLDetailsElement>('details[open]') ?? []) {
        details.open = false
    }
    searchQuery.value = ''
    selectedComponentId.value = 'all'
    activeKind.value = 'all'
    collapsedSections.value = new Set()
    copyStates.value = {}
    clearCopyFeedback()

    if (isHydrated.value) {
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

watch(selectedComponentId, () => {
    if (activeKind.value !== 'all' && !availableKinds.value.includes(activeKind.value)) activeKind.value = 'all'
})

onMounted(() => {
    isHydrated.value = true
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
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
    <section ref="rootElement" class="component-api-root vp-raw my-8 overflow-hidden border-3 border-brutal rounded-brutal bg-brutal-bg text-brutal-fg shadow-brutal" :aria-label="labels.title">
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
            <div v-if="isHydrated" class="component-api-controls flex flex-wrap items-end gap-3 border-b-2 border-brutal bg-brutal-muted px-4 py-3 sm:px-5">
                <div class="component-api-search min-w-48 flex-1">
                    <label :for="searchId" class="mb-1 block text-sm font-bold">{{ labels.search }}</label>
                    <div class="relative">
                        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brutal-muted-foreground" aria-hidden="true" />
                        <Input
                            :id="searchId"
                            v-model="searchQuery"
                            type="search"
                            variant="default"
                            size="sm"
                            :placeholder="labels.searchPlaceholder"
                            :class="searchQuery ? 'pr-12 pl-10' : 'pl-10'"
                        />
                        <Button
                            v-if="searchQuery"
                            size="icon"
                            variant="ghost"
                            class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 shadow-none"
                            :aria-label="labels.clearSearch"
                            :title="labels.clearSearch"
                            @click="searchQuery = ''"
                        >
                            <X class="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
                <div v-if="showComponentName && !props.subcomponent" class="component-api-filter">
                    <label :for="searchId + '-component-trigger'" class="mb-1 block text-sm font-bold">{{ labels.componentFilter }}</label>
                    <Select :key="props.data.locale" v-model="selectedComponentId">
                        <SelectTrigger :id="searchId + '-component-trigger'" class="component-api-select-trigger h-9 min-w-40 shadow-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden">
                            <SelectValue :placeholder="labels.allComponents" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{{ labels.allComponents }}</SelectItem>
                            <SelectItem v-for="component in props.data.components" :key="component.id" :value="component.id">
                                {{ component.name }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <p class="component-api-match-count ml-auto text-sm font-bold text-brutal-muted-foreground" role="status" aria-live="polite">
                    {{ visibleCountText }}
                </p>
            </div>
            <nav v-if="isHydrated" class="component-api-category-filter flex flex-wrap gap-1 border-b-2 border-brutal px-3 py-2" :aria-label="labels.kindFilter">
                <Button size="sm" variant="ghost" class="component-api-category-button h-8 px-3" :aria-pressed="activeKind === 'all'" @click="activeKind = 'all'">
                    {{ labels.kinds.all }} <span class="component-api-category-count">{{ searchMatchedMembers.length }}</span>
                </Button>
                <Button v-for="kind in availableKinds" :key="kind" size="sm" variant="ghost" class="component-api-category-button h-8 px-3" :aria-pressed="activeKind === kind" @click="activeKind = kind">
                    {{ labels.kinds[kind] }} <span class="component-api-category-count">{{ kindCounts[kind] }}</span>
                </Button>
            </nav>

            <div v-if="showSearchEmpty" class="p-6 text-center" role="status">
                <p class="font-bold">{{ labels.noSearchMatches.replace('{query}', searchQuery.trim()) }}</p>
                <Button size="sm" variant="outline" class="mt-3 shadow-none" @click="searchQuery = ''">{{ labels.clearFilters }}</Button>
            </div>
            <div v-else-if="showKindEmpty" class="p-6 text-center" role="status">
                <p class="font-bold">{{ labels.noKindMatches }}</p>
                <Button size="sm" variant="outline" class="mt-3 shadow-none" @click="activeKind = 'all'">{{ labels.kinds.all }}</Button>
            </div>
            <div v-else class="divide-y-2 divide-brutal">
                <section v-for="section in componentSections" :id="section.headingId" :key="section.component.id" tabindex="-1" class="component-api-group">
                    <h3 v-if="showComponentName" class="border-b-2 border-brutal bg-brutal-accent px-4 py-2 font-black tracking-tight text-brutal-accent-foreground sm:px-5">
                        {{ section.component.name }}
                    </h3>
                    <section v-for="kindSection in section.kinds" :id="kindSection.sectionId" :key="kindSection.kind" class="component-api-kind">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            class="component-api-kind-toggle !h-auto w-full justify-between rounded-brutal border-b-2 border-brutal bg-brutal-muted px-4 py-2 text-left font-bold shadow-none transition-colors hover:bg-brutal-secondary sm:px-5"
                            :aria-expanded="isSectionExpanded(kindSection.sectionId)"
                            :aria-controls="kindSection.tableId"
                            :disabled="!isHydrated"
                            @click="toggleSection(kindSection.sectionId)"
                        >
                            <span>{{ labels.kinds[kindSection.kind] }} ({{ kindSection.members.length }})</span>
                            <span v-if="isHydrated" aria-hidden="true">{{ isSectionExpanded(kindSection.sectionId) ? '−' : '+' }}</span>
                        </Button>
                        <table
                            v-show="isSectionExpanded(kindSection.sectionId)"
                            :id="kindSection.tableId"
                            :class="['component-api-table w-full text-left', kindSection.kind === 'props' ? 'component-api-table--props' : 'component-api-table--members']"
                        >
                            <caption class="sr-only">{{ section.component.name }} — {{ labels.kinds[kindSection.kind] }}</caption>
                            <thead class="bg-brutal-bg text-sm font-bold">
                                <tr>
                                    <th scope="col">{{ labels.nameColumn }}</th>
                                    <th scope="col">{{ kindSection.kind === 'props' ? labels.typeColumn : labels.signatureColumn }}</th>
                                    <th v-if="kindSection.kind === 'props'" scope="col">{{ labels.defaultColumn }}</th>
                                    <th scope="col">{{ labels.descriptionColumn }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ComponentApiMember
                                    v-for="item in kindSection.members"
                                    :key="item.anchorId"
                                    :member="item.member"
                                    :locale="props.data.locale"
                                    :anchor-id="item.anchorId"
                                    :type-id="item.anchorId + '-type'"
                                    :name-copy-state="copyStates[item.anchorId + '-name'] || 'idle'"
                                    :type-copy-state="copyStates[item.anchorId + '-type-copy'] || 'idle'"
                                    :labels="memberLabels"
                                    :interactive="isHydrated"
                                    @copy="copyToClipboard"
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
    container-name: component-api;
    container-type: inline-size;
    font-size: 0.875rem;
    line-height: 1.5;
}

.component-api-root :deep(a) {
    color: var(--brutal-fg);
}

.component-api-root :deep(code) {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
}

.component-api-root :deep(p),
.component-api-root :deep(summary),
.component-api-root :deep(h4),
.component-api-root :deep(pre),
.component-api-root :deep(dl),
.component-api-root :deep(dd),
.component-api-root :deep(ul) {
    margin: 0;
}

.component-api-root :deep(ul) {
    padding-inline-start: 0;
}

.component-api-root :deep(li + li) {
    margin-block-start: 0.25rem;
}

.component-api-root :deep(.component-api-member-name) {
    font-weight: 700;
}

.component-api-root :deep(.component-api-default-fallback),
.component-api-root :deep(.component-api-factory-note),
.component-api-root :deep(.component-api-source-path) {
    line-height: 1.5;
}

.component-api-category-button[aria-pressed='true'] {
    background: var(--brutal-secondary);
    color: var(--brutal-secondary-foreground);
}

.component-api-category-count {
    font-size: 0.75rem;
}

.component-api-root :deep(.component-api-details-summary) {
    margin: 0;
    padding-block: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.25rem;
}

.component-api-select-trigger {
    max-width: 16rem;
}

.component-api-root :deep(.component-api-select-trigger),
.component-api-root :deep(.component-api-select-trigger:hover) {
    --tw-shadow: 0 0 transparent !important;
}

.component-api-table {
    display: table;
    margin: 0;
    overflow: visible;
    table-layout: fixed;
    border-collapse: collapse;
    border: 0;
    box-shadow: none;
}

.component-api-table th,
.component-api-table :deep(td) {
    min-width: 0;
    overflow-wrap: anywhere;
    border: 0;
    padding: 0.5rem 0.75rem;
    font-size: inherit;
}

.component-api-table :deep(tr) {
    background: transparent;
    border: 0;
}

.component-api-table th {
    border-bottom: 2px solid var(--brutal-border-color);
    padding: 0.625rem 0.75rem;
    text-align: left;
}

.component-api-table--props th:nth-child(1) {
    width: 22%;
}

.component-api-table--props th:nth-child(2) {
    width: 28%;
}

.component-api-table--props th:nth-child(3) {
    width: 17%;
}

.component-api-table--props th:nth-child(4) {
    width: 33%;
}

.component-api-table--members th:nth-child(1) {
    width: 32%;
}

.component-api-table--members th:nth-child(2) {
    width: 28%;
}

.component-api-table--members th:nth-child(3) {
    width: 40%;
}

.component-api-table :deep(.component-api-member-summary + .component-api-member-details-row td) {
    padding: 0 0.75rem 0.5rem;
}

.component-api-table :deep(.component-api-member-details-row + .component-api-member-summary td) {
    border-top: 1px solid color-mix(in srgb, var(--brutal-border-color) 35%, transparent);
}

.component-api-table :deep(.component-api-member-summary),
.component-api-group,
.component-api-kind {
    scroll-margin-top: 6rem;
}

.component-api-details-summary {
    inline-size: fit-content;
}

@container component-api (min-width: 40rem) {
    .component-api-root :deep(.component-api-details-content) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .component-api-root :deep(.component-api-detail-source) {
        grid-column: 1 / -1;
    }
}

@container component-api (max-width: 40rem) {
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

    .component-api-table :deep(tr.component-api-member-summary) {
        display: block;
        margin-block-start: 0.5rem;
        border-block-start: 1px solid color-mix(in srgb, var(--brutal-border-color) 35%, transparent);
    }

    .component-api-table :deep(tr.component-api-member-details-row) {
        display: block;
        width: 100%;
    }

    .component-api-table :deep(tr.component-api-member-summary td) {
        display: grid;
        grid-template-columns: minmax(5rem, 22%) minmax(0, 1fr);
        gap: 0.75rem;
        border: 0;
        padding-block: 0.5rem;
    }

    .component-api-table :deep(tr.component-api-member-summary td::before) {
        content: attr(data-label);
        color: var(--brutal-muted-foreground);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .component-api-table :deep(tr.component-api-member-summary .component-api-name-cell) {
        display: block;
    }

    .component-api-table :deep(tr.component-api-member-summary .component-api-name-cell::before) {
        content: none;
    }

    .component-api-table :deep(tr.component-api-member-details-row td) {
        display: block;
        width: 100%;
        padding-inline: 0.75rem;
    }

    .component-api-table :deep(.component-api-member-summary + .component-api-member-details-row td) {
        padding-block-end: 0.75rem;
    }
}
</style>
