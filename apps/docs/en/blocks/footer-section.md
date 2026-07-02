---
title: Footer Section
description: Bottom information bar section with Logo, description, link groups, and copyright notice.
translated: true
---

# Footer Section

A neo-brutalist bottom information bar featuring Logo text, description, link groups, and copyright notice.

## Demo

<ComponentPreview>
  <FooterSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="footer-section" />

## Usage

```vue
<script setup>
import FooterSection from '@/components/ui/footer-section/FooterSection.vue'

const linkGroups = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '/help' },
            { label: 'Contact', href: '/contact' },
        ],
    },
]

function handleLinkClick({ groupIndex, linkIndex }) {
    console.log('Link clicked:', linkGroups[groupIndex].links[linkIndex].label)
}
</script>

<template>
    <FooterSection
        logo-text="MyApp"
        description="Build bold interfaces faster."
        :link-groups="linkGroups"
        copyright="© 2026 MyApp. All rights reserved."
        @link-click="handleLinkClick"
    />
</template>
```

## Data Types

```ts
interface FooterLinkGroup {
    title: string
    links: FooterLink[]
}

interface FooterLink {
    label: string
    href?: string
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `logoText` | `string` | locale: `footerSection.defaultLogoText` | Logo text |
| `description` | `string` | locale: `footerSection.defaultDescription` | Description text |
| `linkGroups` | `FooterLinkGroup[]` | `[]` | Link group data |
| `copyright` | `string` | locale: `footerSection.defaultCopyright` | Copyright notice text |
| `class` | `string` | — | Custom class name |

## Events

| Event         | Payload                                        | Description               |
| ------------ | ------------------------------------------- | ------------------ |
| `link-click` | `{ groupIndex: number; linkIndex: number }` | Triggered when a link is clicked   |

## Slots

| Slot      | Scope | Description                 |
| --------- | ------ | -------------------- |
| `header`  | —      | Replace the Logo and description area |
| `default` | —      | Replace the link groups area       |
| `footer`  | —      | Replace the copyright notice area     |

## Accessibility

- Rooted in a semantic `<footer>` element, exposing it as a page-footer landmark to assistive technologies
- Each link group is introduced by an `<h3>` heading so screen-reader users can navigate by group
- Groups render their links inside `<ul>` / `<li>` lists, correctly expressing the sibling relationship between items
- External links render as native `<a>` elements while internal actions render as `<Button>`, each preserving its expected keyboard and focus behavior
