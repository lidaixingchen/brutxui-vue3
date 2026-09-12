import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
    chmodSync,
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readlinkSync,
    readdirSync,
    realpathSync,
    rmdirSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..')
const TEMPORARY_DIRECTORY_PREFIX = 'brutx-staged-snapshot-'
const UI_PACKAGE = 'ui'
const CLI_PACKAGE = 'cli'
const PACKAGE_DIRECTORY = Object.freeze({
    [UI_PACKAGE]: path.join('packages', 'ui'),
    [CLI_PACKAGE]: path.join('packages', 'cli'),
})
const PACKAGE_COMMAND = Object.freeze({
    [UI_PACKAGE]: 'pnpm --filter brutx-ui-vue generate',
    [CLI_PACKAGE]: 'pnpm --filter brutx-vue generate',
})
const GENERATOR_ARGUMENTS = Object.freeze(['--import', 'tsx', 'scripts/generate.ts', '--check'])
const MAX_CHILD_OUTPUT_BYTES = 32 * 1024 * 1024
const MAX_GENERATOR_OUTPUT_CHARACTERS = 12 * 1024
const INDEX_PATH_SEPARATOR = 0
const INDEX_METADATA_SEPARATOR = 9
const INDEX_METADATA_PARTS = 3
const INDEX_NORMAL_STAGE = '0'
const INDEX_NORMAL_MODE = '100644'
const INDEX_EXECUTABLE_MODE = '100755'
const INDEX_SYMLINK_MODE = '120000'
const INDEX_SUBMODULE_MODE = '160000'
const GIT_OBJECT_ID_PATTERN = /^[0-9a-f]+$/
const NORMAL_FILE_MODE = 0o644
const EXECUTABLE_FILE_MODE = 0o755
const STATUS_SUCCESS = 0
const STATUS_FAILURE = 1
const LINE_FEED = 10
const PATH_SEPARATOR = '/'
const WORKSPACE_PACKAGE_SCOPE = 'packages'
const GENERATED_INDEX_FILE = /^packages\/ui\/src\/components\/[^/]+\/index\.ts$/
const TEST_FILE = /(?:\.test|\.spec)\.[^.]+$/
const INTEGRITY_FIELD_SEPARATOR = '\0'
const MODE_STRING_RADIX = 8
const WORKTREE_EXCLUDED_PATH_SEGMENTS = new Set(['.git', 'node_modules'])
const WORKTREE_FILE_KIND = Object.freeze({
    FILE: 'file',
    SYMLINK: 'symlink',
    OTHER: 'other',
    MISSING: 'missing',
})
const ROOT_GENERATION_INPUTS = new Set(['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
const ROOT_TYPESCRIPT_CONFIGURATION = /^tsconfig(?:\.[^/]+)?\.json$/
const SHARED_GENERATION_CHECK_FILES = new Set(['.husky/pre-commit'])
const SNAPSHOT_CHECKER_PREFIX = 'scripts/generation/check-staged-snapshot'

const UI_GENERATED_FILES = new Set([
    'packages/ui/registry-manifest.json',
    'packages/ui/exports-manifest.json',
    'packages/ui/src/styles.css',
    'packages/ui/src/preflight.css',
    'packages/ui/src/lib/utils.ts',
    'packages/ui/src/index.ts',
    'packages/ui/src/composables/index.ts',
    'packages/ui/package.json',
])

const CLI_GENERATED_FILES = new Set([
    'packages/cli/src/styles/brutalist.css',
    'packages/cli/src/lib/constants.ts',
    'packages/cli/package.json',
])

const UI_CONFIGURATION_FILES = new Set([
    'packages/ui/api-contract.ts',
    'packages/ui/vite.config.ts',
    'packages/ui/tsconfig.json',
    'packages/ui/tsconfig.typedoc.json',
    'packages/ui/typedoc.json',
])

const CLI_CONFIGURATION_FILES = new Set([
    'packages/cli/tsconfig.json',
    'packages/cli/tsup.config.ts',
])

const SHARED_CONFIGURATION_FILES = new Set([
    'packages/shared/package.json',
    'packages/shared/tsconfig.json',
])

const EXTERNAL_NODE_MODULE_ENTRIES = new Set(['.bin', '.cache', '.vite', '.vite-temp', '.pnpm'])

function normalizePath(relativePath) {
    return relativePath.split(path.sep).join(PATH_SEPARATOR)
}

function runGit(repositoryRoot, argumentsList, options = {}) {
    return execFileSync('git', argumentsList, {
        cwd: repositoryRoot,
        encoding: options.encoding ?? 'buffer',
        env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
        maxBuffer: MAX_CHILD_OUTPUT_BYTES,
        stdio: ['ignore', 'pipe', 'pipe'],
    })
}

function getRepositoryRoot(repositoryRoot) {
    const resolvedRoot = repositoryRoot ? path.resolve(repositoryRoot) : DEFAULT_REPOSITORY_ROOT
    const gitRoot = runGit(resolvedRoot, ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
    return path.resolve(gitRoot)
}

function getIndexPath(repositoryRoot) {
    const gitPath = runGit(repositoryRoot, ['rev-parse', '--git-path', 'index'], { encoding: 'utf8' }).trim()
    return path.resolve(repositoryRoot, gitPath)
}

function hashBytes(bytes) {
    return createHash('sha256').update(bytes).digest('hex')
}

function isExcludedWorktreePath(relativePath) {
    return relativePath.split(PATH_SEPARATOR).some(segment => WORKTREE_EXCLUDED_PATH_SEGMENTS.has(segment))
}

function readWorktreePaths(repositoryRoot) {
    return splitNulSeparated(
        runGit(repositoryRoot, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']),
    )
        .map(value => value.toString('utf8'))
        .filter(relativePath => !isExcludedWorktreePath(relativePath))
        .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
}

function readWorktreeEntry(repositoryRoot, relativePath) {
    const absolutePath = path.resolve(repositoryRoot, ...relativePath.split(PATH_SEPARATOR))
    let fileStat
    try {
        fileStat = lstatSync(absolutePath)
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return { kind: WORKTREE_FILE_KIND.MISSING, mode: '0', content: Buffer.alloc(0) }
        }
        throw error
    }

    if (fileStat.isSymbolicLink()) {
        return {
            kind: WORKTREE_FILE_KIND.SYMLINK,
            mode: fileStat.mode.toString(MODE_STRING_RADIX),
            content: Buffer.from(readlinkSync(absolutePath), 'utf8'),
        }
    }
    if (fileStat.isFile()) {
        return {
            kind: WORKTREE_FILE_KIND.FILE,
            mode: fileStat.mode.toString(MODE_STRING_RADIX),
            content: readFileSync(absolutePath),
        }
    }
    return {
        kind: WORKTREE_FILE_KIND.OTHER,
        mode: fileStat.mode.toString(MODE_STRING_RADIX),
        content: Buffer.alloc(0),
    }
}

function getWorktreeHash(repositoryRoot) {
    const digest = createHash('sha256')
    for (const relativePath of readWorktreePaths(repositoryRoot)) {
        const entry = readWorktreeEntry(repositoryRoot, relativePath)
        digest.update(
            `${relativePath}${INTEGRITY_FIELD_SEPARATOR}${entry.kind}${INTEGRITY_FIELD_SEPARATOR}${entry.mode}${INTEGRITY_FIELD_SEPARATOR}`,
            'utf8',
        )
        digest.update(entry.content)
        digest.update(INTEGRITY_FIELD_SEPARATOR, 'utf8')
    }
    return digest.digest('hex')
}

function getRepositoryIntegrity(repositoryRoot) {
    const indexPath = getIndexPath(repositoryRoot)
    const indexBytes = existsSync(indexPath) ? readFileSync(indexPath) : Buffer.alloc(0)
    const statusBytes = runGit(repositoryRoot, ['status', '--porcelain=v1', '--untracked-files=all', '-z'])
    return {
        indexPath,
        indexHash: hashBytes(indexBytes),
        statusHash: hashBytes(statusBytes),
        worktreeHash: getWorktreeHash(repositoryRoot),
    }
}

function assertRepositoryIntegrity(repositoryRoot, before) {
    const after = getRepositoryIntegrity(repositoryRoot)
    if (
        after.indexHash !== before.indexHash ||
        after.statusHash !== before.statusHash ||
        after.worktreeHash !== before.worktreeHash
    ) {
        throw new Error(
            '暂存快照检查修改了 Git index 或工作树文件内容/状态，已中止提交；请检查生成检查入口是否写入仓库。',
        )
    }
}

function splitNulSeparated(bytes) {
    const values = []
    let start = 0
    for (let index = 0; index < bytes.length; index += 1) {
        if (bytes[index] !== INDEX_PATH_SEPARATOR) continue
        values.push(bytes.subarray(start, index))
        start = index + 1
    }
    if (start < bytes.length) values.push(bytes.subarray(start))
    return values.filter(value => value.length > 0)
}

export function parseIndexEntries(bytes) {
    return splitNulSeparated(bytes).map(record => {
        const separator = record.indexOf(INDEX_METADATA_SEPARATOR)
        if (separator < 0) throw new Error('Git index 条目格式无效，无法解析候选快照。')
        const metadata = record.subarray(0, separator).toString('utf8').split(' ')
        const relativePath = record.subarray(separator + 1).toString('utf8')
        if (metadata.length !== INDEX_METADATA_PARTS || !relativePath) {
            throw new Error(`Git index 条目格式无效：${relativePath || '<空路径>'}`)
        }
        const [mode, objectId, stage] = metadata
        if (!GIT_OBJECT_ID_PATTERN.test(objectId)) {
            throw new Error(`Git index 条目元数据无效：${relativePath}`)
        }
        if (stage !== INDEX_NORMAL_STAGE) {
            throw new Error(`候选快照包含未解决的合并条目：${relativePath}`)
        }
        return { mode, objectId, relativePath }
    })
}

function readIndexEntries(repositoryRoot) {
    return parseIndexEntries(runGit(repositoryRoot, ['ls-files', '--stage', '-z']))
}

function readStagedPaths(repositoryRoot) {
    let bytes
    try {
        bytes = runGit(repositoryRoot, ['diff', '--cached', '--no-ext-diff', '--no-renames', '--name-only', '-z'])
    } catch {
        bytes = runGit(repositoryRoot, [
            'diff',
            '--cached',
            '--root',
            '--no-ext-diff',
            '--no-renames',
            '--name-only',
            '-z',
        ])
    }
    return splitNulSeparated(bytes).map(value => value.toString('utf8'))
}

function isSourceTestPath(relativePath) {
    return TEST_FILE.test(path.posix.basename(relativePath)) || relativePath.includes('/__snapshots__/')
}

function isSnapshotCheckerInput(relativePath) {
    return relativePath.startsWith(SNAPSHOT_CHECKER_PREFIX) && !isSourceTestPath(relativePath)
}

function isUiGenerationInput(relativePath) {
    if (UI_GENERATED_FILES.has(relativePath) || UI_CONFIGURATION_FILES.has(relativePath)) return true
    if (GENERATED_INDEX_FILE.test(relativePath)) return true
    if (relativePath === 'packages/ui/scripts/generate.ts') return true
    if (relativePath.startsWith('packages/ui/scripts/') && !isSourceTestPath(relativePath)) return true
    if (relativePath.startsWith('packages/ui/src/') && !isSourceTestPath(relativePath)) return true
    return false
}

function isCliGenerationInput(relativePath) {
    if (CLI_GENERATED_FILES.has(relativePath) || CLI_CONFIGURATION_FILES.has(relativePath)) return true
    if (relativePath === 'packages/cli/scripts/generate.ts') return true
    if (relativePath.startsWith('packages/cli/scripts/') && !isSourceTestPath(relativePath)) return true
    if (relativePath.startsWith('packages/cli/src/') && !isSourceTestPath(relativePath)) return true
    return false
}

function isSharedGenerationInput(relativePath) {
    return (
        SHARED_CONFIGURATION_FILES.has(relativePath) ||
        (relativePath.startsWith('packages/shared/src/') && !isSourceTestPath(relativePath))
    )
}

function isRootGenerationInput(relativePath) {
    return ROOT_GENERATION_INPUTS.has(relativePath) || ROOT_TYPESCRIPT_CONFIGURATION.test(relativePath)
}

export function determineAffectedPackages(stagedPaths) {
    const affected = new Set()
    for (const relativePath of stagedPaths) {
        if (
            isRootGenerationInput(relativePath) ||
            SHARED_GENERATION_CHECK_FILES.has(relativePath) ||
            isSnapshotCheckerInput(relativePath)
        ) {
            affected.add(UI_PACKAGE)
            affected.add(CLI_PACKAGE)
            continue
        }
        if (isUiGenerationInput(relativePath) || isSharedGenerationInput(relativePath)) affected.add(UI_PACKAGE)
        if (isCliGenerationInput(relativePath) || isSharedGenerationInput(relativePath)) affected.add(CLI_PACKAGE)
    }
    return [UI_PACKAGE, CLI_PACKAGE].filter(packageName => affected.has(packageName))
}

function ensureCandidatePath(rootPath, relativePath) {
    const normalized = normalizePath(relativePath)
    if (path.posix.isAbsolute(normalized) || normalized.split(PATH_SEPARATOR).includes('..')) {
        throw new Error(`Git index 包含越界路径，无法物化候选快照：${relativePath}`)
    }
    const destination = path.resolve(rootPath, ...normalized.split(PATH_SEPARATOR))
    const rootWithSeparator = `${path.resolve(rootPath)}${path.sep}`
    if (destination !== path.resolve(rootPath) && !destination.startsWith(rootWithSeparator)) {
        throw new Error(`Git index 包含越界路径，无法物化候选快照：${relativePath}`)
    }
    return destination
}

function parseBatchObjects(output, objectIds) {
    const contents = new Map()
    let offset = 0
    for (const objectId of objectIds) {
        const headerEnd = output.indexOf(LINE_FEED, offset)
        if (headerEnd < 0) throw new Error(`无法读取 Git 对象：${objectId}`)
        const header = output.subarray(offset, headerEnd).toString('utf8').split(' ')
        if (header[1] === 'missing') throw new Error(`Git index 引用了缺失对象：${objectId}`)
        const objectSize = Number(header[2])
        if (header.length < INDEX_METADATA_PARTS || !Number.isSafeInteger(objectSize) || objectSize < 0) {
            throw new Error(`Git 对象响应格式无效：${objectId}`)
        }
        const contentStart = headerEnd + 1
        const contentEnd = contentStart + objectSize
        const content = output.subarray(contentStart, contentEnd)
        if (content.length !== objectSize || output[contentEnd] !== LINE_FEED) {
            throw new Error(`Git 对象内容不完整：${objectId}`)
        }
        contents.set(objectId, content)
        offset = contentEnd + 1
    }
    return contents
}

function readIndexedObjects(repositoryRoot, entries) {
    const objectIds = entries
        .filter(entry => entry.mode !== INDEX_SUBMODULE_MODE)
        .map(entry => entry.objectId)
    if (objectIds.length === 0) return new Map()
    const input = Buffer.from(`${objectIds.join('\n')}\n`, 'utf8')
    const output = execFileSync('git', ['cat-file', '--batch'], {
        cwd: repositoryRoot,
        encoding: 'buffer',
        env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
        input,
        maxBuffer: MAX_CHILD_OUTPUT_BYTES,
        stdio: ['pipe', 'pipe', 'pipe'],
    })
    return parseBatchObjects(output, objectIds)
}

function assertSymlinkTargetInside(rootPath, destination, target) {
    if (path.isAbsolute(target)) {
        throw new Error(`候选快照包含越界符号链接：${path.relative(rootPath, destination)}`)
    }
    const targetPath = path.resolve(path.dirname(destination), target)
    const rootWithSeparator = `${path.resolve(rootPath)}${path.sep}`
    if (targetPath !== path.resolve(rootPath) && !targetPath.startsWith(rootWithSeparator)) {
        throw new Error(`候选快照包含越界符号链接：${path.relative(rootPath, destination)}`)
    }
}

export function materializeIndexSnapshot(repositoryRoot, destinationRoot, entries = readIndexEntries(repositoryRoot)) {
    mkdirSync(destinationRoot, { recursive: true })
    const indexedObjects = readIndexedObjects(repositoryRoot, entries)
    for (const entry of entries) {
        if (entry.mode === INDEX_SUBMODULE_MODE) {
            throw new Error(`候选快照包含无法物化的子模块条目：${entry.relativePath}`)
        }
        const destination = ensureCandidatePath(destinationRoot, entry.relativePath)
        const content = indexedObjects.get(entry.objectId)
        if (!content) throw new Error(`无法物化 Git index 条目：${entry.relativePath}`)
        mkdirSync(path.dirname(destination), { recursive: true })
        if (entry.mode === INDEX_SYMLINK_MODE) {
            const target = content.toString('utf8')
            assertSymlinkTargetInside(destinationRoot, destination, target)
            symlinkSync(target, destination)
            continue
        }
        if (entry.mode !== INDEX_NORMAL_MODE && entry.mode !== INDEX_EXECUTABLE_MODE) {
            throw new Error(`候选快照包含不支持的文件 mode ${entry.mode}：${entry.relativePath}`)
        }
        writeFileSync(destination, content)
        chmodSync(destination, entry.mode === INDEX_EXECUTABLE_MODE ? EXECUTABLE_FILE_MODE : NORMAL_FILE_MODE)
    }
    return entries.length
}

function readWorkspacePackageNames(candidateRoot) {
    const packageRoot = path.join(candidateRoot, WORKSPACE_PACKAGE_SCOPE)
    const names = new Map()
    if (!existsSync(packageRoot)) return names
    for (const entry of readdirSync(packageRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const packageJsonPath = path.join(packageRoot, entry.name, 'package.json')
        if (!existsSync(packageJsonPath)) continue
        try {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
            if (typeof packageJson.name === 'string' && packageJson.name) {
                names.set(packageJson.name, path.join(WORKSPACE_PACKAGE_SCOPE, entry.name))
            }
        } catch {
            continue
        }
    }
    return names
}

function linkEntry(sourcePath, destinationPath) {
    if (existsSync(destinationPath)) return
    const parent = path.dirname(destinationPath)
    mkdirSync(parent, { recursive: true })
    const target = realpathSync(sourcePath)
    symlinkSync(target, destinationPath, lstatSync(target).isDirectory() ? 'dir' : 'file')
}

function isWorkspaceSource(sourcePath, repositoryRoot) {
    let resolvedSource
    try {
        resolvedSource = realpathSync(sourcePath)
    } catch {
        return false
    }
    const workspaceRoot = path.resolve(repositoryRoot, WORKSPACE_PACKAGE_SCOPE)
    const workspaceRootWithSeparator = `${workspaceRoot}${path.sep}`
    return resolvedSource === workspaceRoot || resolvedSource.startsWith(workspaceRootWithSeparator)
}

function linkExternalDependencyTree(
    sourceNodeModules,
    destinationNodeModules,
    workspacePackages,
    candidateRoot,
    repositoryRoot,
) {
    if (!existsSync(sourceNodeModules)) return
    mkdirSync(destinationNodeModules, { recursive: true })
    for (const entry of readdirSync(sourceNodeModules, { withFileTypes: true })) {
        if (EXTERNAL_NODE_MODULE_ENTRIES.has(entry.name)) continue
        const sourcePath = path.join(sourceNodeModules, entry.name)
        if (entry.name.startsWith('@') && entry.isDirectory()) {
            for (const scopedEntry of readdirSync(sourcePath, { withFileTypes: true })) {
                if (EXTERNAL_NODE_MODULE_ENTRIES.has(scopedEntry.name)) continue
                const packageName = `${entry.name}/${scopedEntry.name}`
                const destinationPath = path.join(destinationNodeModules, entry.name, scopedEntry.name)
                const workspacePath = workspacePackages.get(packageName)
                if (workspacePath) {
                    const candidatePath = path.join(candidateRoot, workspacePath)
                    if (!existsSync(candidatePath)) continue
                    linkEntry(candidatePath, destinationPath)
                } else if (isWorkspaceSource(path.join(sourcePath, scopedEntry.name), repositoryRoot)) {
                    continue
                } else {
                    linkEntry(path.join(sourcePath, scopedEntry.name), destinationPath)
                }
            }
            continue
        }
        const destinationPath = path.join(destinationNodeModules, entry.name)
        const workspacePath = workspacePackages.get(entry.name)
        if (workspacePath) {
            const candidatePath = path.join(candidateRoot, workspacePath)
            if (!existsSync(candidatePath)) continue
            linkEntry(candidatePath, destinationPath)
        } else if (isWorkspaceSource(sourcePath, repositoryRoot)) {
            continue
        } else {
            linkEntry(sourcePath, destinationPath)
        }
    }
}

function prepareCandidateDependencies(repositoryRoot, candidateRoot) {
    const workspacePackages = readWorkspacePackageNames(candidateRoot)
    const candidateRootNodeModules = path.join(candidateRoot, 'node_modules')
    linkExternalDependencyTree(
        path.join(repositoryRoot, 'node_modules'),
        candidateRootNodeModules,
        workspacePackages,
        candidateRoot,
        repositoryRoot,
    )
    for (const packageName of [UI_PACKAGE, CLI_PACKAGE]) {
        const packageRelativePath = PACKAGE_DIRECTORY[packageName]
        const candidatePackageRoot = path.join(candidateRoot, packageRelativePath)
        if (!existsSync(candidatePackageRoot)) continue
        const sourcePackageNodeModules = path.join(repositoryRoot, packageRelativePath, 'node_modules')
        const sourceNodeModules = existsSync(sourcePackageNodeModules)
            ? sourcePackageNodeModules
            : path.join(repositoryRoot, 'node_modules')
        linkExternalDependencyTree(
            sourceNodeModules,
            path.join(candidatePackageRoot, 'node_modules'),
            workspacePackages,
            candidateRoot,
            repositoryRoot,
        )
    }
    const sharedRoot = path.join(candidateRoot, 'packages', 'shared')
    if (existsSync(sharedRoot)) {
        const sharedSourceNodeModules = path.join(repositoryRoot, 'packages', 'shared', 'node_modules')
        const sourceNodeModules = existsSync(sharedSourceNodeModules)
            ? sharedSourceNodeModules
            : path.join(repositoryRoot, 'node_modules')
        linkExternalDependencyTree(
            sourceNodeModules,
            path.join(sharedRoot, 'node_modules'),
            workspacePackages,
            candidateRoot,
            repositoryRoot,
        )
    }
}

function normalizeGeneratorResult(result) {
    if (typeof result === 'number') return { exitCode: result, stdout: '', stderr: '' }
    return {
        exitCode: result?.exitCode ?? result?.status ?? STATUS_FAILURE,
        stdout: result?.stdout ?? '',
        stderr: result?.stderr ?? '',
        signal: result?.signal,
        error: result?.error,
    }
}

export function runGenerator(request) {
    const child = spawnSync(process.execPath, [...GENERATOR_ARGUMENTS], {
        cwd: request.packageRoot,
        env: request.environment,
        encoding: 'utf8',
        maxBuffer: MAX_CHILD_OUTPUT_BYTES,
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    return normalizeGeneratorResult({
        exitCode: child.status ?? STATUS_FAILURE,
        stdout: child.stdout,
        stderr: child.stderr,
        signal: child.signal,
        error: child.error,
    })
}

function trimGeneratorOutput(value) {
    const text = String(value ?? '').trim()
    if (text.length <= MAX_GENERATOR_OUTPUT_CHARACTERS) return text
    return `${text.slice(0, MAX_GENERATOR_OUTPUT_CHARACTERS)}\n…输出已截断`
}

function findGeneratedFileHint(output, packageName) {
    const candidates = packageName === UI_PACKAGE ? UI_GENERATED_FILES : CLI_GENERATED_FILES
    for (const relativePath of candidates) {
        if (output.includes(path.posix.basename(relativePath)) || output.includes(relativePath)) return relativePath
    }
    return packageName === UI_PACKAGE ? 'packages/ui 生成文件或生成区域' : 'packages/cli 生成文件或生成区域'
}

function isMissingDependencyOutput(output) {
    return /ERR_MODULE_NOT_FOUND|Cannot find module|ENOENT|找不到模块|缺少依赖/i.test(output)
}

function formatGeneratorFailure(packageName, result) {
    const output = [result.stdout, result.stderr, result.error?.message].filter(Boolean).map(trimGeneratorOutput).filter(Boolean).join('\n')
    const missingDependency = isMissingDependencyOutput(output)
    const fileHint = findGeneratedFileHint(output, packageName)
    const dependencyHint = missingDependency ? '候选快照缺少手写依赖或输入文件' : '候选快照生成检查失败'
    return [
        `✗ ${dependencyHint}：${fileHint}`,
        output || `生成器退出码：${result.exitCode}`,
        `请运行 \`${PACKAGE_COMMAND[packageName]}\` 后重新选择要暂存的文件。`,
        `检查入口：\`node --import tsx scripts/generate.ts --check\`（工作目录：packages/${packageName}）`,
    ].join('\n')
}

function createGeneratorRequest(candidateRoot, packageName) {
    const packageRoot = path.join(candidateRoot, PACKAGE_DIRECTORY[packageName])
    return {
        packageName,
        candidateRoot,
        packageRoot,
        command: [process.execPath, ...GENERATOR_ARGUMENTS],
        environment: {
            ...process.env,
            BRUTX_CANDIDATE_ROOT: candidateRoot,
            BRUTX_GENERATION_SNAPSHOT: '1',
        },
    }
}

function removeOwnedTree(targetPath) {
    let targetStat
    try {
        targetStat = lstatSync(targetPath)
    } catch (error) {
        if (error?.code === 'ENOENT') return
        throw error
    }
    if (!targetStat.isDirectory()) {
        unlinkSync(targetPath)
        return
    }
    for (const entry of readdirSync(targetPath)) removeOwnedTree(path.join(targetPath, entry))
    rmdirSync(targetPath)
}

export async function checkStagedSnapshot(options = {}) {
    const repositoryRoot = getRepositoryRoot(options.repoRoot)
    const stagedPaths = readStagedPaths(repositoryRoot)
    const affectedPackages = determineAffectedPackages(stagedPaths)
    if (affectedPackages.length === 0) return { checked: false, packages: [], stagedPaths }

    const integrityBefore = getRepositoryIntegrity(repositoryRoot)
    const candidateRoot = mkdtempSync(path.join(options.tempDirectory ?? os.tmpdir(), TEMPORARY_DIRECTORY_PREFIX))
    let operationError
    try {
        materializeIndexSnapshot(repositoryRoot, candidateRoot)
        prepareCandidateDependencies(repositoryRoot, candidateRoot)
        for (const packageName of affectedPackages) {
            const request = createGeneratorRequest(candidateRoot, packageName)
            const runner = options.generatorRunner ?? runGenerator
            const result = normalizeGeneratorResult(await runner(request))
            if (result.exitCode !== STATUS_SUCCESS) throw new Error(formatGeneratorFailure(packageName, result))
        }
    } catch (error) {
        operationError = error
    } finally {
        try {
            removeOwnedTree(candidateRoot)
        } catch (cleanupError) {
            operationError ??= cleanupError
        }
    }
    try {
        assertRepositoryIntegrity(repositoryRoot, integrityBefore)
    } catch (integrityError) {
        operationError = integrityError
    }
    if (operationError) throw operationError
    return { checked: true, packages: affectedPackages, stagedPaths }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    checkStagedSnapshot()
        .then(result => {
            if (result.checked) console.log(`✓ 暂存快照检查通过：${result.packages.join('、')}`)
        })
        .catch(error => {
            console.error(error instanceof Error ? error.message : error)
            process.exitCode = STATUS_FAILURE
        })
}
