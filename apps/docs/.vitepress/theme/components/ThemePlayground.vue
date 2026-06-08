<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Check, Copy, RotateCcw } from '@lucide/vue'
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

type ThemeName = 'classic' | 'pastel' | 'mono'
type ColorMode = 'light' | 'dark'
type CopyState = 'idle' | 'success' | 'error'

interface ThemeTokens {
    borderWidth: string
    borderColor: string
    shadowOffsetX: string
    shadowOffsetY: string
    shadowColor: string
    radius: string
    bg: string
    fg: string
    primary: string
    secondary: string
    accent: string
    destructive: string
    success: string
    muted: string
    mutedForeground: string
    ring: string
    pressedOffset: string
    info: string
    overlay: string
    placeholder: string
}

type ColorTokenKey = 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
type LengthTokenKey = 'borderWidth' | 'radius' | 'shadowOffsetX' | 'shadowOffsetY'

interface ThemePreset {
    label: string
    description: string
    modes: Record<ColorMode, ThemeTokens>
}

const themePresets: Record<ThemeName, ThemePreset> = {
    classic: {
        label: 'Classic',
        description: '粗边框、硬阴影、零圆角和高饱和强调色。',
        modes: {
            light: {
                borderWidth: '3px',
                borderColor: '#000000',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#000000',
                radius: '0px',
                bg: '#ffffff',
                fg: '#000000',
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                destructive: '#EF476F',
                success: '#7FB069',
                muted: '#f3f4f6',
                mutedForeground: '#4B5563',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#4A90D9',
                overlay: 'rgba(0, 0, 0, 0.5)',
                placeholder: '#9CA3AF',
            },
            dark: {
                borderWidth: '3px',
                borderColor: '#ffffff',
                shadowOffsetX: '4px',
                shadowOffsetY: '4px',
                shadowColor: '#ffffff',
                radius: '0px',
                bg: '#141414',
                fg: '#ffffff',
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#FFE66D',
                destructive: '#EF476F',
                success: '#7FB069',
                muted: '#1e1e1e',
                mutedForeground: '#9CA3AF',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#3B82F6',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#6B7280',
            },
        },
    },
    pastel: {
        label: 'Pastel',
        description: '更柔和的色调、轻一些的边框和 8px 圆角。',
        modes: {
            light: {
                borderWidth: '2px',
                borderColor: '#1e1e24',
                shadowOffsetX: '3px',
                shadowOffsetY: '3px',
                shadowColor: '#1e1e24',
                radius: '8px',
                bg: '#faf9f6',
                fg: '#1e1e24',
                primary: '#d6c6e1',
                secondary: '#c5ded9',
                accent: '#fbe3b5',
                destructive: '#f3b0b0',
                success: '#cce2cb',
                muted: '#eae8e1',
                mutedForeground: '#6b6b78',
                ring: '#1e1e24',
                pressedOffset: '2px',
                info: '#a8c8e8',
                overlay: 'rgba(0, 0, 0, 0.4)',
                placeholder: '#b0aeb5',
            },
            dark: {
                borderWidth: '2px',
                borderColor: '#e5e5e5',
                shadowOffsetX: '3px',
                shadowOffsetY: '3px',
                shadowColor: '#e5e5e5',
                radius: '8px',
                bg: '#18171c',
                fg: '#e5e5e5',
                primary: '#8a739b',
                secondary: '#6e8e88',
                accent: '#b28e56',
                destructive: '#9b5a5a',
                success: '#678465',
                muted: '#27252f',
                mutedForeground: '#8a8a99',
                ring: '#e5e5e5',
                pressedOffset: '2px',
                info: '#5a7a9b',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#5a5866',
            },
        },
    },
    mono: {
        label: 'Mono',
        description: '黑白灰极限对比，更粗的线条和更强的阴影偏移。',
        modes: {
            light: {
                borderWidth: '4px',
                borderColor: '#000000',
                shadowOffsetX: '5px',
                shadowOffsetY: '5px',
                shadowColor: '#000000',
                radius: '0px',
                bg: '#ffffff',
                fg: '#000000',
                primary: '#000000',
                secondary: '#ffffff',
                accent: '#7a7a7a',
                destructive: '#333333',
                success: '#dddddd',
                muted: '#f0f0f0',
                mutedForeground: '#555555',
                ring: '#000000',
                pressedOffset: '2px',
                info: '#666666',
                overlay: 'rgba(0, 0, 0, 0.5)',
                placeholder: '#888888',
            },
            dark: {
                borderWidth: '4px',
                borderColor: '#ffffff',
                shadowOffsetX: '5px',
                shadowOffsetY: '5px',
                shadowColor: '#ffffff',
                radius: '0px',
                bg: '#000000',
                fg: '#ffffff',
                primary: '#ffffff',
                secondary: '#000000',
                accent: '#888888',
                destructive: '#cccccc',
                success: '#222222',
                muted: '#1a1a1a',
                mutedForeground: '#aaaaaa',
                ring: '#ffffff',
                pressedOffset: '2px',
                info: '#999999',
                overlay: 'rgba(0, 0, 0, 0.7)',
                placeholder: '#777777',
            },
        },
    },
}

const tokenKeys: (keyof ThemeTokens)[] = [
    'borderWidth',
    'borderColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowColor',
    'radius',
    'bg',
    'fg',
    'primary',
    'secondary',
    'accent',
    'destructive',
    'success',
    'muted',
    'mutedForeground',
    'ring',
    'pressedOffset',
    'info',
    'overlay',
    'placeholder',
]

const cssVariableNames: Record<keyof ThemeTokens, string> = {
    borderWidth: '--brutal-border-width',
    borderColor: '--brutal-border-color',
    shadowOffsetX: '--brutal-shadow-offset-x',
    shadowOffsetY: '--brutal-shadow-offset-y',
    shadowColor: '--brutal-shadow-color',
    radius: '--brutal-radius',
    bg: '--brutal-bg',
    fg: '--brutal-fg',
    primary: '--brutal-primary',
    secondary: '--brutal-secondary',
    accent: '--brutal-accent',
    destructive: '--brutal-destructive',
    success: '--brutal-success',
    muted: '--brutal-muted',
    mutedForeground: '--brutal-muted-foreground',
    ring: '--brutal-ring',
    pressedOffset: '--brutal-pressed-offset',
    info: '--brutal-info',
    overlay: '--brutal-overlay',
    placeholder: '--brutal-placeholder',
}

const colorControls: { key: ColorTokenKey; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'destructive', label: 'Destructive' },
    { key: 'success', label: 'Success' },
    { key: 'info', label: 'Info' },
]

const lengthControls: { key: LengthTokenKey; label: string; min: number; max: number; step: number }[] = [
    { key: 'borderWidth', label: 'Border', min: 1, max: 8, step: 1 },
    { key: 'radius', label: 'Radius', min: 0, max: 24, step: 1 },
    { key: 'shadowOffsetX', label: 'Shadow X', min: 0, max: 12, step: 1 },
    { key: 'shadowOffsetY', label: 'Shadow Y', min: 0, max: 12, step: 1 },
]

const themeOptions: { value: ThemeName; label: string }[] = [
    { value: 'classic', label: 'Classic' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mono', label: 'Mono' },
]

const modeOptions: { value: ColorMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
]

const segmentBaseClass = 'border-3 border-brutal px-3 py-2 text-xs font-black uppercase tracking-wide transition-all duration-150 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
const segmentActiveClass = 'bg-brutal-primary text-black shadow-brutal'
const segmentIdleClass = 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal'
const sampleEmail = ref('hello@brutx.dev')
const baseTheme = ref<ThemeName>('classic')
const colorMode = ref<ColorMode>('light')
const themeTokens = ref<Record<ColorMode, ThemeTokens>>(clonePreset('classic'))
const validationErrors = ref<Partial<Record<ColorTokenKey, string>>>({})
const copyState = ref<CopyState>('idle')
const cssOutput = ref<HTMLTextAreaElement | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const currentTokens = computed(() => themeTokens.value[colorMode.value])
const currentPreset = computed(() => themePresets[baseTheme.value])
const previewStyle = computed(() => toCssVariableObject(currentTokens.value))
const generatedCss = computed(() => [
    formatCssBlock(['.theme-custom'], themeTokens.value.light),
    formatCssBlock(['.dark .theme-custom', '.theme-custom.dark'], themeTokens.value.dark),
].join('\n\n'))

function cloneTokens(tokens: ThemeTokens): ThemeTokens {
    return { ...tokens }
}

function clonePreset(name: ThemeName): Record<ColorMode, ThemeTokens> {
    const preset = themePresets[name]
    return {
        light: cloneTokens(preset.modes.light),
        dark: cloneTokens(preset.modes.dark),
    }
}

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

function isValidHex(value: string): boolean {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

function updateColorToken(key: ColorTokenKey, value: string) {
    const nextValue = value.trim()
    if (!isValidHex(nextValue)) {
        validationErrors.value = {
            ...validationErrors.value,
            [key]: '请输入 #RGB 或 #RRGGBB',
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

function toCssVariableObject(tokens: ThemeTokens): Record<string, string> {
    return tokenKeys.reduce<Record<string, string>>((result, key) => {
        result[cssVariableNames[key]] = tokens[key]
        return result
    }, {})
}

function formatCssBlock(selectors: string[], tokens: ThemeTokens): string {
    const body = tokenKeys
        .map((key) => `    ${cssVariableNames[key]}: ${tokens[key]};`)
        .join('\n')
    return `${selectors.join(',\n')} {\n${body}\n}`
}

function getSegmentClass(active: boolean): string[] {
    return [
        segmentBaseClass,
        active ? segmentActiveClass : segmentIdleClass,
    ]
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
</script>

<template>
    <section class="theme-playground vp-raw my-8">
        <div class="mb-5 border-3 border-brutal bg-brutal-accent p-4 shadow-brutal">
            <p class="m-0 text-xs font-black uppercase tracking-[0.16em] text-black">
                Theme Lab
            </p>
            <h2 class="!m-0 !mt-1 !border-0 !p-0 text-2xl font-black text-black sm:text-3xl">
                调出属于你的 BrutxUI 主题
            </h2>
            <p class="m-0 mt-2 max-w-3xl text-sm font-bold leading-6 text-black">
                选择基底主题，调节色彩、边框、圆角和硬阴影，右侧预览会局部响应，复制的 CSS 可以直接粘贴到使用 BrutxUI 的项目里。
            </p>
        </div>

        <div class="grid gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
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
                    <div class="space-y-3">
                        <label
                            v-for="control in colorControls"
                            :key="control.key"
                            class="grid gap-2"
                        >
                            <span class="text-sm font-black text-brutal-fg">{{ control.label }}</span>
                            <span class="grid grid-cols-[52px_minmax(0,1fr)] gap-2">
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
                                    class="h-10 min-w-0 border-3 border-brutal bg-brutal-bg px-3 font-mono text-sm font-black text-brutal-fg shadow-brutal-sm outline-none focus:ring-3 focus:ring-brutal-ring"
                                    :aria-label="`${control.label} hex value`"
                                    @input="updateColorToken(control.key, ($event.target as HTMLInputElement).value)"
                                >
                            </span>
                            <span
                                v-if="validationErrors[control.key]"
                                class="text-xs font-bold text-brutal-destructive"
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
                        重置
                    </Button>
                    <Button type="button" variant="primary" class="gap-2" @click="copyCss">
                        <Check v-if="copyState === 'success'" class="h-4 w-4" />
                        <Copy v-else class="h-4 w-4" />
                        {{ copyState === 'success' ? '已复制' : '复制 CSS' }}
                    </Button>
                </div>
                <p
                    v-if="copyState === 'error'"
                    class="m-0 border-3 border-brutal bg-brutal-destructive p-3 text-sm font-black text-black shadow-brutal-sm"
                >
                    无法自动复制，CSS 已被选中，请手动复制。
                </p>
            </aside>

            <div class="space-y-5">
                <section
                    class="min-h-[560px] border-3 border-brutal bg-brutal-bg p-4 text-brutal-fg shadow-brutal transition-all duration-150 sm:p-5"
                    :class="colorMode === 'dark' ? 'dark' : ''"
                    :style="previewStyle"
                >
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p class="m-0 text-xs font-black uppercase tracking-[0.16em] text-brutal-muted-foreground">
                                Live preview
                            </p>
                            <h3 class="!m-0 !border-0 !p-0 text-xl font-black text-brutal-fg">
                                {{ currentPreset.label }} / {{ colorMode }}
                            </h3>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="primary">Primary</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="accent">Accent</Badge>
                        </div>
                    </div>

                    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
                        <Card class="bg-brutal-bg">
                            <CardHeader>
                                <CardTitle>Launch Console</CardTitle>
                                <CardDescription>
                                    A compact product surface using your current token set.
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="grid gap-3 sm:grid-cols-3">
                                    <div class="border-3 border-brutal bg-brutal-primary p-3 text-black shadow-brutal-sm">
                                        <p class="m-0 text-xs font-black uppercase tracking-wide">Primary</p>
                                        <p class="m-0 break-words font-mono text-lg font-black">{{ currentTokens.primary }}</p>
                                    </div>
                                    <div class="border-3 border-brutal bg-brutal-secondary p-3 text-black shadow-brutal-sm">
                                        <p class="m-0 text-xs font-black uppercase tracking-wide">Radius</p>
                                        <p class="m-0 font-mono text-lg font-black">{{ currentTokens.radius }}</p>
                                    </div>
                                    <div class="border-3 border-brutal bg-brutal-accent p-3 text-black shadow-brutal-sm">
                                        <p class="m-0 text-xs font-black uppercase tracking-wide">Shadow</p>
                                        <p class="m-0 font-mono text-lg font-black">{{ currentTokens.shadowOffsetX }}</p>
                                    </div>
                                </div>

                                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                                    <Input v-model="sampleEmail" placeholder="hello@brutx.dev" />
                                    <Button type="button" variant="primary">Invite</Button>
                                </div>

                                <Alert variant="primary">
                                    <AlertTitle>Token driven</AlertTitle>
                                    <AlertDescription>
                                        Border, color, radius and shadow are inherited from the preview container.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter class="flex flex-wrap gap-3">
                                <Button type="button" variant="secondary">Ship preset</Button>
                                <Button type="button" variant="outline">View CSS</Button>
                            </CardFooter>
                        </Card>

                        <div class="space-y-4">
                            <Card class="bg-brutal-bg">
                                <CardHeader>
                                    <CardTitle>Component Stack</CardTitle>
                                    <CardDescription>
                                        Core primitives reacting to the same local variables.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <div class="flex flex-wrap gap-2">
                                        <Button type="button">Default</Button>
                                        <Button type="button" variant="accent">Accent</Button>
                                        <Button type="button" variant="success">Success</Button>
                                    </div>
                                    <div class="border-3 border-brutal bg-brutal-muted p-3 shadow-brutal-sm">
                                        <p class="m-0 text-sm font-black text-brutal-fg">Static toast preview</p>
                                        <p class="m-0 mt-1 text-xs font-bold text-brutal-muted-foreground">
                                            Copy succeeded with the current theme.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div class="border-3 border-brutal bg-brutal-bg p-4 shadow-brutal">
                                <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                                    Swatches
                                </p>
                                <div class="mt-3 grid grid-cols-3 gap-2">
                                    <div
                                        v-for="control in colorControls"
                                        :key="control.key"
                                        class="min-h-16 border-3 border-brutal p-2 shadow-brutal-sm"
                                        :style="{ backgroundColor: currentTokens[control.key], color: control.key === 'secondary' || control.key === 'accent' || control.key === 'success' ? '#000000' : currentTokens.fg }"
                                    >
                                        <p class="m-0 break-words text-[0.65rem] font-black uppercase leading-tight">
                                            {{ control.label }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="border-3 border-brutal bg-brutal-bg shadow-brutal">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b-3 border-brutal bg-brutal-muted p-3">
                        <div>
                            <p class="m-0 text-xs font-black uppercase tracking-[0.14em] text-brutal-muted-foreground">
                                Generated CSS
                            </p>
                            <p class="m-0 text-sm font-bold text-brutal-fg">
                                复制到项目 CSS 中即可使用 `.theme-custom`。
                            </p>
                        </div>
                        <Button type="button" variant="primary" class="gap-2" @click="copyCss">
                            <Check v-if="copyState === 'success'" class="h-4 w-4" />
                            <Copy v-else class="h-4 w-4" />
                            {{ copyState === 'success' ? '已复制' : '复制 CSS' }}
                        </Button>
                    </div>
                    <textarea
                        ref="cssOutput"
                        :value="generatedCss"
                        readonly
                        class="block min-h-[320px] w-full resize-y border-0 bg-brutal-fg p-4 font-mono text-xs font-bold leading-6 text-brutal-bg outline-none sm:text-sm"
                        aria-label="Generated theme CSS"
                    />
                </section>
            </div>
        </div>
    </section>
</template>
