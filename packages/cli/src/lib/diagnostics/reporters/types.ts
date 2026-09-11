import type { DiagnosticReport } from '../types.js';

export interface ReporterOptions {
    cwd: string;
    failOn?: 'error' | 'warn' | 'drift';
    silent?: boolean;
    outputFile?: string;
    write?: (message: string) => void;
    stepSummaryPath?: string | false;
}

export interface DiagnosticReporter {
    readonly name: string;
    render(report: DiagnosticReport, options: ReporterOptions): Promise<void>;
}
