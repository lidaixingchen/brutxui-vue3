import type { ApiComponent, ApiKind, ApiMember } from '../../api-types'
import { apiAnchorPart } from '../../api-types'

export const API_TYPE_SUMMARY_LENGTH = 120

export interface ComponentApiMemberLabels {
    required: string
    nullable: string
    readonly: string
    notApplicable: string
    notDeclared: string
    declaration: string
    resolution: string
    fallback: string
    source: string
    typeReferences: string
    typeReferenceDefinition: string
    locateTypeReference: string
    copyName: string
    copyType: string
    copied: string
    copyFailed: string
    expandType: string
    collapseType: string
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

export function isLongApiType(type: string): boolean {
    return type.length > API_TYPE_SUMMARY_LENGTH || type.includes('\n')
}

export function matchesApiMember(member: ApiMember, query: string): boolean {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return true

    return [member.name, member.type.text, member.description, ...member.notes,
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
