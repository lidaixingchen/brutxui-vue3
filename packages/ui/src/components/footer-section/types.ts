export interface FooterLink {
    label: string
    /** 缺省时表示非导航项，渲染为按钮并触发 link-click 事件 */
    href?: string
}

export interface FooterLinkGroup {
    title: string
    links: [FooterLink, ...FooterLink[]]
}
