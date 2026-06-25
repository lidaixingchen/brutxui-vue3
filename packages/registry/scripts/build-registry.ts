import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENTS } from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_LOCALES_DIR = path.resolve(__dirname, '../../ui/src/locales');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

const LIB_FILE_EXCLUDE = new Set<string>(['utils.ts']);

interface ComponentFileMapping {
    files: string[];
    composables?: string[];
    locales?: string[];
}

const COMPONENT_FILES: Record<string, ComponentFileMapping> = {
    alert: { files: ['Alert.vue', 'AlertDescription.vue', 'AlertTitle.vue', 'alert-variants.ts'] },
    avatar: { files: ['Avatar.vue', 'AvatarFallback.vue', 'AvatarImage.vue', 'avatar-variants.ts'] },
    badge: { files: ['Badge.vue', 'badge-variants.ts'] },
    button: { files: ['Button.vue', 'button-variants.ts'] },
    calendar: { files: ['Calendar.vue'] },
    card: { files: ['Card.vue', 'CardContent.vue', 'CardDescription.vue', 'CardFooter.vue', 'CardHeader.vue', 'CardTitle.vue', 'card-variants.ts'] },
    checkbox: { files: ['Checkbox.vue', 'checkbox-variants.ts'] },
    combobox: { files: ['Combobox.vue', 'ComboboxMulti.vue', 'combobox-types.ts'], composables: ['useLocale.ts'] },
    command: { files: ['Command.vue', 'CommandDialog.vue', 'CommandEmpty.vue', 'CommandGroup.vue', 'CommandInput.vue', 'CommandItem.vue', 'CommandList.vue', 'CommandSeparator.vue', 'CommandShortcut.vue', 'command-context.ts', 'command-variants.ts'], composables: ['useLocale.ts'] },
    dialog: { files: ['DialogContent.vue', 'DialogDescription.vue', 'DialogFooter.vue', 'DialogHeader.vue', 'DialogOverlay.vue', 'DialogTitle.vue', 'dialog-variants.ts'] },
    'dropdown-menu': { files: ['DropdownMenuCheckboxItem.vue', 'DropdownMenuContent.vue', 'DropdownMenuItem.vue', 'DropdownMenuLabel.vue', 'DropdownMenuRadioItem.vue', 'DropdownMenuSeparator.vue', 'DropdownMenuShortcut.vue', 'DropdownMenuSubContent.vue', 'DropdownMenuSubTrigger.vue', 'dropdown-menu-variants.ts'] },
    input: { files: ['Input.vue', 'input-variants.ts'] },
    label: { files: ['Label.vue', 'label-variants.ts'] },
    pagination: { files: ['Pagination.vue', 'pagination-variants.ts'], composables: ['useLocale.ts'] },
    popover: { files: ['PopoverContent.vue', 'popover-variants.ts'] },
    'scroll-area': { files: ['ScrollArea.vue', 'ScrollBar.vue'] },
    select: { files: ['SelectContent.vue', 'SelectItem.vue', 'SelectLabel.vue', 'SelectScrollDownButton.vue', 'SelectScrollUpButton.vue', 'SelectSeparator.vue', 'SelectTrigger.vue', 'select-variants.ts'] },
    separator: { files: ['Separator.vue', 'separator-variants.ts'] },
    skeleton: { files: ['Skeleton.vue', 'SkeletonAvatar.vue', 'SkeletonCard.vue', 'SkeletonTable.vue', 'SkeletonText.vue', 'skeleton-variants.ts'] },
    spinner: { files: ['Spinner.vue', 'BarsSpinner.vue', 'BlockSpinner.vue', 'DotsSpinner.vue', 'spinner-variants.ts'], composables: ['useLocale.ts'] },
    'submit-button': { files: ['SubmitButton.vue'], composables: ['useLocale.ts'] },
    switch: { files: ['Switch.vue', 'switch-variants.ts'] },
    table: { files: ['Table.vue', 'TableBody.vue', 'TableCaption.vue', 'TableCell.vue', 'TableFooter.vue', 'TableHead.vue', 'TableHeader.vue', 'TableRow.vue', 'table-variants.ts'] },
    tabs: { files: ['TabsContent.vue', 'TabsList.vue', 'TabsTrigger.vue', 'tabs-variants.ts'] },
    textarea: { files: ['Textarea.vue', 'textarea-variants.ts'], composables: ['useLocale.ts'] },
    toast: { files: ['Toast.vue', 'ToastContainer.vue', 'toast-variants.ts'], composables: ['useToast.ts', 'useLocale.ts'] },
    tooltip: { files: ['TooltipContent.vue', 'tooltip-variants.ts'] },
    'saas-pricing': { files: ['SaaSPricing.vue'] },
    'dashboard-stats': { files: ['DashboardStats.vue'], composables: ['useLocale.ts'] },
    form: { files: ['Form.vue', 'FormControl.vue', 'FormDescription.vue', 'FormField.vue', 'FormItem.vue', 'FormLabel.vue', 'FormMessage.vue', 'form-context.ts'] },
    'alert-dialog': { files: ['AlertDialogAction.vue', 'AlertDialogCancel.vue', 'AlertDialogContent.vue', 'AlertDialogDescription.vue', 'AlertDialogFooter.vue', 'AlertDialogHeader.vue', 'AlertDialogTitle.vue'] },
    sheet: { files: ['SheetContent.vue', 'SheetDescription.vue', 'SheetFooter.vue', 'SheetHeader.vue', 'SheetTitle.vue', 'sheet-variants.ts'], composables: ['useLocale.ts'] },
    'radio-group': { files: ['RadioGroup.vue', 'RadioGroupItem.vue', 'radio-group-variants.ts'] },
    slider: { files: ['Slider.vue', 'slider-variants.ts'] },
    progress: { files: ['Progress.vue', 'progress-variants.ts'] },
    toggle: { files: ['Toggle.vue', 'toggle-variants.ts'] },
    'toggle-group': { files: ['ToggleGroup.vue', 'ToggleGroupItem.vue', 'toggle-group-key.ts'] },
    'brutalist-hero': { files: ['BrutalistHero.vue'], composables: ['useLocale.ts'] },
    'pricing-section': { files: ['PricingSection.vue'] },
    'auth-card': { files: ['AuthCard.vue'], composables: ['useLocale.ts'] },
    'dashboard-shell': { files: ['DashboardShell.vue'] },
    'empty-state': { files: ['EmptyState.vue'], composables: ['useLocale.ts'] },
    'waitlist-page': { files: ['WaitlistPage.vue'], composables: ['useLocale.ts'] },
    accordion: { files: ['Accordion.vue', 'AccordionItem.vue', 'AccordionTrigger.vue', 'AccordionContent.vue', 'accordion-key.ts', 'accordion-variants.ts'] },
    'tags-input': { files: ['TagsInput.vue', 'TagsInputInput.vue', 'TagsInputItem.vue', 'TagsInputItemText.vue', 'TagsInputItemDelete.vue', 'tags-input-variants.ts'] },
    'number-input': { files: ['NumberInput.vue', 'number-input-variants.ts'], composables: ['useLocale.ts'] },
    'copy-to-clipboard': { files: ['CopyToClipboard.vue', 'copy-to-clipboard-variants.ts'], composables: ['useClipboard.ts', 'useLocale.ts'] },
    breadcrumb: { files: ['Breadcrumb.vue', 'BreadcrumbList.vue', 'BreadcrumbItem.vue', 'BreadcrumbLink.vue', 'BreadcrumbPage.vue', 'BreadcrumbSeparator.vue', 'BreadcrumbEllipsis.vue', 'breadcrumb-variants.ts'], composables: ['useLocale.ts'] },
    marquee: { files: ['Marquee.vue', 'marquee-variants.ts'] },
    'before-after': { files: ['BeforeAfter.vue', 'before-after-variants.ts'], composables: ['useLocale.ts'] },
    'code-block': { files: ['CodeBlock.vue', 'prism-languages.ts', 'brutx-prism.css', 'code-block-variants.ts'], composables: ['useLocale.ts'] },
    timeline: { files: ['Timeline.vue', 'TimelineItem.vue', 'TimelineSeparator.vue', 'TimelineDot.vue', 'TimelineConnector.vue', 'TimelineContent.vue', 'timeline-key.ts', 'timeline-variants.ts'] },
    carousel: { files: ['Carousel.vue', 'CarouselItem.vue', 'carousel-variants.ts'], composables: ['useLocale.ts'] },
    'tree-view': { files: ['TreeView.vue', 'TreeViewNode.vue', 'tree-view-variants.ts'], composables: ['useLocale.ts'] },
    kanban: { files: ['KanbanBoard.vue', 'kanban-variants.ts'], composables: ['useLocale.ts'] },
    'chat-bubble': { files: ['ChatBubble.vue', 'chat-bubble-variants.ts'] },
    kbd: { files: ['Kbd.vue', 'kbd-variants.ts'] },
    counter: { files: ['Counter.vue', 'counter-variants.ts'] },
    stepper: { files: ['Stepper.vue', 'stepper-variants.ts'], composables: ['useLocale.ts'] },
    'card-3d': { files: ['Card3D.vue', 'card-3d-variants.ts'], composables: ['useReducedMotion.ts', 'useLocale.ts'] },
    'glitch-text': { files: ['GlitchText.vue', 'glitch-text-variants.ts'], composables: ['useReducedMotion.ts'] },
    'scratch-card': { files: ['ScratchCard.vue', 'scratch-card-variants.ts'], composables: ['useReducedMotion.ts', 'useCanvasInteraction.ts', 'useLocale.ts'] },
    'sketchy-chart': { files: ['SketchyChart.vue', 'sketchy-chart-variants.ts'] },
    'hardcore-input': { files: ['HardcoreInput.vue', 'hardcore-input-variants.ts'], composables: ['useAudioEngine.ts', 'useLocale.ts'] },
    'testimonial-card': { files: ['TestimonialCard.vue'], composables: ['useLocale.ts'] },
    'blog-card': { files: ['BlogCard.vue'], composables: ['useLocale.ts'] },
    'file-card': { files: ['FileCard.vue'] },
    'quick-actions': { files: ['QuickActions.vue'], composables: ['useLocale.ts'] },
    'faq-section': { files: ['FaqSection.vue'] },
    'tabs-nav': { files: ['TabsNav.vue'] },
    'header-section': { files: ['HeaderSection.vue'] },
    'footer-section': { files: ['FooterSection.vue'], composables: ['useLocale.ts'] },
    'not-found-page': { files: ['NotFoundPage.vue'] },
    'loading-page': { files: ['LoadingPage.vue'], composables: ['useLocale.ts'] },
    'error-card': { files: ['ErrorCard.vue'] },
    'success-card': { files: ['SuccessCard.vue'], composables: ['useLocale.ts'] },
    'search-widget': { files: ['SearchWidget.vue'] },
    'feedback-form': { files: ['FeedbackForm.vue'], composables: ['useLocale.ts'] },
    'stepper-section': { files: ['StepperSection.vue'], composables: ['useLocale.ts'] },
    'cookie-consent': { files: ['CookieConsent.vue'], composables: ['useLocale.ts'] },
    'data-table-section': { files: ['DataTableSection.vue'], composables: ['useLocale.ts'] },
    'settings-page': { files: ['SettingsPage.vue'], composables: ['useLocale.ts'] },
    'blog-list-page': { files: ['BlogListPage.vue'], composables: ['useLocale.ts'] },
    'activity-log-page': { files: ['ActivityLogPage.vue'] },
    'profile-page': { files: ['ProfilePage.vue'] },
    'chart-section': { files: ['ChartSection.vue'] },
    'gallery-section': { files: ['GallerySection.vue'] },
    'upload-card': { files: ['UploadCard.vue'], composables: ['useLocale.ts'] },
    'overview-page': { files: ['OverviewPage.vue'], composables: ['useLocale.ts'] },
    'color-picker': {
        files: ['ColorPicker.vue', 'ColorPickerPanel.vue', 'ColorPickerSwatch.vue', 'ColorPickerInput.vue', 'ColorPickerHistory.vue', 'color-picker-variants.ts', 'types.ts'],
        composables: ['useLocale.ts', 'useColorHistory.ts'],
    },
    'date-picker': {
        files: [
            'DatePicker.vue',
            'DatePickerPanel.vue',
            'DatePickerRange.vue',
            'DatePickerRangePanel.vue',
            'TimePicker.vue',
            'DateTimePicker.vue',
            'DateTimePickerPanel.vue',
            'WeekPicker.vue',
            'WeekPickerPanel.vue',
            'MonthPicker.vue',
            'MonthPickerPanel.vue',
            'YearPicker.vue',
            'YearPickerPanel.vue',
            'date-picker-variants.ts',
            'types.ts',
        ],
        composables: ['useLocale.ts'],
    },
};

const FILE_TO_COMPONENT: Record<string, string> = {};
for (const [compName, mapping] of Object.entries(COMPONENT_FILES)) {
    for (const file of mapping.files) {
        FILE_TO_COMPONENT[file] = compName;
    }
}

function readComponentSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
}

function rewriteImports(code: string, componentName: string): string {
    code = code.replace(/['"]\.\.\/lib\/([^'"]+)['"]/g, "'@/lib/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g, "'@/lib/$1'");
    code = code.replace(/['"]\.\.\/composables\/([^'"]+)['"]/g, "'@/composables/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/composables\/([^'"]+)['"]/g, "'@/composables/$1'");
    code = code.replace(/['"]\.\.\/locales\/([^'"]+)['"]/g, "'@/locales/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/locales\/([^'"]+)['"]/g, "'@/locales/$1'");
    code = code.replace(
        /['"]\.\.\/components\/([a-zA-Z0-9-]+)\/([^'"]+)['"]/g,
        (m, comp, rest) => (COMPONENT_FILES[comp] ? `'@/components/ui/${comp}/${rest}'` : m)
    );

    // Rewrite cross-component imports: ../{component}/{file} → @/components/ui/{component}/{file}
    // Extract the component name directly from the path to avoid filename collision issues.
    code = code.replace(
        /(['"])\.\.\/([a-zA-Z0-9-]+)\/([^'"]+)\1/g,
        (m, quote, comp, rest) => (COMPONENT_FILES[comp] ? `${quote}@/components/ui/${comp}/${rest}${quote}` : m)
    );

    // Rewrite same-directory imports: ./{file} → @/components/ui/{componentName}/{file}
    // Use the current component name to avoid collisions between components sharing file names (e.g. types.ts).
    code = code.replace(
        /(['"])\.\/([^'"]+)\1/g,
        `$1@/components/ui/${componentName}/$2$1`
    );

    return code;
}

function extractComposableDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/composables\/([^'";\s]+)/g,
        /\.\.\/\.\.\/composables\/([^'";\s]+)/g,
        /\.\.\/composables\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractLibDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/lib\/([^'";\s]+)/g,
        /\.\.\/\.\.\/lib\/([^'";\s]+)/g,
        /\.\.\/lib\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractLocaleDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/locales\/([^'";\s]+)/g,
        /\.\.\/\.\.\/locales\/([^'";\s]+)/g,
        /\.\.\/locales\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractRegistryDeps(code: string, componentName: string): string[] {
    const deps = new Set<string>();
    const matches = code.match(/@\/components\/ui\/([a-zA-Z0-9-]+)/g);
    if (matches) {
        for (const match of matches) {
            const depName = match.replace('@/components/ui/', '');
            if (depName !== componentName && COMPONENT_FILES[depName]) {
                deps.add(depName);
            }
        }
    }
    return Array.from(deps);
}

const TAILWIND_CONFIG = {
    config: {
        theme: {
            extend: {
                borderWidth: {
                    '3': 'var(--brutal-border-width, 3px)'
                },
                borderColor: {
                    brutal: 'var(--brutal-border-color, #000000)'
                },
                borderRadius: {
                    brutal: 'var(--brutal-radius, 0px)'
                },
                colors: {
                    'brutal-bg': 'var(--brutal-bg)',
                    'brutal-fg': 'var(--brutal-fg)',
                    'brutal-primary': 'var(--brutal-primary)',
                    'brutal-secondary': 'var(--brutal-secondary)',
                    'brutal-accent': 'var(--brutal-accent)',
                    'brutal-destructive': 'var(--brutal-destructive)',
                    'brutal-success': 'var(--brutal-success)',
                    'brutal-muted': 'var(--brutal-muted)',
                    'brutal-ring': 'var(--brutal-ring)',
                    'brutal-info': 'var(--brutal-info)',
                    'brutal-muted-foreground': 'var(--brutal-muted-foreground)',
                    'brutal-overlay': 'var(--brutal-overlay)',
                    'brutal-placeholder': 'var(--brutal-placeholder)'
                },
                boxShadow: {
                    brutal: 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-sm': 'calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-lg': 'calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-xl': 'calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-primary': 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-primary)',
                    'brutal-secondary': 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-secondary)'
                }
            }
        }
    }
};

const CSS_VARS = {
    light: {
        'brutal-border-width': '3px',
        'brutal-border-color': '#000000',
        'brutal-shadow-offset-x': '4px',
        'brutal-shadow-offset-y': '4px',
        'brutal-shadow-color': '#000000',
        'brutal-radius': '0px',
        'brutal-pressed-offset': '2px',
        'brutal-bg': '#ffffff',
        'brutal-fg': '#000000',
        'brutal-primary': '#FF6B6B',
        'brutal-secondary': '#4ECDC4',
        'brutal-accent': '#FFE66D',
        'brutal-destructive': '#EF476F',
        'brutal-success': '#7FB069',
        'brutal-muted': '#f3f4f6',
        'brutal-ring': '#000000',
        'brutal-info': '#4A90D9',
        'brutal-muted-foreground': '#4B5563',
        'brutal-overlay': 'rgba(0, 0, 0, 0.5)',
        'brutal-placeholder': '#9CA3AF'
    },
    dark: {
        'brutal-border-width': '3px',
        'brutal-border-color': '#ffffff',
        'brutal-shadow-offset-x': '4px',
        'brutal-shadow-offset-y': '4px',
        'brutal-shadow-color': '#ffffff',
        'brutal-radius': '0px',
        'brutal-pressed-offset': '2px',
        'brutal-bg': '#141414',
        'brutal-fg': '#ffffff',
        'brutal-primary': '#FF6B6B',
        'brutal-secondary': '#4ECDC4',
        'brutal-accent': '#FFE66D',
        'brutal-destructive': '#EF476F',
        'brutal-success': '#7FB069',
        'brutal-muted': '#1e1e1e',
        'brutal-ring': '#ffffff',
        'brutal-info': '#3B82F6',
        'brutal-muted-foreground': '#9CA3AF',
        'brutal-overlay': 'rgba(0, 0, 0, 0.7)',
        'brutal-placeholder': '#6B7280'
    }
};

async function run() {
    console.log('🚀 Starting registry build...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const componentNames = Object.keys(COMPONENT_FILES);
    console.log(`📦 Found ${componentNames.length} components to process.`);
    let errorCount = 0;

    const registryIndex: Record<string, any> = {
        name: 'brutx-vue',
        homepage: 'https://lidaixingchen.github.io/brutxui-vue3/',
        items: []
    };

    for (const name of componentNames) {
        try {
            const componentInfo = COMPONENTS[name];
            const fileMapping = COMPONENT_FILES[name];

            if (!fileMapping) {
                throw new Error(`No file mapping found for component "${name}"`);
            }

            const allRegistryDeps = new Set<string>();
            const files: { path: string; content: string; type: string }[] = [];
            const composableDeps = new Set(fileMapping.composables ?? []);
            const localeDeps = new Set(fileMapping.locales ?? []);
            const libDeps = new Set<string>();

            for (const fileName of fileMapping.files) {
                const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);

                if (!fs.existsSync(filePath)) {
                    throw new Error(`Source file not found at ${filePath}`);
                }

                let code = readComponentSource(filePath);
                code = rewriteImports(code, name);

                const deps = extractRegistryDeps(code, name);
                deps.forEach(d => allRegistryDeps.add(d));
                extractComposableDeps(code).forEach(d => composableDeps.add(d));
                extractLocaleDeps(code).forEach(d => localeDeps.add(d));
                extractLibDeps(code).forEach(d => libDeps.add(d));

                files.push({
                    path: `components/ui/${name}/${fileName}`,
                    content: code,
                    type: 'registry:ui'
                });
            }

            const addedComposables = new Set<string>();
            while (addedComposables.size < composableDeps.size) {
                const pendingComposables = Array.from(composableDeps).filter((name) => !addedComposables.has(name));

                for (const composableName of pendingComposables) {
                    const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);

                    if (!fs.existsSync(composablePath)) {
                        throw new Error(`Composable file not found at ${composablePath}`);
                    }

                    let code = readComponentSource(composablePath);
                    code = rewriteImports(code, name);
                    extractComposableDeps(code).forEach(d => composableDeps.add(d));
                    extractLocaleDeps(code).forEach(d => localeDeps.add(d));
                    extractLibDeps(code).forEach(d => libDeps.add(d));

                    files.push({
                        path: `composables/${composableName}`,
                        content: code,
                        type: 'registry:ui'
                    });
                    addedComposables.add(composableName);
                }
            }

            for (const localeName of localeDeps) {
                const localePath = path.join(UI_LOCALES_DIR, localeName);

                if (!fs.existsSync(localePath)) {
                    throw new Error(`Locale file not found at ${localePath}`);
                }

                const code = rewriteImports(readComponentSource(localePath), name);

                files.push({
                    path: `locales/${localeName}`,
                    content: code,
                    type: 'registry:ui'
                });
            }

            for (const libName of libDeps) {
                if (LIB_FILE_EXCLUDE.has(libName)) continue;

                const libPath = path.join(UI_LIB_DIR, libName);

                if (!fs.existsSync(libPath)) {
                    throw new Error(`Lib file not found at ${libPath}`);
                }

                const code = rewriteImports(readComponentSource(libPath), name);

                files.push({
                    path: `lib/${libName}`,
                    content: code,
                    type: 'registry:ui'
                });
            }

            const title = name
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const description = `A highly customizable neo-brutalist ${title} component built with Brutx design tokens for Vue 3.`;

            const registryItem = {
                $schema: 'https://ui.shadcn.com/schema/registry-item.json',
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo?.dependencies || [],
                registryDependencies: Array.from(allRegistryDeps),
                files,
                tailwind: TAILWIND_CONFIG,
                cssVars: CSS_VARS
            };

            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (${files.length} files, Registry dependencies: [${Array.from(allRegistryDeps).join(', ')}])`);

            registryIndex.items.push({
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo?.dependencies || [],
                registryDependencies: Array.from(allRegistryDeps),
                files: files.map(f => ({
                    path: f.path,
                    type: f.type
                })),
                tailwind: TAILWIND_CONFIG,
                cssVars: CSS_VARS
            });
        } catch (err: any) {
            console.error(`✗ Failed to process component ${name}:`, err.message || err);
            errorCount++;
        }
    }

    if (errorCount > 0) {
        throw new Error(`Registry build failed with ${errorCount} component error(s).`);
    }

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');
    console.log('🎉 Registry built successfully!');
}

run().catch(console.error);
