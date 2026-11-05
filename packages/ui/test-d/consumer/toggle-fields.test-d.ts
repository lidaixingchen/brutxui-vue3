import { expectTypeOf } from 'vitest'
import { Checkbox, Toggle, ToggleGroup } from 'brutx-ui-vue'

type CheckboxProps = InstanceType<typeof Checkbox>['$props']
type ToggleProps = InstanceType<typeof Toggle>['$props']
type ToggleGroupProps = InstanceType<typeof ToggleGroup>['$props']

expectTypeOf<CheckboxProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<CheckboxProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<ToggleProps['defaultValue']>().toEqualTypeOf<boolean | undefined>()
expectTypeOf<ToggleProps['name']>().toEqualTypeOf<string | undefined>()
expectTypeOf<ToggleProps['required']>().toEqualTypeOf<boolean | undefined>()
expectTypeOf<ToggleGroupProps['defaultValue']>().toEqualTypeOf<string | string[] | undefined>()
expectTypeOf<ToggleGroupProps['name']>().toEqualTypeOf<string | undefined>()
expectTypeOf<ToggleGroupProps['required']>().toEqualTypeOf<boolean | undefined>()
