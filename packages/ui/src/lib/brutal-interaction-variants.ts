export const brutalHoverLift = 'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5'

export const brutalHighlightLift = 'data-[highlighted]:shadow-brutal-lg data-[highlighted]:-translate-x-0.5 data-[highlighted]:-translate-y-0.5'

export const brutalPress = 'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'

// Derived interaction variants
export const brutalPressWithTransition = `${brutalPress} transition-all`
export const brutalHoverLiftWithTransition = `${brutalHoverLift} transition-all`
export const brutalHoverLiftSm = 'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5'
export const brutalHoverLiftNoX = 'hover:shadow-brutal-lg hover:-translate-y-0.5'
export const brutalHoverLiftSmNoX = 'hover:shadow-brutal hover:-translate-y-0.5'
export const brutalPressWithShadowSm = 'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-brutal-sm'
export const brutalHighlightLiftWithBorder = `${brutalHighlightLift} data-[highlighted]:border-brutal`

