export interface FooterLink {
    label: string
    href?: string
}

export interface FooterLinkGroup {
    title: string
    links: FooterLink[]
}
