import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    loadCandidateArtifacts,
    summarizeCandidateArtifacts,
} from '../../../scripts/testing/consumer-artifacts.mjs';
import {
    C1_COMPONENT_NAMES,
    COLLECTION_COMPONENT_NAMES,
    C1_UPDATE_COMPONENT_NAMES,
    C1_UPDATE_TARGET_FILES,
    C1_BASELINE_SHARED_MODULE_PATH,
    C1_BASELINE_SHARED_MODULE_MARKER,
    C1_BASELINE_MISSING_MODULE_COMPONENT,
    C1_BASELINE_MISSING_MODULE_PATH,
    assertC1BaselineDependencies,
    assertC1UpdateDifferences,
    parseConsumerArguments,
    readPrivateComposableNames,
    selectConsumerTests,
    writeC1Source,
    writeU1Consumer,
} from './test-consumers.mjs';

const collectionFixtureTags = [
    ['select', 'Select'],
    ['command', 'Command'],
    ['combobox', 'Combobox'],
    ['cascader', 'Cascader'],
    ['tree-select', 'TreeSelect'],
    ['tree-view', 'TreeView'],
    ['transfer', 'Transfer'],
    ['dropdown-menu', 'DropdownMenuItem'],
];

test('consumer selector defaults to the two core matrices', () => {
    assert.deepEqual(selectConsumerTests([]), ['U1', 'C1']);
    assert.deepEqual(selectConsumerTests(['--filter', 'u1']), ['U1']);
    assert.deepEqual(selectConsumerTests(['--filter=C3']), ['C3']);
    assert.deepEqual(selectConsumerTests(['--all']), ['U1', 'C1', 'C3']);
});

test('consumer selector returns independent selections', () => {
    const firstSelection = selectConsumerTests([]);
    firstSelection.push('C3');
    assert.deepEqual(selectConsumerTests([]), ['U1', 'C1']);
});

test('consumer selector keeps artifact input separate from matrix selection', () => {
    const parsed = parseConsumerArguments(['--filter', 'C1', '--artifacts', '/tmp/candidate']);
    assert.equal(parsed.filter, 'C1');
    assert.equal(parsed.artifactsPath, '/tmp/candidate');
    assert.deepEqual(parsed.tests, ['C1']);
});

test('private consumer type checks derive composables from the API contract', () => {
    const privateComposableNames = readPrivateComposableNames();

    assert.ok(privateComposableNames.length > 0);
});

test('U1 and C1 fixtures render every collection component and register it with the CLI', () => {
    assert.deepEqual(COLLECTION_COMPONENT_NAMES, collectionFixtureTags.map(([name]) => name));
    assert.ok(COLLECTION_COMPONENT_NAMES.every(name => C1_COMPONENT_NAMES.includes(name)));

    const u1Dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-u1-fixture-test-'));
    const c1Dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c1-fixture-test-'));
    try {
        writeU1Consumer(u1Dir);
        writeC1Source(c1Dir);

        const u1Source = fs.readFileSync(path.join(u1Dir, 'src/App.vue'), 'utf-8');
        const c1Source = fs.readFileSync(path.join(c1Dir, 'src/App.vue'), 'utf-8');
        for (const [name, tag] of collectionFixtureTags) {
            assert.match(u1Source, new RegExp(`<${tag}(?:\\s|>)`), `U1 fixture does not render ${name}`);
            assert.match(c1Source, new RegExp(`<${tag}(?:\\s|>)`), `C1 fixture does not render ${name}`);
        }
        assert.match(u1Source, /<DropdownMenuItem data-tone="danger">/);
        assert.match(c1Source, /<DropdownMenuItem data-tone="danger">/);
    } finally {
        fs.rmSync(u1Dir, { recursive: true, force: true });
        fs.rmSync(c1Dir, { recursive: true, force: true });
    }
});

test('C1 requires a real outdated diff for Button and every collection update target', () => {
    const expectedTargets = ['button', ...collectionFixtureTags.map(([name]) => name)];
    assert.deepEqual(C1_UPDATE_COMPONENT_NAMES, expectedTargets);
    assert.deepEqual(Object.keys(C1_UPDATE_TARGET_FILES), expectedTargets);

    const differences = expectedTargets.map(component => ({ component, integrityStatus: 'outdated' }));
    assert.doesNotThrow(() => assertC1UpdateDifferences(differences));
    assert.throws(
        () => assertC1UpdateDifferences(differences.map(result => ({ ...result, integrityStatus: 'up-to-date' }))),
        /diff 未识别 button/,
    );

    for (const component of expectedTargets) {
        assert.throws(
            () => assertC1UpdateDifferences(differences.filter(result => result.component !== component)),
            new RegExp(`diff 未识别 ${component}`),
        );
    }
});

const invalidSelectorCases = [
    {
        args: ['--filter', 'unknown'],
        message: /Unknown consumer filter "unknown"/,
    },
    {
        args: ['--filter', ''],
        message: /--filter requires a non-empty consumer id/,
    },
    {
        args: ['--filter'],
        message: /--filter requires a non-empty consumer id/,
    },
    {
        args: ['--filter', '--all'],
        message: /--filter requires a non-empty consumer id/,
    },
    {
        args: ['--filter', 'U1', '--filter', 'C1'],
        message: /Duplicate --filter option/,
    },
    {
        args: ['--all', '--filter', 'U1'],
        message: /--all and --filter cannot be used together/,
    },
    {
        args: ['--all', '--all'],
        message: /Duplicate --all option/,
    },
    {
        args: ['--artifacts'],
        message: /--artifacts requires a candidate directory/,
    },
    {
        args: ['--artifacts', ''],
        message: /--artifacts requires a candidate directory/,
    },
    {
        args: ['--artifacts', '/tmp/one', '--artifacts', '/tmp/two'],
        message: /Duplicate --artifacts option/,
    },
    {
        args: ['--unsupported'],
        message: /Unknown consumer option or positional argument/,
    },
    {
        args: ['U1'],
        message: /Unknown consumer option or positional argument/,
    },
];

for (const { args, message } of invalidSelectorCases) {
    test(`rejects invalid consumer selector: ${args.join(' ') || '<empty>'}`, () => {
        assert.throws(() => selectConsumerTests(args), message);
    });
}

test('C1 baseline checks require an older shared module and an absent candidate module', () => {
    const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-c1-baseline-test-'));
    try {
        const sharedModulePath = path.join(consumerDir, 'src/lib/collection-item-variants.ts');
        const missingModulePath = path.join(consumerDir, 'src/components/ui/transfer/transfer-variants.ts');
        fs.mkdirSync(path.dirname(sharedModulePath), { recursive: true });
        fs.mkdirSync(path.dirname(missingModulePath), { recursive: true });
        const candidateSharedContent = 'export const collectionItemVariants = () => "candidate";\n';
        fs.writeFileSync(sharedModulePath, `${C1_BASELINE_SHARED_MODULE_MARKER}${candidateSharedContent}`);

        const projectedTransferComponent = {
            name: C1_BASELINE_MISSING_MODULE_COMPONENT,
            files: [{
                path: C1_BASELINE_MISSING_MODULE_PATH,
                targetPath: missingModulePath,
                content: 'export const transferItemVariants = () => "candidate";\n',
            }],
        };
        const projectedComponents = [
            {
                name: 'select',
                files: [{
                    path: C1_BASELINE_SHARED_MODULE_PATH,
                    targetPath: sharedModulePath,
                    content: candidateSharedContent,
                }],
            },
            {
                name: 'command',
                files: [{
                    path: C1_BASELINE_SHARED_MODULE_PATH,
                    targetPath: sharedModulePath,
                    content: candidateSharedContent,
                }],
            },
            projectedTransferComponent,
        ];

        assert.doesNotThrow(() => assertC1BaselineDependencies(projectedComponents));

        fs.writeFileSync(sharedModulePath, candidateSharedContent);
        assert.throws(
            () => assertC1BaselineDependencies(projectedComponents),
            /旧基线内容/,
        );

        fs.writeFileSync(sharedModulePath, `${C1_BASELINE_SHARED_MODULE_MARKER}${candidateSharedContent}`);
        fs.writeFileSync(missingModulePath, projectedTransferComponent.files[0].content);
        assert.throws(
            () => assertC1BaselineDependencies(projectedComponents),
            /尚不存在的模块/,
        );
    } finally {
        fs.rmSync(consumerDir, { recursive: true, force: true });
    }
});

test('candidate artifact loader validates and normalizes a reusable manifest', () => {
    const candidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-consumer-artifacts-test-'));
    try {
        const uiContent = Buffer.from('ui-candidate');
        const cliContent = Buffer.from('cli-candidate');
        fs.writeFileSync(path.join(candidateDir, 'brutx-ui-vue-0.1.0.tgz'), uiContent);
        fs.writeFileSync(path.join(candidateDir, 'brutx-vue-0.1.0.tgz'), cliContent);
        fs.writeFileSync(
            path.join(candidateDir, 'candidate-manifest.json'),
            JSON.stringify({
                isTestArtifact: true,
                gitCommit: 'candidate-commit',
                packages: {
                    'brutx-ui-vue': {
                        name: 'brutx-ui-vue',
                        version: '0.1.0',
                        tarballFile: 'brutx-ui-vue-0.1.0.tgz',
                    },
                    'brutx-vue': {
                        name: 'brutx-vue',
                        version: '0.1.0',
                        tarballFile: 'brutx-vue-0.1.0.tgz',
                    },
                },
            })
        );

        const manifest = loadCandidateArtifacts(candidateDir);
        assert.equal(manifest.packages['brutx-ui-vue'].tarballPath, path.join(candidateDir, 'brutx-ui-vue-0.1.0.tgz'));
        assert.equal(manifest.packages['brutx-vue'].tarballPath, path.join(candidateDir, 'brutx-vue-0.1.0.tgz'));
        assert.deepEqual(summarizeCandidateArtifacts(manifest), {
            gitCommit: 'candidate-commit',
            packages: {
                'brutx-ui-vue': {
                    version: '0.1.0',
                    sizeBytes: uiContent.length,
                },
                'brutx-vue': {
                    version: '0.1.0',
                    sizeBytes: cliContent.length,
                },
            },
        });
    } finally {
        fs.rmSync(candidateDir, { recursive: true, force: true });
    }
});

test('candidate artifact loader reports a missing tarball', () => {
    const candidateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-consumer-artifacts-test-'));
    try {
        const tarballs = {
            'brutx-ui-vue-0.1.0.tgz': 'ui-candidate',
            'brutx-vue-0.1.0.tgz': 'cli-candidate',
        };
        const packages = {};
        for (const [fileName, content] of Object.entries(tarballs)) {
            fs.writeFileSync(path.join(candidateDir, fileName), content);
            const packageName = fileName.startsWith('brutx-ui-vue') ? 'brutx-ui-vue' : 'brutx-vue';
            packages[packageName] = {
                name: packageName,
                version: '0.1.0',
                tarballFile: fileName,
            };
        }
        fs.unlinkSync(path.join(candidateDir, 'brutx-ui-vue-0.1.0.tgz'));
        fs.writeFileSync(
            path.join(candidateDir, 'candidate-manifest.json'),
            JSON.stringify({ isTestArtifact: true, packages })
        );

        assert.throws(
            () => loadCandidateArtifacts(path.join(candidateDir, 'candidate-manifest.json')),
            /Candidate artifact tarball missing for brutx-ui-vue/
        );
    } finally {
        fs.rmSync(candidateDir, { recursive: true, force: true });
    }
});
