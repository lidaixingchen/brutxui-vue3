export class CliError extends Error {
    public readonly code: number;

    constructor(message: string, code: number = 1) {
        super(message);
        this.name = 'CliError';
        this.code = code;
    }
}
