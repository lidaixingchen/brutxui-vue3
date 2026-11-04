import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ProcessTreeManager } from './consumer-artifacts.mjs';

export const MAX_CONSUMER_CONCURRENCY = 2;
export const CONSUMER_RESULTS_PATH_ENV = 'BRUTX_CONSUMER_RESULTS_PATH';

const CHILD_EXIT_SUCCESS = 0;
const SIGNAL_EXIT_CODES = Object.freeze({ SIGINT: 130, SIGTERM: 143 });

function waitForExit(child) {
    return new Promise(resolve => {
        let spawnError;
        child.once('error', error => {
            spawnError = error;
        });
        child.once('close', (exitCode, signal) => {
            resolve({
                exitCode,
                signal,
                error: spawnError?.message,
            });
        });
    });
}

function createChild({ id, scriptPath, artifactsPath, evidenceDirectory, resultsDirectory, env, spawnProcess }) {
    const workerDirectory = path.join(resultsDirectory, id);
    fs.mkdirSync(workerDirectory, { recursive: true });
    const resultsPath = path.join(workerDirectory, 'consumer-results.json');
    const childEnv = {
        ...env,
        BRUTX_CONSUMER_EVIDENCE_DIR: path.join(evidenceDirectory, id),
        [CONSUMER_RESULTS_PATH_ENV]: resultsPath,
    };
    const child = spawnProcess(process.execPath, [
        scriptPath,
        '--filter', id,
        '--artifacts', artifactsPath,
    ], {
        env: childEnv,
        stdio: 'inherit',
        detached: process.platform !== 'win32',
    });

    return { child, resultsPath };
}

export async function runConsumerMatrix({
    tests,
    scriptPath,
    artifactsPath,
    evidenceDirectory,
    resultsDirectory,
    env = process.env,
    processManager = new ProcessTreeManager(),
    spawnProcess = spawn,
}) {
    if (!Array.isArray(tests) || tests.length === 0) {
        throw new Error('At least one consumer matrix is required.');
    }
    if (new Set(tests).size !== tests.length) {
        throw new Error('Consumer matrix ids must be unique.');
    }

    fs.mkdirSync(evidenceDirectory, { recursive: true });
    fs.mkdirSync(resultsDirectory, { recursive: true });

    const outcomes = new Map();
    const activeChildren = new Map();
    let nextIndex = 0;
    let stopScheduling = false;

    const stopActiveChildren = async () => {
        stopScheduling = true;
        await Promise.all(
            [...activeChildren.values()].map(({ child }) => processManager.killProcessTree(child.pid))
        );
    };

    const worker = async () => {
        while (!stopScheduling && nextIndex < tests.length) {
            const id = tests[nextIndex++];
            let childRecord;
            let resultsPath;
            let status;

            try {
                childRecord = createChild({
                    id,
                    scriptPath,
                    artifactsPath,
                    evidenceDirectory,
                    resultsDirectory,
                    env,
                    spawnProcess,
                });
                resultsPath = childRecord.resultsPath;
                processManager.track(childRecord.child, `consumer matrix ${id}`);
                activeChildren.set(id, childRecord);
                status = await waitForExit(childRecord.child);
            } catch (error) {
                status = { exitCode: null, signal: null, error: error.message };
            }

            activeChildren.delete(id);
            outcomes.set(id, {
                id,
                started: childRecord !== undefined,
                resultsPath,
                ...status,
            });

            if (status.exitCode !== CHILD_EXIT_SUCCESS) {
                await stopActiveChildren();
            }
        }
    };

    const workerCount = Math.min(MAX_CONSUMER_CONCURRENCY, tests.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return tests.map(id => outcomes.get(id) ?? {
        id,
        started: false,
        exitCode: null,
        signal: null,
        error: 'Not started after another consumer matrix failed.',
    });
}

export function registerConsumerMatrixSignalHandlers(processManager, signalTarget = process) {
    for (const [signal, exitCode] of Object.entries(SIGNAL_EXIT_CODES)) {
        signalTarget.on(signal, async () => {
            await processManager.cleanupAll();
            signalTarget.exit(exitCode);
        });
    }
}
