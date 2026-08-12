/**
 * 按压位移完整类名字面量（引用全局样式 styles.css 的 --brutal-pressed-offset，默认 2px）。
 * 必须保存完整类名而非插值片段：Tailwind 源码扫描器无法从 `${...}` 动态拼接中
 * 提取类名，完整字面量才能保证产物 CSS 始终包含该工具类。
 */
const pressedOffsetBase = 'translate-y-[var(--brutal-pressed-offset,2px)]'
const pressedOffset = 'active:translate-y-[var(--brutal-pressed-offset,2px)]'

// 位移/阴影基础片段：各导出从这里派生，保证单一事实来源。
// 后续调整位移距离或阴影等级只需修改对应片段。
const hoverLiftLg = 'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftSm = 'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftLgNoX = 'hover:shadow-brutal-lg hover:-translate-y-0.5'
const hoverLiftSmNoX = 'hover:shadow-brutal hover:-translate-y-0.5'

export const brutalHoverLift = hoverLiftLg

export const brutalHighlightLift = 'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'

export const brutalPress = `${pressedOffset} active:shadow-none`

// 永久按下态（无 active: 前缀）：供 copied/selected 等「保持按下」状态引用，
// 与 brutalPress 共享位移/阴影语义，避免两处硬编码 fallback 脱同步
export const brutalPressedState = `${pressedOffsetBase} shadow-none`

// Derived interaction variants
// 过渡仅限 transform/box-shadow，避免 transition-all 对其他可动画属性（颜色等）产生不必要的开销
export const brutalPressWithTransition = `${brutalPress} transition-[transform,box-shadow]`
export const brutalHoverLiftWithTransition = `${brutalHoverLift} transition-[transform,box-shadow]`
export const brutalHoverLiftSm = hoverLiftSm
export const brutalHoverLiftNoX = hoverLiftLgNoX
export const brutalHoverLiftSmNoX = hoverLiftSmNoX
export const brutalPressWithShadowSm = `${pressedOffset} active:shadow-brutal-sm`
export const brutalHighlightLiftWithBorder = `${brutalHighlightLift} data-[highlighted]:border-brutal`
