<script setup lang="ts">
import { ref, computed } from 'vue'
import { Github } from 'lucide-vue-next'
import CopyButton from './CopyButton.vue'
import { cn } from '../lib/utils'

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
    'submit-button': [],
    form: ['vee-validate', '@vee-validate/zod', 'zod'],
    'alert-dialog': ['reka-ui'],
    sheet: ['reka-ui'],
    slider: ['reka-ui'],
    toggle: ['reka-ui'],
    'toggle-group': ['reka-ui'],
    'radio-group': ['reka-ui'],
    progress: ['reka-ui'],
    'saas-pricing': [],
    'dashboard-stats': [],
}

const componentImports: Record<string, string[]> = {
    button: ['Button', 'buttonVariants'],
    card: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    input: ['Input'],
    textarea: ['Textarea'],
    label: ['Label'],
    badge: ['Badge', 'badgeVariants'],
    dialog: ['Dialog', 'DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogFooter', 'DialogTitle', 'DialogDescription', 'DialogClose'],
    'alert-dialog': ['AlertDialog', 'AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogHeader', 'AlertDialogFooter', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogAction', 'AlertDialogCancel'],
    popover: ['Popover', 'PopoverTrigger', 'PopoverContent'],
    tooltip: ['Tooltip', 'TooltipTrigger', 'TooltipContent', 'TooltipProvider'],
    'dropdown-menu': ['DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioItem', 'DropdownMenuLabel', 'DropdownMenuSeparator', 'DropdownMenuShortcut', 'DropdownMenuGroup', 'DropdownMenuSub', 'DropdownMenuSubContent', 'DropdownMenuSubTrigger', 'DropdownMenuRadioGroup'],
    select: ['Select', 'SelectGroup', 'SelectValue', 'SelectTrigger', 'SelectContent', 'SelectLabel', 'SelectItem', 'SelectSeparator'],
    tabs: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
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
    'submit-button': ['SubmitButton'],
    form: ['Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage'],
    sheet: ['Sheet', 'SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetFooter', 'SheetTitle', 'SheetDescription', 'SheetClose'],
    slider: ['Slider'],
    toggle: ['Toggle'],
    'toggle-group': ['ToggleGroup', 'ToggleGroupItem'],
    'radio-group': ['RadioGroup', 'RadioGroupItem'],
    progress: ['Progress'],
    'saas-pricing': ['SaaSPricing'],
    'dashboard-stats': ['DashboardStats'],
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
            return `pnpm dlx brutx@latest add ${name}`
        case 'npm':
            return `npx brutx@latest add ${name}`
        case 'yarn':
            return `yarn dlx brutx@latest add ${name}`
        case 'bun':
            return `bunx brutx@latest add ${name}`
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
    const pascalName = props.componentName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')
    if (names.length === 1) {
        return `import { ${names[0]} } from '@/components/ui/${props.componentName}.vue'`
    }
    const imports = names.join(', ')
    return `import { ${imports} } from '@/components/ui/${props.componentName}'`
})

const githubUrl = computed(
    () =>
        `https://github.com/lidaixingchen/brutxui-vue3/tree/main/packages/ui/src/components/${props.componentName}`,
)

const tabClass = (tab: InstallTab) =>
    computed(() =>
        cn(
            'px-4 py-2 text-sm font-bold border-3 border-brutal transition-all duration-150',
            activeTab.value === tab
                ? 'bg-brutal-primary text-black shadow-brutal'
                : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted',
        ),
    )

const pmTabClass = (pm: PackageManager) =>
    computed(() =>
        cn(
            'px-3 py-1.5 text-xs font-bold border-2 border-brutal transition-all duration-150',
            activePackageManager.value === pm
                ? 'bg-brutal-secondary text-black shadow-brutal-sm'
                : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted',
        ),
    )
</script>

<template>
    <div class="rounded-brutal border-3 border-brutal shadow-brutal overflow-hidden">
        <div class="flex border-b-3 border-brutal">
            <button
                type="button"
                :class="tabClass('cli').value"
                @click="activeTab = 'cli'"
            >
                CLI
            </button>
            <button
                type="button"
                :class="tabClass('manual').value"
                @click="activeTab = 'manual'"
            >
                Manual
            </button>
        </div>

        <div class="p-4 space-y-4 bg-brutal-bg">
            <div class="flex gap-1">
                <button
                    v-for="pm in packageManagers"
                    :key="pm.key"
                    type="button"
                    :class="pmTabClass(pm.key).value"
                    @click="activePackageManager = pm.key"
                >
                    {{ pm.label }}
                </button>
            </div>

            <div v-if="activeTab === 'cli'">
                <div class="relative group">
                    <pre class="p-4 border-3 border-brutal shadow-brutal overflow-x-auto font-mono text-sm" style="background-color: #111827; color: #f3f4f6;"><code>{{ cliCommand }}</code></pre>
                    <CopyButton
                        :text="cliCommand"
                        class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-[2px_2px_0px_0px_var(--brutal-border-color)]"
                    />
                </div>
            </div>

            <div v-if="activeTab === 'manual'" class="space-y-4">
                <div v-if="resolvedDeps.length > 0">
                    <h4 class="text-sm font-bold mb-2">
                        1. Install dependencies
                    </h4>
                    <div class="relative group">
                        <pre class="p-4 border-3 border-brutal shadow-brutal overflow-x-auto font-mono text-sm" style="background-color: #111827; color: #f3f4f6;"><code>{{ installCommand }}</code></pre>
                        <CopyButton
                            :text="installCommand"
                            class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-[2px_2px_0px_0px_var(--brutal-border-color)]"
                        />
                    </div>
                </div>

                <div>
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '2' : '1' }}. Copy the component source from GitHub
                    </h4>
                    <a
                        :href="githubUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold border-3 border-brutal bg-brutal-bg shadow-brutal hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                    >
                        <Github :size="16" />
                        View on GitHub
                    </a>
                </div>

                <div>
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '3' : '2' }}. Save to your project
                    </h4>
                    <pre class="p-4 border-3 border-brutal shadow-brutal overflow-x-auto font-mono text-sm" style="background-color: #111827; color: #f3f4f6;"><code>src/components/ui/{{ componentName }}.vue</code></pre>
                </div>

                <div v-if="resolvedImports.length > 0">
                    <h4 class="text-sm font-bold mb-2">
                        {{ resolvedDeps.length > 0 ? '4' : '3' }}. Import and use
                    </h4>
                    <div class="relative group">
                        <pre class="p-4 border-3 border-brutal shadow-brutal overflow-x-auto font-mono text-sm" style="background-color: #111827; color: #f3f4f6;"><code>{{ importStatement }}</code></pre>
                        <CopyButton
                            :text="importStatement"
                            class="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-[2px_2px_0px_0px_var(--brutal-border-color)]"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
