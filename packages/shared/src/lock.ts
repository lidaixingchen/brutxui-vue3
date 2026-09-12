import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const GENERATE_LOCK_DEFAULT_WAIT_TIMEOUT_MS = 30_000
export const GENERATE_LOCK_DEFAULT_POLL_INTERVAL_MS = 100
export const GENERATE_LOCK_DEFAULT_STALE_AGE_MS = 5_000
const PROCESS_PROBE_SIGNAL = 0
const MIN_WAIT_INTERVAL_MS = 1

export interface GenerateLockOptions {
    packageName: string
    cacheDir?: string
    lockFileName?: string
    waitTimeoutMs?: number
    pollIntervalMs?: number
    staleLockAgeMs?: number
}

export interface GenerateLockResult {
    lockPath: string
    token: string
    release: () => void
}

interface LockObservation {
    raw: string
    pid: number | null
    modifiedAtMs: number
}

interface NormalizedLockOptions extends Required<Pick<GenerateLockOptions, 'packageName' | 'cacheDir' | 'lockFileName'>> {
    waitTimeoutMs: number
    pollIntervalMs: number
    staleLockAgeMs: number
}

function normalizeDuration(value: number | undefined, fallback: number, label: string): number {
    const duration = value ?? fallback
    if (!Number.isFinite(duration) || duration < 0) {
        throw new RangeError(`${label} must be a finite non-negative number`)
    }
    return Math.floor(duration)
}

function normalizeOptions(options: GenerateLockOptions): NormalizedLockOptions {
    const packageName = options.packageName
    const cacheDir = path.resolve(
        options.cacheDir ?? path.resolve(process.cwd(), 'node_modules/.cache'),
    )
    const lockFileName = options.lockFileName ?? `brutx-${packageName.replace(/[^a-zA-Z0-9_-]/g, '_')}-generate.lock`

    return {
        packageName,
        cacheDir,
        lockFileName,
        waitTimeoutMs: normalizeDuration(
            options.waitTimeoutMs,
            GENERATE_LOCK_DEFAULT_WAIT_TIMEOUT_MS,
            'waitTimeoutMs',
        ),
        pollIntervalMs: Math.max(
            MIN_WAIT_INTERVAL_MS,
            normalizeDuration(
                options.pollIntervalMs,
                GENERATE_LOCK_DEFAULT_POLL_INTERVAL_MS,
                'pollIntervalMs',
            ),
        ),
        staleLockAgeMs: normalizeDuration(
            options.staleLockAgeMs,
            GENERATE_LOCK_DEFAULT_STALE_AGE_MS,
            'staleLockAgeMs',
        ),
    }
}

function processIsAlive(pid: number | null): boolean {
    if (pid === null) return false
    try {
        process.kill(pid, PROCESS_PROBE_SIGNAL)
        return true
    } catch (error: unknown) {
        const code = (error as NodeJS.ErrnoException).code
        if (code === 'EPERM') return true
        if (code === 'ESRCH') return false
        return false
    }
}

function readLockObservation(lockPath: string): LockObservation | null {
    let raw: string
    let modifiedAtMs: number
    try {
        raw = fs.readFileSync(lockPath, 'utf-8')
        modifiedAtMs = fs.statSync(lockPath).mtimeMs
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
    }

    let pid: number | null = null
    try {
        const value: unknown = JSON.parse(raw)
        if (
            typeof value === 'object' &&
            value !== null &&
            'pid' in value &&
            typeof value.pid === 'number' &&
            Number.isSafeInteger(value.pid) &&
            value.pid > 0
        ) {
            pid = value.pid
        }
    } catch {
        // An incomplete payload is treated as stale only after its grace period.
    }

    return { raw, pid, modifiedAtMs }
}

function isStaleObservation(observation: LockObservation, staleLockAgeMs: number): boolean {
    if (observation.pid !== null) return !processIsAlive(observation.pid)
    return Date.now() - observation.modifiedAtMs >= staleLockAgeMs
}

function removeIfUnchanged(lockPath: string, expectedRaw: string): boolean {
    try {
        if (fs.readFileSync(lockPath, 'utf-8') !== expectedRaw) return false
        fs.unlinkSync(lockPath)
        return true
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
        throw error
    }
}

function createLock(options: NormalizedLockOptions): GenerateLockResult | null {
    fs.mkdirSync(options.cacheDir, { recursive: true })
    const lockPath = path.join(options.cacheDir, options.lockFileName)
    const token = crypto.randomUUID()
    const lockPayload = JSON.stringify(
        {
            token,
            package: options.packageName,
            pid: process.pid,
            createdAt: new Date().toISOString(),
        },
        null,
        2,
    )

    let fd: number
    try {
        fd = fs.openSync(lockPath, 'wx')
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return null
        throw error
    }

    try {
        fs.writeFileSync(fd, lockPayload, 'utf-8')
    } catch (error) {
        try {
            fs.unlinkSync(lockPath)
        } catch {
            // 保留锁写入错误；清理失败不能覆盖主诊断。
        }
        throw error
    } finally {
        fs.closeSync(fd)
    }

    let released = false
    const release = () => {
        if (released) return
        released = true
        try {
            const current = readLockObservation(lockPath)
            if (!current) return
            let metadata: unknown
            try {
                metadata = JSON.parse(current.raw)
            } catch {
                return
            }
            if (
                typeof metadata === 'object' &&
                metadata !== null &&
                'token' in metadata &&
                metadata.token === token
            ) {
                fs.unlinkSync(lockPath)
            }
        } catch {
            // 释放不能覆盖生成任务的原始结果。
        }
    }

    return { lockPath, token, release }
}

function conflictError(
    options: NormalizedLockOptions,
    observation: LockObservation | null,
): Error {
    const holder = observation?.raw ? `\n锁持有信息: ${observation.raw}\n` : '\n'
    return new Error(
        `[BrutxUI] 生成锁等待超时: 包 ${options.packageName} 的生成锁仍被占用。\n` +
        `锁文件路径: ${path.join(options.cacheDir, options.lockFileName)}\n` +
        holder +
        '活跃锁不会被自动夺取；若确认前次任务已退出，请显式清理锁文件后重试。',
    )
}

function wait(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs))
}

export async function acquireGenerateLock(
    options: GenerateLockOptions,
): Promise<GenerateLockResult> {
    const normalized = normalizeOptions(options)
    const lockPath = path.join(normalized.cacheDir, normalized.lockFileName)
    const startedAtMs = Date.now()

    while (true) {
        const lock = createLock(normalized)
        if (lock) return lock

        const observation = readLockObservation(lockPath)
        if (!observation) continue
        if (isStaleObservation(observation, normalized.staleLockAgeMs)) {
            if (removeIfUnchanged(lockPath, observation.raw)) continue
        }

        const elapsedMs = Date.now() - startedAtMs
        if (elapsedMs >= normalized.waitTimeoutMs) {
            throw conflictError(normalized, observation)
        }
        const remainingMs = normalized.waitTimeoutMs - elapsedMs
        await wait(Math.min(normalized.pollIntervalMs, remainingMs))
    }
}

export async function withGenerateLock<T>(
    options: GenerateLockOptions,
    fn: () => Promise<T> | T,
): Promise<T> {
    const lock = await acquireGenerateLock(options)
    try {
        return await fn()
    } finally {
        lock.release()
    }
}
