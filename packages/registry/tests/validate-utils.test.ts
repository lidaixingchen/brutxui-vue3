import { describe, expect, it } from 'vitest'
import {
    findRegistryDependencyCycles,
    findUnknownRegistryReferences,
} from '../scripts/validate-utils'

describe('validate-registry helpers', () => {
    it('finds registry dependencies that do not reference known items', () => {
        expect(findUnknownRegistryReferences([
            { name: 'button', registryDependencies: [] },
            { name: 'dialog', registryDependencies: ['button', 'missing'] },
        ])).toEqual([
            { component: 'dialog', dependency: 'missing' },
        ])
    })

    it('finds dependency cycles across registry items', () => {
        expect(findRegistryDependencyCycles([
            { name: 'a', registryDependencies: ['b'] },
            { name: 'b', registryDependencies: ['c'] },
            { name: 'c', registryDependencies: ['a'] },
            { name: 'd', registryDependencies: ['a'] },
        ])).toEqual([
            ['a', 'b', 'c', 'a'],
        ])
    })

    it('ignores acyclic dependency graphs', () => {
        expect(findRegistryDependencyCycles([
            { name: 'button', registryDependencies: [] },
            { name: 'dialog', registryDependencies: ['button'] },
            { name: 'popover', registryDependencies: ['button'] },
        ])).toEqual([])
    })
})
