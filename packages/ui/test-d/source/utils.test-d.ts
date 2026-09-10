import { describe, it, expectTypeOf } from 'vitest'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'
import type { ClassValue } from 'clsx'

describe('utils type contract', () => {
    it('cn accepts ClassValue inputs and returns string', () => {
        expectTypeOf(cn).toBeFunction()
        expectTypeOf(cn).parameters.toEqualTypeOf<ClassValue[]>()
        expectTypeOf(cn('foo', ['bar', { baz: true }])).toEqualTypeOf<string>()
    })

    it('FOCUS_RING_CLASSES is string', () => {
        expectTypeOf(FOCUS_RING_CLASSES).toBeString()
    })
})
