import { expectTypeOf } from 'vitest'
import { Cascader, Combobox, Select, TreeSelect } from 'brutx-ui-vue'

type SelectProps = InstanceType<typeof Select>['$props']
type ComboboxProps = InstanceType<typeof Combobox>['$props']
type CascaderProps = InstanceType<typeof Cascader>['$props']
type TreeSelectProps = InstanceType<typeof TreeSelect>['$props']

expectTypeOf<SelectProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<SelectProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<SelectProps['ariaLabel']>().toEqualTypeOf<string | undefined>()

expectTypeOf<ComboboxProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<ComboboxProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<ComboboxProps['ariaLabel']>().toEqualTypeOf<string | undefined>()

expectTypeOf<CascaderProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<CascaderProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<CascaderProps['ariaLabel']>().toEqualTypeOf<string | undefined>()

expectTypeOf<TreeSelectProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<TreeSelectProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<TreeSelectProps['ariaLabel']>().toEqualTypeOf<string | undefined>()
