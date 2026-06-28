import type { InjectionKey, ComputedRef } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { avatarVariants } from './avatar-variants'

type AvatarVariantProps = VariantProps<typeof avatarVariants>

export const avatarKey: InjectionKey<{
    variant: ComputedRef<NonNullable<AvatarVariantProps['variant']>>
}> = Symbol('avatar')
