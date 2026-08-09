import crypto from 'node:crypto';
import { CATEGORIES, type ComponentCategory } from './types.js';

export const REGISTRY_ITEM_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json';

export const REGISTRY_FILE_TYPES = [
    'registry:ui',
    'registry:hook',
    'registry:lib',
    'registry:directive',
] as const;

export type RegistryFileType = typeof REGISTRY_FILE_TYPES[number];

export interface RegistryFile {
    path: string;
    content: string;
    type: RegistryFileType;
}

export interface RegistryIndexFile {
    path: string;
    type: RegistryFileType;
}

export interface RegistryItem {
    $schema?: string;
    name: string;
    type: RegistryFileType;
    title: string;
    description: string;
    category?: ComponentCategory;
    examples?: string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
    dependencies: string[];
    registryDependencies: string[];
    files: RegistryFile[];
    tailwind: Record<string, unknown>;
    cssVars: Record<string, unknown>;
    integrity: string;
}

export interface RegistryIndexItem {
    name: string;
    type: RegistryFileType;
    title: string;
    description: string;
    category?: ComponentCategory;
    examples?: string[];
    status?: 'stable' | 'legacy' | 'deprecated';
    replacement?: string;
    dependencies: string[];
    registryDependencies: string[];
    files: RegistryIndexFile[];
    tailwind: Record<string, unknown>;
    cssVars: Record<string, unknown>;
    integrity: string;
}

export interface RegistryIndex {
    $schema?: string;
    name: string;
    homepage: string;
    schemaVersion: number;
    registryVersion: string;
    items: RegistryIndexItem[];
}

export interface ValidateRegistryItemOptions {
    name?: string;
    requireSchema?: boolean;
}

/**
 * integrity 与实际 files 内容不匹配时抛出的可辨识错误（区别于其它结构校验错误）。
 * 消费方（如 CLI 验签链路）可据此将错误归类为完整性校验失败而不是普通数据错误。
 */
export class RegistryIntegrityMismatchError extends Error {
    constructor(context: string) {
        super(`Invalid registry data for "${context}": integrity does not match file contents.`);
        this.name = 'RegistryIntegrityMismatchError';
    }
}

/**
 * 计算 registry item 的完整性哈希。
 *
 * 覆盖每个文件的 path/type/content 全部字段（防止互换同一 item 内不同 path 的文件内容而不被发现），
 * 并先序列化再排序，使结果与 files 数组顺序无关（files 顺序本身无语义，重排不应触发误报）。
 *
 * 注意：CLI 侧对已安装文件的漂移检测哈希（computeInstalledContentHash）是与本函数
 * 相互独立的契约（只覆盖 content），改动本算法不会影响已安装项目的 manifest。
 */
export function computeRegistryIntegrity(files: Array<Pick<RegistryFile, 'path' | 'type' | 'content'>>): string {
    const serialized = files
        .map(file => JSON.stringify([file.path, file.type, file.content]))
        .sort()
        .join('\n');
    return 'sha256-' + crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * registry-manifest.json 自身完整性哈希的规范化输入（与 build 侧、CLI 验签侧共享）。
 * 见 computeRegistryManifestIntegrity 的说明。
 */
export interface RegistryManifestIntegrityInput {
    name: string;
    schemaVersion: number;
    registryVersion: string;
    items: Record<string, unknown>;
}

/**
 * 计算 registry-manifest 自身完整性哈希（基础设施闭环 P1 安全契约）。
 *
 * 规范化契约（CLI 验签侧与 build 侧共用同一实现，严禁单独修改其一）：
 *   1. items 按 name 字典序排序（Object.entries 再 sort，与字段写入顺序无关）
 *   2. 规范化 JSON 仅含 name / schemaVersion / registryVersion / items 四个字段，顺序固定
 *   3. 排除 buildTimestamp / gitCommit / integrity / signature / keyId 自身（两次 build 间会变）
 *
 * 返回 sha256 hex（不含 "sha256-" 前缀）。
 */
export function computeRegistryManifestIntegrity(manifest: RegistryManifestIntegrityInput): string {
    const sortedItems = Object.entries(manifest.items)
        .sort(([a], [b]) => a.localeCompare(b));
    const canonical = JSON.stringify({
        name: manifest.name,
        schemaVersion: manifest.schemaVersion,
        registryVersion: manifest.registryVersion,
        items: sortedItems,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function validateRegistryIntegrity(item: RegistryItem, context = item.name): void {
    const expected = computeRegistryIntegrity(item.files);

    if (item.integrity !== expected) {
        throw new Error(`Invalid registry data for "${context}": integrity mismatch. Expected ${expected}, got ${item.integrity}.`);
    }
}

export function validateRegistryItem(
    data: unknown,
    options: ValidateRegistryItemOptions = {}
): asserts data is RegistryItem {
    const context = options.name ?? 'unknown';

    if (!isRecord(data)) {
        throw new Error(`Invalid registry data for "${context}": expected an object.`);
    }

    if (options.requireSchema && data.$schema !== REGISTRY_ITEM_SCHEMA_URL) {
        throw new Error(`Invalid registry data for "${context}": missing or invalid $schema.`);
    }

    assertNonEmptyString(data.name, `"name"`, context);
    assertRegistryType(data.type, `"type"`, context);
    assertNonEmptyString(data.title, `"title"`, context);
    assertNonEmptyString(data.description, `"description"`, context);
    assertCategory(data.category, context);
    assertOptionalStringArray(data.examples, `"examples"`, context);
    assertStatus(data.status, context);
    assertOptionalNonEmptyString(data.replacement, `"replacement"`, context);
    assertLifecycleReplacement(data.status, data.replacement, context);
    assertStringArray(data.dependencies, `"dependencies"`, context);
    assertStringArray(data.registryDependencies, `"registryDependencies"`, context);
    assertObject(data.tailwind, `"tailwind"`, context);
    assertObject(data.cssVars, `"cssVars"`, context);
    assertIntegrity(data.integrity, context);

    if (!Array.isArray(data.files)) {
        throw new Error(`Invalid registry data for "${context}": "files" must be an array.`);
    }

    if (data.files.length === 0) {
        throw new Error(`Invalid registry data for "${context}": "files" must not be empty.`);
    }

    // 逐文件校验并收集（断言函数逐个收窄元素类型），同时拦截重复 path——
    // 同一 item 出现相同 path 时下游安装会互相覆盖，且哈希无法暴露该问题
    const files: RegistryFile[] = [];
    const seenPaths = new Set<string>();
    for (const file of data.files) {
        validateRegistryFile(file, context);
        if (seenPaths.has(file.path)) {
            throw new Error(`Invalid registry data for "${context}": duplicate file path "${file.path}".`);
        }
        seenPaths.add(file.path);
        files.push(file);
    }

    // 完整性自洽：integrity 必须与实际 files 内容匹配，防止调用方只做结构校验
    // 而跳过内容校验（validateRegistryIntegrity）时被篡改数据通过
    if (data.integrity !== computeRegistryIntegrity(files)) {
        throw new RegistryIntegrityMismatchError(context);
    }
}

export function validateRegistryIndex(data: unknown): asserts data is RegistryIndex {
    if (!isRecord(data)) {
        throw new Error('Invalid registry index: expected an object.');
    }

    if (data.$schema !== undefined && typeof data.$schema !== 'string') {
        throw new Error('Invalid registry index: "$schema" must be a string.');
    }

    assertNonEmptyString(data.name, `"name"`, 'index');
    assertNonEmptyString(data.homepage, `"homepage"`, 'index');

    if (typeof data.schemaVersion !== 'number' || !Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
        throw new Error('Invalid registry index: "schemaVersion" must be a positive integer.');
    }

    assertNonEmptyString(data.registryVersion, `"registryVersion"`, 'index');

    if (!Array.isArray(data.items)) {
        throw new Error('Invalid registry index: "items" must be an array.');
    }

    const seenNames = new Set<string>();
    for (const item of data.items) {
        // validateRegistryIndexItem 断言已把 item 收窄为 RegistryIndexItem（name 必为 string），
        // 无需再做冗余的 typeof 判空
        validateRegistryIndexItem(item);
        if (seenNames.has(item.name)) {
            throw new Error(`Invalid registry index: duplicate item name "${item.name}".`);
        }
        seenNames.add(item.name);
    }
}

function validateRegistryFile(file: unknown, context: string): asserts file is RegistryFile {
    if (!isRecord(file)) {
        throw new Error(`Invalid registry file in "${context}": expected an object.`);
    }

    assertSafeRegistryPath(file.path, `"path"`, context, 'Invalid registry file');
    assertNonEmptyString(file.content, `"content"`, context, 'Invalid registry file');
    assertRegistryType(file.type, `"type"`, context, 'Invalid registry file');
}

function validateRegistryIndexItem(data: unknown): asserts data is RegistryIndexItem {
    if (!isRecord(data)) {
        throw new Error('Invalid registry index item: expected an object.');
    }

    const context = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'index item';

    assertNonEmptyString(data.name, `"name"`, context, 'Invalid registry index item');
    assertRegistryType(data.type, `"type"`, context, 'Invalid registry index item');
    assertNonEmptyString(data.title, `"title"`, context, 'Invalid registry index item');
    assertNonEmptyString(data.description, `"description"`, context, 'Invalid registry index item');
    assertCategory(data.category, context, 'Invalid registry index item');
    assertOptionalStringArray(data.examples, `"examples"`, context, 'Invalid registry index item');
    assertStatus(data.status, context, 'Invalid registry index item');
    assertOptionalNonEmptyString(data.replacement, `"replacement"`, context, 'Invalid registry index item');
    assertLifecycleReplacement(data.status, data.replacement, context, 'Invalid registry index item');
    assertStringArray(data.dependencies, `"dependencies"`, context, 'Invalid registry index item');
    assertStringArray(data.registryDependencies, `"registryDependencies"`, context, 'Invalid registry index item');
    assertObject(data.tailwind, `"tailwind"`, context, 'Invalid registry index item');
    assertObject(data.cssVars, `"cssVars"`, context, 'Invalid registry index item');
    assertIntegrity(data.integrity, context, 'Invalid registry index item');

    if (!Array.isArray(data.files)) {
        throw new Error(`Invalid registry index item for "${context}": "files" must be an array.`);
    }

    for (const file of data.files) {
        validateRegistryIndexFile(file, context);
    }
}

function validateRegistryIndexFile(file: unknown, context: string): asserts file is RegistryIndexFile {
    if (!isRecord(file)) {
        throw new Error(`Invalid registry index file in "${context}": expected an object.`);
    }

    assertSafeRegistryPath(file.path, `"path"`, context, 'Invalid registry index file');
    assertRegistryType(file.type, `"type"`, context, 'Invalid registry index file');
}

function assertNonEmptyString(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${prefix} for "${context}": ${field} must be a non-empty string.`);
    }
}

function assertSafeRegistryPath(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string {
    assertNonEmptyString(value, field, context, prefix);
    // 拒绝绝对路径与穿越路径（registry 文件最终会写入磁盘，恶意 path 可在安装侧造成路径穿越）。
    // 与安装侧解析语义对齐：同时按 / 与 \ 归一化分段（Windows 下 path.join 会接受 \ 分隔符），
    // 并显式拒绝 "." 段——"./foo" 与 "foo" 归一化后指向同一文件，允许其一即可绕过重复 path
    // 检测且产生不同哈希；盘符前缀（C:\evil）与 UNC 起始（\\server）同样拒绝
    const segments = value.split(/[\\/]/);
    if (value.startsWith('/') || value.startsWith('\\') || /^[a-zA-Z]:[\\/]/.test(value) || segments.includes('..') || segments.includes('.')) {
        throw new Error(`${prefix} for "${context}": ${field} must be a normalized relative path (no leading "/", no ".." or "." segments, no drive letters).`);
    }
}

function assertOptionalNonEmptyString(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string | undefined {
    if (value !== undefined && (typeof value !== 'string' || value.length === 0)) {
        throw new Error(`${prefix} for "${context}": ${field} must be a non-empty string when provided.`);
    }
}

function assertStatus(
    value: unknown,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is 'stable' | 'legacy' | 'deprecated' | undefined {
    if (value !== undefined && value !== 'stable' && value !== 'legacy' && value !== 'deprecated') {
        throw new Error(`${prefix} for "${context}": "status" must be one of: stable, legacy, deprecated.`);
    }
}

function assertCategory(
    value: unknown,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is ComponentCategory | undefined {
    // 类别数组由 types.ts 的 CATEGORIES 单一来源派生，避免与类型联合重复维护而漂移
    if (value !== undefined && (typeof value !== 'string' || !CATEGORIES.includes(value as ComponentCategory))) {
        throw new Error(`${prefix} for "${context}": "category" must be one of: ${CATEGORIES.join(', ')}.`);
    }
}

function assertLifecycleReplacement(
    status: 'stable' | 'legacy' | 'deprecated' | undefined,
    replacement: string | undefined,
    context: string,
    prefix = 'Invalid registry data'
): void {
    if ((status === 'legacy' || status === 'deprecated') && !replacement) {
        throw new Error(`${prefix} for "${context}": "replacement" is required when "status" is ${status}.`);
    }
}

function assertStringArray(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string[] {
    if (!Array.isArray(value)) {
        throw new Error(`${prefix} for "${context}": ${field} must be an array.`);
    }

    for (const entry of value) {
        if (typeof entry !== 'string' || entry.length === 0) {
            throw new Error(`${prefix} for "${context}": ${field} must contain only non-empty strings.`);
        }
    }
}

function assertOptionalStringArray(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string[] | undefined {
    if (value === undefined) {
        return;
    }

    assertStringArray(value, field, context, prefix);
}

function assertObject(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is Record<string, unknown> {
    if (!isRecord(value)) {
        throw new Error(`${prefix} for "${context}": ${field} must be an object.`);
    }
}

function assertRegistryType(
    value: unknown,
    field: string,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is RegistryFileType {
    if (typeof value !== 'string' || !REGISTRY_FILE_TYPES.includes(value as RegistryFileType)) {
        throw new Error(`${prefix} for "${context}": ${field} must be one of: ${REGISTRY_FILE_TYPES.join(', ')}.`);
    }
}

function assertIntegrity(
    value: unknown,
    context: string,
    prefix = 'Invalid registry data'
): asserts value is string {
    if (typeof value !== 'string' || !/^sha256-[a-f0-9]{64}$/.test(value)) {
        throw new Error(`${prefix} for "${context}": "integrity" must be a sha256 hash (format: sha256-<64 hex chars>).`);
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
