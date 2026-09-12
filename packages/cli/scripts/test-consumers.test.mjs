import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    loadCandidateArtifacts,
    summarizeCandidateArtifacts,
} from '../../../scripts/testing/consumer-artifacts.mjs';
import {
    parseConsumerArguments,
    selectConsumerTests,
} from './test-consumers.mjs';

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

function sha256(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

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
                        sha256: sha256(uiContent),
                    },
                    'brutx-vue': {
                        name: 'brutx-vue',
                        version: '0.1.0',
                        tarballFile: 'brutx-vue-0.1.0.tgz',
                        sha256: sha256(cliContent),
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
                    sha256: sha256(uiContent),
                    sizeBytes: uiContent.length,
                },
                'brutx-vue': {
                    version: '0.1.0',
                    sha256: sha256(cliContent),
                    sizeBytes: cliContent.length,
                },
            },
        });
    } finally {
        fs.rmSync(candidateDir, { recursive: true, force: true });
    }
});

test('candidate artifact loader rejects a changed tarball', () => {
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
                sha256: sha256(content),
            };
        }
        packages['brutx-ui-vue'].sha256 = sha256('changed-candidate');
        fs.writeFileSync(
            path.join(candidateDir, 'candidate-manifest.json'),
            JSON.stringify({ isTestArtifact: true, packages })
        );

        assert.throws(
            () => loadCandidateArtifacts(path.join(candidateDir, 'candidate-manifest.json')),
            /Candidate artifact sha256 mismatch for brutx-ui-vue/
        );
    } finally {
        fs.rmSync(candidateDir, { recursive: true, force: true });
    }
});
