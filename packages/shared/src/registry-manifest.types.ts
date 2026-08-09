import type { ComponentMetadataEntry } from './component-metadata.js';

export interface ComponentFileManifest {
    files: string[];
    composables: string[];
    directives: string[];
    lib: string[];
}

export interface MergedRegistryEntry extends ComponentMetadataEntry, ComponentFileManifest {}

/**
 * 键即组件名：与 COMPONENT_METADATA 的键一一对应（由 prebuild:scan 生成）。
 * 类型上保留宽松字符串键，但消费方访问前必须做空值检查——
 * 拼写错误/未知键会静默得到 undefined（见 build-registry.ts loadMergedRegistry 的显式校验）。
 */
export type RegistryManifest = Record<string, ComponentFileManifest>;
