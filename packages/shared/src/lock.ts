import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export interface GenerateLockOptions {
    packageName: string
    cacheDir?: string
    lockFileName?: string
}

export interface GenerateLockResult {
    lockPath: string
    token: string
    release: () => void
}

export function acquireGenerateLock(options: GenerateLockOptions): GenerateLockResult {
    const {
        packageName,
        cacheDir = path.resolve(process.cwd(), 'node_modules/.cache'),
        lockFileName = `brutx-${packageName.replace(/[^a-zA-Z0-9_-]/g, '_')}-generate.lock`,
    } = options

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
    }

    const lockPath = path.join(cacheDir, lockFileName)
    const token = crypto.randomUUID()
    const lockPayload = JSON.stringify(
        {
            token,
            package: packageName,
            pid: process.pid,
            createdAt: new Date().toISOString(),
        },
        null,
        2
    )

    let fd: number
    try {
        fd = fs.openSync(lockPath, 'wx')
    } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
            let existingInfo = ''
            try {
                existingInfo = fs.readFileSync(lockPath, 'utf-8')
            } catch {
                // ignore read failure
            }
            throw new Error(
                `[BrutxUI] 检测到并发生成任务冲突: 包 ${packageName} 的生成锁已存在。\n` +
                `锁文件路径: ${lockPath}\n` +
                (existingInfo ? `锁持有信息: ${existingInfo}\n` : '') +
                `若前次任务已异常退出，请确认无其他任务运行后，手动删除该锁文件再重试。`,
                { cause: err }
            )
        }
        throw err
    }

    try {
        fs.writeFileSync(fd, lockPayload, 'utf-8')
    } finally {
        fs.closeSync(fd)
    }

    let released = false
    const release = () => {
        if (released) return
        released = true
        try {
            if (fs.existsSync(lockPath)) {
                const current = fs.readFileSync(lockPath, 'utf-8')
                if (current.includes(token)) {
                    fs.unlinkSync(lockPath)
                }
            }
        } catch {
            // ignore cleanup failure
        }
    }

    return {
        lockPath,
        token,
        release,
    }
}

export async function withGenerateLock<T>(
    options: GenerateLockOptions,
    fn: () => Promise<T> | T
): Promise<T> {
    const lock = acquireGenerateLock(options)
    try {
        return await fn()
    } finally {
        lock.release()
    }
}
