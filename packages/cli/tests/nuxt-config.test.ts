import { describe, it, expect } from 'vitest';
import { injectNuxtConfig } from '../src/lib/frameworks/nuxt-config.js';

describe('NuxtConfigModifier', () => {
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
