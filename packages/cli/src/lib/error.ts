export type CliErrorCode =
    | 'UNKNOWN'
    | 'CONFIG_NOT_FOUND'
    | 'CONFIG_INVALID'
    | 'REGISTRY_FETCH_FAILED'
    | 'COMPONENT_NOT_FOUND'
    | 'INVALID_COMPONENT_NAME'
    | 'REGISTRY_INTEGRITY_FAILED'
    | 'REGISTRY_VERSION_UNSUPPORTED'
    | 'REGISTRY_OFFLINE_UNAVAILABLE'
    | 'REGISTRY_SIGNATURE_INVALID'
    | 'PATH_UNSAFE'
    | 'PATH_UNSAFE_AFTER_WRITE'
    | 'MANIFEST_READ_FAILED'
    | 'WRITE_FAILED'
    | 'INVALID_REGISTRY';

// 运行时校验的数据源。satisfies 保证每一项都落在 CliErrorCode 联合类型内，
// 新增错误码必须同时加进联合类型，否则编译期即报错，杜绝两者漂移
const VALID_ERROR_CODES = [
    'UNKNOWN',
    'CONFIG_NOT_FOUND',
    'CONFIG_INVALID',
    'REGISTRY_FETCH_FAILED',
    'COMPONENT_NOT_FOUND',
    'INVALID_COMPONENT_NAME',
    'REGISTRY_INTEGRITY_FAILED',
    'REGISTRY_VERSION_UNSUPPORTED',
    'REGISTRY_OFFLINE_UNAVAILABLE',
    'REGISTRY_SIGNATURE_INVALID',
    'PATH_UNSAFE',
    'PATH_UNSAFE_AFTER_WRITE',
    'MANIFEST_READ_FAILED',
    'WRITE_FAILED',
    'INVALID_REGISTRY',
] as const satisfies readonly CliErrorCode[];

export interface CliErrorOptions {
    code?: CliErrorCode;
    exitCode?: number;
    cause?: unknown;
}

/**
 * CLI 业务错误。
 *
 * @param options.code 错误码；未提供或运行时非法（经类型断言传入任意值）时回退 'UNKNOWN'。
 *                     业务错误应尽量显式传入 code，否则排障时只能看到 UNKNOWN + exitCode 1。
 * @param options.exitCode 进程退出码；未提供或非法（非 0-255 整数）时回退 1，
 *                         避免 process.exit 收到超范围值抛 ERR_OUT_OF_RANGE 掩盖原始错误。
 * @param options.cause 原始错误（错误链）。
 */
export class CliError extends Error {
    public readonly code: CliErrorCode;
    public readonly exitCode: number;

    constructor(message: string, options: CliErrorOptions | number = {}) {
        const normalizedOptions = typeof options === 'number'
            ? { exitCode: options }
            : options;

        // 不用 super(message, { cause }): 旧版 Node（<16.9）会静默忽略 Error 构造器第二参数，
        // 手动挂载 cause，保证错误链在任意受支持版本上都保留
        super(message);
        if (normalizedOptions.cause !== undefined) {
            (this as Error & { cause?: unknown }).cause = normalizedOptions.cause;
        }

        this.name = 'CliError';
        this.code = typeof normalizedOptions.code === 'string'
            && VALID_ERROR_CODES.includes(normalizedOptions.code as CliErrorCode)
            ? normalizedOptions.code
            : 'UNKNOWN';
        const exitCode = normalizedOptions.exitCode ?? 1;
        this.exitCode = Number.isInteger(exitCode) && exitCode >= 0 && exitCode <= 255 ? exitCode : 1;
    }
}
