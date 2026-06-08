<script setup lang="ts">
import { computed } from 'vue'
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Checkbox,
    Combobox,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Input,
    NumberInput,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    Textarea,
    Toast,
} from '../src'

type VisualSuite = 'forms' | 'overlays' | 'feedback' | 'containers'
type VisualTheme = 'light' | 'dark'

const query = new URLSearchParams(window.location.search)

const suite = computed<VisualSuite>(() => {
    const value = query.get('suite')
    if (value === 'overlays' || value === 'feedback' || value === 'containers') return value
    return 'forms'
})

const theme = computed<VisualTheme>(() => query.get('theme') === 'dark' ? 'dark' : 'light')

const suiteTitle = computed(() => {
    const titles: Record<VisualSuite, string> = {
        forms: 'Form Controls',
        overlays: 'Selection And Menus',
        feedback: 'Feedback States',
        containers: 'Card Containers',
    }

    return titles[suite.value]
})

const shellClasses = computed(() => [
    'visual-shell min-h-screen bg-brutal-bg text-brutal-fg p-8',
    theme.value === 'dark' ? 'dark' : '',
])

const suiteClasses = computed(() => [
    'visual-suite theme-classic mx-auto w-[1080px] border-3 border-brutal bg-brutal-bg p-6 text-brutal-fg shadow-brutal-xl',
    suite.value === 'overlays' ? 'min-h-[520px]' : '',
])

const frameworkOptions = [
    { value: 'vue', label: 'Vue' },
    { value: 'vite', label: 'Vite' },
    { value: 'reka', label: 'Reka UI' },
    { value: 'tailwind', label: 'Tailwind CSS' },
]
</script>

<template>
    <main :class="shellClasses">
        <section :class="suiteClasses">
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
                        <DropdownMenu open>
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
                        </DropdownMenu>
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
