import uiPackage from '../../../../../packages/ui/package.json'
import type { ApiComponent, ApiDefault, ApiKind, ApiMember, ApiSource } from '../../api-types'
import { apiAnchorPart } from '../../api-types'

const SOURCE_BRANCH_REFERENCE = 'HEAD'

export interface ComponentApiMemberLabels {
    required: string
    nullable: string
    readonly: string
    notDeclared: string
    details: string
    rawType: string
    defaultDetails: string
    declaration: string
    resolution: string
    resolutionExpression: string
    fallback: string
    fallbackExplanation: string
    factoryInstance: string
    source: string
    typeReferences: string
    typeReferenceDefinition: string
    locateTypeReference: string
    copyName: string
    copyType: string
    copied: string
    copyFailed: string
    typeLiterals: string
}

export function getApiMemberAnchorId(member: ApiMember, instance?: string): string {
    return instance ? instance + '-' + member.id : member.id
}

export function getApiComponentAnchorId(component: ApiComponent, instance?: string): string {
    const componentId = 'api-' + apiAnchorPart(component.id)
    return instance ? instance + '-' + componentId : componentId
}

export function getApiKindAnchorId(component: ApiComponent, kind: ApiKind, instance?: string): string {
    return getApiComponentAnchorId(component, instance) + '-' + kind
}

export function getApiTypeReferenceAnchorId(memberAnchorId: string, referenceIndex: number): string {
    return memberAnchorId + '-type-reference-' + referenceIndex
}

export function getApiSourceFileName(source: ApiSource): string {
    return source.file.split('/').at(-1) ?? source.file
}

export function getApiSourceUrl(source: ApiSource): string | undefined {
    const repository = typeof uiPackage.repository === 'string'
        ? uiPackage.repository
        : uiPackage.repository?.url
    if (!repository) return undefined

    const repositoryUrl = repository.replace(/^git\+/, '').replace(/\.git$/, '').replace(/\/$/, '')
    const sourcePath = source.file.split('/').map(encodeURIComponent).join('/')
    const line = source.line ? '#L' + source.line : ''
    return repositoryUrl + '/blob/' + SOURCE_BRANCH_REFERENCE + '/' + sourcePath + line
}

export function getApiDefaultMainValue(defaultValue: ApiDefault | undefined, factoryLabel: string): string {
    if (!defaultValue || defaultValue.declaration.kind === 'absent') return '—'
    if (defaultValue.resolution?.kind === 'resolved') return defaultValue.resolution.text
    if (defaultValue.declaration.kind === 'factory') return factoryLabel
    return defaultValue.declaration.text
}

export function matchesApiMember(member: ApiMember, query: string): boolean {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return true

    return [member.name, member.type.displayText ?? '', member.type.text, member.description, ...member.notes,
        ...member.type.references.flatMap(reference => [reference.name, reference.text])]
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
}

export function matchesApiName(name: string, data: { id: string; name: string; components: ApiComponent[] }): boolean {
    const normalize = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLocaleLowerCase().replace(/[^a-z0-9]/g, '')
    const requestedName = normalize(name)
    if (!requestedName) return false

    const groupId = data.id.split(':').at(-1) ?? data.id
    return [groupId, data.name, ...data.components.map(component => component.name)]
        .some(candidate => normalize(candidate) === requestedName)
}

export function findApiComponent(components: ApiComponent[], name: string): ApiComponent | undefined {
    const normalizedName = name.trim().toLocaleLowerCase()
    return components.find(component =>
        component.name.trim().toLocaleLowerCase() === normalizedName ||
        component.id.trim().toLocaleLowerCase() === normalizedName,
    )
}

export function isApiKind(value: string): value is ApiKind {
    return value === 'props' || value === 'events' || value === 'slots' || value === 'exposes'
}

export function getApiMemberDisplayName(member: ApiMember): string {
    if (member.kind === 'events') return '@' + member.name
    if (member.kind === 'slots') return '#' + member.name
    return member.name
}
