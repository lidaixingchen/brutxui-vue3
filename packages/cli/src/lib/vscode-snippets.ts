import fs from 'fs-extra';
import path from 'path';

import type { BrutalistConfig } from './types.js';
import { AVAILABLE_COMPONENTS } from './constants.js';

interface VscodeSnippet {
    prefix: string;
    body: string[];
    description: string;
}

interface VscodeSnippetFile {
    [key: string]: VscodeSnippet;
}

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

const COMPONENT_SNIPPET_BODY: Record<string, string[]> = {
    alert: [
        '<Alert variant="${1|default,destructive,warning,success|}">',
        '    <AlertTitle>${2:Title}</AlertTitle>',
        '    <AlertDescription>${3:Description}</AlertDescription>',
        '</Alert>',
    ],
    avatar: [
        '<Avatar>',
        '    <AvatarImage src="${1:url}" alt="${2:avatar}" />',
        '    <AvatarFallback>${3:AB}</AvatarFallback>',
        '</Avatar>',
    ],
    badge: [
        '<Badge variant="${1|default,secondary,destructive,outline|}">${2:Badge}</Badge>',
    ],
    button: [
        '<Button variant="${1|default,destructive,outline,secondary,ghost,link|}" size="${2|default,sm,lg,icon|}">',
        '    ${3:Click me}',
        '</Button>',
    ],
    calendar: [
        '<Calendar v-model="${1:date}" />',
    ],
    card: [
        '<Card>',
        '    <CardHeader>',
        '        <CardTitle>${1:Title}</CardTitle>',
        '        <CardDescription>${2:Description}</CardDescription>',
        '    </CardHeader>',
        '    <CardContent>',
        '        ${3:Content}',
        '    </CardContent>',
        '</Card>',
    ],
    checkbox: [
        '<Checkbox v-model:checked="${1:checked}" id="${2:check}" />',
    ],
    combobox: [
        '<Combobox v-model="${1:value}" :options="${2:options}" />',
    ],
    command: [
        '<Command>',
        '    <CommandInput placeholder="${1:Type a command...}" />',
        '    <CommandList>',
        '        <CommandEmpty>${2:No results found.}</CommandEmpty>',
        '        <CommandGroup heading="${3:Suggestions}">',
        '            ${4:<!-- CommandItem -->}',
        '        </CommandGroup>',
        '    </CommandList>',
        '</Command>',
    ],
    dialog: [
        '<Dialog v-model:open="${1:open}">',
        '    <DialogTrigger as-child>',
        '        <Button>${2:Open Dialog}</Button>',
        '    </DialogTrigger>',
        '    <DialogContent>',
        '        <DialogHeader>',
        '            <DialogTitle>${3:Title}</DialogTitle>',
        '            <DialogDescription>${4:Description}</DialogDescription>',
        '        </DialogHeader>',
        '    </DialogContent>',
        '</Dialog>',
    ],
    'dropdown-menu': [
        '<DropdownMenu>',
        '    <DropdownMenuTrigger as-child>',
        '        <Button>${1:Open Menu}</Button>',
        '    </DropdownMenuTrigger>',
        '    <DropdownMenuContent>',
        '        <DropdownMenuItem>${2:Item}</DropdownMenuItem>',
        '    </DropdownMenuContent>',
        '</DropdownMenu>',
    ],
    input: [
        '<Input v-model="${1:value}" type="${2|text,email,password,number|}" placeholder="${3:Enter text...}" />',
    ],
    label: [
        '<Label for="${1:inputId}">${2:Label}</Label>',
    ],
    pagination: [
        '<Pagination v-model:page="${1:page}" :total="${2:total}" :items-per-page="${3:10}" />',
    ],
    popover: [
        '<Popover>',
        '    <PopoverTrigger as-child>',
        '        <Button>${1:Open}</Button>',
        '    </PopoverTrigger>',
        '    <PopoverContent>',
        '        ${2:Content}',
        '    </PopoverContent>',
        '</Popover>',
    ],
    'scroll-area': [
        '<ScrollArea class="${1:h-72 w-48}">',
        '    ${2:<!-- scrollable content -->}',
        '</ScrollArea>',
    ],
    select: [
        '<Select v-model="${1:value}">',
        '    <SelectTrigger>',
        '        <SelectValue placeholder="${2:Select an option}" />',
        '    </SelectTrigger>',
        '    <SelectContent>',
        '        <SelectItem value="${3:option1}">${4:Option 1}</SelectItem>',
        '    </SelectContent>',
        '</Select>',
    ],
    separator: [
        '<Separator ${1:orientation="horizontal"} />',
    ],
    skeleton: [
        '<Skeleton class="${1:h-4 w-[250px]}" />',
    ],
    spinner: [
        '<Spinner size="${1|sm,md,lg|}" />',
    ],
    switch: [
        '<Switch v-model:checked="${1:checked}" />',
    ],
    table: [
        '<Table>',
        '    <TableHeader>',
        '        <TableRow>',
        '            <TableHead>${1:Column}</TableHead>',
        '        </TableRow>',
        '    </TableHeader>',
        '    <TableBody>',
        '        <TableRow>',
        '            <TableCell>${2:Cell}</TableCell>',
        '        </TableRow>',
        '    </TableBody>',
        '</Table>',
    ],
    tabs: [
        '<Tabs default-value="${1:tab1}">',
        '    <TabsList>',
        '        <TabsTrigger value="${1:tab1}">${2:Tab 1}</TabsTrigger>',
        '    </TabsList>',
        '    <TabsContent value="${1:tab1}">',
        '        ${3:Content}',
        '    </TabsContent>',
        '</Tabs>',
    ],
    textarea: [
        '<Textarea v-model="${1:value}" placeholder="${2:Enter text...}" />',
    ],
    toast: [
        'toast(${1:{ title: "Title", description: "Description" }})',
    ],
    tooltip: [
        '<Tooltip>',
        '    <TooltipTrigger as-child>',
        '        <Button>${1:Hover me}</Button>',
        '    </TooltipTrigger>',
        '    <TooltipContent>',
        '        <p>${2:Tooltip text}</p>',
        '    </TooltipContent>',
        '</Tooltip>',
    ],
    accordion: [
        '<Accordion type="single" collapsible>',
        '    <AccordionItem value="item-1">',
        '        <AccordionTrigger>${1:Question}</AccordionTrigger>',
        '        <AccordionContent>${2:Answer}</AccordionContent>',
        '    </AccordionItem>',
        '</Accordion>',
    ],
    'alert-dialog': [
        '<AlertDialog v-model:open="${1:open}">',
        '    <AlertDialogTrigger as-child>',
        '        <Button>${2:Open}</Button>',
        '    </AlertDialogTrigger>',
        '    <AlertDialogContent>',
        '        <AlertDialogHeader>',
        '            <AlertDialogTitle>${3:Are you sure?}</AlertDialogTitle>',
        '            <AlertDialogDescription>${4:This action cannot be undone.}</AlertDialogDescription>',
        '        </AlertDialogHeader>',
        '    </AlertDialogContent>',
        '</AlertDialog>',
    ],
    sheet: [
        '<Sheet v-model:open="${1:open}">',
        '    <SheetTrigger as-child>',
        '        <Button>${2:Open Sheet}</Button>',
        '    </SheetTrigger>',
        '    <SheetContent>',
        '        <SheetHeader>',
        '            <SheetTitle>${3:Title}</SheetTitle>',
        '            <SheetDescription>${4:Description}</SheetDescription>',
        '        </SheetHeader>',
        '    </SheetContent>',
        '</Sheet>',
    ],
    'radio-group': [
        '<RadioGroup v-model="${1:value}">',
        '    <RadioGroupItem value="${2:option1}" id="${2:option1}" />',
        '    <Label for="${2:option1}">${3:Option 1}</Label>',
        '</RadioGroup>',
    ],
    slider: [
        '<Slider v-model="${1:value}" :min="${2:0}" :max="${3:100}" :step="${4:1}" />',
    ],
    progress: [
        '<Progress v-model="${1:progress}" :max="${2:100}" />',
    ],
    toggle: [
        '<Toggle v-model:pressed="${1:pressed}">',
        '    ${2:Toggle}',
        '</Toggle>',
    ],
    'toggle-group': [
        '<ToggleGroup type="${1|single,multiple|}" v-model="${2:value}">',
        '    <ToggleGroupItem value="${3:a}">${3:a}</ToggleGroupItem>',
        '</ToggleGroup>',
    ],
    form: [
        '<form @submit="onSubmit">',
        '    <FormField v-slot="{ componentField }" name="${1:field}">',
        '        <FormItem>',
        '            <FormLabel>${2:Label}</FormLabel>',
        '            <FormControl>',
        '                <Input v-bind="componentField" />',
        '            </FormControl>',
        '            <FormMessage />',
        '        </FormItem>',
        '    </FormField>',
        '    <Button type="submit">${3:Submit}</Button>',
        '</form>',
    ],
    breadcrumb: [
        '<Breadcrumb>',
        '    <BreadcrumbList>',
        '        <BreadcrumbItem>',
        '            <BreadcrumbLink href="${1:/}">${2:Home}</BreadcrumbLink>',
        '        </BreadcrumbItem>',
        '        <BreadcrumbSeparator />',
        '        <BreadcrumbItem>',
        '            <BreadcrumbPage>${3:Current}</BreadcrumbPage>',
        '        </BreadcrumbItem>',
        '    </BreadcrumbList>',
        '</Breadcrumb>',
    ],
    'tags-input': [
        '<TagsInput v-model="${1:tags}" />',
    ],
    'number-input': [
        '<NumberInput v-model="${1:value}" :min="${2:0}" :max="${3:100}" />',
    ],
    'copy-to-clipboard': [
        '<CopyToClipboard :text="${1:text}" />',
    ],
    marquee: [
        '<Marquee>',
        '    ${1:<!-- repeated content -->}',
        '</Marquee>',
    ],
    'code-block': [
        '<CodeBlock :code="${1:code}" language="${2:typescript}" />',
    ],
    carousel: [
        '<Carousel>',
        '    <CarouselContent>',
        '        <CarouselItem>${1:Slide 1}</CarouselItem>',
        '    </CarouselContent>',
        '    <CarouselPrevious />',
        '    <CarouselNext />',
        '</Carousel>',
    ],
    counter: [
        '<Counter v-model="${1:count}" :min="${2:0}" :max="${3:99}" />',
    ],
    kbd: [
        '<Kbd>${1:Ctrl+K}</Kbd>',
    ],
    'card-3d': [
        '<Card3d>',
        '    ${1:<!-- content -->}',
        '</Card3d>',
    ],
    stepper: [
        '<Stepper v-model="${1:step}" :steps="${2:steps}" />',
    ],
};

function getSnippetBody(componentName: string): string[] {
    if (COMPONENT_SNIPPET_BODY[componentName]) {
        return COMPONENT_SNIPPET_BODY[componentName];
    }

    const pascalName = toPascalCase(componentName);
    return ['<' + pascalName + '>${1:<!-- content -->}</' + pascalName + '>'];
}

function buildSnippetForComponent(componentName: string): VscodeSnippet {
    const pascalName = toPascalCase(componentName);

    return {
        prefix: `brutx-${componentName}`,
        body: getSnippetBody(componentName),
        description: `BrutxUI ${pascalName} component`,
    };
}

export function generateSnippets(config: BrutalistConfig, components?: string[]): string {
    const componentList = components ?? AVAILABLE_COMPONENTS;

    const snippetFile: VscodeSnippetFile = {};

    for (const componentName of componentList) {
        const snippetKey = `BrutxUI ${toPascalCase(componentName)}`;
        snippetFile[snippetKey] = buildSnippetForComponent(componentName);
    }

    return JSON.stringify(snippetFile, null, 4);
}

export function generateSnippetsForComponents(components: string[]): string {
    const snippetFile: VscodeSnippetFile = {};

    for (const componentName of components) {
        const snippetKey = `BrutxUI ${toPascalCase(componentName)}`;
        snippetFile[snippetKey] = buildSnippetForComponent(componentName);
    }

    return JSON.stringify(snippetFile, null, 4);
}

export async function writeSnippetsFile(
    cwd: string,
    config: BrutalistConfig,
    components?: string[],
): Promise<string> {
    const vscodeDir = path.join(cwd, '.vscode');
    await fs.ensureDir(vscodeDir);

    const snippetContent = generateSnippets(config, components);
    const snippetPath = path.join(vscodeDir, 'brutx.code-snippets');
    await fs.writeFile(snippetPath, snippetContent, 'utf-8');

    return snippetPath;
}

export async function mergeSnippetsFile(
    cwd: string,
    newComponents: string[],
): Promise<string> {
    const vscodeDir = path.join(cwd, '.vscode');
    const snippetPath = path.join(vscodeDir, 'brutx.code-snippets');

    let existingSnippets: VscodeSnippetFile = {};
    if (await fs.pathExists(snippetPath)) {
        try {
            const parsed: unknown = await fs.readJson(snippetPath);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                existingSnippets = parsed as VscodeSnippetFile;
            }
        } catch {
            existingSnippets = {};
        }
    }

    for (const componentName of newComponents) {
        const snippetKey = `BrutxUI ${toPascalCase(componentName)}`;
        existingSnippets[snippetKey] = buildSnippetForComponent(componentName);
    }

    await fs.ensureDir(vscodeDir);
    await fs.writeFile(snippetPath, JSON.stringify(existingSnippets, null, 4), 'utf-8');

    return snippetPath;
}

export async function hasVscodeDir(cwd: string): Promise<boolean> {
    return fs.pathExists(path.join(cwd, '.vscode'));
}
