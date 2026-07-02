import type { InjectionKey, Ref } from 'vue'

export const descriptionsBorderKey: InjectionKey<Ref<boolean>> = Symbol('descriptions-border')
export const descriptionsDirectionKey: InjectionKey<Ref<'horizontal' | 'vertical'>> = Symbol('descriptions-direction')
