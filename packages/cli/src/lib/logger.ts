import chalk from 'chalk';

export interface LoggerOptions {
    silent?: boolean;
    debug?: boolean;
    verboseLevel?: number;
}

/**
 * Verbose 等级（P1-8）：
 * - 0: 默认，不输出 verbose 信息
 * - 1: 步骤级（-v），如"正在解析依赖"
 * - 2: 缓存/网络细节（-vv），如"缓存命中 button@v1"
 * - 3: 堆栈/调试细节（-vvv）
 */
export const VERBOSE_LEVEL_NONE = 0;
export const VERBOSE_LEVEL_STEP = 1;
export const VERBOSE_LEVEL_DETAIL = 2;
export const VERBOSE_LEVEL_TRACE = 3;
const VERBOSE_LEVEL_MAX = VERBOSE_LEVEL_TRACE;

const VERBOSE_ENV = 'BRUTX_VERBOSE';

function resolveVerboseLevel(initial?: number): number {
    if (typeof initial === 'number') {
        return clampVerboseLevel(initial);
    }
    const fromEnv = process.env[VERBOSE_ENV];
    if (fromEnv !== undefined) {
        const parsed = Number.parseInt(fromEnv, 10);
        if (!Number.isNaN(parsed)) {
            return clampVerboseLevel(parsed);
        }
    }
    return VERBOSE_LEVEL_NONE;
}

function clampVerboseLevel(level: number): number {
    if (Number.isNaN(level)) return VERBOSE_LEVEL_NONE;
    if (level < VERBOSE_LEVEL_NONE) return VERBOSE_LEVEL_NONE;
    if (level > VERBOSE_LEVEL_MAX) return VERBOSE_LEVEL_MAX;
    return level;
}

/**
 * DEBUG 环境变量按真值解析：'0'/'false' 视为未启用，
 * 避免 CI 或生产环境误配为这些值后意外打印调试日志。
 */
function isDebugEnvActive(): boolean {
    const value = process.env.DEBUG;
    if (value === undefined) return false;
    return value !== '0' && value.toLowerCase() !== 'false';
}

function verbosePrefix(level: number): string {
    if (level >= VERBOSE_LEVEL_TRACE) return '[TRACE]';
    if (level >= VERBOSE_LEVEL_DETAIL) return '[DETAIL]';
    return '[STEP]';
}

export class Logger {
    private silent: boolean;
    private debugEnabled: boolean;
    private verboseLevel: number;

    constructor(options: LoggerOptions = {}) {
        this.silent = options.silent ?? false;
        this.debugEnabled = options.debug ?? false;
        this.verboseLevel = resolveVerboseLevel(options.verboseLevel);
    }

    setSilent(silent: boolean): void {
        this.silent = silent;
    }

    setDebug(debug: boolean): void {
        this.debugEnabled = debug;
    }

    setVerboseLevel(level: number): void {
        this.verboseLevel = clampVerboseLevel(level);
    }

    getVerboseLevel(): number {
        return this.verboseLevel;
    }

    log(message: string): void {
        if (!this.silent) {
            console.log(message);
        }
    }

    info(message: string): void {
        this.log(chalk.gray(message));
    }

    success(message: string): void {
        this.log(chalk.green(message));
    }

    warn(message: string): void {
        if (!this.silent) {
            console.warn(chalk.yellow(message));
        }
    }

    error(message: string): void {
        // 错误始终输出到 stderr，不受 silent 影响——否则 CI/排障场景下关键失败信息会被静默吞掉
        console.error(chalk.red(message));
    }

    bold(message: string): void {
        this.log(chalk.bold(message));
    }

    highlight(message: string): void {
        this.log(chalk.cyan(message));
    }

    dim(message: string): void {
        this.log(chalk.dim(message));
    }

    debug(message: string): void {
        if (this.debugEnabled || isDebugEnvActive()) {
            this.log(chalk.gray(`[DEBUG] ${message}`));
        }
    }

    /**
     * 按等级输出 verbose 信息（P1-8）。
     * level=1 步骤（-v），level=2 细节（-vv），level=3 堆栈（-vvv）。
     */
    verbose(level: number, message: string): void {
        // 非法等级（0/负数/NaN）直接拦截，避免 clamp 归零后与默认等级恒等导致无条件输出
        if (level < VERBOSE_LEVEL_STEP || this.verboseLevel < level) {
            return;
        }
        this.log(chalk.gray(`${verbosePrefix(level)} ${message}`));
    }

    newLine(): void {
        this.log('');
    }
}

// 默认实例，保持向后兼容
export const logger = new Logger();
