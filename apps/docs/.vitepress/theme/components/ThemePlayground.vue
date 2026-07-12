<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Check, Copy, RotateCcw, Search, ShieldCheck, ShieldAlert } from '@lucide/vue'
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Input,
} from 'brutx-ui-vue'
import {
    clonePreset,
    colorControls,
    formatThemeCss,
    getContrastChecks,
    getThemeCoverage,
    isValidHex,
    lengthControls,
    modeOptions,
    themeOptions,
    themePresets,
    toCssVariableObject,
    type ColorMode,
    type ColorTokenKey,
    type ContrastCheckResult,
    type LengthTokenKey,
    type ThemeName,
    type ThemeTokens,
} from '../lib/theme-playground'
import { useI18n } from '../lib/i18n'

const { isEn, t } = useI18n()

type CopyState = 'idle' | 'success' | 'error'

const segmentBaseClass = 'border-3 border-brutal px-3 py-2 text-xs font-black uppercase tracking-wide transition-all duration-150 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
const segmentActiveClass = 'bg-brutal-primary text-black shadow-brutal'
const segmentIdleClass = 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg'
const sampleEmail = ref('hello@brutx.dev')
const baseTheme = ref<ThemeName>('classic')
const colorMode = ref<ColorMode>('light')
const themeTokens = ref<Record<ColorMode, ThemeTokens>>(clonePreset('classic'))
const validationErrors = ref<Partial<Record<ColorTokenKey, string>>>({})
const copyState = ref<CopyState>('idle')
const cssOutput = ref<HTMLTextAreaElement | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const swatchRoles = [
    { bgKey: 'bg', fgKey: 'fg', label: 'Base' },
    { bgKey: 'muted', fgKey: 'mutedForeground', label: 'Muted' },
    { bgKey: 'primary', fgKey: 'primaryForeground', label: 'Primary' },
    { bgKey: 'secondary', fgKey: 'secondaryForeground', label: 'Secondary' },
    { bgKey: 'accent', fgKey: 'accentForeground', label: 'Accent' },
    { bgKey: 'destructive', fgKey: 'destructiveForeground', label: 'Destructive' },
    { bgKey: 'success', fgKey: 'successForeground', label: 'Success' },
    { bgKey: 'info', fgKey: 'infoForeground', label: 'Info' },
] as const

const currentTokens = computed(() => themeTokens.value[colorMode.value])
const currentPreset = computed(() => themePresets[baseTheme.value])
const previewStyle = computed(() => toCssVariableObject(currentTokens.value))
const generatedCss = computed(() => formatThemeCss(themeTokens.value))
const themeCoverage = computed(() => getThemeCoverage(themeTokens.value))
const contrastChecks = computed(() => getContrastChecks(currentTokens.value))
const contrastSummary = computed(() => {
    const warnings = contrastChecks.value.filter((item) => item.status === 'warn').length
    const unavailable = contrastChecks.value.filter((item) => item.status === 'unavailable').length
    return {
        warnings,
        unavailable,
        passed: contrastChecks.value.length - warnings - unavailable,
        total: contrastChecks.value.length,
    }
})
const contrastSummaryText = computed(() => {
    const { passed, total, warnings } = contrastSummary.value
    if (isEn.value) {
        return `${passed}/${total} passed, ${warnings} low`
    }
    return `${passed}/${total} 通过，${warnings} 个偏低`
})

function selectBaseTheme(name: ThemeName) {
    baseTheme.value = name
    themeTokens.value = clonePreset(name)
    validationErrors.value = {}
}

function selectColorMode(mode: ColorMode) {
    colorMode.value = mode
}

function resetCurrentPreset() {
    themeTokens.value = clonePreset(baseTheme.value)
    validationErrors.value = {}
}

function updateColorToken(key: ColorTokenKey, value: string) {
    const nextValue = value.trim()
    if (!isValidHex(nextValue)) {
        validationErrors.value = {
            ...validationErrors.value,
            [key]: t('themeLabHexError'),
        }
        return
    }

    themeTokens.value = {
        ...themeTokens.value,
        [colorMode.value]: {
            ...currentTokens.value,
            [key]: nextValue,
        },
    }
    const nextErrors = { ...validationErrors.value }
    delete nextErrors[key]
    validationErrors.value = nextErrors
}

function updateLengthToken(key: LengthTokenKey, value: string | number) {
    const control = lengthControls.find((item) => item.key === key)
    if (!control) return
    const rawValue = Number(value)
    const safeValue = Number.isFinite(rawValue) ? rawValue : control.min
    const clampedValue = Math.min(control.max, Math.max(control.min, safeValue))

    themeTokens.value = {
        ...themeTokens.value,
        [colorMode.value]: {
            ...currentTokens.value,
            [key]: `${clampedValue}px`,
        },
    }
}

function numberFromPx(value: string): number {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
}

function getSegmentClass(active: boolean): string[] {
    return [
        segmentBaseClass,
        active ? segmentActiveClass : segmentIdleClass,
    ]
}

function getContrastStatusClass(status: ContrastCheckResult['status']): string[] {
    return [
        'border-3 border-brutal p-3 shadow-brutal-sm',
        status === 'pass' && 'bg-brutal-success text-brutal-fg',
        status === 'warn' && 'bg-brutal-accent text-brutal-fg',
        status === 'unavailable' && 'bg-brutal-muted text-brutal-fg',
    ].filter(Boolean) as string[]
}

function getContrastStatusLabel(status: ContrastCheckResult['status']): string {
    if (status === 'pass') return t('themeLabContrastPass')
    if (status === 'warn') return t('themeLabContrastWarn')
    return t('themeLabContrastUnavailable')
}

function formatContrastRatio(ratio: number | null): string {
    return ratio === null ? 'N/A' : `${ratio.toFixed(1)}:1`
}

async function copyCss() {
    if (copyTimer) {
        clearTimeout(copyTimer)
    }

    try {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API unavailable')
        }
        await navigator.clipboard.writeText(generatedCss.value)
        copyState.value = 'success'
    } catch {
        copyState.value = 'error'
        await nextTick()
        cssOutput.value?.focus()
        cssOutput.value?.select()
    }

    copyTimer = setTimeout(() => {
        copyState.value = 'idle'
    }, 1800)
}

onBeforeUnmount(() => {
    if (copyTimer) {
        clearTimeout(copyTimer)
    }
})
</script>

<template>
    <section class="theme-playground vp-raw my-8">
        <div class="mb-5 border-3 border-brutal bg-brutal-accent p-4 shadow-brutal">
            <p class="m-0 text-xs font-black uppercase tracking-[0.16em] text-black">
                Theme Lab
            </p>
            <h2 class="!m-0 !mt-1 !border-0 !p-0 text-2xl font-black text-black sm:text-3xl">
                {{ t('themeLabTitle') }}
            </h2>
            <p class="m-0 mt-2 max-w-3xl text-sm font-bold leading-6 text-black">
                {{ t('themeLabDescription') }}
            </p>
        </div>

        <div class="grid gap-5 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            <aside class="space-y-5 border-3 border-brutal bg-brutal-bg p-4 shadow-brutal">
                <div class="space-y-3">
                    <div>
                        <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                            Base theme
                        </p>
                        <p class="m-0 mt-1 text-sm font-bold text-brutal-fg">
                            {{ currentPreset.description }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            v-for="option in themeOptions"
                            :key="option.value"
                            type="button"
                            :class="getSegmentClass(baseTheme === option.value)"
                            @click="selectBaseTheme(option.value)"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>

                <div class="space-y-3">
                    <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                        Editing mode
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                        <button
                            v-for="option in modeOptions"
                            :key="option.value"
                            type="button"
                            :class="getSegmentClass(colorMode === option.value)"
                            @click="selectColorMode(option.value)"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>

                <div class="space-y-3">
                    <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                        Color tokens
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        <label
                            v-for="control in colorControls"
                            :key="control.key"
                            class="grid gap-1.5"
                        >
                            <span class="text-xs font-black text-brutal-fg truncate">{{ control.label }}</span>
                            <span class="grid grid-cols-[38px_minmax(0,1fr)] gap-1.5">
                                <input
                                    type="color"
                                    :value="currentTokens[control.key]"
                                    class="h-10 w-full cursor-pointer border-3 border-brutal bg-brutal-bg p-1 shadow-brutal-sm"
                                    :aria-label="`${control.label} color picker`"
                                    @input="updateColorToken(control.key, ($event.target as HTMLInputElement).value)"
                                >
                                <input
                                    type="text"
                                    :value="currentTokens[control.key]"
                                    class="h-10 min-w-0 border-3 border-brutal bg-brutal-bg px-2 font-mono text-xs font-black text-brutal-fg shadow-brutal-sm outline-none focus:ring-3 focus:ring-brutal-ring"
                                    :aria-label="`${control.label} hex value`"
                                    @input="updateColorToken(control.key, ($event.target as HTMLInputElement).value)"
                                >
                            </span>
                            <span
                                v-if="validationErrors[control.key]"
                                class="text-[10px] font-bold leading-tight text-brutal-destructive"
                            >
                                {{ validationErrors[control.key] }}
                            </span>
                        </label>
                    </div>
                </div>

                <div class="space-y-3">
                    <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                        Shape and shadow
                    </p>
                    <label
                        v-for="control in lengthControls"
                        :key="control.key"
                        class="grid gap-2"
                    >
                        <span class="flex items-center justify-between gap-3">
                            <span class="text-sm font-black text-brutal-fg">{{ control.label }}</span>
                            <span class="font-mono text-xs font-black text-brutal-muted-foreground">
                                {{ currentTokens[control.key] }}
                            </span>
                        </span>
                        <span class="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
                            <input
                                type="range"
                                :min="control.min"
                                :max="control.max"
                                :step="control.step"
                                :value="numberFromPx(currentTokens[control.key])"
                                class="w-full accent-[var(--brutal-primary)]"
                                :aria-label="`${control.label} slider`"
                                @input="updateLengthToken(control.key, ($event.target as HTMLInputElement).value)"
                            >
                            <input
                                type="number"
                                :min="control.min"
                                :max="control.max"
                                :step="control.step"
                                :value="numberFromPx(currentTokens[control.key])"
                                class="h-10 border-3 border-brutal bg-brutal-bg px-2 text-center font-mono text-sm font-black text-brutal-fg shadow-brutal-sm outline-none focus:ring-3 focus:ring-brutal-ring"
                                :aria-label="`${control.label} value`"
                                @input="updateLengthToken(control.key, ($event.target as HTMLInputElement).value)"
                            >
                        </span>
                    </label>
                </div>

                <div class="flex flex-wrap gap-3 pt-1">
                    <Button type="button" variant="outline" class="gap-2" @click="resetCurrentPreset">
                        <RotateCcw class="h-4 w-4" />
                        {{ t('themeLabReset') }}
                    </Button>
                    <Button type="button" variant="primary" class="gap-2" @click="copyCss">
                        <Check v-if="copyState === 'success'" class="h-4 w-4" />
                        <Copy v-else class="h-4 w-4" />
                        {{ copyState === 'success' ? t('themeLabCopied') : t('themeLabCopyCss') }}
                    </Button>
                </div>
                <p
                    v-if="copyState === 'error'"
                    class="m-0 border-3 border-brutal bg-brutal-destructive p-3 text-sm font-black text-black shadow-brutal-sm"
                >
                    {{ t('themeLabCopyError') }}
                </p>
            </aside>

            <section
                class="border-3 border-brutal bg-brutal-bg p-4 text-brutal-fg shadow-brutal transition-all duration-150 sm:p-5"
                :class="colorMode === 'dark' ? 'dark' : ''"
                :style="previewStyle"
            >
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p class="m-0 text-xs font-black uppercase tracking-[0.16em] text-brutal-muted-foreground">
                            {{ t('themeLabLivePreview') }}
                        </p>
                        <h3 class="!m-0 !border-0 !p-0 text-xl font-black text-brutal-fg">
                            {{ currentPreset.label }} / {{ colorMode }}
                        </h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <Badge variant="primary">{{ t('themeLabBadgePrimary') }}</Badge>
                        <Badge variant="secondary">{{ t('themeLabBadgeSecondary') }}</Badge>
                        <Badge variant="accent">{{ t('themeLabBadgeAccent') }}</Badge>
                    </div>
                </div>

                <div class="grid gap-4">
                    <Card class="bg-brutal-bg">
                        <CardHeader>
                            <div class="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <CardTitle>{{ t('themeLabConsoleTitle') }}</CardTitle>
                                    <CardDescription>
                                        {{ t('themeLabConsoleDescription') }}
                                    </CardDescription>
                                </div>
                                <Badge variant="success">{{ t('themeLabStatusOnline') }}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent class="space-y-4">
                            <div class="grid gap-3 md:grid-cols-3">
                                <div class="border-3 border-brutal bg-brutal-primary p-3 shadow-brutal-sm">
                                    <p class="m-0 text-xs font-black uppercase tracking-wide text-brutal-fg">{{ t('themeLabStatRevenue') }}</p>
                                    <p class="m-0 mt-1 font-mono text-2xl font-black text-brutal-fg">42.8K</p>
                                    <p class="m-0 text-xs font-bold text-brutal-fg">{{ t('themeLabStatRevenueDelta') }}</p>
                                </div>
                                <div class="border-3 border-brutal bg-brutal-secondary p-3 shadow-brutal-sm">
                                    <p class="m-0 text-xs font-black uppercase tracking-wide text-brutal-fg">{{ t('themeLabStatActive') }}</p>
                                    <p class="m-0 mt-1 font-mono text-2xl font-black text-brutal-fg">1,284</p>
                                    <p class="m-0 text-xs font-bold text-brutal-fg">{{ t('themeLabStatActiveDesc') }}</p>
                                </div>
                                <div class="border-3 border-brutal bg-brutal-accent p-3 shadow-brutal-sm">
                                    <p class="m-0 text-xs font-black uppercase tracking-wide text-brutal-fg">{{ t('themeLabStatShadow') }}</p>
                                    <p class="m-0 mt-1 font-mono text-2xl font-black text-brutal-fg">{{ currentTokens.shadowOffsetX }}</p>
                                    <p class="m-0 text-xs font-bold text-brutal-fg">{{ t('themeLabStatShadowDesc') }}</p>
                                </div>
                            </div>

                            <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_max-content]">
                                <div class="relative">
                                    <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brutal-muted-foreground" />
                                    <Input v-model="sampleEmail" class="pl-9" :placeholder="t('themeLabFilterPlaceholder')" />
                                </div>
                                <Button type="button" variant="primary" class="whitespace-nowrap">{{ t('themeLabCreateSegment') }}</Button>
                            </div>

                            <div class="overflow-hidden border-3 border-brutal bg-brutal-bg shadow-brutal-sm">
                                <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b-3 border-brutal bg-brutal-muted p-3 text-xs font-black uppercase tracking-wide text-brutal-muted-foreground">
                                    <span>{{ t('themeLabColAccount') }}</span>
                                    <span>{{ t('themeLabColStatus') }}</span>
                                    <span>{{ t('themeLabColRisk') }}</span>
                                </div>
                                <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b-3 border-brutal p-3">
                                    <div class="min-w-0">
                                        <p class="m-0 truncate text-sm font-black text-brutal-fg">brutal-studio.io</p>
                                        <p class="m-0 truncate text-xs font-bold text-brutal-muted-foreground">hello@brutx.dev</p>
                                    </div>
                                    <Badge variant="success" size="sm">{{ t('themeLabStatusHealthy') }}</Badge>
                                    <Badge variant="outline" size="sm">{{ t('themeLabRiskLow') }}</Badge>
                                </div>
                                <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-3">
                                    <div class="min-w-0">
                                        <p class="m-0 truncate text-sm font-black text-brutal-fg">mono-labs.dev</p>
                                        <p class="m-0 truncate text-xs font-bold text-brutal-muted-foreground">ops@brutx.dev</p>
                                    </div>
                                    <Badge variant="primary" size="sm">{{ t('themeLabStatusTrial') }}</Badge>
                                    <Badge variant="danger" size="sm">{{ t('themeLabRiskHigh') }}</Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter class="flex flex-wrap gap-3">
                            <Button type="button" variant="secondary">{{ t('themeLabPublishPreset') }}</Button>
                            <Button type="button" variant="danger">{{ t('themeLabPauseAccount') }}</Button>
                            <Button type="button" variant="outline">{{ t('themeLabViewCss') }}</Button>
                        </CardFooter>
                    </Card>

                        <div class="space-y-4">
                            <Card class="bg-brutal-bg min-w-0">
                                <CardHeader>
                                    <CardTitle>{{ t('themeLabMatrixTitle') }}</CardTitle>
                                    <CardDescription>
                                        {{ t('themeLabMatrixDescription') }}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <div class="grid gap-2 xl:grid-cols-2">
                                        <Button type="button">Default</Button>
                                        <Button type="button" variant="primary">Primary</Button>
                                        <Button type="button" variant="accent">Accent</Button>
                                        <Button type="button" variant="danger">Danger</Button>
                                    </div>
                                    <Input :placeholder="t('themeLabTokenInputPlaceholder')" />
                                    <div class="flex flex-wrap gap-2">
                                        <Badge>Default</Badge>
                                        <Badge variant="primary">Primary</Badge>
                                        <Badge variant="success">Success</Badge>
                                        <Badge variant="danger">Danger</Badge>
                                    </div>
                                    <Alert variant="info">
                                        <AlertTitle>{{ t('themeLabAlertInfoTitle') }}</AlertTitle>
                                        <AlertDescription>
                                            {{ t('themeLabAlertInfoDesc') }}
                                        </AlertDescription>
                                    </Alert>
                                    <Alert variant="danger">
                                        <AlertTitle>{{ t('themeLabAlertDangerTitle') }}</AlertTitle>
                                        <AlertDescription>
                                            {{ t('themeLabAlertDangerDesc') }}
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>

                            <div class="border-3 border-brutal bg-brutal-bg p-4 shadow-brutal">
                                <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                                    {{ t('themeLabSwatchPanel') }}
                                </p>
                                <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <div
                                        v-for="swatch in swatchRoles"
                                        :key="swatch.label"
                                        class="min-h-16 min-w-0 border-3 border-brutal p-2 shadow-brutal-sm flex flex-col justify-between"
                                        :style="{ backgroundColor: currentTokens[swatch.bgKey], color: currentTokens[swatch.fgKey] }"
                                    >
                                        <p class="m-0 break-all text-[0.62rem] font-black uppercase leading-tight mb-1">
                                            {{ swatch.label }}
                                        </p>
                                        <div>
                                            <p class="m-0 font-mono text-[0.55rem] font-black leading-none opacity-80">
                                                BG: {{ currentTokens[swatch.bgKey] }}
                                            </p>
                                            <p class="m-0 font-mono text-[0.55rem] font-black leading-none opacity-80 mt-0.5">
                                                FG: {{ currentTokens[swatch.fgKey] }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
        </div>

        <section class="mt-5 grid gap-5 lg:grid-cols-2">
            <div class="border-3 border-brutal bg-brutal-bg shadow-brutal">
                <div class="border-b-3 border-brutal bg-brutal-muted p-3">
                    <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                        {{ t('themeLabQualityCheck') }}
                    </p>
                    <p class="m-0 text-sm font-bold text-brutal-fg">
                        {{ contrastSummaryText }}
                    </p>
                </div>

                <div class="space-y-3 p-3">
                    <div
                        class="border-3 border-brutal p-3 shadow-brutal-sm"
                        :class="themeCoverage.isComplete ? 'bg-brutal-success text-brutal-fg' : 'bg-brutal-accent text-brutal-fg'"
                    >
                        <div class="flex items-start gap-3">
                            <ShieldCheck v-if="themeCoverage.isComplete" class="mt-0.5 h-5 w-5 shrink-0" />
                            <ShieldAlert v-else class="mt-0.5 h-5 w-5 shrink-0" />
                            <div class="min-w-0">
                                <p class="m-0 text-sm font-black">
                                    {{ t('themeLabCoverageLabel') }} {{ themeCoverage.covered }}/{{ themeCoverage.total }} tokens
                                </p>
                                <p class="m-0 mt-1 text-xs font-bold">
                                    {{ themeCoverage.isComplete ? t('themeLabCoverageComplete') : t('themeLabCoverageMissing') }}
                                </p>
                            </div>
                        </div>
                        <ul v-if="!themeCoverage.isComplete" class="m-0 mt-2 list-none p-0 text-xs font-black">
                            <li v-for="item in themeCoverage.missing" :key="item">
                                {{ item }}
                            </li>
                        </ul>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div
                            v-for="check in contrastChecks"
                            :key="check.id"
                            :class="getContrastStatusClass(check.status)"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <p class="m-0 text-sm font-black">{{ check.label }}</p>
                                    <p class="m-0 text-xs font-bold">{{ check.usage }}</p>
                                </div>
                                <span class="shrink-0 border-3 border-brutal bg-brutal-bg px-2 py-1 text-[0.65rem] font-black text-brutal-fg">
                                    {{ getContrastStatusLabel(check.status) }}
                                </span>
                            </div>
                            <div class="mt-3 flex items-end justify-between gap-3">
                                <p class="m-0 font-mono text-xl font-black">
                                    {{ formatContrastRatio(check.ratio) }}
                                </p>
                                <p class="m-0 text-right text-xs font-bold">
                                    target {{ check.threshold }}:1
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="border-3 border-brutal bg-brutal-bg shadow-brutal">
                <div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-brutal bg-brutal-muted p-3">
                    <div>
                        <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                            {{ t('themeLabGeneratedCss') }}
                        </p>
                        <p class="m-0 text-sm font-bold text-brutal-fg">
                            {{ t('themeLabGeneratedCssHint') }}
                        </p>
                    </div>
                    <Button type="button" variant="primary" class="gap-2" @click="copyCss">
                        <Check v-if="copyState === 'success'" class="h-4 w-4" />
                        <Copy v-else class="h-4 w-4" />
                        {{ copyState === 'success' ? t('themeLabCopied') : t('themeLabCopyCss') }}
                    </Button>
                </div>
                <textarea
                    ref="cssOutput"
                    :value="generatedCss"
                    readonly
                    class="block min-h-[360px] w-full resize-y border-0 bg-brutal-fg p-4 font-mono text-xs font-bold leading-6 text-brutal-bg outline-none sm:text-sm"
                    aria-label="Generated theme CSS"
                />
            </div>
        </section>
    </section>
</template>
