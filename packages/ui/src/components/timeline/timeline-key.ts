import { type InjectionKey, type ComputedRef } from 'vue'

export type TimelineOrientation = 'vertical' | 'horizontal'

export const timelineOrientationKey: InjectionKey<ComputedRef<TimelineOrientation>> = Symbol('timeline-orientation')

export const timelineAlternateKey: InjectionKey<ComputedRef<boolean>> = Symbol('timeline-alternate')
