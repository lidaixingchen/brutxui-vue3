/**
 * 扫描清单共享模块：prebuild-scan 与 registry build 的单一事实来源。
 *
 * 历史背景：build-registry.ts 的 watch 模式（runPrebuildScan）需要与 prebuild-scan.ts
 * 使用完全相同的 LIB_EXCLUDE / MANIFEST_OVERRIDES，历史上两处逐字重写，
 * 改一处漏另一处会让 registry watch 产物与 CI 产物静默分叉。
 * 因此把清单抽到本模块，两处都经 import 复用，改清单只改这一处。
 */
import type { ComponentFileManifest } from 'brutx-shared-vue/scan';

/**
 * lib 目录中不参与 registry 发布/哈希的文件（内容不发布，但 import 仍被扫描以发现传递依赖）。
 */
export const LIB_EXCLUDE = new Set<string>(['utils.ts']);

/**
 * 约定式依赖覆盖清单：AST 扫描发现不了的（源码之间无 import 链接）依赖。
 *
 * v-loading 指令随 Loading.vue 打包但未被其 import——由消费者外部注册。
 * 这是代码库中唯一此类情况；保持清单最小且有文档说明。
 */
export const MANIFEST_OVERRIDES: Record<string, Partial<ComponentFileManifest>> = {
    loading: {
        directives: ['loading.ts'],
    },
};

/**
 * 把 MANIFEST_OVERRIDES 合并进扫描结果（按组件名追加字段）。
 * 与清单同源导出，避免各消费方自行实现导致覆盖逻辑漂移。
 */
export function applyManifestOverrides(manifest: Record<string, ComponentFileManifest>): void {
    for (const [name, override] of Object.entries(MANIFEST_OVERRIDES)) {
        if (!manifest[name]) continue;
        if (override.directives) {
            const existing = new Set(manifest[name].directives);
            for (const d of override.directives) existing.add(d);
            manifest[name].directives = Array.from(existing).sort();
        }
    }
}
