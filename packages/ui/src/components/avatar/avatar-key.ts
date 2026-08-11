import type { InjectionKey, ComputedRef } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import type { avatarVariants } from './avatar-variants'

type AvatarVariantProps = VariantProps<typeof avatarVariants>

/**
 * Avatar 注入键。
 *
 * 契约：由 Avatar 组件通过 provide(avatarKey, { variant }) 提供；消费方（AvatarFallback）
 * 必须携带兜底默认值调用 inject，使组件脱离 Avatar 单独渲染时能安全降级为 default 变体，
 * 而非以 undefined 抛出空指针。自定义注入方需保持
 * `{ variant: ComputedRef<NonNullable<AvatarVariantProps['variant']>> }` 的结构。
 */
export const avatarKey: InjectionKey<{
    variant: ComputedRef<NonNullable<AvatarVariantProps['variant']>>
}> = Symbol('avatar')
