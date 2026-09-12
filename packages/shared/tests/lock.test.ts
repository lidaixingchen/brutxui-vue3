import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { acquireGenerateLock, withGenerateLock } from '../src/lock.js'

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

    it('successfully acquires and releases a generation lock', () => {
        const lock = acquireGenerateLock({
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

    it('throws descriptive error on concurrent lock conflict', () => {
        const lock1 = acquireGenerateLock({
            packageName: 'conflict-pkg',
            cacheDir: tempDir,
        })

        expect(() => {
            acquireGenerateLock({
                packageName: 'conflict-pkg',
                cacheDir: tempDir,
            })
        }).toThrow(/\[BrutxUI\] 检测到并发生成任务冲突: 包 conflict-pkg 的生成锁已存在/)

        lock1.release()
        expect(fs.existsSync(lock1.lockPath)).toBe(false)
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
