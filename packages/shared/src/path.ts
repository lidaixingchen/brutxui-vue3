import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 路径输入分类
 */
export type PathCategory =
    | 'empty'
    | 'url'
    | 'unc'
    | 'device'
    | 'win32-drive-relative'
    | 'win32-root-relative'
    | 'win32-drive-absolute'
    | 'posix-absolute'
    | 'portable-relative';

export interface PathCategoryOptions {
    readonly platform?: NodeJS.Platform;
}

export interface FormatPosixPathOptions {
    readonly hostSepOnly?: boolean;
}

export interface IsInsideDirOptions {
    readonly pathImpl?: typeof path;
}

export interface ResolvePortablePathOptions {
    readonly platform?: NodeJS.Platform;
    readonly pathImpl?: typeof path;
    readonly allowAbsolute?: boolean;
    readonly checkInsideBase?: boolean;
}

/**
 * 对输入路径进行类别识别，区分可移植相对路径、各类绝对路径及异系统/特殊格式
 */
export function categorizePathInput(input: string, options: PathCategoryOptions = {}): PathCategory {
    if (typeof input !== 'string' || !input.trim()) {
        return 'empty';
    }

    const raw: string = input.trim();

    // 1. URL 协议（file://, http://, https://, data:, javascript: 等）
    if (/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/|file:|[a-zA-Z][a-zA-Z0-9+.-]+:)/i.test(raw)) {
        return 'url';
    }

    // 2. Windows 设备 / 扩展长度路径前缀（\\?\, //?\, \\.\, //./, \??\）
    if (/^[/\\]{2}(\?|\.)[/\\]/.test(raw) || /^[/\\]\?\?[/\\]/.test(raw)) {
        return 'device';
    }

    // 3. UNC 路径（\\host\share 或 //host/share）
    if (/^[/\\]{2}/.test(raw)) {
        return 'unc';
    }

    const platform: NodeJS.Platform = options.platform ?? process.platform;

    // 4. Windows 驱动器路径（C:relative 或 C:\absolute 或 C:/absolute）
    const driveMatch: RegExpMatchArray | null = raw.match(/^([a-zA-Z]):(.*)$/);
    if (driveMatch) {
        const rest: string = driveMatch[2];
        if (!rest.startsWith('/') && !rest.startsWith('\\')) {
            return 'win32-drive-relative';
        }
        return 'win32-drive-absolute';
    }

    // 5. 跨平台统一拦截根相对路径与异系统路径（防止 Linux 下 \foo 逃逸）
    if (/^[/\\]/.test(raw)) {
        if (platform === 'win32') {
            return 'win32-root-relative';
        }
        if (raw.startsWith('/')) {
            return 'posix-absolute';
        }
        return 'win32-root-relative';
    }

    // 6. 可移植相对路径
    return 'portable-relative';
}

/**
 * 将任意路径转换为标准 Posix 斜杠格式（无差别替换反斜杠）
 */
export function toPosixPath(p: string): string {
    return p.replace(/\\/g, '/');
}

/**
 * 格式化路径为 Posix 斜杠形式
 * @param hostSepOnly 若为 true，仅替换宿主目录分隔符（保留 POSIX 下合法文件名中的反斜杠）；若为 false，无差别替换
 */
export function formatPosixPath(p: string, options?: FormatPosixPathOptions): string {
    if (options?.hostSepOnly) {
        return p.split(path.sep).join('/');
    }
    return p.replace(/\\/g, '/');
}

/**
 * 解析声明接受可移植输入的路径
 * 严格按照规范：类别识别 → 分隔符归一化 → 按基准目录解析 → 边界校验
 */
export function resolvePortablePath(
    baseDir: string,
    input: string,
    options: ResolvePortablePathOptions = {}
): string {
    const platform: NodeJS.Platform = options.platform ?? process.platform;
    const pathImpl: typeof path = options.pathImpl ?? path;
    const category: PathCategory = categorizePathInput(input, { platform });

    switch (category) {
        case 'empty':
            throw new Error('路径参数不能为空');
        case 'url':
            throw new Error(`不支持 URL 格式路径: ${input}`);
        case 'unc':
            throw new Error(`不支持 UNC 路径: ${input}`);
        case 'device':
            throw new Error(`不支持设备或扩展长度路径: ${input}`);
        case 'win32-drive-relative':
            throw new Error(`不支持 Windows 驱动器相对路径: ${input}`);
        case 'win32-root-relative':
            throw new Error(`不支持隐式当前驱动器的根相对路径: ${input}`);
        case 'win32-drive-absolute':
            if (platform !== 'win32') {
                throw new Error(`不支持跨操作系统绝对路径: ${input}`);
            }
            if (!options.allowAbsolute) {
                throw new Error(`当前上下文不允许使用绝对路径: ${input}`);
            }
            return validateBoundary(baseDir, pathImpl.resolve(input), options);
        case 'posix-absolute':
            if (platform === 'win32') {
                throw new Error(`不支持跨操作系统绝对路径: ${input}`);
            }
            if (!options.allowAbsolute) {
                throw new Error(`当前上下文不允许使用绝对路径: ${input}`);
            }
            return validateBoundary(baseDir, pathImpl.resolve(input), options);
        case 'portable-relative': {
            const normalized: string = toPosixPath(input.trim()).replace(/^\.\//, '');
            const resolved: string = pathImpl.resolve(baseDir, normalized);
            return validateBoundary(baseDir, resolved, options);
        }
    }
}

function validateBoundary(
    baseDir: string,
    resolvedAbs: string,
    options: ResolvePortablePathOptions
): string {
    if (options.checkInsideBase) {
        const pathImpl: typeof path = options.pathImpl ?? path;
        const rel: string = pathImpl.relative(baseDir, resolvedAbs);
        const normalizedRel: string = toPosixPath(rel);
        if (normalizedRel.startsWith('../') || normalizedRel === '..' || pathImpl.isAbsolute(rel)) {
            throw new Error(`路径越界，必须位于基准目录内: ${resolvedAbs}`);
        }
    }
    return resolvedAbs;
}

/**
 * 校验 targetPath 是否处于 parentDir 目录范围内（纯词法检查，杜绝 .. 逃逸）
 */
export function isInsideDir(
    parentDir: string,
    targetPath: string,
    options?: IsInsideDirOptions
): boolean {
    const pathImpl: typeof path = options?.pathImpl ?? path;
    const rel: string = pathImpl.relative(pathImpl.resolve(parentDir), pathImpl.resolve(targetPath));
    const normalizedRel: string = toPosixPath(rel);
    return normalizedRel === '' || (!normalizedRel.startsWith('../') && normalizedRel !== '..' && !pathImpl.isAbsolute(rel));
}

/**
 * 将 file:/// URL 或常规相对/绝对路径解析为操作系统绝对路径
 * 自动剥离 URL 中的 fragment (#) 与 query (?)，防止 fileURLToPath 抛错
 */
export function normalizeAbsPath(targetPathOrUrl: string): string {
    if (typeof targetPathOrUrl === 'string' && targetPathOrUrl.startsWith('file:')) {
        const cleanUrl: string = targetPathOrUrl.split(/[?#]/)[0];
        return path.resolve(fileURLToPath(cleanUrl));
    }
    return path.resolve(targetPathOrUrl);
}
