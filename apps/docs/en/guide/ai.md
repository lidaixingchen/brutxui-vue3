---
title: AI Integration
description: Learn how to integrate BrutxUI with AI coding assistants
translated: true
---

# AI Integration

BrutxUI is designed to work seamlessly with AI coding assistants. The component library provides structured, type-safe APIs that AI tools can understand and use to generate code.

## AGENTS.md

The `AGENTS.md` file at the project root is a unified configuration file for AI coding assistants, providing project-specific instructions for all AI tools (Cursor, Copilot, Windsurf, Claude Code, etc.), including:

- Monorepo structure and commands
- Vue 3 `<script setup>` component conventions
- Import path aliases (`@/` mapping)
- CVA variant patterns and `cn()` class name merging utility
- Neo-Brutalism design tokens and visual rules
- Anti-pattern checklist (no soft shadows, no rounded borders, etc.)
- Code style rules (4-space indentation, single quotes, no comments)
- Security requirements and Registry Schema specifications

AI assistants can use `AGENTS.md` to:

- Understand the project structure and available commands
- Generate component code that follows project conventions
- Follow Neo-Brutalism visual rules
- Avoid anti-patterns (soft shadows, rounded borders, etc.)
- Use import paths and class name merging utilities correctly

## BrutxUI Skill

BrutxUI provides a dedicated AI Skill file (`skills/brutxui/SKILL.md`) that gives AI coding assistants complete knowledge of the component library. Unlike `AGENTS.md` which provides project-level instructions, the Skill focuses on **code generation** — telling AI how to correctly use each BrutxUI component.

### How to Use

In AI tools that support Skills (such as Claude Code), type `/brutxui` to activate. The Skill automatically loads the following:

- Complete component list (40+ components + 30+ block templates)
- Import methods (npm package import / copy-paste import)
- Style specifications (required / prohibited class names)
- Theme system (Classic / Pastel / Mono / Warm presets)
- Internationalization configuration (`useLocale()`, language switching, custom language packs)
- Code templates (forms, timelines, charts, and other common scenarios)
- Reference files by category (forms, layout, data display, feedback, blocks, etc.)

### Skill vs AGENTS.md

| Dimension | AGENTS.md | BrutxUI Skill |
| --- | --- | --- |
| Scope | Project-level (monorepo structure, commands, release process) | Component-level (code generation, style specs, API usage) |
| Trigger | Auto-loaded | `/brutxui` command |
| Use case | Understanding project structure, running commands | Generating component code, selecting correct variants and styles |
| Content granularity | Coarse (conventions and rules) | Fine (Props/Events/Slots for each component) |

### Reference File Structure

The Skill's reference files are organized by component category:

```text
skills/brutxui/
├── SKILL.md                          # Main file (component list, specs, templates)
└── references/
    ├── design-tokens.md              # Design tokens, themes, i18n
    ├── components/
    │   ├── form.md                   # Form component Props
    │   ├── layout.md                 # Layout container Props
    │   ├── data.md                   # Data display Props
    │   ├── feedback.md               # Overlay/feedback Props
    │   └── brutal.md                 # Neo-Brutalism specialty component Props
    └── blocks/
        ├── layout-nav.md             # Header/footer/dashboard shell
        ├── marketing.md              # Hero/pricing/blog/FAQ
        ├── dashboard.md              # Stats/charts/data tables
        ├── pages.md                  # Login/settings/404 pages
        ├── feedback.md               # Empty/error/success/feedback states
        └── interactive.md            # Search/upload/quick actions
```

AI assistants automatically read the corresponding reference files based on the scenario when generating code, ensuring the generated code conforms to the component API.

## How AI Assistants Use BrutxUI

### Component Generation

AI assistants can generate BrutxUI components following established patterns:

```vue
<script setup>
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button.vue'

const isLoading = ref(false)

const buttonClasses = computed(() =>
    cn('custom-class')
)
</script>

<template>
    <Button variant="primary" size="lg" :loading="isLoading">
        Submit
    </Button>
</template>
```

### Variant Usage

All variant values are string literals, and AI can auto-complete them:

- **Button variants**: `default`, `primary`, `secondary`, `accent`, `danger`, `success`, `outline`, `ghost`, `link`
- **Button sizes**: `sm`, `default`, `lg`, `xl`, `icon`
- **Alert variants**: `default`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`
- **Badge variants**: `default`, `primary`, `secondary`, `accent`, `danger`, `success`, `outline`

### Form Patterns

AI can generate complete form implementations using the Form component with vee-validate:

```vue
<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Form from '@/components/ui/Form.vue'
import FormField from '@/components/ui/FormField.vue'
import FormItem from '@/components/ui/FormItem.vue'
import FormLabel from '@/components/ui/FormLabel.vue'
import FormControl from '@/components/ui/FormControl.vue'
import FormMessage from '@/components/ui/FormMessage.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const schema = toTypedSchema(z.object({
    email: z.string().email(),
    password: z.string().min(8),
}))

function onSubmit(values) {
    console.log(values)
}
</script>

<template>
    <Form :validation-schema="schema" @submit="onSubmit">
        <FormField name="email" v-slot="{ componentField }">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" type="email" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <Button type="submit" variant="primary">Sign In</Button>
    </Form>
</template>
```

### Composable Usage

AI can correctly use BrutxUI composables such as `useToast`:

```vue
<script setup>
import { useToast } from '@/composables/useToast'

const { success, error, warning, info } = useToast()

function handleSave() {
    success('Saved!', 'Your changes have been saved.')
}

function handleError() {
    error('Error', 'Something went wrong.')
}
</script>
```

## Best Practices for AI-Assisted Development

1. Always use `v-model` instead of `onChange`/`onInput` for two-way binding
2. Use `@click` instead of `onClick` as the event handler
3. Use `<script setup>` syntax, not Options API
4. Include the `.vue` extension when importing local project components
5. Use `ref()` and `computed()` instead of `useState` and `useMemo`
6. Use `cn()` to merge class names, never concatenate strings
7. Use `--brutal-*` CSS variables, never hardcode colors
8. Never use soft shadows (`shadow-md`, `shadow-lg`), only use `shadow-brutal*`
9. Never use rounded corners (`rounded-md`, `rounded-lg`), only use `rounded-brutal`
10. Interactive elements must have press feedback (`active:translate-y` + `active:shadow-none`)
