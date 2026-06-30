import chalk from 'chalk';

export interface LoggerOptions {
    silent?: boolean;
    debug?: boolean;
}

export class Logger {
    private silent: boolean;
    private debugEnabled: boolean;

    constructor(options: LoggerOptions = {}) {
        this.silent = options.silent ?? false;
        this.debugEnabled = options.debug ?? false;
    }

    setSilent(silent: boolean): void {
        this.silent = silent;
    }

    setDebug(debug: boolean): void {
        this.debugEnabled = debug;
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
        if (!this.silent) {
            console.error(chalk.red(message));
        }
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
        if (this.debugEnabled || process.env.DEBUG) {
            this.log(chalk.gray(`[DEBUG] ${message}`));
        }
    }

    newLine(): void {
        this.log('');
    }
}

// 默认实例，保持向后兼容
export const logger = new Logger();
