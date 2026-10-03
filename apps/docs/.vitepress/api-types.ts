export const API_KINDS = ['props', 'events', 'slots', 'exposes'] as const
export type ApiKind = typeof API_KINDS[number]
export type ApiLocale = 'zh-CN' | 'en'

export interface ApiSource {
    file: string
    line?: number
}

export interface ApiType {
    text: string
    displayText?: string
    literals: string[]
    references: Array<{ name: string; text: string; id: string }>
}

export interface ApiDefault {
    declaration: { kind: 'absent' } | { kind: 'value' | 'expression' | 'factory'; text: string; source?: ApiSource }
    resolution?: { kind: 'resolved'; text: string } | { kind: 'expression'; text: string }
    fallback?: string
}

export interface ApiMember {
    id: string
    name: string
    kind: ApiKind
    type: ApiType
    description: string
    notes: string[]
    source: ApiSource
    required?: boolean
    nullable?: boolean
    readonly?: boolean
    default?: ApiDefault
    origin?: 'declared' | 'fallthrough' | 'supplement'
}

export interface ApiComponent {
    id: string
    name: string
    source: ApiSource
    members: ApiMember[]
}

export interface ApiGroup {
    id: string
    name: string
    locale: ApiLocale
    components: ApiComponent[]
}

export interface ApiSemantic {
    zh?: string
    en?: string
    notes?: Partial<Record<ApiLocale, string[]>>
    fallback?: Partial<Record<ApiLocale, string>>
}

export interface ApiSupplement {
    name: string
    kind: ApiKind
    type: string
    source: ApiSource
    origin: 'fallthrough' | 'supplement'
    description: Record<ApiLocale, string>
    notes?: Partial<Record<ApiLocale, string[]>>
}

export interface ApiContent {
    /** 完成逐成员双语验收的页面才能启用严格语义门禁。 */
    complete: boolean
    members: Record<string, Partial<Record<ApiKind, Record<string, ApiSemantic>>>>
    supplements?: Record<string, ApiSupplement[]>
}

export function apiMemberId(componentId: string, kind: ApiKind, name: string): string {
    return `api-${apiAnchorPart(componentId)}-${kind}-${apiAnchorPart(name)}`
}

export function apiAnchorPart(value: string): string {
    return encodeURIComponent(value).replace(/-/g, '%2D').replace(/_/g, '%5F').replace(/%/g, '_')
}
