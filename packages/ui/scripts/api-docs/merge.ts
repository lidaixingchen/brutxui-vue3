import type {
    ApiComponent,
    ApiContent,
    ApiDefault,
    ApiLocale,
    ApiMember,
    ApiSemantic,
    ApiSupplement,
} from '../../../../apps/docs/.vitepress/api-types.js'
import { apiMemberId } from '../../../../apps/docs/.vitepress/api-types.js'

const PLACEHOLDER_DESCRIPTIONS = new Set(['-', '—', '–'])
const SEMANTIC_FIELDS = new Set(['zh', 'en', 'notes', 'fallback'])

function hasDescription(value: unknown, memberName: string): value is string {
    if (typeof value !== 'string') return false
    const normalized = value.trim()
    return normalized.length > 0
        && !PLACEHOLDER_DESCRIPTIONS.has(normalized)
        && normalized.toLocaleLowerCase() !== memberName.trim().toLocaleLowerCase()
}

function semanticsFor(content: ApiContent | undefined, component: ApiComponent, member: ApiMember): ApiSemantic | undefined {
    return content?.members[component.name]?.[member.kind]?.[member.name]
}

function assertSemanticKeys(content: ApiContent | undefined): void {
    if (!content) return
    for (const [componentId, byKind] of Object.entries(content.members)) {
        for (const [kind, byName] of Object.entries(byKind)) {
            for (const [name, semantic] of Object.entries(byName ?? {})) {
                for (const field of Object.keys(semantic ?? {})) {
                    if (!SEMANTIC_FIELDS.has(field)) {
                        throw new Error(`API_CONTENT_STRUCTURAL_OVERRIDE ${componentId}/${kind}/${name}.${field}`)
                    }
                }
            }
        }
    }
}

function assertContentKeys(components: readonly ApiComponent[], content: ApiContent | undefined): void {
    if (!content) return
    const componentByName = new Map(components.map(component => [component.name, component]))
    for (const [componentName, byKind] of Object.entries(content.members)) {
        const component = componentByName.get(componentName)
        if (!component) throw new Error(`API_CONTENT_COMPONENT_UNKNOWN ${componentName}`)
        for (const [kind, byName] of Object.entries(byKind)) {
            for (const name of Object.keys(byName ?? {})) {
                const member = component.members.find(candidate => candidate.kind === kind && candidate.name === name)
                if (!member) throw new Error(`API_CONTENT_MEMBER_UNKNOWN ${component.id}/${kind}/${name}`)
            }
        }
    }
    for (const componentName of Object.keys(content.supplements ?? {})) {
        if (!componentByName.has(componentName)) throw new Error(`API_CONTENT_SUPPLEMENT_COMPONENT_UNKNOWN ${componentName}`)
    }
}

function supplementToMember(supplement: ApiSupplement, componentId: string, locale: ApiLocale): ApiMember {
    return {
        id: apiMemberId(componentId, supplement.kind, supplement.name),
        name: supplement.name,
        kind: supplement.kind,
        type: { text: supplement.type, literals: [], references: [] },
        description: supplement.description[locale] ?? '',
        notes: supplement.notes?.[locale] ?? [],
        source: supplement.source,
        origin: supplement.origin,
    }
}

function localizedDefault(current: ApiDefault | undefined, fallback: string | undefined): ApiDefault | undefined {
    if (fallback === undefined) return current
    if (!current) return undefined
    return { ...current, fallback }
}

function mergeMember(member: ApiMember, semantic: ApiSemantic | undefined, locale: ApiLocale): ApiMember {
    const fallback = semantic?.fallback?.[locale]
    const notes = [...member.notes, ...(semantic?.notes?.[locale] ?? [])]
    if (fallback !== undefined && !member.default) notes.push(fallback)
    const semanticDescription = semantic?.[locale === 'zh-CN' ? 'zh' : 'en']
    return {
        ...member,
        description: hasDescription(semanticDescription, member.name)
            ? semanticDescription
            : locale === 'zh-CN' ? member.description : '',
        notes,
        default: localizedDefault(member.default, fallback),
    }
}

function assertCompleteSemantics(components: readonly ApiComponent[], content: ApiContent): void {
    for (const component of components) {
        for (const member of component.members) {
            const semantic = semanticsFor(content, component, member)
            const chineseDescription = hasDescription(semantic?.zh, member.name) ? semantic.zh : member.description
            if (!hasDescription(chineseDescription, member.name) || !hasDescription(semantic?.en, member.name)) {
                throw new Error(`API_CONTENT_INCOMPLETE_MEMBER ${component.id}/${member.kind}/${member.name}`)
            }
        }
        for (const supplement of content.supplements?.[component.name] ?? []) {
            if (!hasDescription(supplement.description['zh-CN'], supplement.name) || !hasDescription(supplement.description.en, supplement.name)) {
                throw new Error(`API_CONTENT_INCOMPLETE_SUPPLEMENT ${component.id}/${supplement.kind}/${supplement.name}`)
            }
        }
    }
}

export function mergeApiContent(
    components: readonly ApiComponent[],
    content: ApiContent | undefined,
    locale: ApiLocale,
): ApiComponent[] {
    assertSemanticKeys(content)
    assertContentKeys(components, content)
    if (content?.complete) assertCompleteSemantics(components, content)

    return components.map(component => {
        const members = component.members.map(member => mergeMember(member, semanticsFor(content, component, member), locale))
        const supplements = (content?.supplements?.[component.name] ?? []).map(supplement => supplementToMember(supplement, component.id, locale))
        const existingKeys = new Set(members.map(member => `${member.kind}/${member.name}`))
        for (const supplement of supplements) {
            const key = `${supplement.kind}/${supplement.name}`
            if (existingKeys.has(key)) throw new Error(`API_CONTENT_SUPPLEMENT_DUPLICATE ${component.id}/${key}`)
            existingKeys.add(key)
        }
        return { ...component, members: [...members, ...supplements] }
    })
}
