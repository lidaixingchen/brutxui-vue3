export type CliErrorCode =
    | 'UNKNOWN'
    | 'CONFIG_NOT_FOUND'
    | 'CONFIG_INVALID'
    | 'REGISTRY_FETCH_FAILED'
    | 'REGISTRY_INTEGRITY_FAILED'
    | 'REGISTRY_VERSION_UNSUPPORTED'
    | 'PATH_UNSAFE'
    | 'WRITE_FAILED';

export interface CliErrorOptions {
    code?: CliErrorCode;
    exitCode?: number;
    cause?: unknown;
}

export class CliError extends Error {
    public readonly code: CliErrorCode;
    public readonly exitCode: number;

    constructor(message: string, options: CliErrorOptions | number = {}) {
        const normalizedOptions = typeof options === 'number'
            ? { exitCode: options }
            : options;

        super(message, { cause: normalizedOptions.cause });
        this.name = 'CliError';
        this.code = normalizedOptions.code ?? 'UNKNOWN';
        this.exitCode = normalizedOptions.exitCode ?? 1;
    }
}
