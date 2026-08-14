/**
 * 共享交互变体机制契约与实现说明：
 *
 * ① 完整类名字面量（@source 契约）：styles.css 的 @source 指令声明扫描 src 下所有 .vue/.ts
 *    源码（含本文件），Tailwind 按源码字面量逐个匹配，每个完整类名必须是可扫描源码中的
 *    字面量；禁止类名内部 ${...} 插值；允许「完整字面量常量 + ${} 组合」（本文件即样板）。
 *    机制见 docs/guides/TAILWIND_V4_MECHANISMS.md §4。
 * ② data-* 复合变体字节序（竞态）：产物字节序 hover:* < focus:* < active:* < data-[highlighted]:*
 *    < data-[state=on]:* 等，同特异度 (0,2,0) 恒后者胜 → data-* 恒压过 brutalPress 的 active:*；
 *    需在持久 data-* 态下保留瞬态按压反馈时写 data-*:active:... 复合变体（特异度 0,3,0）；
 *    持久态下取消按压反馈则删引用并注释，严禁保留永不生效的导入。
 *    按压位移 X/Y 各等于阴影偏移（--brutal-shadow-offset-x/y，盖影语义），
 *    translate-x-[阴影偏移] 本身即是对 hover 侧滑的覆盖重置，无需 translate-x-0。
 * ③ 管辖分界：brutalPress（瞬态 active）vs brutalPressedState（持久 data-* 态）；持久「保持按下」
 *    态必须复用 brutalPressedState / brutalPressedStateOn 语义，严禁内联手抄 fallback 字面量；
 *    switch/checkbox 的 checked 位移驱动独立 thumb 元素属合法边界；按压位移一律派生自
 *    --brutal-shadow-offset-x/y（单一事实来源），组件私有尺度去令牌化为字面量。
 */

/**
 * 按压位移完整类名字面量（引用全局样式 styles.css 的 --brutal-shadow-offset-x/y，默认 4px）。
 * 必须保存完整类名而非插值片段：Tailwind 源码扫描器无法从 ${...} 动态拼接中
 * 提取类名，完整字面量才能保证产物 CSS 始终包含该工具类。
 */
const pressX = 'active:translate-x-[var(--brutal-shadow-offset-x,4px)]'
const pressY = 'active:translate-y-[var(--brutal-shadow-offset-y,4px)]'
const pressedStateX = 'translate-x-[var(--brutal-shadow-offset-x,4px)]'
const pressedStateY = 'translate-y-[var(--brutal-shadow-offset-y,4px)]'

// 位移/阴影基础片段：各导出从这里派生，保证单一事实来源。
// 后续调整位移距离或阴影等级只需修改对应片段。
const hoverLiftLg = 'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftSm = 'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftLgNoX = 'hover:shadow-brutal-lg hover:-translate-y-0.5'
const hoverLiftSmNoX = 'hover:shadow-brutal hover:-translate-y-0.5'

export const brutalHoverLift = hoverLiftLg

const brutalHighlightLift = 'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'

export const brutalPress = `${pressX} ${pressY} active:shadow-none`

// 永久按下态（无 active: 前缀）：供 copied/selected 等「保持按下」状态引用，
// 与 brutalPress 共享位移/阴影语义，避免两处硬编码 fallback 脱同步
export const brutalPressedState = `${pressedStateX} ${pressedStateY} shadow-none`

// 持久「开启态保持按下」版本（data-[state=on] 前缀，特异度 0,2,0）。
// translate-x-[阴影偏移] 即是对 hoverLift X 轴侧滑的覆盖重置（同字节序机制）；
// 其他持久 data-* 态（selected 等）需要同样语义时在此派生对应前缀版本，勿内联手抄 fallback。
export const brutalPressedStateOn = 'data-[state=on]:translate-x-[var(--brutal-shadow-offset-x,4px)] data-[state=on]:translate-y-[var(--brutal-shadow-offset-y,4px)] data-[state=on]:shadow-none'

// 高亮项按压反馈复合变体（data-[highlighted]:active，特异度 0,3,0 压过 data-* 的 0,2,0）：
// command 等 data-[highlighted] 高亮项在按压时恢复位移/去影反馈，位移同为阴影偏移（盖影语义）；
// fallback 与 brutalPress/brutalPressedStateOn 同源派生（--brutal-shadow-offset-x/y），勿内联手抄
export const brutalHighlightPress = 'data-[highlighted]:active:translate-x-[var(--brutal-shadow-offset-x,4px)] data-[highlighted]:active:translate-y-[var(--brutal-shadow-offset-y,4px)] data-[highlighted]:active:shadow-none'

// Derived interaction variants（共享片段派生，单一事实来源）。
// brutalPressWithTransition / brutalHoverLiftWithTransition / brutalPressWithShadowSm 已删除：
// 过渡属性须按场景显式声明（见审查报告 §八修复模板），WithTransition 组合为死导出，不再提供。
export const brutalHoverLiftSm = hoverLiftSm
export const brutalHoverLiftNoX = hoverLiftLgNoX
export const brutalHoverLiftSmNoX = hoverLiftSmNoX
export const brutalHighlightLiftWithBorder = `${brutalHighlightLift} data-[highlighted]:border-brutal`
