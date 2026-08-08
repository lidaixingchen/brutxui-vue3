import { spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';

export interface RunProcessOptions {
    cwd?: string;
    /** 子进程 stdio 策略：'inherit' 直接透传；'pipe' 时通过 onStdout/onStderr 转发（stdin 仍继承） */
    stdio?: 'inherit' | 'pipe';
    onStdout?: (line: string) => void;
    onStderr?: (line: string) => void;
}

interface LineEmitter {
    (chunk: Buffer): void;
    /** 流结束时补发末尾无换行的残行 */
    flush(): void;
}

/**
 * 将流式 chunk 按换行符拆成完整行逐个回调；最后一个不完整行暂存，
 * 由 flush 在流结束时调用以输出结尾无换行的残行。
 *
 * 已知限制：以 \r 结尾的进度类输出（长时间无换行）会一直暂存到换行/close 才回调；
 * 当前 pipe 调用方（包管理器安装）在非 TTY 下无此类输出，如需支持可对 \r 结尾行即时回调。
 */
function makeLineEmitter(onLine?: (line: string) => void): LineEmitter {
    // StringDecoder 保持跨 chunk 解码状态：多字节字符（如中文路径/日志）拆到
    // 相邻 chunk 边界时，先到的半截字节不会变成 U+FFFD 替换符
    const decoder = new StringDecoder('utf8');
    let pending = '';
    const emit = (line: string): void => {
        if (onLine) onLine(line.trimEnd());
    };
    const emitter = ((chunk: Buffer): void => {
        pending += decoder.write(chunk);
        let idx: number;
        while ((idx = pending.indexOf('\n')) !== -1) {
            emit(pending.slice(0, idx));
            pending = pending.slice(idx + 1);
        }
    }) as LineEmitter;
    emitter.flush = (): void => {
        pending += decoder.end();
        if (pending.length > 0) {
            emit(pending);
            pending = '';
        }
    };
    return emitter;
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

        // 按行缓冲后回调：chunk 边界不一定在行尾，逐块 trimEnd 会在长行被截断时
        // 误删行内空白，且每次 chunk 都追加换行会打散原本多行的输出
        let stdoutEmitter: LineEmitter | undefined;
        let stderrEmitter: LineEmitter | undefined;
        if (stdio === 'pipe') {
            stdoutEmitter = makeLineEmitter(onStdout);
            stderrEmitter = makeLineEmitter(onStderr);
            child.stdout?.on('data', stdoutEmitter);
            child.stderr?.on('data', stderrEmitter);
        }

        // error 与 close 可能先后触发（spawn 启动失败时 close 随后到达），settled 保证只结算一次，
        // 且优先保留 error 分支的底层错误（如 spawn ENOENT），避免被 close 的 "exited with code null" 覆盖
        let settled = false;
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
            if (settled) return;
            settled = true;
            reject(err);
        });

        child.on('close', (code, signal) => {
            process.removeListener('SIGINT', onSigint);
            if (forceKillTimer) clearTimeout(forceKillTimer);
            // 输出末尾无换行的残行在流结束时补发
            stdoutEmitter?.flush();
            stderrEmitter?.flush();
            if (interrupted) {
                // 用户中断：promise 不 settle，退出码已置 130，事件循环清空后自然退出。
                // 兜底：若存在残留句柄（其他模块的 keep-alive 等）阻止自然退出，3s 后强制退出。
                forceExitTimer = setTimeout(() => process.exit(130), 3000);
                forceExitTimer.unref?.();
                return;
            }
            if (settled) return;
            settled = true;
            if (signal === 'SIGINT') {
                reject(new Error('Process interrupted by user'));
                return;
            }
            if (signal !== null) {
                // 被非 SIGINT 信号终止时 code 为 null，输出 "exited with code null" 是误导信息
                reject(new Error(`${command} terminated by signal ${signal}`));
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
