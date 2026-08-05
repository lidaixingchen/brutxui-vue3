import { spawn } from 'child_process';

export interface RunProcessOptions {
    cwd?: string;
    /** 子进程 stdio 策略：'inherit' 直接透传；'pipe' 时通过 onStdout/onStderr 转发（stdin 仍继承） */
    stdio?: 'inherit' | 'pipe';
    onStdout?: (line: string) => void;
    onStderr?: (line: string) => void;
}

/**
 * 运行子进程并返回 Promise。
 *
 * SIGINT 处理（create.ts 与 package-manager.ts 共享，避免两处行为漂移）：
 *   - 收到 SIGINT 时转发给子进程并置 process.exitCode = 130，不立即退出——
 *     等待子进程 close 后随事件循环自然退出，避免父进程先行退出导致子进程被遗弃/输出被截断。
 *   - 第二次 Ctrl+C 强制 process.exit(130)。
 *   - 子进程忽略 SIGINT 时 5s 后 SIGKILL 兜底；close 后若有残留句柄阻止自然退出，3s 后强制退出。
 *   - 中断后 promise 不 settle（调用方 await 挂起），阻止中断后继续执行后续流程。
 */
export function runProcess(command: string, args: string[], options: RunProcessOptions = {}): Promise<void> {
    const isWindows = process.platform === 'win32';
    const { cwd, stdio = 'inherit', onStdout, onStderr } = options;

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: isWindows,
            env: process.env,
            stdio: stdio === 'pipe' ? ['inherit', 'pipe', 'pipe'] : 'inherit',
        });

        if (stdio === 'pipe') {
            child.stdout?.on('data', (data) => onStdout?.(data.toString().trimEnd()));
            child.stderr?.on('data', (data) => onStderr?.(data.toString().trimEnd()));
        }

        let interrupted = false;
        let forceKillTimer: ReturnType<typeof setTimeout> | undefined;
        let forceExitTimer: ReturnType<typeof setTimeout> | undefined;

        const onSigint = () => {
            if (interrupted) {
                process.exit(130);
                return;
            }
            interrupted = true;
            process.exitCode = 130;
            try {
                child.kill('SIGINT');
            } catch { /* 子进程可能已随终端信号退出 */ }
            // 子进程忽略 SIGINT 时 5s 后强制终止，防止父进程挂起
            forceKillTimer = setTimeout(() => {
                try { child.kill('SIGKILL'); } catch { /* ignore */ }
            }, 5000);
            forceKillTimer.unref?.();
        };
        process.on('SIGINT', onSigint);

        child.on('error', (err) => {
            process.removeListener('SIGINT', onSigint);
            if (forceKillTimer) clearTimeout(forceKillTimer);
            // 与 close 处理器一致：已中断时不再 reject，保持 130 自然退出的设计
            if (interrupted) return;
            reject(err);
        });

        child.on('close', (code, signal) => {
            process.removeListener('SIGINT', onSigint);
            if (forceKillTimer) clearTimeout(forceKillTimer);
            if (interrupted) {
                // 用户中断：promise 不 settle，退出码已置 130，事件循环清空后自然退出。
                // 兜底：若存在残留句柄（其他模块的 keep-alive 等）阻止自然退出，3s 后强制退出。
                forceExitTimer = setTimeout(() => process.exit(130), 3000);
                forceExitTimer.unref?.();
                return;
            }
            if (signal === 'SIGINT') {
                reject(new Error('Process interrupted by user'));
                return;
            }
            if (code !== 0) {
                reject(new Error(`${command} exited with code ${code}`));
                return;
            }
            resolve();
        });
    });
}
