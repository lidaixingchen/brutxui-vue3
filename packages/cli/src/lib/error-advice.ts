import type { CliError } from './error.js';

export function getCliErrorAdvice(error: CliError): string[] {
    switch (error.code) {
        case 'CONFIG_NOT_FOUND':
            return [
                'Run brutx-vue init to create components.json.',
                'Run brutx-vue doctor to diagnose project setup.',
            ];
        case 'CONFIG_INVALID':
            return [
                'Run brutx-vue doctor --fix to repair fixable configuration issues.',
                'Use brutx-vue init --force only if you want to regenerate the config.',
            ];
        case 'REGISTRY_FETCH_FAILED':
            return [
                'Check your network connection or pass --registry with a reachable registry.',
                'Use --no-cache if cached registry data may be stale.',
            ];
        case 'REGISTRY_INTEGRITY_FAILED':
            return [
                'Use --no-cache to refetch registry data.',
                'If you use a custom registry, rebuild and validate it before retrying.',
            ];
        case 'REGISTRY_VERSION_UNSUPPORTED':
            return [
                'The @version syntax requires a GitHub raw URL registry.',
                'Use --registry to specify a GitHub raw URL, or remove @version from the component name.',
            ];
        case 'PATH_UNSAFE':
            return [
                'Check the target path and aliases in components.json.',
                'Brutx-Vue refuses to write outside the project directory.',
            ];
        case 'WRITE_FAILED':
            return [
                'Check file permissions and whether target files are locked.',
                'Run brutx-vue doctor --fix to repair known project issues.',
            ];
        case 'UNKNOWN':
        default:
            return [
                'Try running brutx-vue doctor to diagnose project issues.',
            ];
    }
}
