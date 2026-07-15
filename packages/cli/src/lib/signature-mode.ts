/**
 * 签名严格模式开关（P1-6）
 *
 * 触发条件（任一即可）：
 *   - 环境变量 `BRUTX_REQUIRE_SIGNATURE=1`
 *   - 全局 CLI flag `--require-signature`（在 index.ts 注册）
 *
 * 语义：manifest 签名校验失败时，默认行为是 `warn`（不阻塞发布，避免迁移期卡死）；
 *   严格模式激活时，失败行为升级为 `error`（抛 REGISTRY_SIGNATURE_INVALID）。
 *
 * 设计依据（见 AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md 风险与取舍）：
 *   "不要让签名变成发布阻塞：签名验证失败时默认 warn 而非 error，
 *    除非用户显式 --require-signature，避免迁移期卡死。"
 */

const REQUIRE_SIGNATURE_ENV = 'BRUTX_REQUIRE_SIGNATURE';

let globalRequireSignature = false;

/**
 * 检测环境变量是否激活严格签名模式。
 */
export function isRequireSignatureEnvActive(): boolean {
    return process.env[REQUIRE_SIGNATURE_ENV] === '1';
}

/**
 * 返回当前严格签名模式状态（含环境变量检测）。
 */
export function isRequireSignature(): boolean {
    return globalRequireSignature || isRequireSignatureEnvActive();
}

/**
 * 设置全局严格签名模式。
 * 由 index.ts 在解析全局 --require-signature flag 后调用。
 * 测试可通过此函数直接控制。
 */
export function setRequireSignature(enabled: boolean): void {
    globalRequireSignature = enabled;
}

/**
 * 重置严格签名模式状态（供测试隔离使用）。
 */
export function resetRequireSignature(): void {
    globalRequireSignature = false;
}
