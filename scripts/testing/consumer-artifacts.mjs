import { execFileSync, execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * 计算文件 SHA-256 哈希
 */
export function computeFileSha256(filePath) {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 获取当前仓库 HEAD Commit SHA
 */
export function getGitCommitSha(cwd = REPO_ROOT) {
    try {
        return execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return 'unknown-commit';
    }
}

const DEFAULT_RETRY_OPTIONS = {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 1500,
    backoffFactor: 2,
};

/**
 * 带有指数退避的文件与目录递归删除（专防 Windows EBUSY / EPERM 句柄锁）
 */
export async function rmWithRetry(targetPath, options = {}) {
    if (!fs.existsSync(targetPath)) return;

    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let currentDelay = opts.initialDelayMs;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
        try {
            fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
            return;
        } catch (error) {
            const isLockError = error?.code === 'EBUSY' || error?.code === 'EPERM' || error?.code === 'ENOTEMPTY';
            if (!isLockError || attempt === opts.maxRetries) {
                throw new Error(
                    `Failed to remove path "${targetPath}" after ${attempt} attempts (code: ${error?.code}): ${error?.message}`
                );
            }
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay = Math.min(currentDelay * opts.backoffFactor, opts.maxDelayMs);
        }
    }
}

/**
 * 跨平台进程树管理器
 * 负责追踪运行中产生的服务/浏览器进程，支持 Windows taskkill 进程树销毁与 Linux 进程组销毁
 */
export class ProcessTreeManager {
    constructor() {
        this.processes = new Map();
        this.isWindows = process.platform === 'win32';
    }

    track(proc, command) {
        if (!proc || typeof proc.pid !== 'number') return;
        this.processes.set(proc.pid, {
            pid: proc.pid,
            command,
            startedAt: Date.now(),
            processRef: proc,
        });

        proc.once('exit', () => {
            this.processes.delete(proc.pid);
        });
    }

    isRunning(pid) {
        try {
            // 信号 0 仅检查进程是否存在，不发送真实终止信号
            process.kill(pid, 0);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 强行终止特定进程树
     */
    async killProcessTree(pid, graceTimeoutMs = 1500) {
        if (!this.isRunning(pid)) {
            this.processes.delete(pid);
            return;
        }

        if (this.isWindows) {
            try {
                // Windows taskkill /PID <pid> /T /F 强杀整棵进程树
                execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
                    stdio: 'ignore',
                    windowsHide: true,
                });
            } catch {
                // 忽略进程可能已退出的错误
            }
        } else {
            // Linux / macOS: 先尝试优雅 SIGTERM，超时后发送 SIGKILL 杀进程组
            try {
                process.kill(-pid, 'SIGTERM');
            } catch {
                try { process.kill(pid, 'SIGTERM'); } catch {}
            }

            const startTime = Date.now();
            while (this.isRunning(pid) && Date.now() - startTime < graceTimeoutMs) {
                await new Promise(r => setTimeout(r, 50));
            }

            if (this.isRunning(pid)) {
                try {
                    process.kill(-pid, 'SIGKILL');
                } catch {
                    try { process.kill(pid, 'SIGKILL'); } catch {}
                }
            }
        }

        this.processes.delete(pid);
    }

    /**
     * 清理所有已记录的进程
     */
    async cleanupAll() {
        const pids = Array.from(this.processes.keys());
        for (const pid of pids) {
            await this.killProcessTree(pid);
        }
    }
}

/**
 * 构建待测候选产物（UI 与 CLI tarball），生成 candidate-manifest.json
 */
export function packCandidateArtifacts(destinationDir, rootDir = REPO_ROOT) {
    fs.mkdirSync(destinationDir, { recursive: true });

    const packagesToPack = [
        { name: 'brutx-ui-vue', dir: path.join(rootDir, 'packages/ui') },
        { name: 'brutx-vue', dir: path.join(rootDir, 'packages/cli') },
    ];

    const packageRecords = {};

    for (const pkg of packagesToPack) {
        const pkgJsonPath = path.join(pkg.dir, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const version = pkgJson.version;

        // 使用 pnpm pack 打包为标准 tgz
        execSync(`pnpm --config.ignore-scripts=true pack --pack-destination "${destinationDir}"`, {
            cwd: pkg.dir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                npm_config_ignore_scripts: 'true',
            },
        });

        // 精确匹配打包生成的对应 tgz 文件
        const files = fs.readdirSync(destinationDir);
        const sanitizedName = pkg.name.replace(/^@/, '').replace('/', '-');
        const expectedTarballName = `${sanitizedName}-${version}.tgz`;
        const matched = files.find(f => f === expectedTarballName) ||
            files.find(f => f.startsWith(`${sanitizedName}-`) && f.endsWith('.tgz'));

        if (!matched) {
            throw new Error(`Failed to locate packed tarball for ${pkg.name} in ${destinationDir}`);
        }

        const tarballPath = path.join(destinationDir, matched);
        const stat = fs.statSync(tarballPath);
        const sha256 = computeFileSha256(tarballPath);

        packageRecords[pkg.name] = {
            name: pkg.name,
            version,
            tarballFile: matched,
            tarballPath,
            sha256,
            sizeBytes: stat.size,
        };
    }

    const manifest = {
        gitCommit: getGitCommitSha(rootDir),
        createdAt: new Date().toISOString(),
        isTestArtifact: true,
        packages: packageRecords,
    };

    const manifestPath = path.join(destinationDir, 'candidate-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return manifest;
}

/**
 * 运行自检烟测 (--smoke)
 */
async function runSmoke() {
    console.log('[consumer-artifacts] Running T0 smoke verification...');

    // 1. 测试进程树管理
    const manager = new ProcessTreeManager();
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: 'ignore',
        windowsHide: true,
    });
    manager.track(child, 'dummy-timer');

    if (!manager.isRunning(child.pid)) {
        throw new Error(`ProcessTreeManager failed to start child pid ${child.pid}`);
    }

    await manager.killProcessTree(child.pid);
    await new Promise(r => setTimeout(r, 100));

    if (manager.isRunning(child.pid)) {
        throw new Error(`ProcessTreeManager failed to terminate child pid ${child.pid}`);
    }
    console.log('✓ ProcessTreeManager lifecycle and termination verified');

    // 2. 测试带重试的清理机制
    const testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-smoke-test-'));
    fs.writeFileSync(path.join(testTempDir, 'test.txt'), 'hello');
    await rmWithRetry(testTempDir);

    if (fs.existsSync(testTempDir)) {
        throw new Error(`rmWithRetry failed to clean ${testTempDir}`);
    }
    console.log('✓ rmWithRetry cleanup verified');

    // 3. 测试 Git Commit 提取
    const commit = getGitCommitSha();
    if (!commit || commit.length < 7) {
        throw new Error(`Invalid git commit sha: ${commit}`);
    }
    console.log(`✓ Git commit sha extracted: ${commit}`);

    console.log('[consumer-artifacts] All T0 smoke checks passed successfully.');
}

if (process.argv.includes('--smoke')) {
    runSmoke().catch(err => {
        console.error('[consumer-artifacts] Smoke check failed:', err);
        process.exit(1);
    });
}
