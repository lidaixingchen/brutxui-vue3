/**
 * 全局 dry-run 开关（P1-8）
 *
 * 触发条件（任一即可）：
 *   - 环境变量 `BRUTX_DRY_RUN=1`
 *   - 全局 CLI flag `--dry-run`（在 index.ts 注册，由 commander 传入）
 *
 * 语义：所有写操作只打印将写入的路径，不落盘。
 * 与命令级 `--dry-run` 的关系：全局开关激活时，命令级 flag 自动生效；
 * 命令级 `--dry-run` 仍可单独使用，不影响全局。
 *
 * 实现策略：在每个命令入口处调用 `mergeDryRun(options.dryRun)` 合并全局与命令级标志，
 * 将合并后的有效 dry-run 传给所有子函数。现有 writeComponentFiles / manifest 写入 /
 * removeComponents 已支持 dry-run 语义，只需传入合并后的标志。
 */

const DRY_RUN_ENV = 'BRUTX_DRY_RUN';

/**
 * 全局 dry-run 状态（进程级）。
 * 由 index.ts 在解析 CLI 后调用 setGlobalDryRun 设置；
 * 测试可通过 setGlobalDryRun 直接控制。
 */
let globalDryRunEnabled = false;

/**
 * 检测环境变量是否激活全局 dry-run。
 */
export function isDryRunEnvActive(): boolean {
    return process.env[DRY_RUN_ENV] === '1';
}

/**
 * 返回当前全局 dry-run 状态（含环境变量检测）。
 */
export function isGlobalDryRun(): boolean {
    return globalDryRunEnabled || isDryRunEnvActive();
}

/**
 * 设置全局 dry-run 状态。
 * 由 index.ts 在解析全局 --dry-run flag 后调用。
 * 测试可通过此函数直接控制。
 */
export function setGlobalDryRun(enabled: boolean): void {
    globalDryRunEnabled = enabled;
}

/**
 * 合并命令级 dry-run 与全局 dry-run。
 * 任一为 true 则有效 dry-run 为 true。
 */
export function mergeDryRun(commandDryRun?: boolean): boolean {
    return commandDryRun === true || isGlobalDryRun();
}

/**
 * 重置全局 dry-run 状态（供测试隔离使用）。
 */
export function resetGlobalDryRun(): void {
    globalDryRunEnabled = false;
}

/**
 * 打印 dry-run 模式下将执行的操作。
 * 统一格式：`[Dry Run] Would <action>: <path>`
 */
export function printDryRunAction(action: string, target: string): void {
    // 动态导入避免循环依赖
    void import('./logger.js').then(({ logger }) => {
        logger.info(`[Dry Run] Would ${action}: ${target}`);
    });
}
