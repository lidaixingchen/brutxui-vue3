import assert from 'node:assert/strict'
import test from 'node:test'
import { BROWSER_PROFILES, COST_SCENARIOS, selectCostScenarios } from './cost-profile.ts'

const buttonScenarios = ['empty', 'button-root', 'button-subpath', 'button-root-dynamic']

test('Button cost profile contains the four consumer builds', () => {
    assert.deepEqual(COST_SCENARIOS.map(scenario => scenario.id), buttonScenarios)
    assert.deepEqual(selectCostScenarios(buttonScenarios, true).map(scenario => scenario.id), buttonScenarios)
})

test('resource assertions retain all Button browser profiles with only their required bundles', () => {
    assert.deepEqual(BROWSER_PROFILES.map(profile => profile.id), [
        'button-effect-none',
        'button-effect-none-autoplay',
        'button-effect-glitch-autoplay',
        'button-effect-glitch-reduced-motion',
        'button-effect-glitch-keep-alive',
    ])
    assert.throws(
        () => selectCostScenarios(['empty', 'button-subpath', 'button-root-dynamic'], true),
        /缺少必需场景：button-root/,
    )
    assert.throws(
        () => selectCostScenarios(['button-root'], false),
        /缺少必需场景：empty/,
    )
})
