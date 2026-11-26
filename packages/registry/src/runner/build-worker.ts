import { workerData } from 'node:worker_threads';
import { runBuild, type RunnerOptions } from './build-runner.js';

await runBuild(workerData as RunnerOptions);
