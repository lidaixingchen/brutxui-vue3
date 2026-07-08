import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const uiRoot = path.join(repoRoot, 'packages', 'ui');
const cliRoot = path.join(repoRoot, 'packages', 'cli');

const requiredCommands = [
    ['pnpm', '--filter', 'brutx-ui-vue', 'check:exports'],
    ['pnpm', '--filter', 'brutx-ui-vue', 'build'],
    ['pnpm', '--filter', 'brutx-ui-vue', 'test:package'],
    ['pnpm', '--filter', 'brutx-vue', 'build'],
    ['pnpm', '-r', 'typecheck'],
    ['pnpm', '-r', 'lint'],
    ['pnpm', '--filter', 'brutx-ui-vue', 'test'],
    ['pnpm', '--filter', 'brutx-ui-vue', 'test:visual'],
    ['pnpm', '--filter', 'brutx-vue', 'test'],
    {
        command: 'pnpm',
        args: ['--filter', 'brutx-vue', 'test:integration'],
        env: { BRUTX_RUN_FULL_INTEGRATION_MATRIX: '1' },
    },
    ['pnpm', '--filter', 'brutx-registry-vue', 'build'],
    ['pnpm', '--filter', 'brutx-registry-vue', 'validate'],
    ['pnpm', '--filter', 'docs', 'build'],
];

const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const pnpmExecPath = process.env.npm_execpath?.toLowerCase().includes('pnpm')
    ? process.env.npm_execpath
    : '';

function printGroup(title) {
    console.log(`\n==> ${title}`);
}

function fail(message) {
    throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function assertFileExists(filePath, label) {
    if (!existsSync(filePath)) {
        fail(`${label} is missing: ${path.relative(repoRoot, filePath)}`);
    }
}

function assertFileNonEmpty(filePath, label) {
    assertFileExists(filePath, label);

    const content = readFileSync(filePath, 'utf-8');
    if (content.length === 0) {
        fail(`${label} is empty: ${path.relative(repoRoot, filePath)}`);
    }

    return content;
}

function runCommand(command, args, options = {}) {
    const display = options.displayCommand ?? [command, ...args].join(' ');
    console.log(`$ ${display}`);

    const result = spawnSync(command, args, {
        cwd: options.cwd ?? repoRoot,
        encoding: 'utf-8',
        shell: process.platform === 'win32',
        stdio: options.capture ? 'pipe' : 'inherit',
        env: { ...process.env, ...options.env },
    });

    if (result.error) {
        fail(`Command failed to start: ${display}\n${result.error.message}`);
    }

    if (result.status !== 0) {
        if (options.capture) {
            const stdout = result.stdout ? `\nstdout:\n${result.stdout}` : '';
            const stderr = result.stderr ? `\nstderr:\n${result.stderr}` : '';
            fail(`Command failed with exit code ${result.status}: ${display}${stdout}${stderr}`);
        }
        fail(`Command failed with exit code ${result.status}: ${display}`);
    }

    return result.stdout ?? '';
}

function runPnpm(args, options = {}) {
    if (pnpmExecPath) {
        return runCommand(process.execPath, [pnpmExecPath, ...args], {
            ...options,
            displayCommand: ['pnpm', ...args].join(' '),
        });
    }

    return runCommand('pnpm', args, options);
}

function getReleaseTag() {
    const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
    return tag && tag.startsWith('v') ? tag : '';
}

function checkVersions(uiPackage, cliPackage) {
    printGroup('Checking versions');

    if (!semverPattern.test(uiPackage.version)) {
        fail(`UI package version is not valid semver: ${uiPackage.version}`);
    }
    console.log(`UI package version: ${uiPackage.version}`);

    if (!semverPattern.test(cliPackage.version)) {
        fail(`CLI package version is not valid semver: ${cliPackage.version}`);
    }
    console.log(`CLI package version: ${cliPackage.version}`);

    const tag = getReleaseTag();
    if (!tag) {
        console.log('No release tag detected; skipping tag/version match.');
        return;
    }

    const expectedTag = `v${uiPackage.version}`;
    if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(tag)) {
        fail(`Release tag is not a valid v<semver> tag: ${tag}`);
    }

    if (tag !== expectedTag) {
        fail(`Release tag does not match UI package version. Expected ${expectedTag}, got ${tag}.`);
    }

    console.log(`Release tag matches UI package version: ${tag}`);
}

function collectExportFiles(exportsField) {
    const files = new Set();

    function visit(value) {
        if (typeof value === 'string') {
            files.add(value);
            return;
        }

        if (Array.isArray(value)) {
            for (const item of value) visit(item);
            return;
        }

        if (value && typeof value === 'object') {
            for (const nested of Object.values(value)) visit(nested);
        }
    }

    visit(exportsField);
    return files;
}

function checkUiArtifacts(uiPackage) {
    printGroup('Checking UI exports');

    const required = new Set([
        uiPackage.main,
        uiPackage.module,
        uiPackage.types,
        ...collectExportFiles(uiPackage.exports),
    ]);

    for (const relativeFile of required) {
        const artifactPath = path.join(uiRoot, relativeFile);
        assertFileNonEmpty(artifactPath, `UI export ${relativeFile}`);
        console.log(`ok ${path.relative(repoRoot, artifactPath)}`);
    }
}

function checkCliArtifacts(cliPackage) {
    printGroup('Checking CLI binary');

    const binPath = cliPackage.bin?.['brutx-vue'];
    if (!binPath) {
        fail('CLI package is missing bin.brutx-vue.');
    }

    const binFile = path.join(cliRoot, binPath);
    const mainFile = path.join(cliRoot, cliPackage.main);
    const binContent = assertFileNonEmpty(binFile, 'CLI bin');
    assertFileNonEmpty(mainFile, 'CLI main');

    const firstLine = binContent.split(/\r?\n/, 1)[0];
    if (!firstLine.includes('node')) {
        fail(`CLI bin is missing node shebang: ${path.relative(repoRoot, binFile)}`);
    }

    console.log(`ok ${path.relative(repoRoot, binFile)}`);
    console.log(`ok ${path.relative(repoRoot, mainFile)}`);
}

function runRequiredCommands() {
    printGroup('Running build and tests');

    for (const entry of requiredCommands) {
        const args = Array.isArray(entry) ? entry.slice(1) : entry.args;
        const options = Array.isArray(entry) ? {} : { env: entry.env };
        runPnpm(args, options);
    }
}

function extractJsonPayload(stdout, packageName) {
    const candidates = [];
    const lineStartPattern = /(^|\r?\n)([ \t]*[\[{])/g;
    let match;

    while ((match = lineStartPattern.exec(stdout)) !== null) {
        const prefix = match[1];
        const token = match[2];
        candidates.push(match.index + prefix.length + token.search(/[\[{]/));
    }

    for (let index = candidates.length - 1; index >= 0; index--) {
        const payload = sliceJsonPayload(stdout, candidates[index]);
        if (!payload) continue;

        try {
            if (hasPackFilesList(JSON.parse(payload))) {
                return payload;
            }
        } catch {
            // Keep walking backward. Build tools may print non-JSON lines that
            // start with brackets, such as "[unplugin:dts]".
        }
    }

    fail(`pnpm pack --json output for ${packageName} did not contain parseable pack JSON.\nstdout:\n${stdout}`);
}

function hasPackFilesList(value) {
    if (Array.isArray(value)) {
        return value.some((entry) => Array.isArray(entry?.files));
    }

    return Array.isArray(value?.files);
}

function sliceJsonPayload(stdout, start) {
    const stack = [];
    let inString = false;
    let escape = false;

    for (let index = start; index < stdout.length; index++) {
        const char = stdout[index];

        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            stack.push('}');
        } else if (char === '[') {
            stack.push(']');
        } else if (char === '}' || char === ']') {
            if (stack.pop() !== char) {
                return null;
            }
            if (stack.length === 0) {
                return stdout.slice(start, index + 1);
            }
        }
    }

    return null;
}

function parsePackFiles(stdout, packageName) {
    let parsed;
    try {
        parsed = JSON.parse(extractJsonPayload(stdout, packageName));
    } catch {
        fail(`Failed to parse pnpm pack --json output for ${packageName}.\nstdout:\n${stdout}`);
    }

    const entries = Array.isArray(parsed) ? parsed : [parsed];
    const files = entries.flatMap((entry) => {
        if (Array.isArray(entry?.files)) {
            return entry.files
                .map((file) => file?.path)
                .filter((filePath) => typeof filePath === 'string');
        }
        return [];
    });

    if (files.length === 0) {
        fail(`pnpm pack --json output for ${packageName} did not include a files list.\nstdout:\n${stdout}`);
    }

    return files;
}

function assertPackIncludes(files, expected, packageName) {
    for (const file of expected) {
        if (!files.includes(file)) {
            fail(`${packageName} pack output is missing required file: ${file}`);
        }
        console.log(`ok ${packageName} includes ${file}`);
    }
}

function assertPackExcludes(files, blockedPrefixes, packageName) {
    for (const blockedPrefix of blockedPrefixes) {
        const found = files.find((file) => file === blockedPrefix || file.startsWith(`${blockedPrefix}/`));
        if (found) {
            fail(`${packageName} pack output includes forbidden file: ${found}`);
        }
    }
}

function assertPackExcludesPatterns(files, patterns, packageName) {
    for (const pattern of patterns) {
        const found = files.find((file) => pattern.test(file));
        if (found) {
            fail(`${packageName} pack output includes forbidden file: ${found}`);
        }
    }
}

function checkPackContents() {
    printGroup('Auditing package contents');

    const uiStdout = runPnpm(['pack', '--dry-run', '--json'], { cwd: uiRoot, capture: true });
    const uiFiles = parsePackFiles(uiStdout, 'brutx-ui-vue');
    assertPackIncludes(uiFiles, ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/styles.css'], 'brutx-ui-vue');
    assertPackExcludes(uiFiles, ['src', 'tests', 'visual', 'playwright-report', 'test-results'], 'brutx-ui-vue');
    assertPackExcludesPatterns(uiFiles, [/\.test\./, /\.spec\./], 'brutx-ui-vue');

    const cliStdout = runPnpm(['pack', '--dry-run', '--json'], { cwd: cliRoot, capture: true });
    const cliFiles = parsePackFiles(cliStdout, 'brutx-vue');
    assertPackIncludes(cliFiles, ['dist/index.js'], 'brutx-vue');
    assertPackExcludes(cliFiles, ['src', 'tests'], 'brutx-vue');
    assertPackExcludesPatterns(cliFiles, [/\.test\./, /\.spec\./], 'brutx-vue');
}

function main() {
    try {
        const uiPackage = readJson(path.join(uiRoot, 'package.json'));
        const cliPackage = readJson(path.join(cliRoot, 'package.json'));

        checkVersions(uiPackage, cliPackage);
        runRequiredCommands();
        checkUiArtifacts(uiPackage);
        checkCliArtifacts(cliPackage);
        checkPackContents();

        console.log('\nRelease check passed.');
    } catch (error) {
        console.error('\nRelease check failed.');
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
