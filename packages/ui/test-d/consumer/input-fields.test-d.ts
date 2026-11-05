import { expectTypeOf } from 'vitest'
import { HardcoreInput, Input, NumberInput, Textarea } from 'brutx-ui-vue'

type InputProps = InstanceType<typeof Input>['$props']
type TextareaProps = InstanceType<typeof Textarea>['$props']
type HardcoreInputProps = InstanceType<typeof HardcoreInput>['$props']
type NumberInputProps = InstanceType<typeof NumberInput>['$props']

expectTypeOf<InputProps['name']>().toEqualTypeOf<string | undefined>()
expectTypeOf<InputProps['required']>().toEqualTypeOf<boolean | undefined>()
expectTypeOf<TextareaProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<TextareaProps['name']>().toEqualTypeOf<string | undefined>()
expectTypeOf<TextareaProps['required']>().toEqualTypeOf<boolean | undefined>()
expectTypeOf<HardcoreInputProps['id']>().toEqualTypeOf<string | undefined>()
expectTypeOf<HardcoreInputProps['name']>().toEqualTypeOf<string | undefined>()
expectTypeOf<HardcoreInputProps['required']>().toEqualTypeOf<boolean | undefined>()
expectTypeOf<HardcoreInputProps['ariaDescribedby']>().toEqualTypeOf<string | undefined>()
expectTypeOf<HardcoreInputProps['ariaInvalid']>().toEqualTypeOf<boolean | 'grammar' | 'spelling' | undefined>()
expectTypeOf<NumberInputProps['ariaLabel']>().toEqualTypeOf<string | undefined>()
expectTypeOf<NumberInputProps['ariaLabelledby']>().toEqualTypeOf<string | undefined>()
