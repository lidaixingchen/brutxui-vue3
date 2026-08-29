/**
 * GitHub Actions Workflow Commands 字符转义工具函数（遵循 GitHub RFC 契约）
 */

/**
 * 转义 property 字段（如 title、file 等）
 * % -> %25, \r -> %0D, \n -> %0A, : -> %3A, , -> %2C
 */
export function escapeGithubProperty(value: string): string {
    return value
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}

/**
 * 转义 data / message 字段
 * % -> %25, \r -> %0D, \n -> %0A
 */
export function escapeGithubData(value: string): string {
    return value
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
