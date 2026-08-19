import path from 'node:path';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import { BarrelManager } from './barrel-manager.js';

export type GenerateType = 'component' | 'composable' | 'page';

export interface TemplateVars {
    PascalName: string;
    kebabName: string;
    camelName: string;
    description: string;
}

export interface FileTemplate {
    relativePath: string;
    content: string;
}

export interface GeneratorConfig {
    targetDir: string;
    files: FileTemplate[];
    exports: string[];
}

export interface ScaffoldEngineOptions {
    fs: FileSystemAdapter;
    projectRoot: string;
}

export interface GenerateOptions {
    type: GenerateType;
    name: string;
    dryRun?: boolean;
    overwrite?: boolean;
}

export interface PlannedFile {
    filePath: string;
    content: string;
    isNew: boolean;
}

export interface GenerateResult {
    success: boolean;
    type: GenerateType;
    name: string;
    files: PlannedFile[];
    injectedExports: string[];
    error?: string;
}

function toPascalCase(name: string): string {
    return name
        .replace(/[-_\s]+(.)?/g, (_match: string, char: string | undefined): string =>
            char ? char.toUpperCase() : ''
        )
        .replace(/^./, (char: string): string => char.toUpperCase());
}

function toKebabCase(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

function toCamelCase(name: string): string {
    const pascal = toPascalCase(name);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function replaceTemplateVars(template: string, vars: TemplateVars): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(pattern, value);
    }
    return result;
}

function getComponentVueTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        '<script setup lang="ts">',
        "import { computed } from 'vue'",
        "import { cn } from '@/lib/utils'",
        "import { {{camelName}}Variants } from './{{kebabName}}-variants'",
        '',
        'interface {{PascalName}}Props {',
        '    /** 自定义 CSS 类名 */',
        '    class?: string',
        '}',
        '',
        'const props = withDefaults(defineProps<{{PascalName}}Props>(), {',
        '    class: undefined,',
        '})',
        '',
        'const classes = computed(() =>',
        '    cn({{camelName}}Variants(), props.class)',
        ')',
        '</script>',
        '',
        '<template>',
        '    <div :class="classes">',
        '        <slot />',
        '    </div>',
        '</template>',
        '',
    ];
    return lines.join('\n');
}

function getComponentVariantsTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { cva } from 'class-variance-authority'",
        '',
        'export const {{camelName}}Variants = cva(',
        '    [',
        "        'relative',",
        '    ],',
        '    {',
        '        variants: {',
        '            variant: {',
        "                default: '',",
        '            },',
        '            size: {',
        "                default: '',",
        '            },',
        '        },',
        '        defaultVariants: {',
        "            variant: 'default',",
        "            size: 'default',",
        '        },',
        '    }',
        ')',
        '',
    ];
    return lines.join('\n');
}

function getComponentTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { mount } from '@vue/test-utils'",
        "import {{PascalName}} from './{{PascalName}}.vue'",
        '',
        "describe('{{PascalName}}', () => {",
        "    it('正确渲染默认状态', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            slots: {',
        "                default: '{{description}}',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.text()).toContain('{{description}}')",
        '    })',
        '',
        "    it('支持自定义 class', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                class: 'custom-class',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.classes()).toContain('custom-class')",
        '    })',
        '})',
        '',
    ];
    return lines.join('\n');
}

function getComposableTemplate(_vars: TemplateVars): string {
    const BT = '`';
    const lines: string[] = [
        "import { ref, type Ref } from 'vue'",
        '',
        '/**',
        ' * {{description}} 选项',
        ' */',
        'export interface {{PascalName}}Options {',
        '    /** 初始值 */',
        '    initialValue?: unknown',
        '}',
        '',
        '/**',
        ' * {{description}} 返回类型',
        ' */',
        'export interface {{PascalName}}Return {',
        '    /** 当前值 */',
        '    value: Ref<unknown>',
        '    /** 重置为初始值 */',
        '    reset: () => void',
        '}',
        '',
        '/**',
        ' * {{description}}',
        ' *',
        ' * @param options - 配置选项',
        ' * @returns 包含状态和操作方法的对象',
        ' *',
        ' * @example',
        ` * ${BT}${BT}${BT}vue`,
        ' * <script setup lang="ts">',
        " * import { {{camelName}} } from '@brutx/ui-vue'",
        ' *',
        ' * const { value, reset } = {{camelName}}({',
        ' *     initialValue: null,',
        ' * })',
        ' * </script>',
        ` * ${BT}${BT}${BT}`,
        ' */',
        'export function {{camelName}}(',
        '    options: {{PascalName}}Options = {},',
        '): {{PascalName}}Return {',
        '    const { initialValue = null } = options',
        '',
        '    const value = ref<unknown>(initialValue)',
        '',
        '    function reset(): void {',
        '        value.value = initialValue',
        '    }',
        '',
        '    return {',
        '        value,',
        '        reset,',
        '    }',
        '}',
        '',
    ];
    return lines.join('\n');
}

function getComposableTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { {{camelName}} } from './{{camelName}}'",
        '',
        "describe('{{camelName}}', () => {",
        "    it('返回默认初始值', () => {",
        '        const { value } = {{camelName}}()',
        '        expect(value.value).toBeNull()',
        '    })',
        '',
        "    it('支持自定义初始值', () => {",
        "        const { value } = {{camelName}}({ initialValue: 'test' })",
        "        expect(value.value).toBe('test')",
        '    })',
        '',
        "    it('重置为初始值', () => {",
        "        const { value, reset } = {{camelName}}({ initialValue: 'initial' })",
        "        value.value = 'changed'",
        "        expect(value.value).toBe('changed')",
        '',
        '        reset()',
        "        expect(value.value).toBe('initial')",
        '    })',
        '})',
        '',
    ];
    return lines.join('\n');
}

function getPageVueTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        '<script setup lang="ts">',
        "import { cn } from '@/lib/utils'",
        '',
        'interface {{PascalName}}Props {',
        '    /** 页面标题 */',
        '    title?: string',
        '    /** 页面描述 */',
        '    description?: string',
        '    /** 自定义 CSS 类名 */',
        '    class?: string',
        '}',
        '',
        'const props = withDefaults(defineProps<{{PascalName}}Props>(), {',
        "    title: '{{description}}',",
        "    description: '',",
        '    class: undefined,',
        '})',
        '</script>',
        '',
        '<template>',
        '    <div :class="cn(\'flex flex-col gap-6 p-6\', props.class)">',
        '        <header class="flex flex-col gap-2">',
        '            <h1 class="text-3xl font-black tracking-tight">',
        '                {{ title }}',
        '            </h1>',
        '            <p',
        '                v-if="description"',
        '                class="text-muted-foreground"',
        '            >',
        '                {{ description }}',
        '            </p',
        '        </header>',
        '',
        '        <main class="flex-1">',
        '            <slot />',
        '        </main>',
        '',
        '        <footer v-if="$slots.footer">',
        '            <slot name="footer" />',
        '        </footer>',
        '    </div>',
        '</template>',
        '',
    ];
    return lines.join('\n');
}

function getPageIndexTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "export { default as {{PascalName}} } from './{{PascalName}}.vue'",
        '',
    ];
    return lines.join('\n');
}

function getPageTestTemplate(_vars: TemplateVars): string {
    const lines: string[] = [
        "import { describe, it, expect } from 'vitest'",
        "import { mount } from '@vue/test-utils'",
        "import {{PascalName}} from './{{PascalName}}.vue'",
        '',
        "describe('{{PascalName}}', () => {",
        "    it('正确渲染默认标题', () => {",
        '        const wrapper = mount({{PascalName}})',
        '',
        "        expect(wrapper.find('h1').text()).toBe('{{description}}')",
        '    })',
        '',
        "    it('支持自定义标题', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                title: '自定义标题',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.find('h1').text()).toBe('自定义标题')",
        '    })',
        '',
        "    it('支持自定义 class', () => {",
        '        const wrapper = mount({{PascalName}}, {',
        '            props: {',
        "                class: 'custom-class',",
        '            },',
        '        })',
        '',
        "        expect(wrapper.classes()).toContain('custom-class')",
        '    })',
        '})',
        '',
    ];
    return lines.join('\n');
}

export class ScaffoldEngine {
    private readonly fs: FileSystemAdapter;
    private readonly projectRoot: string;
    private readonly uiSrcDir: string;
    private readonly componentsDir: string;
    private readonly composablesDir: string;
    private readonly indexFile: string;
    private readonly barrelManager: BarrelManager;

    constructor(options: ScaffoldEngineOptions) {
        this.fs = options.fs;
        this.projectRoot = path.resolve(options.projectRoot);
        this.uiSrcDir = path.join(this.projectRoot, 'packages', 'ui', 'src');
        this.componentsDir = path.join(this.uiSrcDir, 'components');
        this.composablesDir = path.join(this.uiSrcDir, 'composables');
        this.indexFile = path.join(this.uiSrcDir, 'index.ts');
        this.barrelManager = new BarrelManager();
    }

    public buildTemplateVars(name: string, type: GenerateType): TemplateVars {
        const pascalName = toPascalCase(name);
        const kebabName = toKebabCase(name);

        const descriptionMap: Record<GenerateType, string> = {
            component: `${pascalName} 组件`,
            composable: `${pascalName} 组合式函数`,
            page: `${pascalName} 页面`,
        };

        return {
            PascalName: pascalName,
            kebabName,
            camelName: toCamelCase(name),
            description: descriptionMap[type],
        };
    }

    public getGeneratorConfig(type: GenerateType, vars: TemplateVars): GeneratorConfig {
        if (type === 'component') {
            const kebabName = vars.kebabName;
            return {
                targetDir: path.join(this.componentsDir, kebabName),
                files: [
                    {
                        relativePath: `${vars.PascalName}.vue`,
                        content: replaceTemplateVars(getComponentVueTemplate(vars), vars),
                    },
                    {
                        relativePath: `${kebabName}-variants.ts`,
                        content: replaceTemplateVars(getComponentVariantsTemplate(vars), vars),
                    },
                    {
                        relativePath: `${kebabName}.test.ts`,
                        content: replaceTemplateVars(getComponentTestTemplate(vars), vars),
                    },
                ],
                exports: [
                    `export { default as ${vars.PascalName} } from './components/${kebabName}/${vars.PascalName}.vue'`,
                    `export { ${vars.camelName}Variants } from './components/${kebabName}/${kebabName}-variants'`,
                ],
            };
        }

        if (type === 'composable') {
            return {
                targetDir: this.composablesDir,
                files: [
                    {
                        relativePath: `${vars.camelName}.ts`,
                        content: replaceTemplateVars(getComposableTemplate(vars), vars),
                    },
                    {
                        relativePath: `${vars.camelName}.test.ts`,
                        content: replaceTemplateVars(getComposableTestTemplate(vars), vars),
                    },
                ],
                exports: [
                    `export { ${vars.camelName} } from './composables/${vars.camelName}'`,
                    `export type { ${vars.PascalName}Options, ${vars.PascalName}Return } from './composables/${vars.camelName}'`,
                ],
            };
        }

        const kebabName = vars.kebabName;
        return {
            targetDir: path.join(this.componentsDir, kebabName),
            files: [
                {
                    relativePath: `${vars.PascalName}.vue`,
                    content: replaceTemplateVars(getPageVueTemplate(vars), vars),
                },
                {
                    relativePath: 'index.ts',
                    content: replaceTemplateVars(getPageIndexTemplate(vars), vars),
                },
                {
                    relativePath: `${vars.PascalName}.test.ts`,
                    content: replaceTemplateVars(getPageTestTemplate(vars), vars),
                },
            ],
            exports: [
                `export { default as ${vars.PascalName} } from './components/${kebabName}/${vars.PascalName}.vue'`,
            ],
        };
    }

    public async generate(options: GenerateOptions): Promise<GenerateResult> {
        const { type, name, dryRun = false, overwrite = false } = options;
        const vars = this.buildTemplateVars(name, type);
        const config = this.getGeneratorConfig(type, vars);

        const plannedFiles: PlannedFile[] = [];
        for (const file of config.files) {
            const filePath = path.join(config.targetDir, file.relativePath);
            const exists = await this.fs.pathExists(filePath);
            if (exists && !overwrite) {
                return {
                    success: false,
                    type,
                    name,
                    files: [],
                    injectedExports: [],
                    error: `文件已存在: ${filePath}`,
                };
            }
            plannedFiles.push({
                filePath,
                content: file.content,
                isNew: !exists,
            });
        }

        if (dryRun) {
            return {
                success: true,
                type,
                name,
                files: plannedFiles,
                injectedExports: config.exports,
            };
        }

        const writtenFiles: string[] = [];
        let originalIndexContent: string | null = null;

        try {
            for (const file of plannedFiles) {
                await this.fs.writeFile(file.filePath, file.content, 'utf-8');
                writtenFiles.push(file.filePath);
            }

            if (await this.fs.pathExists(this.indexFile)) {
                originalIndexContent = await this.fs.readFile(this.indexFile, 'utf-8');
                const nextIndexContent = this.barrelManager.injectExports(originalIndexContent, config.exports);
                if (nextIndexContent !== originalIndexContent) {
                    await this.fs.writeFile(this.indexFile, nextIndexContent, 'utf-8');
                }
            }

            return {
                success: true,
                type,
                name,
                files: plannedFiles,
                injectedExports: config.exports,
            };
        } catch (error) {
            for (const written of writtenFiles) {
                await this.fs.remove(written).catch(() => {});
            }
            if (originalIndexContent !== null) {
                await this.fs.writeFile(this.indexFile, originalIndexContent, 'utf-8').catch(() => {});
            }
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                type,
                name,
                files: [],
                injectedExports: [],
                error: `脚手架生成失败并已自动回滚: ${message}`,
            };
        }
    }
}
