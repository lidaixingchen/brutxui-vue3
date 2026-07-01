# Brutx UI

A Neo-Brutalism styled Vue 3 component library with CLI tool support. Copy components into your codebase for full customization control.

**[中文](/packages/ui/README.md)**

[![npm version](https://img.shields.io/npm/v/brutx-ui-vue.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui-vue)
[![npm downloads](https://img.shields.io/npm/dm/brutx-ui-vue.svg?style=flat-square)](https://www.npmjs.com/package/brutx-ui-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)

## Features

- **CLI Tool**: Copy components into your codebase via `npx brutx@latest`
- **Full Control**: Own and customize every component
- **Brutalist Style**: Bold borders, offset shadows, vivid colors
- **Tailwind-ready Tokens**: background/foreground/primary/secondary/destructive, ring, input, card, etc. Dark mode support via `.dark`
- **Headless Primitives**: Built on reka-ui, CVA variants, tailwind-merge `cn()`
- **i18n Support**: Built-in `useLocale()` composable for multi-language support
- **Theme Presets**: Classic (default), Pastel, and Mono themes

## Installation

Add components to your project using the CLI:

```bash
# Initialize your project
npx brutx@latest init

# Add components
npx brutx@latest add button card badge

# Or add all components
npx brutx@latest add --all
```

## Upgrading

When a new version of BrutxUI is released, re-run the init command to upgrade:

```bash
npx brutx@latest init
```

You can also update individual components:

```bash
npx brutx@latest add button --overwrite
```

## Usage

After adding components, import them from your project:

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Welcome to Brutx</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <Input placeholder="Email" />
      <Button variant="primary">Get Started</Button>
      <Button variant="outline" size="sm">
        Learn More
      </Button>
    </CardContent>
  </Card>
</template>
```

## CLI Commands

| Command                             | Description                        |
| ----------------------------------- | ---------------------------------- |
| `npx brutx@latest init`             | Initialize project with components.json |
| `npx brutx@latest add <component>`  | Add a specific component           |
| `npx brutx@latest add --all`        | Add all components                 |

## Component List

### Base Components

Accordion · Alert · AlertDialog · Avatar · Badge · Button · Card · Card3D · Checkbox · Combobox · Command · Dialog · DropdownMenu · Input · Label · NumberInput · Popover · Progress · RadioGroup · ScrollArea · Select · Separator · Sheet · Skeleton · Slider · Switch · Table · Tabs · TagsInput · Textarea · Toast · Toggle · ToggleGroup · Tooltip

### Pages & Sections

ActivityLogPage · AuthCard · BlogCard · BlogListPage · BrutalistHero · CookieConsent · DashboardShell · DashboardStats · EmptyState · ErrorCard · FaqSection · FeedbackForm · FileCard · FooterSection · GallerySection · HeaderSection · LoadingPage · NotFoundPage · OverviewPage · PricingSection · ProfilePage · QuickActions · SettingsPage · StepperSection · SuccessCard · TestimonialCard · UploadCard · WaitlistPage

### Featured Components

BeforeAfter · BlogCard · Calendar · Carousel · ChatBubble · CodeBlock · CopyToClipboard · Counter · DataTableSection · GlitchText · HardcoreInput · Kanban · Kbd · Marquee · Pagination · ScratchCard · SearchWidget · SketchyChart · Spinner · Stepper · Timeline · TreeView

## Claude Code Skill

BrutxUI provides a Claude Code Skill that enables AI assistants to generate component code following BrutxUI design specifications.

### Installation

Copy the `skills/brutxui/` directory to your global Claude Code configuration directory:

```bash
# Windows
xcopy /E /I skills\brutxui %USERPROFILE%\.claude\skills\brutxui

# macOS / Linux
cp -r skills/brutxui ~/.claude/skills/brutxui
```

### Usage

After installation, simply describe your needs in Claude Code:

- "Create a login form using BrutxUI"
- "Build a neo-brutalist pricing page"
- "How do I use the BrutxUI Button component?"

Claude will automatically reference component documentation, style specifications, and code templates to generate code that follows BrutxUI design conventions.

## Notes

- **Dark Mode**: Add/remove `.dark` on `html` or `body` to toggle the theme
- **Component Ownership**: Components are copied into your project, giving you full ownership and customization control
- **Token Overrides**: Override CSS variables (`--brutal-*`) to customize the design system
- **Theme Presets**: `.theme-classic` (default) · `.theme-pastel` (soft) · `.theme-mono` (monochrome)

## License

[MIT](https://opensource.org/licenses/MIT)
