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
        case 'REGISTRY_OFFLINE_UNAVAILABLE':
            return [
                'Offline mode is active (BRUTX_OFFLINE=1 or --offline) and the requested component is not in cache.',
                'Run without --offline to fetch from the registry, or pre-cache the component by running add/list --check-updates while online.',
            ];
        case 'REGISTRY_SIGNATURE_INVALID':
            return [
                'The registry manifest signature verification failed. This may indicate tampering or a mismatched signing key.',
                'Verify BRUTX_REGISTRY_PUBLIC_KEYS matches the registry publisher\'s public keys, or unset it to skip verification (not recommended for production).',
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
