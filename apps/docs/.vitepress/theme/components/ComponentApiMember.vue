<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Check, Copy } from '@lucide/vue'
import { Button } from 'brutx-ui-vue'
import type { ApiDefault, ApiLocale, ApiMember, ApiSource } from '../../api-types'
import ComponentApiDescription from './ComponentApiDescription.vue'
import {
    getApiDefaultMainValue,
    getApiSourceFileName,
    getApiSourceUrl,
    getApiTypeReferenceAnchorId,
    getApiMemberDisplayName,
    type ComponentApiMemberLabels,
} from './component-api-view'

type CopyState = 'idle' | 'copied' | 'failed'

interface Props {
    member: ApiMember
    locale: ApiLocale
    anchorId: string
    typeId: string
    nameCopyState: CopyState
    typeCopyState: CopyState
    labels: ComponentApiMemberLabels
    interactive: boolean
}

interface DefaultDetailRow {
    label: string
    value: string
    source?: ApiSource
    explanation?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    copy: [text: string, key: string]
}>()

const displayName = computed(() => getApiMemberDisplayName(props.member))
const displayType = computed(() => props.member.type.displayText ?? props.member.type.text)
const mainSourceUrl = computed(() => getApiSourceUrl(props.member.source))
const mainSourceName = computed(() => getApiSourceFileName(props.member.source))
const defaultMainValue = computed(() => getApiDefaultMainValue(props.member.default, props.labels.factoryInstance))
const defaultFallback = computed(() => props.member.kind === 'props' ? props.member.default?.fallback : undefined)
const defaultRows = computed(() => getDefaultRows(props.member.default, props.labels))

function copyLabel(defaultLabel: string, state: CopyState): string {
    if (state === 'copied') return props.labels.copied
    if (state === 'failed') return props.labels.copyFailed
    return defaultLabel
}

function getDefaultRows(defaultValue: ApiDefault | undefined, labels: ComponentApiMemberLabels): DefaultDetailRow[] {
    if (!defaultValue) {
        return [{ label: labels.notDeclared, value: '—' }]
    }

    const rows: DefaultDetailRow[] = defaultValue.declaration.kind === 'absent'
        ? [{ label: labels.notDeclared, value: '—' }]
        : [{
        label: labels.declaration,
        value: defaultValue.declaration.text,
        source: defaultValue.declaration.source,
        }]

    if (defaultValue.resolution) {
        rows.push({
            label: defaultValue.resolution.kind === 'resolved' ? labels.resolution : labels.resolutionExpression,
            value: defaultValue.resolution.text,
        })
    }
    if (defaultValue.fallback) {
        rows.push({
            label: labels.fallback,
            value: defaultValue.fallback,
            explanation: labels.fallbackExplanation,
        })
    }
    return rows
}
</script>

<template>
    <tr :id="anchorId" tabindex="-1" class="component-api-member-summary align-top focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden">
        <td class="component-api-cell component-api-name-cell p-3 align-top" :data-label="locale === 'en' ? 'Name' : '名称'">
            <div class="component-api-name-line flex min-w-0 flex-wrap items-center gap-2">
                <code class="component-api-member-name min-w-0 font-mono font-bold text-brutal-fg" :title="displayName">{{ displayName }}</code>
                <Button
                    v-if="interactive"
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 shrink-0 shadow-none"
                    :aria-label="copyLabel(labels.copyName, nameCopyState)"
                    :title="copyLabel(labels.copyName, nameCopyState)"
                    @click="emit('copy', member.name, anchorId + '-name')"
                >
                    <Check v-if="nameCopyState === 'copied'" class="h-4 w-4" aria-hidden="true" />
                    <AlertCircle v-else-if="nameCopyState === 'failed'" class="h-4 w-4" aria-hidden="true" />
                    <Copy v-else class="h-4 w-4" aria-hidden="true" />
                </Button>
                <span class="sr-only" role="status" aria-live="polite">{{ nameCopyState === 'copied' ? labels.copied : nameCopyState === 'failed' ? labels.copyFailed : '' }}</span>
            </div>
            <div v-if="member.required || member.nullable || member.readonly" class="mt-1 flex flex-wrap items-center gap-1.5">
                <span v-if="member.required" class="border-2 border-brutal bg-brutal-destructive px-1.5 py-0.5 text-xs font-bold text-brutal-destructive-foreground">
                    {{ labels.required }}
                </span>
                <span v-if="member.nullable" class="border-2 border-brutal bg-brutal-muted px-1.5 py-0.5 text-xs font-bold text-brutal-fg">
                    {{ labels.nullable }}
                </span>
                <span v-if="member.readonly" class="border-2 border-brutal bg-brutal-muted px-1.5 py-0.5 text-xs font-bold text-brutal-fg">
                    {{ labels.readonly }}
                </span>
            </div>
        </td>
        <td class="component-api-cell component-api-type-cell p-3 align-top" :data-label="locale === 'en' ? 'Type' : '类型'">
            <code class="component-api-display-type min-w-0 font-mono text-sm text-brutal-fg">{{ displayType }}</code>
        </td>
        <td v-if="member.kind === 'props'" class="component-api-cell component-api-default-cell p-3 align-top" :data-label="locale === 'en' ? 'Default' : '默认值'">
            <div class="min-w-0">
                <code class="component-api-default-value font-mono text-sm text-brutal-fg" :title="!member.default || member.default.declaration.kind === 'absent' ? labels.notDeclared : undefined">{{ defaultMainValue }}</code>
                <p v-if="member.default?.declaration.kind === 'factory' && member.default.resolution?.kind === 'resolved'" class="component-api-factory-note text-xs text-brutal-muted-foreground">{{ labels.factoryInstance }}</p>
                <p v-if="defaultFallback" class="component-api-default-fallback mt-1 text-xs text-brutal-muted-foreground">
                    <span class="font-bold">{{ labels.fallback }}:</span>
                    <code class="font-mono text-brutal-fg">{{ defaultFallback }}</code>
                </p>
            </div>
        </td>
        <td class="component-api-cell component-api-description-cell p-3 align-top text-brutal-muted-foreground" :data-label="locale === 'en' ? 'Description' : '说明'">
            <div class="component-api-description-content min-w-0">
                <ComponentApiDescription :text="member.description" />
                <ul v-if="member.notes.length" class="mt-1 list-inside list-disc space-y-1 text-sm">
                    <li v-for="(note, index) in member.notes" :key="index">
                        <ComponentApiDescription :text="note" />
                    </li>
                </ul>
            </div>
        </td>
    </tr>
    <tr class="component-api-member-details-row">
        <td :colspan="member.kind === 'props' ? 4 : 3" class="component-api-details-cell">
            <details :id="typeId" class="component-api-details">
                <summary class="component-api-details-summary cursor-pointer font-bold focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden">
                    {{ labels.details }}
                </summary>
                <div class="component-api-details-content grid gap-4 p-3">
                    <section class="min-w-0">
                        <div class="mb-1 flex items-center gap-2">
                            <h4 class="font-bold text-brutal-fg">{{ labels.rawType }}</h4>
                            <Button v-if="interactive" size="icon" variant="ghost" class="h-6 w-6 shrink-0 shadow-none" :aria-label="copyLabel(labels.copyType, typeCopyState)" :title="copyLabel(labels.copyType, typeCopyState)" @click="emit('copy', member.type.text, anchorId + '-type-copy')">
                                <Check v-if="typeCopyState === 'copied'" class="h-4 w-4" aria-hidden="true" />
                                <AlertCircle v-else-if="typeCopyState === 'failed'" class="h-4 w-4" aria-hidden="true" />
                                <Copy v-else class="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <span class="sr-only" role="status" aria-live="polite">{{ typeCopyState === 'copied' ? labels.copied : typeCopyState === 'failed' ? labels.copyFailed : '' }}</span>
                        </div>
                        <pre class="component-api-code-block font-mono text-sm text-brutal-fg">{{ member.type.text }}</pre>
                        <div v-if="member.type.literals.length" class="mt-3">
                            <p class="mb-1 text-xs font-bold text-brutal-muted-foreground">{{ labels.typeLiterals }}</p>
                            <ul class="flex flex-wrap gap-1.5">
                                <li v-for="(literal, index) in member.type.literals" :key="index">
                                    <code class="font-mono text-xs text-brutal-fg">{{ literal }}</code>
                                </li>
                            </ul>
                        </div>
                        <div v-if="member.type.references.length" class="mt-3 space-y-2">
                            <p class="text-xs font-bold text-brutal-muted-foreground">{{ labels.typeReferences }}</p>
                            <div v-for="(reference, index) in member.type.references" :key="reference.id" class="min-w-0">
                                <a
                                    :href="`#${getApiTypeReferenceAnchorId(anchorId, index)}`"
                                    :aria-label="labels.locateTypeReference.replace('{name}', reference.name)"
                                    class="font-mono text-xs font-bold text-brutal-fg underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden"
                                >
                                    {{ reference.name }}
                                </a>
                                <details :id="getApiTypeReferenceAnchorId(anchorId, index)" tabindex="-1" class="component-api-reference mt-1">
                                    <summary class="cursor-pointer py-1 text-xs font-bold text-brutal-fg focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden">
                                        {{ labels.typeReferenceDefinition }} — {{ reference.name }}
                                    </summary>
                                    <pre class="component-api-code-block font-mono text-xs text-brutal-muted-foreground">{{ reference.text }}</pre>
                                </details>
                            </div>
                        </div>
                    </section>
                    <section v-if="member.kind === 'props'" class="min-w-0">
                        <h4 class="mb-1 font-bold text-brutal-fg">{{ labels.defaultDetails }}</h4>
                        <dl class="space-y-3">
                            <div v-for="(row, index) in defaultRows" :key="index" class="min-w-0">
                                <dt class="text-xs font-bold text-brutal-muted-foreground">{{ row.label }}</dt>
                                <dd class="mt-1 min-w-0">
                                    <code class="component-api-inline-code font-mono text-sm text-brutal-fg">{{ row.value }}</code>
                                    <p v-if="row.explanation" class="mt-1 text-xs text-brutal-muted-foreground">{{ row.explanation }}</p>
                                    <p v-if="row.source" class="mt-1 text-xs text-brutal-muted-foreground">
                                        {{ labels.source }}:
                                        <a v-if="getApiSourceUrl(row.source)" :href="getApiSourceUrl(row.source)" :title="row.source.file" target="_blank" rel="noreferrer">
                                            {{ row.source.file }}<span v-if="row.source.line">:{{ row.source.line }}</span>
                                        </a>
                                        <span v-else :title="row.source.file">{{ row.source.file }}<span v-if="row.source.line">:{{ row.source.line }}</span></span>
                                    </p>
                                </dd>
                            </div>
                        </dl>
                    </section>
                    <section class="component-api-detail-source min-w-0">
                        <h4 class="mb-1 font-bold text-brutal-fg">{{ labels.source }}</h4>
                        <p class="break-words text-sm text-brutal-muted-foreground">
                            <a v-if="mainSourceUrl" :href="mainSourceUrl" :title="member.source.file" target="_blank" rel="noreferrer">
                                {{ mainSourceName }}<span v-if="member.source.line">:{{ member.source.line }}</span>
                            </a>
                            <span v-else>{{ member.source.file }}<span v-if="member.source.line">:{{ member.source.line }}</span></span>
                        </p>
                        <p class="component-api-source-path font-mono text-xs text-brutal-muted-foreground">{{ member.source.file }}</p>
                    </section>
                </div>
            </details>
        </td>
    </tr>
</template>

<style scoped>
.component-api-name-line,
.component-api-type-line {
    min-width: 0;
}

.component-api-member-name {
    max-inline-size: 100%;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.component-api-display-type {
    display: block;
    max-block-size: 5.25rem;
    overflow: auto;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.component-api-default-value,
.component-api-inline-code {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.component-api-default-value {
    display: block;
}

.component-api-code-block {
    max-block-size: min(32rem, 60vh);
    max-inline-size: 100%;
    overflow: auto;
    white-space: pre;
}

.component-api-details-summary {
    inline-size: fit-content;
}

.component-api-source-path {
    overflow-wrap: anywhere;
}

.component-api-reference[open] > pre {
    margin-block-start: 0.5rem;
}
</style>
