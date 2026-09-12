import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
import { acquireGenerateLock, withGenerateLock } from '../src/lock.js'

const REPOSITORY_ROOT = path.resolve(__dirname, '../../..')
const PROCESS_LOCK_PACKAGE_NAME = 'cross-process-pkg'
const PROCESS_LOCK_HOLD_MS = 250
const PROCESS_LOCK_WAIT_TIMEOUT_MS = 2_000
const PROCESS_LOCK_POLL_INTERVAL_MS = 5
const PROCESS_LOCK_TEST_TIMEOUT_MS = 15_000

function runLockChild(scriptPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            process.execPath,
            ['--import', 'tsx', scriptPath, ...args],
            { cwd: REPOSITORY_ROOT, stdio: ['ignore', 'ignore', 'pipe'] },
        )
        let stderr = ''
        let settled = false
        const timeout = setTimeout(() => {
            if (settled) return
            settled = true
            child.kill('SIGTERM')
            reject(new Error(`独立进程锁测试超时: ${stderr}`))
        }, PROCESS_LOCK_TEST_TIMEOUT_MS)

        child.stderr?.on('data', chunk => {
            stderr += String(chunk)
        })
        child.once('error', error => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            reject(error)
        })
        child.once('close', code => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            if (code === 0) {
                resolve()
                return
            }
            reject(new Error(`独立进程锁测试失败 (${code}): ${stderr}`))
        })
    })
}

async function waitForFile(filePath: string): Promise<void> {
    const startedAt = Date.now()
    while (Date.now() - startedAt < PROCESS_LOCK_TEST_TIMEOUT_MS) {
        if (fs.existsSync(filePath)) return
        await new Promise(resolve => setTimeout(resolve, PROCESS_LOCK_POLL_INTERVAL_MS))
    }
    throw new Error(`独立进程锁测试未收到事件: ${filePath}`)
}

describe('Generation Lock Contract', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-lock-test-'))
    })

    afterEach(() => {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true })
        } catch {
            // ignore cleanup errors
        }
    })

    it('successfully acquires and releases a generation lock', async () => {
        const lock = await acquireGenerateLock({
            packageName: 'test-pkg',
            cacheDir: tempDir,
        })

        expect(fs.existsSync(lock.lockPath)).toBe(true)
        const content = JSON.parse(fs.readFileSync(lock.lockPath, 'utf-8')) as {
            token: string
            package: string
            pid: number
        }
        expect(content.token).toBe(lock.token)
        expect(content.package).toBe('test-pkg')
        expect(content.pid).toBe(process.pid)

        lock.release()
        expect(fs.existsSync(lock.lockPath)).toBe(false)
    })

    it('waits for an active lock and does not take it over', async () => {
        const lock1 = await acquireGenerateLock({
            packageName: 'conflict-pkg',
            cacheDir: tempDir,
        })

        const waiting = acquireGenerateLock({
            packageName: 'conflict-pkg',
            cacheDir: tempDir,
            waitTimeoutMs: 250,
            pollIntervalMs: 5,
        })
        await new Promise(resolve => setTimeout(resolve, 20))
        expect(fs.existsSync(lock1.lockPath)).toBe(true)
        lock1.release()
        const lock2 = await waiting
        expect(lock2.token).not.toBe(lock1.token)
        lock2.release()
        expect(fs.existsSync(lock1.lockPath)).toBe(false)
    })

    it('serializes independent generator processes with the package lock', async () => {
        const eventsPath = path.join(tempDir, 'events.log')
        const childScriptPath = path.join(tempDir, 'lock-child.mjs')
        const lockModuleUrl = pathToFileURL(path.resolve(__dirname, '../src/lock.ts')).href
        fs.writeFileSync(
            childScriptPath,
            [
                "import fs from 'node:fs/promises'",
                `import { withGenerateLock } from ${JSON.stringify(lockModuleUrl)}`,
                'const [cacheDir, eventsPath, label, holdMs] = process.argv.slice(2)',
                `await withGenerateLock({ packageName: ${JSON.stringify(PROCESS_LOCK_PACKAGE_NAME)}, cacheDir, waitTimeoutMs: ${PROCESS_LOCK_WAIT_TIMEOUT_MS}, pollIntervalMs: ${PROCESS_LOCK_POLL_INTERVAL_MS} }, async () => {`,
                "    await fs.appendFile(eventsPath, label + '\\n')",
                '    await new Promise(resolve => setTimeout(resolve, Number(holdMs)))',
                '})',
            ].join('\n'),
            'utf-8',
        )

        const first = runLockChild(childScriptPath, [
            tempDir,
            eventsPath,
            'first',
            String(PROCESS_LOCK_HOLD_MS),
        ])
        await waitForFile(eventsPath)
        const second = runLockChild(childScriptPath, [
            tempDir,
            eventsPath,
            'second',
            String(PROCESS_LOCK_HOLD_MS),
        ])

        await Promise.all([first, second])
        expect(fs.readFileSync(eventsPath, 'utf-8').trim().split('\n')).toEqual([
            'first',
            'second',
        ])
    }, PROCESS_LOCK_TEST_TIMEOUT_MS)

    it('times out on an active lock without removing it', async () => {
        const lock1 = await acquireGenerateLock({
            packageName: 'timeout-pkg',
            cacheDir: tempDir,
        })

        await expect(acquireGenerateLock({
            packageName: 'timeout-pkg',
            cacheDir: tempDir,
            waitTimeoutMs: 20,
            pollIntervalMs: 5,
        })).rejects.toThrow(expect.objectContaining({
            message: expect.stringMatching(/生成锁等待超时: 包 timeout-pkg/),
        }))
        expect(fs.existsSync(lock1.lockPath)).toBe(true)
        lock1.release()
    })

    it('recovers a lock whose owner process is no longer alive', async () => {
        const lockPath = path.join(tempDir, 'brutx-stale-pkg-generate.lock')
        fs.writeFileSync(lockPath, JSON.stringify({
            token: 'stale-token',
            package: 'stale-pkg',
            pid: -1,
            createdAt: new Date(0).toISOString(),
        }), 'utf-8')

        const lock = await acquireGenerateLock({
            packageName: 'stale-pkg',
            cacheDir: tempDir,
            waitTimeoutMs: 250,
            pollIntervalMs: 5,
            staleLockAgeMs: 0,
        })
        expect(lock.token).not.toBe('stale-token')
        lock.release()
        expect(fs.existsSync(lockPath)).toBe(false)
    })

    it('rejects invalid duration options', async () => {
        await expect(acquireGenerateLock({
            packageName: 'invalid-pkg',
            cacheDir: tempDir,
            waitTimeoutMs: Number.NaN,
        })).rejects.toThrow(/waitTimeoutMs/)
    })

    it('withGenerateLock automatically releases lock on completion and error', async () => {
        let executed = false
        await withGenerateLock(
            {
                packageName: 'auto-pkg',
                cacheDir: tempDir,
            },
            () => {
                executed = true
            }
        )
        expect(executed).toBe(true)
        const expectedLockPath = path.join(tempDir, 'brutx-auto-pkg-generate.lock')
        expect(fs.existsSync(expectedLockPath)).toBe(false)

        await expect(
            withGenerateLock(
                {
                    packageName: 'auto-pkg-err',
                    cacheDir: tempDir,
                },
                () => {
                    throw new Error('boom')
                }
            )
        ).rejects.toThrow('boom')

        const errLockPath = path.join(tempDir, 'brutx-auto-pkg-err-generate.lock')
        expect(fs.existsSync(errLockPath)).toBe(false)
    })
})
