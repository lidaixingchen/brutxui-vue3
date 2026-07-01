# Accessibility Guide

BrutxUI features built-in support for accessibility (A11y). This guide explains how to properly configure ARIA attributes, handle focus control, and leverage keyboard navigation to ensure a seamless experience for all users.

## 1. ARIA Attributes

### 1.1 Semantic Defaults

BrutxUI components are built on top of `reka-ui` primitives, which have correct accessibility attributes baked in. You do not need to configure them manually:

```vue
<template>
  <!-- Dialog automatically binds role="dialog" and aria-modal -->
  <Dialog>
    <DialogTrigger as-child>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogDescription>This action cannot be undone. Please confirm.</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>

  <!-- AlertDialog automatically sets role="alertdialog" -->
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="danger">Delete</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action will permanently delete the resource.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
```

### 1.2 Form Controls Relationships

```vue
<template>
  <!-- Link inputs to labels with explicit id references -->
  <div class="space-y-2">
    <Label for="username">Username</Label>
    <Input id="username" v-model="username" placeholder="Enter username" />
    <p class="text-sm text-brutal-muted-foreground">
      A unique display identifier for your account.
    </p>
  </div>

  <!-- FormField automatically maps relationships underneath -->
  <FormField name="email" v-slot="{ field }">
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input v-bind="field" type="email" placeholder="your@email.com" />
      </FormControl>
      <FormDescription>Used for password recovery and notifications.</FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
```

### 1.3 State Updates

```vue
<template>
  <!-- Use aria-live to notify users of dynamic content updates -->
  <div aria-live="polite" aria-atomic="true">
    <Alert v-if="showSuccess" variant="success">
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes have been saved.</AlertDescription>
    </Alert>
  </div>

  <!-- Loading Busy Feedback -->
  <Button :disabled="isLoading">
    <Spinner v-if="isLoading" class="mr-2" aria-hidden="true" />
    <span>{{ isLoading ? 'Submitting...' : 'Submit' }}</span>
  </Button>
</template>
```

### 1.4 Labels for Interactive Icon Elements

```vue
<template>
  <!-- Interactive elements with only icons must have explicit label descriptors -->
  <Button variant="ghost" size="icon" aria-label="Close panel">
    <IconClose class="h-4 w-4" />
  </Button>

  <Button variant="outline" size="icon" aria-label="Search content">
    <IconSearch class="h-4 w-4" />
  </Button>

  <!-- Buttons with text do not require aria-labels -->
  <Button>
    <IconPlus class="h-4 w-4" />
    Add New Project
  </Button>
</template>
```

---

## 2. Keyboard Navigation

### 2.1 Built-in Keyboard Mappings

Keyboard interactions are mapped natively within components:

| Component | Key | Interaction Behavior |
|------|------|------|
| Button | Enter / Space | Triggers click action |
| Dialog | Escape | Dismisses dialog |
| Select | Arrow Up/Down | Cycles through options |
| Select | Enter | Confirms selection |
| Tabs | Arrow Left/Right | Navigates between tabs |
| Accordion | Arrow Up/Down | Toggles expanded state |
| Combobox | Arrow Up/Down | Cycles through search options |
| Combobox | Enter | Confirms selection |
| DropdownMenu | Arrow Up/Down | Navigates menu list options |
| Command | Arrow Up/Down | Navigates command list results |

### 2.2 Focus Lifecycle

```vue
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref<InstanceType<typeof Input>>()
const dialogOpen = ref(false)

async function handleDialogClose() {
  dialogOpen.value = false
  // Return focus back to the input element once dialog finishes closing
  await nextTick()
  inputRef.value?.focus()
}
</script>

<template>
  <Input ref="inputRef" v-model="searchQuery" placeholder="Search..." />
  
  <Dialog v-model:open="dialogOpen">
    <DialogTrigger as-child>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent @close="handleDialogClose">
      <!-- Content -->
    </DialogContent>
  </Dialog>
</template>
```

### 2.3 Custom Key Mappings

```vue
<script setup lang="ts">
import { useEventListener } from 'brutx-ui-vue'

// Listen for global shortcut binds
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  // Ctrl+K to open Search panel
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    commandOpen.value = true
  }
  
  // Escape to close all overlays
  if (event.key === 'Escape') {
    closeAllModals()
  }
})
</script>

<template>
  <!-- Render keyboard indicator badges -->
  <Button variant="outline" @click="openSearch">
    <IconSearch class="h-4 w-4" />
    Search
    <Kbd class="ml-2">Ctrl</Kbd>
    <Kbd>K</Kbd>
  </Button>
</template>
```

---

## 3. Screen Reader Support

### 3.1 Text Alternatives

```vue
<template>
  <!-- Avatars require fallbacks and image alt tags -->
  <Avatar>
    <AvatarImage src="/avatar.jpg" alt="User profile avatar image" />
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>

  <!-- Decorative icons must be hidden from screen readers -->
  <div class="flex items-center gap-2">
    <IconStar class="h-4 w-4 text-brutal-warning" aria-hidden="true" />
    <span>Favorite</span>
  </div>

  <!-- Decorative background shapes -->
  <div aria-hidden="true">
    <NoiseBackground />
  </div>
</template>
```

### 3.2 Describing Layout States

```vue
<template>
  <!-- Switch components state description -->
  <div class="flex items-center gap-2">
    <Switch
      v-model:checked="notifications"
      aria-label="Toggle email notifications"
    />
    <span>{{ notifications ? 'Enabled' : 'Disabled' }}</span>
  </div>

  <!-- Progress description -->
  <div>
    <Progress :value="75" aria-label="Upload progress indicator" />
    <span class="sr-only">Upload progress: 75% complete</span>
    <span aria-hidden="true">75%</span>
  </div>

  <!-- Loading State description -->
  <Button disabled aria-busy="true">
    <Spinner class="mr-2" aria-hidden="true" />
    Loading...
  </Button>
</template>
```

### 3.3 Semantic Navigation Lists

```vue
<template>
  <!-- Breadcrumb navigation structure -->
  <Breadcrumb aria-label="Navigation path">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/products">Products</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Detail</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>

  <!-- Accessible tab controls -->
  <Tabs default-value="tab1" aria-label="Account Settings Panel">
    <TabsList aria-label="Settings Categories">
      <TabsTrigger value="tab1">General</TabsTrigger>
      <TabsTrigger value="tab2">Security</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">General settings details.</TabsContent>
    <TabsContent value="tab2">Security configuration panel.</TabsContent>
  </Tabs>
</template>
```

---

## 4. User Preferences & System Toggles

### 4.1 High Contrast Adaptations

BrutxUI features built-in support for high contrast theme variables:

```vue
<script setup lang="ts">
import { useTheme } from 'brutx-ui-vue'

const { theme, setTheme } = useTheme()
</script>

<template>
  <Select v-model="theme" @update:model-value="setTheme">
    <SelectTrigger>
      <SelectValue placeholder="Select Theme" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="default">Default</SelectItem>
      <SelectItem value="dark">Dark Theme</SelectItem>
      <SelectItem value="high-contrast">High Contrast</SelectItem>
    </SelectContent>
  </Select>
</template>
```

### 4.2 Reduced Motion Prefers

```vue
<script setup lang="ts">
import { useReducedMotion } from 'brutx-ui-vue'

// Detect OS level request for reduced animations
const prefersReducedMotion = useReducedMotion()
</script>

<template>
  <div :class="{ 'motion-safe:animate-bounce': !prefersReducedMotion }">
    <!-- Adjust complex transitions based on preference -->
  </div>
</template>
```

### 4.3 Custom Contrast Variable Overrides

```css
/* Media query hook to override custom layout styling */
@media (prefers-contrast: high) {
  :root {
    --brutal-border-width: 4px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 6px;
    --brutal-shadow-offset-y: 6px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #0000cc;
    --brutal-primary-foreground: #ffffff;
  }
}
```

---

## 5. Accessibility Checklist

### 5.1 Interactive Elements & Markup
- [ ] All interactive elements are focusable via keyboard navigation.
- [ ] Graphic and icon-only buttons include descriptive `aria-label` settings.
- [ ] Input elements are linked to `<Label>` components using explicit `for`/`id` variables.
- [ ] Overlay Dialogs include correct `DialogTitle` and `DialogDescription` components.
- [ ] Dynamic toast status feeds use `aria-live` containers.
- [ ] Async processing status updates toggle `aria-busy="true"` on parent buttons.

### 5.2 Visual Contrast & Styling
- [ ] Colors conform to WCAG 2.1 AA contrast requirements (minimum 4.5:1 ratio for standard text).
- [ ] Active focus indicator ring states are clearly visible.
- [ ] Layout instructions do not rely solely on color variants (e.g., text indicators accompany status updates).
- [ ] Variable overrides support system high-contrast theme flags.
- [ ] Layout animations toggle based on reduced-motion preference signals.

### 5.3 Page Content Structure
- [ ] Layout headings follow a single sequential semantic structure (`<h1>` to `<h6>`).
- [ ] Lists are marked up using semantic lists (`<ul>`, `<ol>`).
- [ ] Navigation components are wrapped inside `<nav>` elements.
- [ ] Core page blocks are enclosed in a `<main>` container element.
- [ ] Pages provide skip-to-content links for keyboard navigation bypasses.

```vue
<template>
  <div>
    <!-- Skip Navigation Link -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
      Skip to content
    </a>
    
    <nav aria-label="Main Navigation">
      <!-- Nav details -->
    </nav>
    
    <main id="main-content">
      <!-- Main Content Block -->
    </main>
  </div>
</template>
```

---

## 6. Testing Resources

| Tool | Focus Objective |
|------|------|
| axe DevTools | Browser plugin; scans DOM for A11y violations. |
| Lighthouse | Built-in Chrome auditor; reports accessibility scores. |
| NVDA / VoiceOver | Audio screen reader tests. |
| Keyboard only test | Verify accessibility by unplugging mouse. |

```bash
# Add axe-core testing plugins
npm install --save-dev @axe-core/vue

# Component unit test usage
import { mount } from '@vue/test-utils'
import axe from '@axe-core/vue'

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    const wrapper = mount(Button, { slots: { default: 'Click me' } })
    const results = await axe(wrapper.element)
    expect(results.violations).toHaveLength(0)
  })
})
```
