import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { ProcessTreeManager } from './consumer-artifacts.mjs';
import {
    MAX_CONSUMER_CONCURRENCY,
    registerConsumerMatrixSignalHandlers,
    runConsumerMatrix,
} from './consumer-matrix.mjs';

const POLL_INTERVAL_MS = 20;
const PROCESS_WAIT_TIMEOUT_MS = 5000;
const WORKER_DELAY_MS = 400;
const FAILURE_DELAY_MS = 80;
const FAILURE_EXIT_CODE = 7;

const workerSource = String.raw`
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (option) => args[args.indexOf(option) + 1];
const id = valueAfter('--filter');
const artifactsPath = valueAfter('--artifacts');
const appendEvent = (event) => fs.appendFileSync(process.env.EVENTS_PATH, JSON.stringify({ event, id, pid: process.pid, time: Date.now() }) + '\n');
const wait = (duration) => new Promise(resolve => setTimeout(resolve, duration));

appendEvent('start');
if (process.env.BARRIER_DIRECTORY) {
    fs.writeFileSync(path.join(process.env.BARRIER_DIRECTORY, id), 'ready');
    while (!fs.existsSync(path.join(process.env.BARRIER_DIRECTORY, 'release'))) {
        await wait(Number(process.env.POLL_INTERVAL_MS));
    }
}
if (process.env.FAIL_ID === id) {
    await wait(Number(process.env.FAILURE_DELAY_MS));
    process.exit(Number(process.env.FAILURE_EXIT_CODE));
}

await wait(Number(process.env.WORKER_DELAY_MS));
const artifactContents = fs.readFileSync(artifactsPath, 'utf-8');
const evidencePath = path.join(process.env.BRUTX_CONSUMER_EVIDENCE_DIR, id, 'evidence.json');
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, JSON.stringify({ id, artifactContents }));
const result = {
    id,
    success: true,
    durationMs: Number(process.env.WORKER_DELAY_MS),
    artifactsPath,
    artifactContents,
    evidencePath,
    resultsPath: process.env.BRUTX_CONSUMER_RESULTS_PATH,
};
fs.mkdirSync(path.dirname(result.resultsPath), { recursive: true });
fs.writeFileSync(result.resultsPath, JSON.stringify({ results: [result] }));
appendEvent('end');
`;

function createTempDirectory(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createWorkerEnvironment(overrides = {}) {
    const env = { ...process.env, ...overrides };
    delete env.NODE_TEST_CONTEXT;
    return env;
}

function makeRunnerFixture(directory) {
    const scriptPath = path.join(directory, 'consumer-worker.mjs');
    fs.writeFileSync(scriptPath, workerSource);
    return scriptPath;
}

function activeWorkerMaximum(events) {
    const active = new Set();
    let maximum = 0;
    for (const { event, id } of events) {
        if (event === 'start') active.add(id);
        if (event === 'end') active.delete(id);
        maximum = Math.max(maximum, active.size);
    }
    return maximum;
}

async function waitForFile(filePath) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < PROCESS_WAIT_TIMEOUT_MS) {
        if (fs.existsSync(filePath)) return;
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(`Timed out waiting for ${filePath}`);
}

test('consumer matrix uses one shared artifact with isolated per-consumer evidence and results', async () => {
    const directory = createTempDirectory('brutx-consumer-matrix-test-');
    const processManager = new ProcessTreeManager();
    try {
        const scriptPath = makeRunnerFixture(directory);
        const artifactsPath = path.join(directory, 'candidate-manifest.json');
        const artifactContents = JSON.stringify({ candidate: 'shared-read-only-input' });
        fs.writeFileSync(artifactsPath, artifactContents);
        const eventsPath = path.join(directory, 'events.jsonl');
        const evidenceDirectory = path.join(directory, 'evidence');
        const resultsDirectory = path.join(directory, 'results');
        const tests = ['U1', 'C1', 'C3'];

        const barrierDirectory = path.join(directory, 'barrier');
        fs.mkdirSync(barrierDirectory);
        const execution = runConsumerMatrix({
            tests,
            scriptPath,
            artifactsPath,
            evidenceDirectory,
            resultsDirectory,
            env: createWorkerEnvironment({
                EVENTS_PATH: eventsPath,
                BARRIER_DIRECTORY: barrierDirectory,
                POLL_INTERVAL_MS: String(POLL_INTERVAL_MS),
                WORKER_DELAY_MS: String(WORKER_DELAY_MS),
            }),
            processManager,
        });
        await Promise.all(tests.slice(0, MAX_CONSUMER_CONCURRENCY).map(id => waitForFile(path.join(barrierDirectory, id))));
        fs.writeFileSync(path.join(barrierDirectory, 'release'), 'release');
        const outcomes = await execution;

        assert.equal(outcomes.length, tests.length);
        assert.ok(outcomes.every(outcome => outcome.started && outcome.exitCode === 0));
        assert.equal(new Set(outcomes.map(outcome => outcome.resultsPath)).size, tests.length);
        assert.ok(outcomes.every(outcome => outcome.resultsPath.endsWith(path.join(outcome.id, 'consumer-results.json'))));

        const events = fs.readFileSync(eventsPath, 'utf-8').trim().split('\n').map(line => JSON.parse(line));
        assert.equal(activeWorkerMaximum(events), MAX_CONSUMER_CONCURRENCY);
        assert.deepEqual(fs.readFileSync(artifactsPath, 'utf-8'), artifactContents);

        const results = outcomes.map(outcome => JSON.parse(fs.readFileSync(outcome.resultsPath, 'utf-8')).results[0]);
        assert.ok(results.every(result => result.artifactsPath === artifactsPath));
        assert.ok(results.every(result => result.artifactContents === artifactContents));
        assert.equal(new Set(results.map(result => result.evidencePath)).size, tests.length);
        assert.ok(results.every(result => fs.existsSync(result.evidencePath)));
    } finally {
        await processManager.cleanupAll();
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('consumer matrix starts only the configured number of child processes at once', async () => {
    const directory = createTempDirectory('brutx-consumer-matrix-limit-test-');
    try {
        const artifactsPath = path.join(directory, 'candidate-manifest.json');
        const artifactContents = 'shared candidate';
        fs.writeFileSync(artifactsPath, artifactContents);
        const events = [];
        const children = new Map();
        let nextPid = 1;
        let activeCount = 0;
        let maximumActiveCount = 0;

        const finishChild = (child, exitCode, signal) => {
            if (child.closed) return;
            child.closed = true;
            activeCount -= 1;
            child.emit('close', exitCode, signal);
        };
        const processManager = {
            track(child) {
                children.set(child.pid, child);
            },
            async killProcessTree(pid) {
                const child = children.get(pid);
                if (child) finishChild(child, null, 'SIGTERM');
            },
        };
        const spawnProcess = (_command, args, options) => {
            const id = args[2];
            const artifactsArgument = args[4];
            const child = new EventEmitter();
            child.pid = nextPid++;
            activeCount += 1;
            maximumActiveCount = Math.max(maximumActiveCount, activeCount);
            events.push({ event: 'start', id });

            setTimeout(() => {
                if (child.closed) return;
                const contents = fs.readFileSync(artifactsArgument, 'utf-8');
                const evidencePath = path.join(options.env.BRUTX_CONSUMER_EVIDENCE_DIR, id, 'evidence.json');
                fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
                fs.writeFileSync(evidencePath, contents);
                const resultsPath = options.env.BRUTX_CONSUMER_RESULTS_PATH;
                fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
                fs.writeFileSync(resultsPath, JSON.stringify({ results: [{ id, success: true, artifactsArgument, evidencePath, resultsPath }] }));
                events.push({ event: 'end', id });
                finishChild(child, 0, null);
            }, WORKER_DELAY_MS);

            return child;
        };

        const outcomes = await runConsumerMatrix({
            tests: ['U1', 'C1', 'C3'],
            scriptPath: path.join(directory, 'unused-worker.mjs'),
            artifactsPath,
            evidenceDirectory: path.join(directory, 'evidence'),
            resultsDirectory: path.join(directory, 'results'),
            processManager,
            spawnProcess,
        });

        assert.equal(maximumActiveCount, MAX_CONSUMER_CONCURRENCY);
        assert.ok(outcomes.every(outcome => outcome.exitCode === 0));
        assert.equal(new Set(outcomes.map(outcome => outcome.resultsPath)).size, outcomes.length);
        assert.deepEqual(events.filter(event => event.event === 'start').map(event => event.id), ['U1', 'C1', 'C3']);
        assert.ok(outcomes.every(outcome => {
            const result = JSON.parse(fs.readFileSync(outcome.resultsPath, 'utf-8')).results[0];
            return result.artifactsArgument === artifactsPath
                && result.resultsPath === outcome.resultsPath
                && fs.existsSync(result.evidencePath)
                && fs.readFileSync(result.evidencePath, 'utf-8') === artifactContents;
        }));
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('consumer matrix propagates failures, stops active siblings, and records unstarted matrices', async () => {
    const directory = createTempDirectory('brutx-consumer-matrix-failure-test-');
    try {
        const scriptPath = makeRunnerFixture(directory);
        const artifactsPath = path.join(directory, 'candidate-manifest.json');
        fs.writeFileSync(artifactsPath, 'shared candidate');
        const outcomes = await runConsumerMatrix({
            tests: ['U1', 'C1', 'C3'],
            scriptPath,
            artifactsPath,
            evidenceDirectory: path.join(directory, 'evidence'),
            resultsDirectory: path.join(directory, 'results'),
            env: createWorkerEnvironment({
                EVENTS_PATH: path.join(directory, 'events.jsonl'),
                FAIL_ID: 'U1',
                FAILURE_DELAY_MS: String(FAILURE_DELAY_MS),
                FAILURE_EXIT_CODE: String(FAILURE_EXIT_CODE),
                WORKER_DELAY_MS: String(PROCESS_WAIT_TIMEOUT_MS),
            }),
            processManager: new ProcessTreeManager(),
        });

        assert.equal(outcomes.length, 3);
        assert.equal(outcomes[0].exitCode, FAILURE_EXIT_CODE);
        assert.equal(outcomes[1].started, true);
        assert.notEqual(outcomes[1].exitCode, 0);
        assert.ok(outcomes[1].signal || Number.isInteger(outcomes[1].exitCode));
        assert.equal(outcomes[2].started, false);
        assert.match(outcomes[2].error, /Not started/);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

const signalCases = [
    ['SIGINT', 130],
    ['SIGTERM', 143],
];

for (const [signal, expectedExitCode] of signalCases) {
    test(`${signal} cleans up tracked consumer children and exits with its conventional code`, async () => {
        const directory = createTempDirectory('brutx-consumer-matrix-signal-test-');
        const readyPath = path.join(directory, 'worker.ready');
        const stoppedPath = path.join(directory, 'worker.stopped');
        const workerPath = path.join(directory, 'signal-worker.mjs');
        fs.writeFileSync(workerPath, [
            "import fs from 'node:fs'",
            "process.on('SIGTERM', () => {",
            "  fs.writeFileSync(process.env.STOPPED_PATH, 'stopped')",
            '  process.exit(0)',
            '})',
            "fs.writeFileSync(process.env.READY_PATH, 'ready')",
            'setInterval(() => {}, 1000)',
        ].join('\n'));

        const processManager = new ProcessTreeManager();
        const worker = spawn(process.execPath, [workerPath], {
            detached: process.platform !== 'win32',
            stdio: 'ignore',
            env: createWorkerEnvironment({
                READY_PATH: readyPath,
                STOPPED_PATH: stoppedPath,
            }),
        });
        const workerExit = new Promise(resolve => worker.once('close', resolve));
        processManager.track(worker, 'signal cleanup fixture');

        try {
            await waitForFile(readyPath);
            const signalTarget = new EventEmitter();
            let complete;
            const exitPromise = new Promise(resolve => {
                complete = resolve;
            });
            signalTarget.exit = complete;
            registerConsumerMatrixSignalHandlers(processManager, signalTarget);
            signalTarget.emit(signal);

            assert.equal(await exitPromise, expectedExitCode);
            await workerExit;
            assert.equal(processManager.isRunning(worker.pid), false);
            if (process.platform !== 'win32') {
                assert.equal(fs.readFileSync(stoppedPath, 'utf-8'), 'stopped');
            }
        } finally {
            await processManager.cleanupAll();
            fs.rmSync(directory, { recursive: true, force: true });
        }
    });
}
