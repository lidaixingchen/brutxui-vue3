import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('cn', () => {
    it('should merge class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
        const condition = false
        expect(cn('foo', condition ? 'bar' : undefined, 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes correctly', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle undefined and null', () => {
        expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('should correctly override custom brutalist color classes', () => {
        expect(cn('bg-brutal-primary', 'bg-red-500')).toBe('bg-red-500')
        expect(cn('text-brutal-fg', 'text-blue-600')).toBe('text-blue-600')
        expect(cn('bg-brutal-accent-subtle', 'bg-brutal-success')).toBe('bg-brutal-success')
        expect(cn('border-brutal-primary', 'border-gray-200')).toBe('border-gray-200')
    })
})

