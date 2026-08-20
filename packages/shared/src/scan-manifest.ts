import type { ComponentFileManifest } from './registry-manifest.types.js';

/**
 * 默认不参与 registry 发布/哈希的 lib 目录文件清单（只读集合）。
 */
export const DEFAULT_LIB_EXCLUDE: ReadonlySet<string> = new Set(['utils.ts']);

/**
 * 约定式依赖覆盖清单：AST 扫描无法静态分析出的隐式依赖。
 */
export const DEFAULT_MANIFEST_OVERRIDES: Readonly<Record<string, Partial<Pick<ComponentFileManifest, 'directives'>>>> = {
    loading: {
        directives: ['loading.ts'],
    },
};

/**
 * 将覆盖规则合并进组件扫描结果（就地修改传入的 manifest）。
 */
export function applyManifestOverrides(
    manifest: Record<string, ComponentFileManifest>,
    overrides: Record<string, Partial<Pick<ComponentFileManifest, 'directives'>>> = DEFAULT_MANIFEST_OVERRIDES
): void {
    for (const [name, override] of Object.entries(overrides)) {
        if (!manifest[name]) continue;
        if (override.directives) {
            const existing = new Set(manifest[name].directives ?? []);
            for (const d of override.directives) {
                existing.add(d);
            }
            manifest[name].directives = Array.from(existing).sort();
        }
    }
}
