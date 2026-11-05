import { expectTypeOf } from 'vitest'
import { Switch, switchRootVariants, switchThumbVariants } from 'brutx-ui-vue'
import { Switch as SubpathSwitch } from 'brutx-ui-vue/switch'

type SwitchProps = InstanceType<typeof Switch>['$props']
type RootVariants = NonNullable<Parameters<typeof switchRootVariants>[0]>
type ThumbVariants = NonNullable<Parameters<typeof switchThumbVariants>[0]>

expectTypeOf(Switch).toEqualTypeOf(SubpathSwitch)
expectTypeOf<SwitchProps>().toHaveProperty('id')
expectTypeOf<SwitchProps>().toHaveProperty('name')
expectTypeOf<SwitchProps>().toHaveProperty('value')
expectTypeOf<SwitchProps>().toHaveProperty('required')
expectTypeOf<SwitchProps>().toHaveProperty('ariaLabelledby')
expectTypeOf<SwitchProps>().not.toHaveProperty('shape')
expectTypeOf<SwitchProps>().not.toHaveProperty('defaultChecked')
expectTypeOf<RootVariants>().toHaveProperty('size')
expectTypeOf<RootVariants>().not.toHaveProperty('shape')
expectTypeOf<ThumbVariants>().not.toHaveProperty('size')
expectTypeOf<ThumbVariants>().not.toHaveProperty('shape')
