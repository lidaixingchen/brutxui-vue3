import { FOCUS_RING_CLASSES } from '@/lib/utils'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

// 交互位移说明：brutalHoverLift（悬停上移）与 brutalPress（按下下移）是组件库统一的
// neo-brutalism 按压反馈语言，与按钮等交互元素保持一致。
// reka-ui Switch/Checkbox 的滑块位移由 checked 状态常驻驱动（非 active 触发），
// 不与按下位移叠加；若后续需要更克制的表单反馈，可单独定义不带位移的开关交互变体。
export const formToggleBaseClasses = [
    'border-3 border-brutal',
    'transition-all duration-150',
    'shadow-brutal-sm',
    brutalHoverLift,
    brutalPress,
    FOCUS_RING_CLASSES,
    // pointer-events-none 会吞掉 disabled 态的光标反馈（cursor-not-allowed 永不生效），
    // 改为 select-none 保留禁用视觉提示；但 Chromium 对 disabled 按钮仍命中 :hover，
    // 需显式抑制 hover/active 位移与阴影，避免禁用态出现交互反馈
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none',
    'disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal-sm disabled:active:translate-y-0 disabled:active:shadow-none',
] as const

// 未选中态统一补充背景，避免各消费方（如 switch-variants / radio-group / toggle）重复硬编码
export const formToggleVariantColors = {
    default: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-success data-[state=indeterminate]:bg-brutal-success data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-success',
    success: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-success data-[state=indeterminate]:bg-brutal-success data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-success',
    primary: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-primary data-[state=indeterminate]:bg-brutal-primary data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-primary',
    secondary: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-secondary data-[state=indeterminate]:bg-brutal-secondary data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-secondary',
    accent: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-accent data-[state=indeterminate]:bg-brutal-accent data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-accent',
    danger: 'data-[state=unchecked]:bg-brutal-bg data-[state=checked]:bg-brutal-destructive data-[state=indeterminate]:bg-brutal-destructive data-[state=off]:bg-brutal-bg data-[state=on]:bg-brutal-destructive',
} as const

export const formToggleForegroundColors = {
    default: 'data-[state=checked]:text-brutal-success-foreground data-[state=indeterminate]:text-brutal-success-foreground data-[state=on]:text-brutal-success-foreground',
    success: 'data-[state=checked]:text-brutal-success-foreground data-[state=indeterminate]:text-brutal-success-foreground data-[state=on]:text-brutal-success-foreground',
    primary: 'data-[state=checked]:text-brutal-primary-foreground data-[state=indeterminate]:text-brutal-primary-foreground data-[state=on]:text-brutal-primary-foreground',
    secondary: 'data-[state=checked]:text-brutal-secondary-foreground data-[state=indeterminate]:text-brutal-secondary-foreground data-[state=on]:text-brutal-secondary-foreground',
    accent: 'data-[state=checked]:text-brutal-accent-foreground data-[state=indeterminate]:text-brutal-accent-foreground data-[state=on]:text-brutal-accent-foreground',
    danger: 'data-[state=checked]:text-brutal-destructive-foreground data-[state=indeterminate]:text-brutal-destructive-foreground data-[state=on]:text-brutal-destructive-foreground',
} as const
