---
title: FAQ Section
description: FAQ accordion section with numbered badges and accordion interaction.
translated: true
---

# FAQ Section

A neo-brutalist FAQ section featuring a title, subtitle, and accordion panels with numbered badges.

## Demo

<ComponentPreview>
  <FaqSectionDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="faq-section" />

## Usage

```vue
<script setup>
import FaqSection from '@/components/ui/faq-section/FaqSection.vue'

const items = [
    {
        question: 'What is BrutxUI?',
        answer: 'BrutxUI is a Neo-Brutalist UI component library for Vue 3.',
    },
    {
        question: 'How do I get started?',
        answer: 'Install via npm and import the components you need.',
    },
    {
        question: 'Is it free?',
        answer: 'Yes, BrutxUI is open source and free to use under the MIT license.',
    },
]

function handleItemClick(index) {
    console.log('FAQ item clicked:', items[index].question)
}
</script>

<template>
    <FaqSection
        title="FAQ"
        subtitle="Find the answers you need"
        :items="items"
        @item-click="handleItemClick"
    />
</template>
```

## Data Types

### FaqItem

```ts
interface FaqItem {
    question: string
    answer: string
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | locale: `faqSection.defaultTitle` | Section title |
| `subtitle` | `string` | locale: `faqSection.defaultSubtitle` | Section subtitle |
| `items` | `FaqItem[]` | `[]` | FAQ question list |
| `class` | `string` | — | Custom CSS class name |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `item-click` | `[index: number]` | Triggered when an FAQ item is clicked |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `header` | — | Replace the title and subtitle area |
| `default` | — | Replace the accordion list area |
| `footer` | — | Replace/extend the section bottom |

## Accessibility

- Accordion component supports keyboard navigation (Enter/Space to expand/collapse)
- Each question item has appropriate ARIA attributes (`aria-expanded`, `aria-controls`)
- Accordion content is visible to screen readers
