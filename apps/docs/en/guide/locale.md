---
title: Internationalization
description: Learn about BrutxUI's multi-language support and localization setup across 52+ components
---

# Internationalization (i18n)

BrutxUI includes a built-in lightweight multi-language system, **defaulting to Chinese (zh-CN)** with an official English (en) locale pack. No mandatory installation of `vue-i18n` is required.

---

## Design Principles

- **Zero Mandatory Third-Party Dependencies**: Built-in lightweight locale system based on Vue's `provide/inject`, which can also seamlessly integrate with `vue-i18n`;
- **Default Chinese**: All components default to simplified Chinese (`zh-CN`);
- **Hierarchical Priority**: `Explicit Component Props > Local texts Prop > provideLocale Injection > Global Plugin Config > Default zh-CN`;
- **Reactive Updates**: Pass a `Ref` or `ComputedRef` to trigger instant live updates upon language changes.

---

## Resolution Priority

Component texts resolve in descending order of precedence:

```text
Component Explicit Props > Component texts Prop > provideLocale Injected Value > Global Plugin Config > Default Chinese (zh-CN)
```

---

## Quick Start

### 1. Default Chinese (Zero Configuration)

Without any configuration, components render standard Chinese strings:

```vue
<template>
    <CommandInput />
    <!-- Default placeholder displays "输入命令或搜索..." -->
</template>
```

### 2. Global English Configuration

Configure the locale in your application entry point:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

---

## Reactive Dynamic Language Switching

`provideLocale` accepts `MaybeRef<Locale>`. Passing a `computed` or `ref` updates all descendant components seamlessly:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { provideLocale, zhCN, en, Button, CommandInput } from 'brutx-ui-vue'

const currentLang = ref<'zh' | 'en'>('zh')
const activeLocale = computed(() => (currentLang.value === 'en' ? en : zhCN))

// Inject reactive locale to subtree
provideLocale(activeLocale)

function toggleLanguage() {
    currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}
</script>

<template>
    <div class="flex flex-col gap-4 p-4">
        <div class="flex items-center gap-2">
            <Button variant="default" size="sm" @click="toggleLanguage">
                Switch to {{ currentLang === 'zh' ? 'English' : '中文' }}
            </Button>
        </div>
        <CommandInput />
    </div>
</template>
```

---

## Subtree Overrides and Fallback Locales

### Subtree Locale Override

Use `provideLocale` to isolate a subtree to a specific language without affecting outer modules:

```vue
<script setup lang="ts">
import { provideLocale, en, CommandInput } from 'brutx-ui-vue'

// This component and all descendants render in English
provideLocale(en)
</script>

<template>
    <div class="border-3 border-brutal p-4">
        <CommandInput />
    </div>
</template>
```

### Custom Fallback Locale

If a custom locale only translates a subset of keys, provide a fallback locale:

```vue
<script setup lang="ts">
import { provideLocale, en } from 'brutx-ui-vue'

provideLocale({
    locale: en,
    fallbackLocale: {
        popconfirm: { confirm: 'Proceed', cancel: 'Dismiss' },
    },
})
</script>
```

Resolution chain: `Active locale` → `Custom fallbackLocale` → `Built-in zhCN` → `Raw path string`.

---

## Deep Merging and Customization

### Partial Override with mergeLocale

Deep merge with existing locale packs to customize specific messages:

```ts
import { zhCN, mergeLocale } from 'brutx-ui-vue'

const customZh = mergeLocale(zhCN, {
    command: {
        placeholder: 'Type a command or search docs...',
    },
    dataTable: {
        emptyText: 'No matching records found',
    },
})
```

---

## Coexisting with vue-i18n

When integrating with `vue-i18n`, keep BrutxUI synchronized via a computed property:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { provideLocale, zhCN, en } from 'brutx-ui-vue'

const { locale } = useI18n()

// Map vue-i18n locale to BrutxUI pack
const brutxLocale = computed(() => (locale.value === 'en' ? en : zhCN))
provideLocale(brutxLocale)
</script>
```

---

## useLocale Composable

Read current locale settings or perform interpolated translation:

```vue
<script setup lang="ts">
import { useLocale } from 'brutx-ui-vue'

const { locale, t } = useLocale()

// Standard key translation
const placeholder = t('command.placeholder')

// Translation with interpolation parameters
const countLabel = t('combobox.selectedCount', { count: 5 }) // "5 selected"
const pageInfo = t('pagination.page', { number: 3 })         // "Page 3"
</script>
```

---

## Supported Component & Key Index (52+ Components)

| Module / Component | Key Prefix | Core Keys & Interpolation Parameters |
| :--- | :--- | :--- |
| **Command** | `command.*` | `placeholder`, `emptyText`, `dialogTitle`, `dialogDescription`, `searchLabel` |
| **Combobox** | `combobox.*` | `placeholder`, `multiPlaceholder`, `searchPlaceholder`, `emptyText`, `selectedCount` (`{count}`), `create` |
| **Pagination** | `pagination.*` | `firstPage`, `previousPage`, `nextPage`, `lastPage`, `page` (`{number}`), `perPageOption` (`{size}`), `total` (`{total}`) |
| **Carousel** | `carousel.*` | `previousSlide`, `nextSlide`, `goToSlide` (`{index}`) |
| **Spinner** | `spinner.*` | `loading` |
| **Button / Submit** | `submitButton.*` | `submitting` |
| **CopyToClipboard** | `copyToClipboard.*` | `copy`, `copied`, `copyFailed` |
| **BeforeAfter** | `beforeAfter.*` | `before`, `after`, `comparisonSlider` |
| **AuthCard** | `authCard.*` | `welcomeBack`, `signInToContinue`, `google`, `github`, `orEmailLogin`, `email`, `password`, `signIn`, `register` |
| **DashboardShell** | `dashboardShell.*` | `sidebarNavigation`, `signOut`, `brand`, `openNavigation`, `closeNavigation` |
| **BrutalistHero** | `brutalistHero.*` | `title`, `primaryCtaText`, `secondaryCtaText`, `neoBrutalismUI`, `defaultSubtitle` |
| **CardWindowHeader**| `cardWindowHeader.*`| `close`, `minimize`, `maximize` |
| **Toast** | `toast.*` | `close`, `container` |
| **Message** | `message.*` | `close` |
| **Dialog** | `dialog.*` | `close` |
| **MessageBox** | `messageBox.*` | `confirm`, `cancel` |
| **Sheet** | `sheet.*` | `close` |
| **Breadcrumb** | `breadcrumb.*` | `label`, `more` |
| **TreeView** | `treeView.*` | `fileTree` |
| **TreeSelect** | `treeSelect.*` | `placeholder`, `emptyText` |
| **Cascader** | `cascader.*` | `placeholder`, `emptyText` |
| **Transfer** | `transfer.*` | `availableTitle`, `selectedTitle`, `searchPlaceholder`, `emptyText`, `clearAll`, `selectAll`, `itemCount` (`{count}`) |
| **Stepper** | `stepper.*` | `progressSteps`, `step` (`{index}`, `{title}`) |
| **HeaderSection** | `headerSection.*` | `defaultLogoText`, `defaultCtaText`, `menuLabel` |
| **FooterSection** | `footerSection.*` | `defaultLogoText`, `defaultDescription`, `defaultCopyright` |
| **FeedbackForm** | `feedbackForm.*` | `defaultTitle`, `defaultDescription`, `defaultSubmitText`, `successTitle`, `nameLabel`, `emailLabel`, `messageLabel` |
| **CookieConsent** | `cookieConsent.*` | `defaultTitle`, `defaultDescription`, `defaultAcceptText`, `defaultDeclineText` |
| **DataTable** | `dataTable.*` | `emptyText`, `searchPlaceholder`, `selectedCount` (`{count}`) |
| **FormWizard** | `formWizard.*` | `previous`, `next`, `submit` |
| **ChatBubble** | `chatBubble.*` | `delivered`, `read` |
| **ScratchCard** | `scratchCard.*` | `ariaLabel` |
| **SketchyChart** | `sketchyChart.*` | `lineAriaLabel`, `barAriaLabel`, `pieAriaLabel` |
| **Card3D** | `card3d.*` | `ariaLabel` |
| **Avatar** | `avatar.*` | `fallback` |
| **HardcoreInput** | `hardcoreInput.*` | `invalidInput` |
| **CodeBlock** | `codeBlock.*` | `copy`, `copied`, `expand`, `collapse` |
| **Calendar** | `calendar.*` | `previousMonth`, `nextMonth` |
| **DatePicker** | `datePicker.*` | `placeholder`, `clear` |
| **ColorPicker** | `colorPicker.*` | `placeholder`, `clear` |
| **Kanban** | `kanban.*` | `dropCardsHere`, `addCard`, `cardGrabbed`, `cardReleased`, `cardMoved`, `cardMovedToColumn` (`{column}`) |
| **Timeline** | `timeline.*` | `label` |
| **Tabs** | `tabs.*` | `more` |
| **PricingSection** | `pricingSection.*` | `defaultTitle`, `mostPopular`, `perLifetime`, `planStarterName`, `planProName`, `planEnterpriseName` |
| **ColorModeSwitcher**| `colorModeSwitcher.*`| `light`, `dark`, `system`, `toggleTheme` |
| **Input / NumberInput / Textarea** | `input.*` / `numberInput.*` / `textarea.*` | `placeholder` |
| **VirtualScroll / InfiniteScroll** | `virtualScroll.*` / `infiniteScroll.*` | `emptyText` / `loading` |
| **Switch / Checkbox**| `switch.*` / `checkbox.*` | `checked`, `unchecked` |
| **TagsInput** | `tagsInput.*` | `placeholder`, `remove` |
| **Badge / Alert** | `badge.*` / `alert.*` | `close` |
| **Popconfirm** | `popconfirm.*` | `confirm`, `cancel` |
| **Upload** | `upload.*` | `dragText`, `browseText`, `maxSizeError`, `limitError` (`{limit}`), `retry` |
| **Tour** | `tour.*` | `prev`, `next`, `finish`, `skip` |
| **Statistic** | `statistic.*` | `empty`, `up`, `down` |
| **Countdown** | `countdown.*` | `finished` |
