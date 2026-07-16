<script setup lang="ts">
import { computed } from 'vue'
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    BlockSpinner,
    BarsSpinner,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Checkbox,
    Combobox,
    DotsSpinner,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    GlitchText,
    Input,
    NumberInput,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    Spinner,
    Switch,
    Textarea,
    Toast,
} from '../src'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuGroup, SelectValue } from 'reka-ui'

type VisualSuite = 'forms' | 'overlays' | 'feedback' | 'containers'
type VisualTheme = 'light' | 'dark'
type CoreComponent = 'button' | 'card' | 'glitch-text' | 'spinner' | 'badge'

const coreComponents: readonly CoreComponent[] = ['button', 'card', 'glitch-text', 'spinner', 'badge']

const params = new URLSearchParams(window.location.search)

const component = computed<CoreComponent | null>(() => {
    const value = params.get('component')
    return coreComponents.find(c => c === value) ?? null
})

const suite = computed<VisualSuite>(() => {
    const value = params.get('suite')
    if (value === 'overlays' || value === 'feedback' || value === 'containers') return value
    return 'forms'
})

const theme = computed<VisualTheme>(() => (params.get('theme') === 'dark' ? 'dark' : 'light'))

const suiteTitle = computed(() => {
    const titles: Record<VisualSuite, string> = {
        forms: 'Form Controls',
        overlays: 'Selection And Menus',
        feedback: 'Feedback States',
        containers: 'Card Containers',
    }
    return titles[suite.value]
})

const componentTitle = computed(() => {
    const titles: Record<CoreComponent, string> = {
        button: 'Button',
        card: 'Card',
        'glitch-text': 'Glitch Text',
        spinner: 'Spinner',
        badge: 'Badge',
    }
    return component.value ? titles[component.value] : ''
})

const shellClasses = computed(() => [
    'visual-shell min-h-screen bg-brutal-bg text-brutal-fg p-8',
    theme.value === 'dark' ? 'dark' : '',
])

const suiteClasses = computed(() => [
    'visual-suite theme-classic mx-auto w-[1080px] border-3 border-brutal bg-brutal-bg p-6 text-brutal-fg shadow-brutal-xl',
    suite.value === 'overlays' ? 'min-h-[520px]' : '',
])

// 单组件容器：固定 min-height 防止视口或内容微抖动导致基线漂移；与 .visual-suite 对齐
const componentShellClasses = [
    'visual-component mx-auto w-[1080px] border-3 border-brutal bg-brutal-bg p-6 text-brutal-fg shadow-brutal-xl',
    'min-h-24', // 6rem — 覆盖多数单行组件的自然高度，留出 padding 余量
]

const frameworkOptions = [
    { value: 'vue', label: 'Vue' },
    { value: 'vite', label: 'Vite' },
    { value: 'reka', label: 'Reka UI' },
    { value: 'tailwind', label: 'Tailwind CSS' },
]
</script>

<template>
    <main :class="shellClasses">
        <!-- 单组件模式：?component=xxx -->
        <section v-if="component" :class="componentShellClasses">
            <header class="mb-6 flex items-start justify-between border-b-3 border-brutal pb-4">
                <div>
                    <p class="text-sm font-black uppercase tracking-normal text-brutal-muted-foreground">
                        BrutxUI Visual Regression · Core Component
                    </p>
                    <h1 class="mt-2 text-4xl font-black tracking-normal">
                        {{ componentTitle }}
                    </h1>
                </div>
                <div class="border-3 border-brutal bg-brutal-accent px-4 py-2 text-sm font-black shadow-brutal-sm">
                    {{ theme }}
                </div>
            </header>

            <!-- Button: variants × sizes + states -->
            <div v-if="component === 'button'" class="grid grid-cols-3 gap-4">
                <Button>Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
            </div>

            <!-- Card: variants × sections -->
            <div v-else-if="component === 'card'" class="grid grid-cols-3 gap-4">
                <Card variant="default">
                    <CardHeader>
                        <CardTitle>Default</CardTitle>
                        <CardDescription>Base border and brutal shadow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Default padding and elevation.</p>
                    </CardContent>
                    <CardFooter>
                        <Button size="sm">Save</Button>
                    </CardFooter>
                </Card>
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle>Elevated</CardTitle>
                        <CardDescription>Larger shadow for emphasis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Uses shadow-brutal-lg.</p>
                    </CardContent>
                </Card>
                <Card variant="flat">
                    <CardHeader>
                        <CardTitle>Flat</CardTitle>
                        <CardDescription>No shadow, border only.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Shadow-none.</p>
                    </CardContent>
                </Card>
                <Card variant="interactive">
                    <CardHeader>
                        <CardTitle>Interactive</CardTitle>
                        <CardDescription>Hover lift and press.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Cursor pointer.</p>
                    </CardContent>
                </Card>
                <Card variant="primary">
                    <CardHeader>
                        <CardTitle>Primary</CardTitle>
                        <CardDescription>Primary-colored border and shadow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Themed accent.</p>
                    </CardContent>
                </Card>
                <Card variant="secondary">
                    <CardHeader>
                        <CardTitle>Secondary</CardTitle>
                        <CardDescription>Secondary-colored border and shadow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">Themed accent.</p>
                    </CardContent>
                </Card>
            </div>

            <!-- GlitchText: directions × speeds (static state — animation disabled in test) -->
            <div v-else-if="component === 'glitch-text'" class="space-y-6">
                <div>
                    <p class="mb-3 text-sm font-black uppercase tracking-normal text-brutal-muted-foreground">Horizontal</p>
                    <div class="space-y-3">
                        <GlitchText text="Brutal Slow" direction="horizontal" speed="slow" class="text-3xl" />
                        <GlitchText text="Brutal Medium" direction="horizontal" speed="medium" class="text-3xl" />
                        <GlitchText text="Brutal Fast" direction="horizontal" speed="fast" class="text-3xl" />
                    </div>
                </div>
                <div>
                    <p class="mb-3 text-sm font-black uppercase tracking-normal text-brutal-muted-foreground">Vertical</p>
                    <div class="space-y-3">
                        <GlitchText text="Brutal Slow" direction="vertical" speed="slow" class="text-3xl" />
                        <GlitchText text="Brutal Medium" direction="vertical" speed="medium" class="text-3xl" />
                        <GlitchText text="Brutal Fast" direction="vertical" speed="fast" class="text-3xl" />
                    </div>
                </div>
                <div>
                    <p class="mb-3 text-sm font-black uppercase tracking-normal text-brutal-muted-foreground">Both</p>
                    <div class="space-y-3">
                        <GlitchText text="Brutal Slow" direction="both" speed="slow" class="text-3xl" />
                        <GlitchText text="Brutal Medium" direction="both" speed="medium" class="text-3xl" />
                        <GlitchText text="Brutal Fast" direction="both" speed="fast" class="text-3xl" />
                    </div>
                </div>
            </div>

            <!-- Spinner: types × sizes × variants -->
            <div v-else-if="component === 'spinner'" class="grid grid-cols-4 gap-6">
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · sm</p>
                    <Spinner size="sm" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · default</p>
                    <Spinner size="default" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · lg</p>
                    <Spinner size="lg" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · xl</p>
                    <Spinner size="xl" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · primary</p>
                    <Spinner variant="primary" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · secondary</p>
                    <Spinner variant="secondary" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">Spinner · accent</p>
                    <Spinner variant="accent" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">BlockSpinner</p>
                    <BlockSpinner />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">BlockSpinner · lg</p>
                    <BlockSpinner size="lg" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">DotsSpinner</p>
                    <DotsSpinner />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">DotsSpinner · lg</p>
                    <DotsSpinner size="lg" />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">BarsSpinner</p>
                    <BarsSpinner />
                </div>
                <div class="space-y-3">
                    <p class="text-sm font-black uppercase tracking-normal">BarsSpinner · lg</p>
                    <BarsSpinner size="lg" />
                </div>
            </div>

            <!-- Badge: variants × sizes + states -->
            <div v-else-if="component === 'badge'" class="grid grid-cols-4 gap-4">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge closable>Closable</Badge>
                <Badge dot>Dot</Badge>
                <Badge pulse>Pulse</Badge>
                <Badge size="sm">Small</Badge>
                <Badge size="default">Default</Badge>
                <Badge size="lg">Large</Badge>
                <Badge variant="primary" dot>Primary Dot</Badge>
                <Badge variant="success" closable>Success Close</Badge>
                <Badge variant="danger" pulse>Danger Pulse</Badge>
            </div>
        </section>

        <!-- 类别 suite 模式（保留作为粗粒度回归）：?suite=xxx -->
        <section v-else :class="suiteClasses">
            <header class="mb-6 flex items-start justify-between border-b-3 border-brutal pb-4">
                <div>
                    <p class="text-sm font-black uppercase tracking-normal text-brutal-muted-foreground">
                        BrutxUI Visual Regression
                    </p>
                    <h1 class="mt-2 text-4xl font-black tracking-normal">
                        {{ suiteTitle }}
                    </h1>
                </div>
                <div class="border-3 border-brutal bg-brutal-accent px-4 py-2 text-sm font-black shadow-brutal-sm">
                    {{ theme }}
                </div>
            </header>

            <div v-if="suite === 'forms'" class="grid grid-cols-[1.1fr_0.9fr] gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Buttons</CardTitle>
                        <CardDescription>Variants, sizes, loading, and disabled states.</CardDescription>
                    </CardHeader>
                    <CardContent class="grid grid-cols-2 gap-4">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="accent">Accent</Button>
                        <Button variant="danger">Danger</Button>
                        <Button variant="outline">Outline</Button>
                        <Button loading>Loading</Button>
                        <Button size="sm">Small</Button>
                        <Button disabled>Disabled</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inputs</CardTitle>
                        <CardDescription>Default, focus, error, disabled, and numeric controls.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Input model-value="Neo brutal input" placeholder="Default input" />
                        <Input model-value="Focused border" class="ring-2 ring-brutal-ring ring-offset-2" />
                        <Input variant="error" model-value="Invalid value" />
                        <Input model-value="Disabled value" disabled />
                        <Textarea model-value="Textarea content stays fixed for snapshots." />
                        <NumberInput :default-value="42" placeholder="Amount" />
                    </CardContent>
                </Card>

                <Card class="col-span-2">
                    <CardHeader>
                        <CardTitle>Choice Controls</CardTitle>
                        <CardDescription>Checked, unchecked, selected, and disabled control states.</CardDescription>
                    </CardHeader>
                    <CardContent class="grid grid-cols-3 gap-6">
                        <div class="space-y-3">
                            <p class="text-sm font-black uppercase tracking-normal">Checkbox</p>
                            <div class="flex items-center gap-3">
                                <Checkbox checked />
                                <span class="text-sm font-bold">Checked</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <Checkbox />
                                <span class="text-sm font-bold">Unchecked</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <Checkbox disabled />
                                <span class="text-sm font-bold">Disabled</span>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <p class="text-sm font-black uppercase tracking-normal">Switch</p>
                            <div class="flex items-center gap-3">
                                <Switch model-value />
                                <span class="text-sm font-bold">Enabled</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <Switch :model-value="false" />
                                <span class="text-sm font-bold">Off</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <Switch disabled />
                                <span class="text-sm font-bold">Disabled</span>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <p class="text-sm font-black uppercase tracking-normal">Radio Group</p>
                            <RadioGroup default-value="default">
                                <div class="flex items-center gap-3">
                                    <RadioGroupItem value="default" />
                                    <span class="text-sm font-bold">Default</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <RadioGroupItem value="secondary" variant="secondary" />
                                    <span class="text-sm font-bold">Secondary</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <RadioGroupItem value="danger" variant="danger" disabled />
                                    <span class="text-sm font-bold">Disabled</span>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div v-else-if="suite === 'overlays'" class="grid grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Select</CardTitle>
                        <CardDescription>Closed and open selection surface.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Select default-value="vue" open>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a tool..." />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="vue">Vue</SelectItem>
                                <SelectItem value="vite">Vite</SelectItem>
                                <SelectItem value="reka">Reka UI</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select disabled>
                            <SelectTrigger disabled>
                                <SelectValue placeholder="Disabled select" />
                            </SelectTrigger>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Combobox</CardTitle>
                        <CardDescription>Selected and disabled trigger states.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Combobox
                            model-value="vue"
                            :options="frameworkOptions"
                            placeholder="Select framework..."
                            search-placeholder="Search framework..."
                        />
                        <Combobox
                            disabled
                            :options="frameworkOptions"
                            placeholder="Disabled combobox"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Dropdown Menu</CardTitle>
                        <CardDescription>Open menu with common action states.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DropdownMenuRoot open>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline">Open Menu</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem class="text-brutal-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenuRoot>
                    </CardContent>
                </Card>
            </div>

            <div v-else-if="suite === 'feedback'" class="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Alerts</CardTitle>
                        <CardDescription>Semantic feedback colors and border treatment.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Alert>
                            <AlertTitle>Default Alert</AlertTitle>
                            <AlertDescription>System state is visible and stable.</AlertDescription>
                        </Alert>
                        <Alert variant="info">
                            <AlertTitle>Info Alert</AlertTitle>
                            <AlertDescription>Fresh registry metadata is available.</AlertDescription>
                        </Alert>
                        <Alert variant="success">
                            <AlertTitle>Success Alert</AlertTitle>
                            <AlertDescription>All visual baselines matched.</AlertDescription>
                        </Alert>
                        <Alert variant="danger">
                            <AlertTitle>Destructive Alert</AlertTitle>
                            <AlertDescription>Visual drift needs review.</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Toasts</CardTitle>
                        <CardDescription>Icon, title, close button, and variant colors.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Toast
                            title="Default toast"
                            description="The component snapshot is deterministic."
                            :duration="0"
                        />
                        <Toast
                            variant="success"
                            title="Visuals matched"
                            description="Baseline comparison completed."
                            :duration="0"
                        />
                        <Toast
                            variant="warning"
                            title="Review needed"
                            description="A snapshot changed intentionally."
                            :duration="0"
                        />
                        <Toast
                            variant="error"
                            title="Regression detected"
                            description="A visual token may have drifted."
                            :duration="0"
                        />
                    </CardContent>
                </Card>
            </div>

            <div v-else class="grid grid-cols-3 gap-6">
                <Card variant="default">
                    <CardHeader>
                        <CardTitle>Default Card</CardTitle>
                        <CardDescription>Base border and brutal shadow.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p class="text-sm font-bold text-brutal-muted-foreground">
                            Cards preserve spacing, typography, and theme tokens.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button size="sm">Save</Button>
                    </CardFooter>
                </Card>

                <Card variant="primary">
                    <CardHeader>
                        <CardTitle>Primary Card</CardTitle>
                        <CardDescription>Accent background with strong foreground.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="border-3 border-brutal bg-brutal-bg p-3 text-sm font-black shadow-brutal-sm">
                            $12,840 monthly revenue
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm">Inspect</Button>
                    </CardFooter>
                </Card>

                <Card variant="secondary">
                    <CardHeader>
                        <CardTitle>Accent Card</CardTitle>
                        <CardDescription>Dense content with nested actions.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-3">
                        <div class="flex items-center justify-between border-3 border-brutal bg-brutal-bg p-3">
                            <span class="text-sm font-black">Latency</span>
                            <span class="text-sm font-black">42ms</span>
                        </div>
                        <div class="flex items-center justify-between border-3 border-brutal bg-brutal-bg p-3">
                            <span class="text-sm font-black">Errors</span>
                            <span class="text-sm font-black">0.02%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    </main>
</template>
