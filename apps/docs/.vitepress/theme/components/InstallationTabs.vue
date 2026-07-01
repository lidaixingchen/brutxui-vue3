<script setup lang="ts">
import { ref, computed } from 'vue'
import CopyButton from './CopyButton.vue'
import { cn } from '../lib/utils'
import { useI18n } from '../lib/i18n'

const { t } = useI18n()

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'
type InstallTab = 'cli' | 'manual'

interface Props {
    componentName: string
    dependencies?: string[]
    imports?: string[]
}

const props = withDefaults(defineProps<Props>(), {
    dependencies: undefined,
    imports: undefined,
})

const componentDependencies: Record<string, string[]> = {
    button: ['reka-ui', 'class-variance-authority'],
    card: ['class-variance-authority'],
    input: ['class-variance-authority'],
    textarea: ['class-variance-authority'],
    label: ['reka-ui', 'class-variance-authority'],
    badge: ['class-variance-authority'],
    dialog: ['reka-ui'],
    popover: ['reka-ui'],
    tooltip: ['reka-ui'],
    'dropdown-menu': ['reka-ui'],
    select: ['reka-ui'],
    tabs: ['reka-ui'],
    table: [],
    alert: ['class-variance-authority'],
    avatar: ['class-variance-authority'],
    separator: ['reka-ui'],
    switch: ['reka-ui'],
    checkbox: ['reka-ui'],
    pagination: [],
    spinner: [],
    toast: [],
    skeleton: [],
    calendar: ['v-calendar'],
    command: ['reka-ui'],
    combobox: ['reka-ui'],
    'scroll-area': ['reka-ui'],
    form: ['vee-validate', '@vee-validate/zod', 'zod'],
    'alert-dialog': ['reka-ui'],
    sheet: ['reka-ui'],
    slider: ['reka-ui'],
    toggle: ['reka-ui'],
    'toggle-group': ['reka-ui'],
    'radio-group': ['reka-ui'],
    progress: ['reka-ui'],
    'dashboard-stats': [],
}

const componentImports: Record<string, string[]> = {
    button: ['Button', 'buttonVariants'],
    card: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    input: ['Input'],
    textarea: ['Textarea'],
    label: ['Label'],
    badge: ['Badge', 'badgeVariants'],
    dialog: ['DialogContent', 'DialogHeader', 'DialogFooter', 'DialogTitle', 'DialogDescription'],
    'alert-dialog': ['AlertDialogContent', 'AlertDialogHeader', 'AlertDialogFooter', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogAction', 'AlertDialogCancel'],
    popover: ['PopoverContent'],
    tooltip: ['TooltipContent'],
    'dropdown-menu': ['DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioItem', 'DropdownMenuLabel', 'DropdownMenuSeparator', 'DropdownMenuShortcut', 'DropdownMenuSubContent', 'DropdownMenuSubTrigger'],
    select: ['SelectTrigger', 'SelectContent', 'SelectLabel', 'SelectItem', 'SelectSeparator'],
    tabs: ['TabsList', 'TabsTrigger', 'TabsContent'],
    table: ['Table', 'TableHeader', 'TableBody', 'TableFooter', 'TableHead', 'TableRow', 'TableCell', 'TableCaption'],
    alert: ['Alert', 'AlertTitle', 'AlertDescription'],
    avatar: ['Avatar', 'AvatarImage', 'AvatarFallback'],
    separator: ['Separator'],
    switch: ['Switch'],
    checkbox: ['Checkbox'],
    pagination: ['Pagination', 'PaginationContent', 'PaginationEllipsis', 'PaginationItem', 'PaginationLink', 'PaginationNext', 'PaginationPrevious'],
    spinner: ['Spinner', 'BlockSpinner', 'DotsSpinner', 'BarsSpinner'],
    toast: ['Toast', 'ToastContainer', 'useToast'],
    skeleton: ['Skeleton', 'SkeletonText', 'SkeletonAvatar', 'SkeletonCard', 'SkeletonTable'],
    calendar: ['Calendar'],
    command: ['Command', 'CommandDialog', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem', 'CommandShortcut', 'CommandSeparator'],
    combobox: ['Combobox', 'ComboboxMulti'],
    'scroll-area': ['ScrollArea', 'ScrollBar'],
    form: ['Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage'],
    sheet: ['SheetContent', 'SheetHeader', 'SheetFooter', 'SheetTitle', 'SheetDescription', 'sheetVariants'],
    slider: ['Slider'],
    toggle: ['Toggle'],
    'toggle-group': ['ToggleGroup', 'ToggleGroupItem', 'toggleGroupKey'],
    'radio-group': ['RadioGroup', 'RadioGroupItem'],
    progress: ['Progress'],
    'dashboard-stats': ['DashboardStats'],
    'brutalist-hero': ['BrutalistHero'],
    'pricing-section': ['PricingSection'],
    'auth-card': ['AuthCard'],
    'dashboard-shell': ['DashboardShell'],
    'empty-state': ['EmptyState'],
    'waitlist-page': ['WaitlistPage'],
}

const activeTab = ref<InstallTab>('cli')
const activePackageManager = ref<PackageManager>('pnpm')

const packageManagers: { key: PackageManager; label: string }[] = [
    { key: 'pnpm', label: 'pnpm' },
    { key: 'npm', label: 'npm' },
    { key: 'yarn', label: 'yarn' },
    { key: 'bun', label: 'bun' },
]

const resolvedDeps = computed(() => {
    if (props.dependencies) return props.dependencies
    return componentDependencies[props.componentName] ?? []
})

const resolvedImports = computed(() => {
    if (props.imports) return props.imports
    return componentImports[props.componentName] ?? []
})

const cliCommand = computed(() => {
    const name = props.componentName
    switch (activePackageManager.value) {
        case 'pnpm':
            return `pnpm dlx brutx-vue@latest add ${name}`
        case 'npm':
            return `npx brutx-vue@latest add ${name}`
        case 'yarn':
            return `yarn dlx brutx-vue@latest add ${name}`
        case 'bun':
            return `bunx brutx-vue@latest add ${name}`
    }
})

const installCommand = computed(() => {
    const deps = resolvedDeps.value
    if (deps.length === 0) return ''
    const depsStr = deps.join(' ')
    switch (activePackageManager.value) {
        case 'pnpm':
            return `pnpm add ${depsStr}`
        case 'npm':
            return `npm install ${depsStr}`
        case 'yarn':
            return `yarn add ${depsStr}`
        case 'bun':
            return `bun add ${depsStr}`
    }
})

const importStatement = computed(() => {
    const names = resolvedImports.value
    if (names.length === 0) return ''
    const compName = props.componentName

    return names
        .map((name) => {
            if (name === 'useToast') {
                return "import { useToast } from '@/composables/useToast'"
            }
            if (name.endsWith('Variants') || name.endsWith('Key')) {
                const file = name.endsWith('Key') ? `${compName}-key` : `${compName}-variants`
                return `import { ${name} } from '@/components/ui/${compName}/${file}'`
            }
            return `import ${name} from '@/components/ui/${compName}/${name}.vue'`
        })
        .join('\n')
})

const githubUrl = computed(
    () =>
        `https://github.com/lidaixingchen/brutxui-vue3/tree/main/packages/ui/src/components/${props.componentName}`,
)

const getTabClass = (tab: InstallTab) =>
    cn(
        'relative px-4 py-2 text-sm font-black uppercase tracking-wider border-3 border-brutal transition-all duration-150',
        activeTab.value === tab
            ? 'bg-brutal-primary text-black shadow-brutal before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-brutal-accent'
            : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted',
    )

const getPmTabClass = (pm: PackageManager) =>
    cn(
        'px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-brutal transition-all duration-150',
        activePackageManager.value === pm
            ? 'bg-brutal-secondary text-black shadow-brutal-sm'
            : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted',
    )
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal overflow-hidden vp-raw">
        <div class="flex border-b-3 border-brutal" role="tablist">
            <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'cli'"
                :tabindex="activeTab === 'cli' ? 0 : -1"
                :class="getTabClass('cli')"
                @click="activeTab = 'cli'"
                @keydown.arrow-right="activeTab = 'manual'"
                @keydown.arrow-left="activeTab = 'manual'"
            >
                CLI
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 'manual'"
                :tabindex="activeTab === 'manual' ? 0 : -1"
                :class="getTabClass('manual')"
                @click="activeTab = 'manual'"
                @keydown.arrow-right="activeTab = 'cli'"
                @keydown.arrow-left="activeTab = 'cli'"
            >
                {{ t('manual') }}
            </button>
        </div>

        <div class="p-4 space-y-4 bg-brutal-bg">
            <div class="flex gap-1">
                <button
                    v-for="pm in packageManagers"
                    :key="pm.key"
                    type="button"
                    :class="getPmTabClass(pm.key)"
                    @click="activePackageManager = pm.key"
                >
                    {{ pm.label }}
                </button>
            </div>

            <div v-if="activeTab === 'cli'">
                <div class="relative group">
                    <pre class="p-4 border-2 border-brutal shadow-brutal-sm overflow-x-auto font-mono text-sm bg-[var(--vp-code-block-bg)] text-[var(--vp-code-block-color)]"><code>{{ cliCommand }}</code></pre>
                    <CopyButton
                        :text="cliCommand"
                        class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-brutal-sm"
                    />
                </div>
            </div>

            <div v-if="activeTab === 'manual'" class="space-y-4">
                <div v-if="resolvedDeps.length > 0">
                    <h4 class="text-sm font-bold mb-2">
                        1. {{ t('installDeps') }}
                    </h4>
                    <div class="relative group">
                        <pre class="p-4 border-2 border-brutal shadow-brutal-sm overflow-x-auto font-mono text-sm bg-[var(--vp-code-block-bg)] text-[var(--vp-code-block-color)]"><code>{{ installCommand }}</code></pre>
                        <CopyButton
                            :text="installCommand"
                            class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-brutal-sm"
                        />
                    </div>
                </div>

                <div>
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '2' : '1' }}. {{ t('copyFromGitHub') }}
                    </h4>
                    <a
                        :href="githubUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-3 border-brutal bg-brutal-bg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                        {{ t('viewOnGitHub') }}
                    </a>
                </div>

                <div>
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '3' : '2' }}. {{ t('saveToProject') }}
                    </h4>
                    <pre class="p-4 border-2 border-brutal shadow-brutal-sm overflow-x-auto font-mono text-sm bg-[var(--vp-code-block-bg)] text-[var(--vp-code-block-color)]"><code>src/components/ui/{{ componentName }}/</code></pre>
                </div>

                <div v-if="resolvedImports.length > 0">
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '4' : '3' }}. {{ t('importAndUse') }}
                    </h4>
                    <div class="relative group">
                        <pre class="p-4 border-2 border-brutal shadow-brutal-sm overflow-x-auto font-mono text-sm bg-[var(--vp-code-block-bg)] text-[var(--vp-code-block-color)]"><code>{{ importStatement }}</code></pre>
                        <CopyButton
                            :text="importStatement"
                            class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-brutal-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
