---
title: Internationalization
description: Learn how to configure multi-language support in BrutxUI
translated: true
---

# Internationalization (i18n)

BrutxUI has built-in lightweight multi-language support. **The default language is Chinese (zh-CN)**, and an English (en) language pack is also provided. No need to install `vue-i18n` — it works out of the box.

## Design Principles

- **No dependency on vue-i18n** — built-in lightweight locale system (provide/inject), can coexist with vue-i18n
- **Chinese by default** — all component default text is in Chinese
- **Fully backward compatible** — props have the highest priority, existing usage is not affected
- **Zero-config out of the box** — displays Chinese when no configuration is provided
- **Reactive switching** — switch languages at runtime, components update automatically

## Priority Chain

Component text resolution priority from highest to lowest:

```text
Component props > Global locale config > Default Chinese (zh-CN)
```

## Default Chinese (Zero Config)

When no configuration is provided, components automatically display Chinese text:

```vue
<template>
    <CommandInput />
    <!-- placeholder shows "输入命令或搜索..." -->
</template>
```

## Globally Switch to English

Switch the language via the `locale` option of `BrutxUIPlugin`:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

## Partial Overrides

### Override a Single Component via Props

Props have the highest priority and can override any locale text:

```vue
<template>
    <CommandInput placeholder="Custom search..." />
    <Spinner label="Processing..." />
</template>
```

### Batch Override via the texts Prop

For components with extensive text (like AuthCard), a `texts` prop is provided for batch overrides:

```vue
<template>
    <AuthCard :texts="{
        google: 'Sign in with Google',
        github: 'Sign in with GitHub',
        orEmailLogin: 'Or sign in with email',
        signIn: 'Sign In',
    }" />
</template>
```

### Local Subtree Language Override

Use `provideLocale` to use a different language within a component subtree without affecting the global configuration:

```vue
<script setup>
import { provideLocale, en } from 'brutx-ui-vue'

provideLocale(en)
</script>

<template>
    <div>
        <!-- Components in this area display in English -->
        <CommandInput />
    </div>
</template>
```

## Reactive Switching

Both `BrutxUIPlugin` and `provideLocale` accept reactive locale values. Components update automatically when the language changes:

```vue
<script setup>
import { ref, computed } from 'vue'
import { BrutxUIPlugin, zhCN, en } from 'brutx-ui-vue'

const isEnglish = ref(false)
const locale = computed(() => isEnglish.value ? en : zhCN)
</script>
```

## Custom Language Packs

### Partial Override

Use `mergeLocale` for deep merging, overriding only the fields you need:

```ts
import { zhCN, mergeLocale } from 'brutx-ui-vue/locales'

const customLocale = mergeLocale(zhCN, {
    command: { placeholder: 'Please enter...' },
})
app.use(BrutxUIPlugin, { locale: customLocale })
```

### Create a New Language Pack

Import the `Locale` type and create a complete language pack:

```ts
import type { Locale } from 'brutx-ui-vue'
import { zhCN } from 'brutx-ui-vue/locales'

const jaJP: Locale = {
    command: {
        placeholder: 'コマンドを入力...',
        emptyText: '結果が見つかりません。',
        dialogTitle: 'コマンドパレット',
        dialogDescription: '実行するコマンドを検索...',
    },
    // ... translations for other components
}

app.use(BrutxUIPlugin, { locale: jaJP })
```

## Coexisting with vue-i18n

BrutxUI's locale system is independent of vue-i18n and they do not interfere with each other. It is recommended to synchronize BrutxUI's locale within vue-i18n's locale watch:

```ts
import { watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { provideLocale, zhCN, en } from 'brutx-ui-vue'

const LOCALE_MAP = { 'zh-CN': zhCN, en }

const { locale } = useI18n()
provideLocale(computed(() => LOCALE_MAP[locale.value] ?? zhCN))
```

## t() Translation Function

The `t()` function returned by `useLocale()` supports dot-path access and interpolation parameters:

```ts
import { useLocale } from 'brutx-ui-vue'

const { t } = useLocale()

t('command.placeholder')
// → '输入命令或搜索...'

t('combobox.selectedCount', { count: 3 })
// → '已选 3 项'

t('pagination.page', { number: 5 })
// → '第 5 页'
```

### Fallback Chain

When `t(path, params?)` is called, it looks up in the following order:

1. Look up the value for `path` in the current locale
2. If not found → fall back to the custom fallbackLocale (if configured)
3. If still not found → fall back to the value for `path` in the zh-CN language pack
4. If still not found → return the path string `path` itself

## Available Language Packs

| Language Pack | Import Path | Description |
|--------|---------|------|
| `zhCN` | `brutx-ui-vue` or `brutx-ui-vue/locales` | Simplified Chinese (default) |
| `en` | `brutx-ui-vue` or `brutx-ui-vue/locales` | English |

## API Reference

### BrutxUIPlugin

Vue plugin for globally configuring the locale.

```ts
interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
}

app.use(BrutxUIPlugin, { locale: en })
```

### provideLocale

Inject locale configuration within a component subtree. Supports two calling methods:

```ts
// Method 1: Direct locale (backward compatible)
function provideLocale(locale: MaybeRef<Locale>): void

// Method 2: Options object with custom fallback
function provideLocale(options: {
    locale: MaybeRef<Locale>
    fallbackLocale?: MaybeRef<Partial<Locale>>
}): void
```

#### Custom Fallback Locale

By default, when a key is not found in the current locale, it falls back to `zhCN`. You can customize the fallback chain via `fallbackLocale`:

```vue
<script setup>
import { provideLocale, en } from 'brutx-ui-vue'

// Custom fallback: en → customFallback → zhCN
provideLocale({
    locale: en,
    fallbackLocale: {
        button: { confirm: 'OK', cancel: 'Cancel' },
    },
})
</script>
```

Fallback order: user locale → fallbackLocale → zhCN → return path string

### useLocale

Get the current locale and translation function.

```ts
function useLocale(): {
    locale: ComputedRef<Locale>
    t: TranslateFunction
}

type TranslateFunction = (
    path: string,
    params?: Record<string, string | number>
) => string
```

### mergeLocale

Deep merge language packs for partial overrides.

```ts
function mergeLocale(base: Locale, override: DeepPartial<Locale>): Locale
```

## Supported Component Text Keys

| Component | Locale Keys | Has Interpolation Params |
|------|----------|-----------|
| Command | `command.placeholder`, `command.emptyText`, `command.dialogTitle`, `command.dialogDescription` | — |
| Combobox | `combobox.placeholder`, `combobox.multiPlaceholder`, `combobox.searchPlaceholder`, `combobox.emptyText`, `combobox.selectedCount` | `selectedCount`: `{count}` |
| Pagination | `pagination.firstPage`, `pagination.previousPage`, `pagination.nextPage`, `pagination.lastPage`, `pagination.page`, `pagination.label` | `page`: `{number}` |
| Carousel | `carousel.previousSlide`, `carousel.nextSlide`, `carousel.goToSlide` | `goToSlide`: `{index}` |
| Spinner | `spinner.loading` | — |
| Button | `submitButton.submitting` | — |
| CopyToClipboard | `copyToClipboard.copy`, `copyToClipboard.copied` | — |
| BeforeAfter | `beforeAfter.before`, `beforeAfter.after` | — |
| AuthCard | `authCard.welcomeBack`, `authCard.signInToContinue`, `authCard.google`, `authCard.github`, `authCard.orEmailLogin`, `authCard.email`, `authCard.password`, `authCard.forgotPassword`, `authCard.signIn`, `authCard.noAccount`, `authCard.register`, `authCard.emailPlaceholder`, `authCard.passwordPlaceholder` | — |
| WaitlistPage | `waitlistPage.title`, `waitlistPage.ctaText`, `waitlistPage.earlyAccess`, `waitlistPage.onWaitlist`, `waitlistPage.live`, `waitlistPage.defaultDescription` | `onWaitlist`: `{count}` |
| DashboardShell | `dashboardShell.sidebarNavigation`, `dashboardShell.signOut`, `dashboardShell.defaultEmail` | — |
| BrutalistHero | `brutalistHero.title`, `brutalistHero.primaryCtaText`, `brutalistHero.secondaryCtaText`, `brutalistHero.neoBrutalismUI`, `brutalistHero.defaultSubtitle` | — |
| Toast | `toast.close`, `toast.container` | — |
| Dialog | `dialog.close` | — |
| Sheet | `sheet.close` | — |
| Breadcrumb | `breadcrumb.label`, `breadcrumb.more` | — |
| TreeView | `treeView.fileTree` | — |
| Stepper | `stepper.progressSteps`, `stepper.step` | `step`: `{index}`, `{title}` |
| EmptyState | `emptyState.defaultTitle`, `emptyState.defaultActionText`, `emptyState.defaultDescription` | — |
| TestimonialCard | `testimonialCard.defaultQuote`, `testimonialCard.defaultAuthor`, `testimonialCard.defaultRole`, `testimonialCard.verified` | — |
| BlogCard | `blogCard.defaultTitle`, `blogCard.defaultExcerpt`, `blogCard.readMore` | — |
| FileCard | `fileCard.defaultFileName`, `fileCard.download` | — |
| QuickActions | `quickActions.defaultTitle`, `quickActions.badge` | — |
| FaqSection | `faqSection.defaultTitle`, `faqSection.defaultSubtitle` | — |
| HeaderSection | `headerSection.defaultLogoText`, `headerSection.defaultCtaText`, `headerSection.menuLabel` | — |
| FooterSection | `footerSection.defaultLogoText`, `footerSection.defaultDescription`, `footerSection.defaultCopyright` | — |
| NotFoundPage | `notFoundPage.defaultTitle`, `notFoundPage.defaultDescription`, `notFoundPage.defaultBackText` | — |
| SearchWidget | `searchWidget.defaultPlaceholder` | — |
| FeedbackForm | `feedbackForm.defaultTitle`, `feedbackForm.defaultDescription`, `feedbackForm.defaultSubmitText`, `feedbackForm.successTitle`, `feedbackForm.successDescription`, `feedbackForm.successConfirmText`, `feedbackForm.nameLabel`, `feedbackForm.emailLabel`, `feedbackForm.subjectLabel`, `feedbackForm.messageLabel` | — |
| CookieConsent | `cookieConsent.defaultTitle`, `cookieConsent.defaultDescription`, `cookieConsent.defaultAcceptText`, `cookieConsent.defaultDeclineText` | — |
| SettingsPage | `settingsPage.defaultTitle`, `settingsPage.saveText`, `settingsPage.nameLabel`, `settingsPage.namePlaceholder`, `settingsPage.notificationsLabel` | — |
| OverviewPage | `overviewPage.defaultTitle`, `overviewPage.recentActivity`, `overviewPage.quickStats` | — |
| BlogListPage | `blogListPage.defaultTitle`, `blogListPage.searchPlaceholder`, `blogListPage.allCategories`, `blogListPage.noPostsFound` | — |
| ActivityLogPage | `activityLogPage.defaultTitle`, `activityLogPage.action`, `activityLogPage.user`, `activityLogPage.timestamp`, `activityLogPage.details`, `activityLogPage.noActivityFound` | — |
| ProfilePage | `profilePage.defaultTitle`, `profilePage.nameLabel`, `profilePage.emailLabel`, `profilePage.bioLabel`, `profilePage.saveText` | — |
| ChartSection | `chartSection.defaultTitle`, `chartSection.defaultSubtitle`, `chartSection.bar`, `chartSection.line`, `chartSection.pie` | — |
| GallerySection | `gallerySection.defaultTitle`, `gallerySection.noItems` | — |
| ScratchCard | `scratchCard.ariaLabel` | — |
| SketchyChart | `sketchyChart.lineAriaLabel`, `sketchyChart.barAriaLabel`, `sketchyChart.pieAriaLabel` | — |
| Card3D | `card3d.ariaLabel` | — |
| HardcoreInput | `hardcoreInput.invalidInput` | — |
| CodeBlock | `codeBlock.copied`, `codeBlock.copy`, `codeBlock.defaultLanguage`, `codeBlock.defaultFilename` | — |
| Calendar | `calendar.previousMonth`, `calendar.nextMonth` | — |
| Kanban | `kanban.dropCardsHere`, `kanban.addCard`, `kanban.cardGrabbed`, `kanban.cardReleased`, `kanban.cardMoved`, `kanban.cardMovedToColumn` | `cardMovedToColumn`: `{column}` |
| Timeline | `timeline.label` | — |
| PricingSection | `pricingSection.defaultTitle`, `pricingSection.mostPopular`, `pricingSection.perLifetime`, `pricingSection.saasTitle`, `pricingSection.saasMostPopular`, `pricingSection.planStarterName`, `pricingSection.planProName`, `pricingSection.planEnterpriseName` | — |
| DashboardStats | `dashboardStats.defaultTitle` | — |
| Input | `input.placeholder` | — |
| NumberInput | `numberInput.placeholder` | — |
| Textarea | `textarea.placeholder` | — |
