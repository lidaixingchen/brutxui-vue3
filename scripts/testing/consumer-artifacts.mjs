import { execFileSync, execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const CANDIDATE_MANIFEST_NAME = 'candidate-manifest.json';
const REQUIRED_CANDIDATE_PACKAGES = ['brutx-ui-vue', 'brutx-vue'];

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

    const manifestPath = path.join(destinationDir, CANDIDATE_MANIFEST_NAME);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return manifest;
}

function resolveCandidateManifestPath(inputPath) {
    const resolvedInput = path.resolve(inputPath);
    if (fs.existsSync(resolvedInput) && fs.statSync(resolvedInput).isDirectory()) {
        return path.join(resolvedInput, CANDIDATE_MANIFEST_NAME);
    }
    return resolvedInput;
}

function resolveCandidateTarballPath(record, manifestDir) {
    const candidates = [];
    if (typeof record.tarballFile === 'string' && record.tarballFile.length > 0) {
        candidates.push(path.resolve(manifestDir, record.tarballFile));
    }
    if (typeof record.tarballPath === 'string' && record.tarballPath.length > 0) {
        candidates.push(path.isAbsolute(record.tarballPath)
            ? record.tarballPath
            : path.resolve(manifestDir, record.tarballPath));
    }

    for (const candidate of candidates) {
        if (!fs.existsSync(candidate)) continue;
        const stat = fs.lstatSync(candidate);
        if (!stat.isSymbolicLink() && stat.isFile()) return candidate;
    }

    return candidates[0];
}

/**
 * 读取并校验可复用的候选 tarball manifest，确保消费者只使用已固定的实际文件。
 */
export function loadCandidateArtifacts(inputPath) {
    if (typeof inputPath !== 'string' || inputPath.trim().length === 0) {
        throw new Error('--artifacts requires a candidate directory or candidate-manifest.json path.');
    }

    const manifestPath = resolveCandidateManifestPath(inputPath);
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Candidate artifact manifest not found: ${manifestPath}`);
    }

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (error) {
        throw new Error(`Failed to parse candidate artifact manifest ${manifestPath}: ${error.message}`, { cause: error });
    }

    if (manifest?.isTestArtifact !== true) {
        throw new Error(`Candidate artifact manifest must set isTestArtifact=true: ${manifestPath}`);
    }
    if (!manifest.packages || typeof manifest.packages !== 'object') {
        throw new Error(`Candidate artifact manifest has no packages object: ${manifestPath}`);
    }

    const manifestDir = path.dirname(manifestPath);
    const normalizedPackages = {};
    for (const packageName of REQUIRED_CANDIDATE_PACKAGES) {
        const record = manifest.packages[packageName];
        if (!record || typeof record !== 'object') {
            throw new Error(`Candidate artifact manifest is missing package ${packageName}.`);
        }
        if (record.name !== packageName) {
            throw new Error(`Candidate artifact package name mismatch: expected ${packageName}.`);
        }
        if (typeof record.version !== 'string' || record.version.length === 0) {
            throw new Error(`Candidate artifact package ${packageName} has no version.`);
        }
        if (typeof record.sha256 !== 'string' || record.sha256.length === 0) {
            throw new Error(`Candidate artifact package ${packageName} has no sha256.`);
        }

        const tarballPath = resolveCandidateTarballPath(record, manifestDir);
        if (!tarballPath || !fs.existsSync(tarballPath)) {
            throw new Error(`Candidate artifact tarball missing for ${packageName}.`);
        }
        const stat = fs.lstatSync(tarballPath);
        if (stat.isSymbolicLink() || !stat.isFile() || stat.size === 0) {
            throw new Error(`Candidate artifact tarball must be a non-empty regular file for ${packageName}.`);
        }
        if (record.sizeBytes !== undefined && record.sizeBytes !== stat.size) {
            throw new Error(`Candidate artifact size mismatch for ${packageName}: expected ${record.sizeBytes}, got ${stat.size}.`);
        }

        const actualSha256 = computeFileSha256(tarballPath);
        if (actualSha256 !== record.sha256) {
            throw new Error(`Candidate artifact sha256 mismatch for ${packageName}: expected ${record.sha256}, got ${actualSha256}.`);
        }

        normalizedPackages[packageName] = {
            ...record,
            tarballPath,
            tarballFile: path.basename(tarballPath),
            sizeBytes: stat.size,
        };
    }

    return {
        ...manifest,
        manifestPath,
        packages: normalizedPackages,
    };
}

/**
 * 生成所有消费者共享的产物摘要，避免每个矩阵独立解析候选输入。
 */
export function summarizeCandidateArtifacts(manifest) {
    return {
        gitCommit: manifest.gitCommit ?? 'unknown-commit',
        packages: Object.fromEntries(
            REQUIRED_CANDIDATE_PACKAGES.map(packageName => {
                const record = manifest.packages[packageName];
                return [packageName, {
                    version: record.version,
                    sha256: record.sha256,
                    sizeBytes: record.sizeBytes,
                }];
            })
        ),
    };
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
