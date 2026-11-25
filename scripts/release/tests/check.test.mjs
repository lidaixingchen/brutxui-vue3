import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { beginReleaseCheck, readPassedReleaseCheck } from '../check-record.mjs';
import { installFakePnpm } from './fake-pnpm.mjs';

const CHECK_PATH = 'scripts/release/check.mjs';
const PREPARE_PATH = 'scripts/release/prepare.mjs';
const RECORD_PATH = 'tmp/release-check.json';
const CHECK_PASSED = /通过 release:check/;

function createFixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-check-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const binDir = path.join(root, 'tmp', 'bin');
    const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}` };
    const write = (file, contents) => {
        const target = path.join(root, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, contents);
    };
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf-8' }).trim();
    const invoke = (file, args, mode) => spawnSync(process.execPath, [file, ...args], {
        cwd: root,
        encoding: 'utf-8',
        env: { ...env, RELEASE_CHECK_FIXTURE_MODE: mode },
    });

    write(CHECK_PATH, fs.readFileSync(new URL('../check.mjs', import.meta.url)));
    write(PREPARE_PATH, fs.readFileSync(new URL('../prepare.mjs', import.meta.url)));
    write('scripts/release/check-record.mjs', fs.readFileSync(new URL('../check-record.mjs', import.meta.url)));
    write('packages/ui/package.json', JSON.stringify({ version: '0.2.0' }));
    write('.gitignore', '/tmp/\n');
    write('scripts/check-contracts-all.mjs', '');
    write('packages/cli/scripts/test-consumers.mjs', '');
    write('scripts/release/tests/run-release-tests.mjs', '');
    git('init', '--quiet');
    git('config', 'user.name', 'Release Test');
    git('config', 'user.email', 'release@example.test');
    git('add', '.');
    git('commit', '--quiet', '-m', 'fixture baseline');
    installFakePnpm(binDir, `
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const recordPath = ${JSON.stringify(RECORD_PATH)};
const checkPath = ${JSON.stringify(CHECK_PATH)};
assert.equal(JSON.parse(readFileSync(recordPath, 'utf8')).status, 'running');
switch (process.env.RELEASE_CHECK_FIXTURE_MODE) {
    case 'fail':
        process.exit(7);
    case 'interrupt':
        process.kill(process.ppid, 'SIGKILL');
        break;
    case 'change-head':
        execFileSync('git', ['commit', '--quiet', '--allow-empty', '-m', 'during check']);
        break;
    case 'missing-head':
        execFileSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/unborn-fixture']);
        break;
    case 'overlap': {
        const nested = spawnSync(process.execPath, [checkPath], {
            env: { ...process.env, RELEASE_CHECK_FIXTURE_MODE: 'fail' },
            encoding: 'utf-8',
        });
        assert.equal(nested.status, 7, nested.stderr);
        break;
    }
}
`);
    const record = () => JSON.parse(fs.readFileSync(path.join(root, RECORD_PATH), 'utf8'));
    const check = (mode = 'pass') => invoke(CHECK_PATH, [], mode);
    const preview = () => {
        const result = invoke(PREPARE_PATH, ['--tag', '--dry-run'], 'pass');
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /\[dry-run\] 将打 annotated tag/);
        assert.equal(git('tag', '--list'), '');
        return result.stdout;
    };
    return { check, git, preview, record, write };
}

test('tag preview follows the latest release check for the current commit', (t) => {
    const { check, git, preview, record, write } = createFixture(t);
    const first = git('rev-parse', 'HEAD');
    assert.doesNotMatch(preview(), CHECK_PASSED);
    write(RECORD_PATH, JSON.stringify({ commit: first, status: 'passed' }));
    assert.doesNotMatch(preview(), CHECK_PASSED);

    const passed = check();
    assert.equal(passed.status, 0, passed.stderr);
    const successfulRun = record();
    assert.equal(successfulRun.commit, first);
    assert.equal(successfulRun.status, 'passed');
    assert.match(preview(), CHECK_PASSED);

    assert.equal(check('fail').status, 7);
    assert.equal(record().commit, first);
    assert.equal(record().status, 'failed');
    assert.notEqual(record().runId, successfulRun.runId);
    assert.doesNotMatch(preview(), CHECK_PASSED);

    assert.equal(check().status, 0);
    assert.match(preview(), CHECK_PASSED);
    assert.equal(check('change-head').status, 1);
    const second = git('rev-parse', 'HEAD');
    assert.notEqual(second, first);
    assert.equal(record().commit, first);
    assert.equal(record().status, 'failed');
    assert.doesNotMatch(preview(), CHECK_PASSED);

    assert.equal(check().status, 0);
    assert.match(preview(), CHECK_PASSED);
    git('checkout', '--quiet', '--detach', first);
    assert.doesNotMatch(preview(), CHECK_PASSED);
});

test('a newer failed check retains ownership when an earlier check finishes', (t) => {
    const { check, preview, record } = createFixture(t);
    const result = check('overlap');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(record().status, 'failed');
    assert.doesNotMatch(preview(), CHECK_PASSED);
});

test('an exception during verification replaces the previous successful record', (t) => {
    const { check, git, preview, record } = createFixture(t);
    const branch = git('symbolic-ref', 'HEAD');
    assert.equal(check().status, 0);
    assert.equal(check('missing-head').status, 1);
    git('symbolic-ref', 'HEAD', branch);
    assert.equal(record().status, 'failed');
    assert.doesNotMatch(preview(), CHECK_PASSED);
});

test('an interrupted check retains its running record', { skip: process.platform === 'win32' }, (t) => {
    const { check, preview, record } = createFixture(t);
    assert.equal(check().status, 0);
    const successfulRun = record();
    assert.equal(check('interrupt').signal, 'SIGKILL');
    assert.equal(record().status, 'running');
    assert.notEqual(record().runId, successfulRun.runId);
    assert.doesNotMatch(preview(), CHECK_PASSED);
});

test('tag reader discards a detached result completed after a newer check starts', {
    skip: process.platform === 'win32',
}, (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-read-race-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const recordPath = path.join(root, RECORD_PATH);
    const commit = 'fixture-head';
    const finishEarlier = beginReleaseCheck(root);
    const readFile = fs.readFileSync;
    const truncate = fs.ftruncateSync;
    const recordModule = new URL('../check-record.mjs', import.meta.url).href;
    let detachedResult;
    let firstRead = true;
    const read = t.mock.method(fs, 'readFileSync', (file, options) => {
        if (file !== recordPath || !firstRead) return readFile(file, options);
        firstRead = false;
        const oldRecord = fs.openSync(file, 'r');
        try {
            finishEarlier(commit, 'passed');
            detachedResult = readFile(oldRecord, options);
            return detachedResult;
        } finally {
            fs.closeSync(oldRecord);
        }
    });
    const swap = t.mock.method(fs, 'ftruncateSync', (descriptor, length) => {
        execFileSync(process.execPath, ['--input-type=module', '--eval', `
            import { beginReleaseCheck } from ${JSON.stringify(recordModule)};
            beginReleaseCheck(process.argv[1])(process.argv[2], 'failed');
        `, root, commit]);
        return truncate(descriptor, length);
    });
    syncBuiltinESMExports();
    try {
        assert.equal(readPassedReleaseCheck(root, commit), undefined);
        assert.equal(JSON.parse(detachedResult).status, 'passed');
        assert.equal(JSON.parse(readFile(recordPath, 'utf8')).status, 'failed');
    } finally {
        read.mock.restore();
        swap.mock.restore();
        syncBuiltinESMExports();
    }
});

test('concurrent starts leave one public result after repeated checks', (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-release-start-race-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const recordPath = path.join(root, RECORD_PATH);
    const commit = 'fixture-head';
    const rename = fs.renameSync;
    const recordModule = new URL('../check-record.mjs', import.meta.url).href;
    const interleave = t.mock.method(fs, 'renameSync', (from, to) => {
        assert.equal(to, recordPath);
        execFileSync(process.execPath, ['--input-type=module', '--eval', `
            import { beginReleaseCheck } from ${JSON.stringify(recordModule)};
            beginReleaseCheck(process.argv[1])(process.argv[2], 'failed');
        `, root, commit]);
        return rename(from, to);
    });
    syncBuiltinESMExports();
    try {
        beginReleaseCheck(root)(commit, 'passed');
    } finally {
        interleave.mock.restore();
        syncBuiltinESMExports();
    }
    const result = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(result.status, 'passed');
    assert.equal(result.commit, commit);
    beginReleaseCheck(root)(commit, 'failed');
    const files = fs.readdirSync(path.dirname(recordPath), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    assert.deepEqual(files, [path.basename(recordPath)]);
});
