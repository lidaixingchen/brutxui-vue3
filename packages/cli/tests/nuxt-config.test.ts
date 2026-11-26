import { describe, it, expect } from 'vitest';
import { injectNuxtConfig } from '../src/lib/frameworks/nuxt-config.js';

describe('NuxtConfigModifier', () => {
    const targets = { cssPath: 'assets/css/main.css', componentsRelDir: 'components/ui' };

    it('appends missing targets while preserving entry order and comments', () => {
        const source = `export default defineNuxtConfig({
    components: ['~/widgets', { path: '~/icons', prefix: 'Icon' }],
    css: [
        '~/assets/css/reset.css', // reset
        '~/assets/css/theme.css' // user theme
    ],
    devtools: { enabled: true },
})`;
        const result = injectNuxtConfig(source, targets);
        expect(result.status).toBe('injected');
        expect(result.content).toBe(`export default defineNuxtConfig({
    components: ['~/widgets', { path: '~/icons', prefix: 'Icon' }, '~/components/ui'],
    css: [
        '~/assets/css/reset.css', // reset
        '~/assets/css/theme.css', // user theme
        'assets/css/main.css'
    ],
    devtools: { enabled: true },
})`);
        expect(injectNuxtConfig(result.content, targets)).toEqual({
            content: result.content, changed: false, status: 'unchanged',
        });
    });

    it('recognizes alias equivalents and an existing recursive directory without deduplicating user entries', () => {
        const source = `export default defineNuxtConfig({
    components: ['~/widgets', { path: '@@/components/', extensions: ['.vue'] }],
    css: ['~/assets/css/main.css', '@@/assets/css/main.css'],
})`;
        expect(injectNuxtConfig(source, targets)).toEqual({ content: source, changed: false, status: 'unchanged' });
    });

    it('adds only the missing target to components.dirs while preserving object options', () => {
        const source = `export default defineNuxtConfig({
    components: { dirs: ['~/widgets'], global: true },
    css: ['@@/assets/css/main.css'],
})`;
        const result = injectNuxtConfig(source, targets);
        expect(result.status).toBe('injected');
        expect(result.content).toBe(source.replace("['~/widgets']", "['~/widgets', '~/components/ui']"));
    });

    it('distinguishes source-relative aliases from root-relative targets with a custom srcDir', () => {
        const source = `export default defineNuxtConfig({
    srcDir: 'client',
    components: ['@/components'],
    css: ['~/assets/css/main.css'],
})`;
        expect(injectNuxtConfig(source, {
            componentsRelDir: 'client/components/ui', cssPath: 'client/assets/css/main.css',
        })).toEqual({ content: source, changed: false, status: 'unchanged' });

        const result = injectNuxtConfig(source, targets);
        expect(result.status).toBe('injected');
        expect(result.content).toContain("['@/components', '~~/components/ui']");
        expect(result.content).toContain("['~/assets/css/main.css', '~~/assets/css/main.css']");
        expect(injectNuxtConfig(result.content, targets).status).toBe('unchanged');
    });

    it('preserves default auto-discovery when components is explicitly enabled', () => {
        const source = `export default defineNuxtConfig({ components: true, css: [] })`;
        const result = injectNuxtConfig(source, targets);
        expect(result.content).toBe(source.replace('css: []', "css: ['assets/css/main.css']"));
        expect(result.status).toBe('injected');
        expect(injectNuxtConfig(source, { ...targets, componentsRelDir: 'widgets' })).toEqual({
            content: source, changed: false, status: 'manual-required',
        });
    });

    it('preserves closing-line indentation and line endings when appending to an empty array', () => {
        const source = [
            'export default defineNuxtConfig({',
            "\tcomponents: ['~/components'],",
            '\tcss: [',
            '\t\t// Global styles',
            '\t],',
            '})',
        ].join('\r\n');
        const result = injectNuxtConfig(source, targets);
        expect(result.status).toBe('injected');
        expect(result.content).toContain("// Global styles\r\n\t\t'assets/css/main.css'\r\n\t]");
    });

    it('uses the effective root properties when duplicate declarations exist', () => {
        const source = `export default defineNuxtConfig({
    components: ['~/components'],
    components: ['~/widgets'],
    css: ['~/assets/css/reset.css'],
    css: ['~/assets/css/main.css'],
})`;
        const result = injectNuxtConfig(source, targets);
        expect(result.status).toBe('injected');
        expect(result.content).toBe(source.replace("['~/widgets']", "['~/widgets', '~/components/ui']"));
    });

    it.each([
        "components: false, css: ['~/assets/css/reset.css']",
        'components: componentDirs, css: []',
        "components: ['~/components'], css: [...globalStyles]",
        "components: [{ path: '~/components', extensions: ['ts'] }], css: []",
        "components: [{ path: '~/components', ignore: ['ui/**'] }], css: []",
        'components: { dirs: componentDirs }, css: []',
        "components: ['~/components'], [key]: [], css: []",
        '...defaults, css: []',
    ])('preserves the whole file when either target requires manual configuration (%s)', properties => {
        const source = `export default defineNuxtConfig({ ${properties} })`;
        expect(injectNuxtConfig(source, targets)).toEqual({
            content: source, changed: false, status: 'manual-required',
        });
    });

    it('injects missing components and css entries into empty defineNuxtConfig', () => {
        const source = 'export default defineNuxtConfig({\n})\n';
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('injected');
        expect(result.changed).toBe(true);
        expect(result.content).toContain("components: ['~/components']");
        expect(result.content).toContain("css: ['assets/css/main.css']");
    });

    it('returns unchanged status when components and css are already defined', () => {
        const source = `
export default defineNuxtConfig({
    components: ['~/components'],
    css: ['assets/css/main.css'],
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('unchanged');
        expect(result.changed).toBe(false);
        expect(result.content).toBe(source);
    });

    it('recognizes single-quoted and double-quoted key names', () => {
        const source = `
export default defineNuxtConfig({
    'components': ['~/components'],
    "css": ['assets/css/main.css'],
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('unchanged');
        expect(result.changed).toBe(false);
        expect(result.content).toBe(source);
    });

    it('handles single-line comments between key and colon', () => {
        const source = `
export default defineNuxtConfig({
    components // 自定义组件目录
        : ['~/components'],
    css // 全局样式
        : ['assets/css/main.css'],
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('unchanged');
        expect(result.changed).toBe(false);
        expect(result.content).toBe(source);
    });

    it('handles comments between defineNuxtConfig and parenthesis', () => {
        const source = `
export default defineNuxtConfig /* config */ ({
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('injected');
        expect(result.changed).toBe(true);
        expect(result.content).toContain("components: ['~/components']");
    });

    it('handles generic arguments in defineNuxtConfig<{ ... }>', () => {
        const source = `
export default defineNuxtConfig<{ modules?: string[] }>({
    devtools: { enabled: true },
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('injected');
        expect(result.changed).toBe(true);
        expect(result.content).toContain("components: ['~/components']");
        expect(result.content).toContain("css: ['assets/css/main.css']");
    });

    it('supports arrow function returning object literal defineNuxtConfig(() => ({ ... }))', () => {
        const source = `
export default defineNuxtConfig(() => ({
    devtools: { enabled: true },
}))
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('injected');
        expect(result.changed).toBe(true);
        expect(result.content).toContain("components: ['~/components']");
    });

    it('safely downgrades statement function configs to manual-required', () => {
        const arrowBlockSource = `
export default defineNuxtConfig(() => {
    return { devtools: { enabled: true } };
})
`;
        const arrowResult = injectNuxtConfig(arrowBlockSource, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });
        expect(arrowResult.status).toBe('manual-required');
        expect(arrowResult.changed).toBe(false);

        const functionSource = `
export default defineNuxtConfig(function() {
    return { devtools: { enabled: true } };
})
`;
        const funcResult = injectNuxtConfig(functionSource, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });
        expect(funcResult.status).toBe('manual-required');
        expect(funcResult.changed).toBe(false);
    });

    it('skips strings and comments containing braces and colons', () => {
        const source = `
// defineNuxtConfig({ components: false })
/*
  export default defineNuxtConfig({ css: [] })
*/
export default defineNuxtConfig({
    app: {
        head: {
            title: 'defineNuxtConfig: { css: true }',
        },
    },
})
`;
        const result = injectNuxtConfig(source, {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('injected');
        expect(result.changed).toBe(true);
        expect(result.content).toContain("components: ['~/components']");
        expect(result.content).toContain("css: ['assets/css/main.css']");
    });

    it('returns manual-required when defineNuxtConfig is missing or unparseable', () => {
        const result = injectNuxtConfig('export default {}', {
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'components',
        });

        expect(result.status).toBe('manual-required');
        expect(result.changed).toBe(false);
    });

    it('supports legacy positional arguments signature', () => {
        const result = injectNuxtConfig(
            'export default defineNuxtConfig({\n})\n',
            'assets/css/main.css',
            'components'
        );

        expect(typeof result).toBe('string');
        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
    });
});
