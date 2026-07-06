import crypto from 'node:crypto';

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
    items: RegistryIndexItem[];
}

export interface ValidateRegistryItemOptions {
    name?: string;
    requireSchema?: boolean;
}

export function computeRegistryIntegrity(files: Array<Pick<RegistryFile, 'content'>>): string {
    const allContent = files.map(file => file.content).join('\0');
    return 'sha256-' + crypto.createHash('sha256').update(allContent).digest('hex');
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

    if (options.requireSchema && data.$schema !== 'https://ui.shadcn.com/schema/registry-item.json') {
        throw new Error(`Invalid registry data for "${context}": missing or invalid $schema.`);
    }

    assertNonEmptyString(data.name, `"name"`, context);
    assertRegistryType(data.type, `"type"`, context);
    assertNonEmptyString(data.title, `"title"`, context);
    assertNonEmptyString(data.description, `"description"`, context);
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

    for (const file of data.files) {
        validateRegistryFile(file, context);
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

    if (!Array.isArray(data.items)) {
        throw new Error('Invalid registry index: "items" must be an array.');
    }

    for (const item of data.items) {
        validateRegistryIndexItem(item);
    }
}

function validateRegistryFile(file: unknown, context: string): asserts file is RegistryFile {
    if (!isRecord(file)) {
        throw new Error(`Invalid registry file in "${context}": expected an object.`);
    }

    assertNonEmptyString(file.path, `"path"`, context, 'Invalid registry file');
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

    assertNonEmptyString(file.path, `"path"`, context, 'Invalid registry index file');
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
    if (typeof value !== 'string' || !value.startsWith('sha256-')) {
        throw new Error(`${prefix} for "${context}": "integrity" must be a sha256 hash.`);
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
