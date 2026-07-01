# Styling & Customization Guide

BrutxUI features a highly flexible style customization system. This guide demonstrates how to customize component visuals using CSS variables, custom theme configurations, and Tailwind extensions.

## 1. CSS Variable Overrides

### 1.1 Variable Design System

BrutxUI styles are powered by CSS Custom Properties (CSS variables). All variable tokens are prefixed with `--brutal-`:

```css
/* Color System */
--brutal-bg                    /* Background color */
--brutal-fg                    /* Foreground text color */
--brutal-primary               /* Primary color */
--brutal-primary-foreground    /* Text color on top of primary */
--brutal-secondary             /* Secondary color */
--brutal-secondary-foreground  /* Text color on top of secondary */
--brutal-accent                /* Accent color */
--brutal-accent-foreground     /* Text color on top of accent */
--brutal-destructive           /* Danger/error color */
--brutal-destructive-foreground
--brutal-success               /* Success color */
--brutal-success-foreground
--brutal-info                  /* Info color */
--brutal-info-foreground
--brutal-muted                 /* Muted background color */
--brutal-muted-foreground      /* Muted text color */
--brutal-ring                  /* Focus ring color */
--brutal-overlay               /* Overlay backdrop color */
--brutal-placeholder           /* Placeholder text color */

/* Borders & Shadows */
--brutal-border-width          /* Border width, defaults to 3px */
--brutal-border-color          /* Border color */
--brutal-shadow-offset-x       /* Shadow horizontal offset */
--brutal-shadow-offset-y       /* Shadow vertical offset */
--brutal-shadow-color          /* Shadow color */
--brutal-radius                /* Border radius, defaults to 0px */
--brutal-pressed-offset        /* Translation offset when clicked */
```

### 1.2 Global Variable Overrides

```css
/* Override tokens in your global CSS stylesheet */
:root {
  --brutal-primary: #6366f1;
  --brutal-primary-foreground: #ffffff;
  --brutal-border-width: 2px;
  --brutal-radius: 8px;
  --brutal-shadow-offset-x: 4px;
  --brutal-shadow-offset-y: 4px;
}
```

### 1.3 Local Variable Overrides

```vue
<template>
  <!-- Override variable values within a specific container scope -->
  <div
    class="custom-section"
    style="--brutal-primary: #10b981; --brutal-radius: 12px;"
  >
    <Button variant="primary">Green Button</Button>
    <Card>Rounded Card</Card>
  </div>
</template>

<style scoped>
.custom-section {
  --brutal-primary: #10b981;
  --brutal-primary-foreground: #ffffff;
  --brutal-radius: 12px;
}
</style>
```

### 1.4 Dark Mode Variables

```css
/* Dark mode variable bindings */
.dark {
  --brutal-bg: #0a0a0a;
  --brutal-fg: #fafafa;
  --brutal-primary: #818cf8;
  --brutal-primary-foreground: #0a0a0a;
  --brutal-border-color: #404040;
  --brutal-shadow-color: #262626;
}
```

---

## 2. Theme Customization

### 2.1 Using Preset Themes

BrutxUI includes 4 built-in theme presets:

```vue
<script setup lang="ts">
import { useTheme } from 'brutx-ui-vue'

const { theme, setTheme } = useTheme()
</script>

<template>
  <div :class="theme">
    <!-- Theme Switcher -->
    <Select v-model="theme" @update:model-value="setTheme">
      <SelectTrigger class="w-[180px]">
        <SelectValue placeholder="Choose theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default</SelectItem>
        <SelectItem value="dark">Dark Theme</SelectItem>
        <SelectItem value="high-contrast">High Contrast</SelectItem>
        <SelectItem value="minimal">Minimal Theme</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
```

### 2.2 Creating a Custom Theme

```typescript
// themes/custom.ts
import { createCustomTheme, type ThemeVariables } from 'brutx-ui-vue'

export const customTheme = createCustomTheme('default', {
  primary: '#8b5cf6',
  'primary-foreground': '#ffffff',
  accent: '#f59e0b',
  'accent-foreground': '#000000',
  'border-width': '2px',
  radius: '8px',
  'shadow-offset-x': '3px',
  'shadow-offset-y': '3px',
})
```

### 2.3 Styling via CSS Theme Classes

```css
/* Define custom theme classes */
.theme-corporate {
  --brutal-bg: #f8fafc;
  --brutal-fg: #1e293b;
  --brutal-primary: #0f172a;
  --brutal-primary-foreground: #f8fafc;
  --brutal-secondary: #475569;
  --brutal-secondary-foreground: #f8fafc;
  --brutal-border-color: #cbd5e1;
  --brutal-border-width: 1px;
  --brutal-radius: 6px;
  --brutal-shadow-offset-x: 2px;
  --brutal-shadow-offset-y: 2px;
  --brutal-shadow-color: #94a3b8;
}

.theme-vibrant {
  --brutal-bg: #fef3c7;
  --brutal-fg: #78350f;
  --brutal-primary: #f43f5e;
  --brutal-primary-foreground: #ffffff;
  --brutal-accent: #8b5cf6;
  --brutal-accent-foreground: #ffffff;
  --brutal-border-color: #fbbf24;
  --brutal-border-width: 4px;
  --brutal-radius: 0px;
  --brutal-shadow-offset-x: 6px;
  --brutal-shadow-offset-y: 6px;
  --brutal-shadow-color: #f43f5e;
}
```

### 2.4 Dynamic Runtime Theme Switching

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const themes = [
  { name: 'Default', value: 'default' },
  { name: 'Corporate', value: 'theme-corporate' },
  { name: 'Vibrant', value: 'theme-vibrant' },
]

const currentTheme = ref('default')

watch(currentTheme, (newTheme) => {
  document.documentElement.className = newTheme
})
</script>

<template>
  <div class="flex gap-2">
    <Button
      v-for="t in themes"
      :key="t.value"
      :variant="currentTheme === t.value ? 'primary' : 'outline'"
      @click="currentTheme = t.value"
    >
      {{ t.name }}
    </Button>
  </div>
</template>
```

---

## 3. Tailwind Extensions

### 3.1 Using Preset Utility Classes

BrutxUI extends Tailwind CSS with dedicated utility values:

```vue
<template>
  <!-- Border styles -->
  <div class="border-3 border-brutal">3px Brutal Border</div>
  
  <!-- Shadows -->
  <div class="shadow-brutal">Brutal Shadow</div>
  
  <!-- Colors -->
  <div class="bg-brutal-primary text-brutal-primary-foreground">
    Primary Background
  </div>
  
  <!-- Combined style layouts -->
  <div class="border-3 border-brutal shadow-brutal bg-brutal-bg text-brutal-fg">
    Fully Brutalist Box
  </div>
</template>
```

### 3.2 Custom Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/brutx-ui-vue/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
      },
      borderWidth: {
        '4': '4px',
        '5': '5px',
      },
      boxShadow: {
        'brutal-lg': '8px 8px 0px 0px var(--brutal-shadow-color)',
        'brutal-xl': '12px 12px 0px 0px var(--brutal-shadow-color)',
      },
    },
  },
} satisfies Config
```

### 3.3 Conditional Merges with cn()

```vue
<script setup lang="ts">
import { cn } from 'brutx-ui-vue'

interface Props {
  variant?: 'default' | 'highlighted'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const classes = cn(
  'px-4 py-2 border-3 border-brutal',
  props.variant === 'highlighted' && 'bg-brutal-primary text-brutal-primary-foreground shadow-brutal',
  props.class
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
```

### 3.4 Advanced Conditionals

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from 'brutx-ui-vue'

interface Props {
  isActive?: boolean
  isError?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isError: false,
  size: 'md',
})

const classes = computed(() => cn(
  'border-3 border-brutal transition-all',
  {
    'bg-brutal-bg': !props.isActive && !props.isError,
    'bg-brutal-primary text-brutal-primary-foreground': props.isActive,
    'bg-brutal-destructive text-brutal-destructive-foreground': props.isError,
    'text-sm px-2 py-1': props.size === 'sm',
    'text-base px-4 py-2': props.size === 'md',
    'text-lg px-6 py-3': props.size === 'lg',
  }
))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
```

---

## 4. Custom Styling

### 4.1 Component Level Overrides

```vue
<template>
  <!-- Override with custom classes -->
  <Button
    variant="primary"
    class="w-full text-lg font-bold tracking-wider uppercase"
  >
    Custom Button
  </Button>
  
  <!-- Override with inline style variables -->
  <Card class="border-4 border-dashed border-brutal-primary">
    <CardContent class="p-8">
      Custom Card Details
    </CardContent>
  </Card>
</template>
```

### 4.2 Deep Selector Customization

```vue
<style scoped>
/* Target internal components directly */
:deep(.brutal-button) {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

:deep(.brutal-input) {
  font-family: 'Courier New', monospace;
}
</style>
```

### 4.3 Reusable Custom Styles

```css
/* styles/custom-components.css */

/* Reusable card presets */
.card-featured {
  @apply border-4 border-brutal-primary shadow-brutal-lg;
  background: linear-gradient(135deg, var(--brutal-bg) 0%, var(--brutal-primary) 100%);
}

.card-minimal {
  @apply border border-brutal-border;
  box-shadow: none;
}

/* Hover effects */
.btn-glow {
  @apply border-3 border-brutal shadow-brutal;
  transition: all 0.3s ease;
}

.btn-glow:hover {
  box-shadow: 0 0 20px var(--brutal-primary), var(--brutal-shadow-offset-x) var(--brutal-shadow-offset-y) 0 0 var(--brutal-shadow-color);
}

/* Dash inputs */
.input-dashed {
  @apply border-2 border-dashed border-brutal-border;
  border-radius: var(--brutal-radius);
}

.input-dashed:focus {
  @apply border-solid border-brutal-primary;
  outline: 2px solid var(--brutal-ring);
}
```

### 4.4 Responsive Styling

```vue
<template>
  <!-- Grid layouts responsive configurations -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card v-for="item in items" :key="item.id">
      <CardContent class="p-4 md:p-6">
        {{ item.name }}
      </CardContent>
    </Card>
  </div>
  
  <!-- Responsive visibility toggles -->
  <Button class="hidden md:inline-flex">
    Desktop Only
  </Button>
  <Button class="md:hidden" size="icon">
    <IconMenu />
  </Button>
</template>
```

---

## 5. Style Architecture

### 5.1 Project Directory Structure Recommendation

```
src/
├── assets/
├── styles/
│   ├── main.css           # Global stylesheet entry
│   ├── variables.css      # Core token definitions
│   ├── themes/
│   │   ├── default.css    # Default style definitions
│   │   ├── dark.css       # Dark mode theme
│   │   └── custom.css     # Custom style theme
│   └── utilities/
│       ├── buttons.css    # Button styling rules
│       └── cards.css      # Card styling rules
├── components/
└── App.vue
```

### 5.2 Token Specificity Hierarchy

```css
/* Lowest specificity */
:root {
  --brutal-primary: #6366f1;  /* Global default configuration */
}

.theme-custom {
  --brutal-primary: #8b5cf6;  /* Active Theme configuration override */
}

.section-special {
  --brutal-primary: #10b981;  /* Local scoped element override */
}
```

### 5.3 Performance Tuning

```css
/* Declare shared variables at root level to reduce DOM overhead */
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

/* Use CSS shorthands for less parsed content */
.badge {
  /* Recommended */
  border: var(--brutal-border-width) solid var(--brutal-border-color);
  
  /* Avoid */
  border-width: var(--brutal-border-width);
  border-style: solid;
  border-color: var(--brutal-border-color);
}
```

---

## 6. FAQ

### Q: How do I round the borders of components?

```css
/* Apply globally */
:root {
  --brutal-radius: 8px;
}

/* Apply to a single element class */
.my-button {
  --brutal-radius: 8px;
}
```

### Q: How can I remove shadows from elements?

```css
.no-shadow {
  --brutal-shadow-offset-x: 0px;
  --brutal-shadow-offset-y: 0px;
}
```

### Q: How do I set custom typography?

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

:root {
  font-family: 'Space Grotesk', sans-serif;
}
```

### Q: How do I render gradient backgrounds?

```vue
<template>
  <div class="bg-gradient-to-br from-brutal-primary to-brutal-accent p-8">
    <Card class="bg-brutal-bg/90 backdrop-blur-sm">
      <CardContent>Card on top of gradient background</CardContent>
    </Card>
  </div>
</template>
```
