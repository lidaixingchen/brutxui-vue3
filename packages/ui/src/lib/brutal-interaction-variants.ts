/**
 * 按压位移 CSS 变量（定义于全局样式 styles.css，默认 2px）。
 * 收敛为单一常量，避免多处重复硬编码导致回退值与全局令牌漂移。
 */
const pressedOffset = 'var(--brutal-pressed-offset,2px)'

// 位移/阴影基础片段：各导出从这里派生，保证单一事实来源。
// 后续调整位移距离或阴影等级只需修改对应片段。
const hoverLiftLg = 'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftSm = 'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'
const hoverLiftLgNoX = 'hover:shadow-brutal-lg hover:-translate-y-0.5'
const hoverLiftSmNoX = 'hover:shadow-brutal hover:-translate-y-0.5'

export const brutalHoverLift = hoverLiftLg

export const brutalHighlightLift = 'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'

export const brutalPress = `active:translate-y-[${pressedOffset}] active:shadow-none`

// Derived interaction variants
// 过渡仅限 transform/box-shadow，避免 transition-all 对其他可动画属性（颜色等）产生不必要的开销
export const brutalPressWithTransition = `${brutalPress} transition-[transform,box-shadow]`
export const brutalHoverLiftWithTransition = `${brutalHoverLift} transition-[transform,box-shadow]`
export const brutalHoverLiftSm = hoverLiftSm
export const brutalHoverLiftNoX = hoverLiftLgNoX
export const brutalHoverLiftSmNoX = hoverLiftSmNoX
export const brutalPressWithShadowSm = `active:translate-y-[${pressedOffset}] active:shadow-brutal-sm`
export const brutalHighlightLiftWithBorder = `${brutalHighlightLift} data-[highlighted]:border-brutal`
