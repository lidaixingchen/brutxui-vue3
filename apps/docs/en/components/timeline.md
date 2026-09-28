---
title: Timeline
description: Timeline component for displaying a series of time events, milestones, or activity logs vertically or horizontally.
translated: true
---

# Timeline

A flowing information display component connected by a main line, suitable for building enterprise milestones, version release logs, and task approval progress flows.

## Demo

<ComponentPreview>
  <TimelineDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="timeline" />

## Usage

```vue
<script setup>
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent
} from 'brutx-ui-vue'
</script>

<template>
    <Timeline orientation="vertical">
        <!-- Node 1 -->
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black">Phase One</div>
                <p class="font-normal text-sm mt-1">Description of Phase One goes here.</p>
            </TimelineContent>
        </TimelineItem>
        
        <!-- Node 2 -->
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black">Phase Two</div>
                <p class="font-normal text-sm mt-1">Description of Phase Two goes here.</p>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

### Horizontal Timeline

Set `orientation="horizontal"` to switch to horizontal layout. In horizontal mode, it is recommended to add `text-center` on `TimelineContent` to align text with the icon:

```vue
<template>
    <Timeline orientation="horizontal">
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">Requirements</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-06-01</div>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">Design & Dev</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-06-15</div>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="success" shape="circle">3</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="text-center">
                <div class="font-black text-sm">Test & Release</div>
                <div class="text-xs text-brutal-fg/60 mt-1">2026-07-01</div>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

### Alternate Layout

Set the `alternate` property to `true` to alternate the vertical timeline content along the separator line: even-indexed items (0, 2, 4...) display content on the left, odd-indexed items (1, 3, 5...) display content on the right, creating a symmetrical alternating rhythm. This property only takes effect when `orientation="vertical"`; in horizontal mode, it is automatically ignored.

```vue
<template>
    <Timeline orientation="vertical" alternate>
        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="primary" shape="circle">1</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">Project Kickoff</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">Define product direction and core objectives.</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="accent" shape="square">2</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">Design & Development</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">Complete visual design and first round of development.</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="success" shape="diamond">3</TimelineDot>
                <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">Testing & Acceptance</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">Regression testing and performance tuning.</p>
            </TimelineContent>
        </TimelineItem>

        <TimelineItem>
            <TimelineSeparator>
                <TimelineDot variant="danger" shape="circle">4</TimelineDot>
            </TimelineSeparator>
            <TimelineContent class="pl-2">
                <div class="font-black text-base">Official Release</div>
                <p class="text-sm text-brutal-fg/80 mt-1 font-normal">Available to all users.</p>
            </TimelineContent>
        </TimelineItem>
    </Timeline>
</template>
```

::: tip Note
The alternate layout index is automatically injected by `Timeline` starting from 0 based on the order of `TimelineItem` elements; no manual specification is needed. When `alternate` and `horizontal` are set simultaneously, horizontal mode takes precedence and `alternate` has no effect.
:::

## Variants

`TimelineDot` supports diverse neo-brutalist geometric designs and color themes, customizable via `shape` and `variant`:

### Shape (`shape`)

| Shape | Description |
|------|------|
| `circle` | Classic circular badge |
| `square` | Bold, angular card shape |
| `diamond` | Diamond rotated 45 degrees (text slot content is automatically counter-rotated internally to prevent tilted typography) |

### Color (`variant`)

| Variant | Description |
|------|------|
| `default` | Default color scheme |
| `primary` | Primary color |
| `secondary` | Secondary color |
| `accent` | Accent color |
| `success` | Success color |
| `danger` | Danger color |

## Sub-components

| Component | Description |
|------|------|
| `Timeline` | Root container, manages layout direction and alternate arrangement |
| `TimelineItem` | Single time node |
| `TimelineSeparator` | Node separator area, contains Dot and Connector |
| `TimelineDot` | Node badge, supports shape and color variants |
| `TimelineConnector` | Connector line between nodes |
| `TimelineContent` | Node content area |

## API Reference

<span id="timeline-1"></span>
<span id="timelineitem"></span>
<span id="timelineseparator"></span>
<span id="timelinedot"></span>
<span id="timelineconnector"></span>
<span id="timelinecontent"></span>
<span id="timeline-2"></span>
<span id="timelineitem-1"></span>
<span id="timelineseparator-1"></span>
<span id="timelinedot-1"></span>
<span id="timelineconnector-1"></span>
<span id="timelinecontent-1"></span>

<ComponentApi name="timeline" />

## Accessibility

- **Semantic Structure**: The timeline uses list structure (`<ol>`/`<li>`) to organize nodes, making it easy for screen readers to understand content order
- **ARIA Attributes**: The root container sets `role="list"`, each node sets `role="listitem"`, providing clear list semantics
- **Layout Direction**: The `orientation` property automatically sets `aria-orientation` to inform assistive technologies of the current layout direction
- **Content Hierarchy**: Content in `TimelineDot` (such as numbers, icons) should be accompanied by text descriptions to ensure complete information delivery
