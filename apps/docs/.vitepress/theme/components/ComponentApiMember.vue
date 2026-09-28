<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy } from '@lucide/vue'
import { Button } from 'brutx-ui-vue'
import type { ApiComponent, ApiLocale, ApiMember } from '../../api-types'
import ComponentApiDescription from './ComponentApiDescription.vue'
import { getApiMemberDisplayName, getApiTypeReferenceAnchorId, isLongApiType, type ComponentApiMemberLabels } from './component-api-view'

type CopyState = 'idle' | 'copied' | 'failed'

interface Props {
    member: ApiMember
    component: ApiComponent
    locale: ApiLocale
    anchorId: string
    typeId: string
    showComponent: boolean
    typeCollapsed: boolean
    nameCopyState: CopyState
    typeCopyState: CopyState
    labels: ComponentApiMemberLabels
}

const props = defineProps<Props>()

const emit = defineEmits<{
    copy: [text: string, key: string]
    toggleType: [anchorId: string]
}>()

const isLongType = computed(() => isLongApiType(props.member.type.text))
const displayName = computed(() => getApiMemberDisplayName(props.member))
const nameCopyLabel = computed(() => copyLabel(props.labels.copyName, props.nameCopyState))
const typeCopyLabel = computed(() => copyLabel(props.labels.copyType, props.typeCopyState))

function copyLabel(defaultLabel: string, state: CopyState): string {
    if (state === 'copied') return props.labels.copied
    if (state === 'failed') return props.labels.copyFailed
    return defaultLabel
}

function defaultRows() {
    if (props.member.kind !== 'props' || !props.member.default) return []
    const defaultValue = props.member.default
    const declaration = defaultValue.declaration
    const rows = declaration.kind === 'absent'
        ? [{ label: props.labels.notDeclared, value: '', source: undefined as { file: string; line?: number } | undefined }]
        : [{ label: props.labels.declaration, value: declaration.text, source: declaration.source }]
    if (defaultValue.resolution) {
        rows.push({ label: props.labels.resolution, value: defaultValue.resolution.text, source: undefined })
    }
    if (defaultValue.fallback) {
        rows.push({ label: props.labels.fallback, value: defaultValue.fallback, source: undefined })
    }
    return rows
}
</script>

<template>
    <tr :id="anchorId" tabindex="-1" class="component-api-member align-top focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden">
        <td class="component-api-cell component-api-name-cell p-3 align-top" :data-label="locale === 'en' ? 'Name' : '名称'">
            <div class="flex flex-wrap items-center gap-2">
                <code class="font-mono font-bold text-brutal-fg break-all">{{ displayName }}</code>
                <span v-if="showComponent" class="component-api-component-label border-2 border-brutal bg-brutal-secondary px-1.5 py-0.5 text-xs font-bold text-brutal-secondary-foreground">
                    {{ component.name }}
                </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
                <span v-if="member.required" class="border-2 border-brutal bg-brutal-destructive px-1.5 py-0.5 text-xs font-bold text-brutal-destructive-foreground">
                    {{ labels.required }}
                </span>
                <span v-if="member.nullable" class="border-2 border-brutal bg-brutal-muted px-1.5 py-0.5 text-xs font-bold text-brutal-fg">
                    {{ labels.nullable }}
                </span>
                <span v-if="member.readonly" class="border-2 border-brutal bg-brutal-muted px-1.5 py-0.5 text-xs font-bold text-brutal-fg">
                    {{ labels.readonly }}
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    class="h-8 w-8"
                    :aria-label="nameCopyLabel"
                    :title="nameCopyLabel"
                    @click="emit('copy', member.name, anchorId + '-name')"
                >
                    <Check v-if="nameCopyState === 'copied'" class="h-4 w-4" aria-hidden="true" />
                    <AlertCircle v-else-if="nameCopyState === 'failed'" class="h-4 w-4" aria-hidden="true" />
                    <Copy v-else class="h-4 w-4" aria-hidden="true" />
                </Button>
                <span class="sr-only" role="status" aria-live="polite">{{ nameCopyState === 'copied' ? labels.copied : nameCopyState === 'failed' ? labels.copyFailed : '' }}</span>
            </div>
        </td>
        <td class="component-api-cell component-api-description-cell p-3 align-top text-brutal-muted-foreground" :data-label="locale === 'en' ? 'Description' : '说明'">
            <ComponentApiDescription :text="member.description" />
            <ul v-if="member.notes.length" class="mt-2 list-inside list-disc space-y-1 text-sm">
                <li v-for="(note, index) in member.notes" :key="index">
                    <ComponentApiDescription :text="note" />
                </li>
            </ul>
        </td>
        <td class="component-api-cell component-api-type-cell p-3 align-top" :data-label="locale === 'en' ? 'Type' : '类型'">
            <div class="flex flex-wrap items-center gap-2">
                <Button
                    size="icon"
                    variant="ghost"
                    class="h-8 w-8 shrink-0"
                    :aria-label="typeCopyLabel"
                    :title="typeCopyLabel"
                    @click="emit('copy', member.type.text, anchorId + '-type-copy')"
                >
                    <Check v-if="typeCopyState === 'copied'" class="h-4 w-4" aria-hidden="true" />
                    <AlertCircle v-else-if="typeCopyState === 'failed'" class="h-4 w-4" aria-hidden="true" />
                    <Copy v-else class="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                    v-if="isLongType"
                    size="sm"
                    variant="ghost"
                    class="h-8 px-2"
                    :aria-expanded="!typeCollapsed"
                    :aria-controls="typeId"
                    @click="emit('toggleType', anchorId)"
                >
                    <ChevronDown v-if="typeCollapsed" class="h-4 w-4" aria-hidden="true" />
                    <ChevronUp v-else class="h-4 w-4" aria-hidden="true" />
                    {{ typeCollapsed ? labels.expandType : labels.collapseType }}
                </Button>
                <span class="sr-only" role="status" aria-live="polite">{{ typeCopyState === 'copied' ? labels.copied : typeCopyState === 'failed' ? labels.copyFailed : '' }}</span>
            </div>
            <pre :id="typeId" :class="['component-api-type-text mt-2 font-mono text-sm text-brutal-fg', { 'component-api-type-text--collapsed': typeCollapsed }]">{{ member.type.text }}</pre>
            <div v-if="member.type.literals.length" class="mt-2">
                <p class="mb-1 text-xs font-bold text-brutal-muted-foreground">{{ labels.typeLiterals }}</p>
                <ul class="flex flex-wrap gap-1.5">
                    <li v-for="(literal, index) in member.type.literals" :key="index" class="border-2 border-brutal bg-brutal-accent px-1.5 py-0.5 font-mono text-xs font-bold text-brutal-accent-foreground break-all">
                        {{ literal }}
                    </li>
                </ul>
            </div>
            <div v-if="member.type.references.length" class="mt-3 space-y-2">
                <p class="text-xs font-bold text-brutal-muted-foreground">{{ labels.typeReferences }}</p>
                <div v-for="(reference, index) in member.type.references" :key="reference.id" class="min-w-0 border-l-2 border-brutal pl-2">
                    <a
                        :href="`#${getApiTypeReferenceAnchorId(anchorId, index)}`"
                        :aria-label="labels.locateTypeReference.replace('{name}', reference.name)"
                        class="font-mono text-xs font-bold text-brutal-fg underline underline-offset-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brutal-ring"
                    >
                        {{ reference.name }}
                    </a>
                    <details :id="getApiTypeReferenceAnchorId(anchorId, index)" open class="component-api-reference mt-1 border-2 border-brutal bg-brutal-muted">
                        <summary class="cursor-pointer px-2 py-1 text-xs font-bold text-brutal-fg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brutal-ring">
                            {{ labels.typeReferenceDefinition }}
                        </summary>
                        <pre class="component-api-reference-text border-t border-brutal px-2 py-2 font-mono text-xs text-brutal-muted-foreground">{{ reference.text }}</pre>
                    </details>
                </div>
            </div>
        </td>
        <td class="component-api-cell component-api-default-cell p-3 align-top text-brutal-muted-foreground" :data-label="locale === 'en' ? 'Default' : '默认值'">
            <template v-if="member.kind === 'props'">
                <div v-if="member.default" class="space-y-2">
                    <div v-for="(row, index) in defaultRows()" :key="index" class="min-w-0">
                        <p class="text-xs font-bold">{{ row.label }}</p>
                        <code v-if="row.value" class="mt-1 block whitespace-pre-wrap break-words font-mono text-xs text-brutal-fg">{{ row.value }}</code>
                        <p v-if="row.source" class="mt-1 break-all text-xs text-brutal-muted-foreground">
                            {{ labels.source }}: {{ row.source.file }}<span v-if="row.source.line">:{{ row.source.line }}</span>
                        </p>
                    </div>
                </div>
                <span v-else>{{ labels.notDeclared }}</span>
            </template>
            <span v-else>{{ labels.notApplicable }}</span>
        </td>
    </tr>
</template>

<style scoped>
.component-api-type-text,
.component-api-reference-text {
    max-width: 100%;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.component-api-type-text--collapsed {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
</style>
