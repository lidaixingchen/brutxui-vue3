# Component Usage Guide

This guide introduces the best ways to use BrutxUI components to help you write robust, maintainable code.

## 1. Component Selection Guide

### 1.1 Basic Interaction Components

| Scenario | Recommended Component | Description |
|------|----------|------|
| Trigger actions | `Button` | Supports variant, size, and loading states. |
| Text input | `Input` | Supports clearable, password toggle, and character counts. |
| Multi-line text | `Textarea` | Automatically adjusts height. |
| Numeric input | `NumberInput` | Built-in step buttons and range validation. |
| Single select | `RadioGroup` | Semantic radio groups. |
| Multi-select | `Checkbox` | Supports indeterminate states. |
| Toggle switch | `Switch` | Boolean switches. |
| Options selection | `Select` / `Combobox` | `Select` for fixed options; `Combobox` for searchable items. |

### 1.2 Composite Form Scenarios

```vue
<!-- Inputs with prepended or appended content -->
<template>
  <Input v-model="url" placeholder="Enter URL">
    <template #prepend>
      <span class="px-3 border-r-3 border-brutal bg-brutal-muted flex items-center">
        https://
      </span>
    </template>
    <template #append>
      <Button variant="primary" size="sm" @click="verify">Verify</Button>
    </template>
  </Input>
</template>
```

### 1.3 Feedback Components

| Scenario | Recommended Component | Description |
|------|----------|------|
| Critical confirmation | `AlertDialog` | Blocking prompt; requires explicit user action. |
| Temporary panels | `Dialog` / `Sheet` | Closable modal overlays. |
| Action feedback | `Toast` | Auto-dismissing notifications. |
| Form validation error | `FormMessage` | Inline error message. |
| Long-running operations | `Progress` / `Spinner` | Visual progress indicator. |

---

## 2. Props Best Practices

### 2.1 Variants and Sizes

BrutxUI components follow a unified `variant` + `size` design pattern:

```vue
<template>
  <!-- Button Variants -->
  <Button variant="default">Default</Button>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="accent">Accent</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="success">Success</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>

  <!-- Button Sizes -->
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">Extra Large</Button>
</template>
```

### 2.2 Explicit Boolean Props

```vue
<template>
  <!-- Recommended: Explicit boolean bindings -->
  <Button :loading="isSubmitting">Submit</Button>
  <Button disabled>Disabled</Button>
  <Input v-model="name" clearable />

  <!-- Avoid: Implicit true (less readable) -->
  <!-- <Button loading>Submit</Button> -->
</template>
```

### 2.3 Style Customization via Class Prop

Most BrutxUI components accept a `class` prop to merge and override default styles:

```vue
<template>
  <Button variant="primary" class="w-full mt-4">
    Full Width Button
  </Button>

  <Card class="max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Custom Card</CardTitle>
    </CardHeader>
  </Card>
</template>
```

### 2.4 TypeScript Prop Extraction

```vue
<script setup lang="ts">
import { type ComponentProps } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'

// Extract Props type from the component definition
type ButtonProps = ComponentProps<typeof Button>

// Use within configuration helpers
function createButtonConfig(): ButtonProps {
  return {
    variant: 'primary',
    size: 'lg',
    loading: false,
  }
}
</script>
```

---

## 3. Event Handling

### 3.1 Two-way Bindings with v-model

```vue
<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const checked = ref(false)
const selected = ref('')
</script>

<template>
  <Input v-model="text" placeholder="Enter text" />
  <Checkbox v-model:checked="checked" label="Accept terms" />
  <Select v-model="selected" :options="options" />
</template>
```

### 3.2 Listening to Component Events

```vue
<template>
  <!-- Clear Event -->
  <Input v-model="query" clearable @clear="handleClear" />

  <!-- Close Event -->
  <Alert variant="info" @close="handleAlertClose">
    <AlertTitle>Info</AlertTitle>
    <AlertDescription>Operation completed successfully.</AlertDescription>
  </Alert>

  <!-- Dialog Control -->
  <Dialog v-model:open="dialogVisible">
    <DialogTrigger as-child>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent @close="handleDialogClose">
      <!-- Content -->
    </DialogContent>
  </Dialog>
</template>
```

### 3.3 Form Submission Workflow

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'brutx-ui-vue'

const { toast } = useToast()
const isSubmitting = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await submitForm()
    toast({ title: 'Submitted successfully', variant: 'success' })
  } catch (error) {
    toast({ title: 'Submission failed', variant: 'destructive' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- Form contents -->
    <Button type="submit" :loading="isSubmitting">Submit</Button>
  </form>
</template>
```

---

## 4. Slot Usage

### 4.1 Default Slots

```vue
<template>
  <Button>
    <IconDownload class="w-4 h-4" />
    Download File
  </Button>
</template>
```

### 4.2 Named Slots

```vue
<template>
  <!-- Prepend & Append in Input -->
  <Input v-model="price" placeholder="0.00">
    <template #prepend>
      <span class="px-3 bg-brutal-muted border-r-3 border-brutal flex items-center">
        $
      </span>
    </template>
    <template #append>
      <span class="px-3 bg-brutal-muted border-l-3 border-brutal flex items-center">
        USD
      </span>
    </template>
  </Input>

  <!-- Actions slot in Alert -->
  <Alert variant="warning">
    <AlertTitle>Warning</AlertTitle>
    <AlertDescription>This action cannot be undone.</AlertDescription>
    <template #actions>
      <Button variant="outline" size="sm" @click="dismiss">Dismiss</Button>
      <Button variant="primary" size="sm" @click="confirm">Confirm</Button>
    </template>
  </Alert>
</template>
```

### 4.3 Card Composite Slots

```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle>User Profile</CardTitle>
      <CardDescription>Manage details here.</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Main Content -->
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save</Button>
    </CardFooter>
  </Card>
</template>
```

---

## 5. Composition Patterns

### 5.1 Composite Component Layout

BrutxUI composite components (e.g., Accordion, Tabs, Dialog) leverage the `Root-Trigger-Content` structure:

```vue
<template>
  <!-- Accordion -->
  <Accordion type="single" collapsible>
    <AccordionItem value="item-1">
      <AccordionTrigger>Section One</AccordionTrigger>
      <AccordionContent>Content for section one.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Section Two</AccordionTrigger>
      <AccordionContent>Content for section two.</AccordionContent>
    </AccordionItem>
  </Accordion>

  <!-- Tabs -->
  <Tabs default-value="account">
    <TabsList>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
    </TabsList>
    <TabsContent value="account">Account setup details.</TabsContent>
    <TabsContent value="password">Manage password settings.</TabsContent>
  </Tabs>
</template>
```

### 5.2 Composable Hook Logic Reusability

```vue
<script setup lang="ts">
import { useToast, useClipboard, useDebounce } from 'brutx-ui-vue'

// Toast hook
const { toast } = useToast()

// Clipboard hook
const { copy, isSupported } = useClipboard()

// Debounce hook
const [debouncedSearch, isDebouncing] = useDebounce(async (query: string) => {
  const results = await searchApi(query)
  // Handle results
}, 300)

async function handleCopy(text: string) {
  await copy(text)
  toast({ title: 'Copied to clipboard!' })
}
</script>
```

### 5.3 Provide/Inject State Sharing

```vue
<!-- Parent Component: Providing layout details -->
<script setup lang="ts">
import { provide } from 'vue'

provide('formLayout', {
  labelWidth: '120px',
  labelPosition: 'right',
})
</script>

<!-- Child Component: Injecting details -->
<script setup lang="ts">
import { inject } from 'vue'

const layout = inject('formLayout', {
  labelWidth: '100px',
  labelPosition: 'left',
})
</script>
```

### 5.4 asChild Pattern

BrutxUI components support the `asChild` prop, which forwards all classes and events to a single child node:

```vue
<template>
  <!-- Render custom NuxtLink styled like a BrutxUI button -->
  <Button as-child>
    <NuxtLink to="/dashboard">
      Go to Dashboard
    </NuxtLink>
  </Button>

  <!-- dialog trigger wrapping custom button -->
  <DialogTrigger as-child>
    <Button variant="outline" size="sm">
      Custom Trigger
    </Button>
  </DialogTrigger>
</template>
```

### 5.5 Invoking Ref Methods

Certain components expose instance methods that can be called directly:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const inputRef = ref<InstanceType<typeof Input>>()

function focusInput() {
  inputRef.value?.focus()
}

function selectAll() {
  inputRef.value?.select()
}
</script>

<template>
  <Input ref="inputRef" v-model="value" />
  <Button @click="focusInput">Focus</Button>
  <Button @click="selectAll">Select All</Button>
</template>
```
