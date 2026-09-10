import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('api-manifest 契约与质量守卫', () => {
    const manifestPath = path.resolve(__dirname, '../../../apps/docs/.vitepress/api-manifest.json')

    it('api-manifest.json 存在且为合法 JSON', () => {
        expect(fs.existsSync(manifestPath)).toBe(true)
        const content = fs.readFileSync(manifestPath, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()
    })

    it('包含必要元数据字段与结构', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        expect(manifest).toHaveProperty('generatedAt')
        expect(manifest).toHaveProperty('totalComponents')
        expect(manifest).toHaveProperty('totalGroups')
        expect(manifest).toHaveProperty('groups')
        expect(manifest).toHaveProperty('components')
        expect(manifest.totalComponents).toBeGreaterThanOrEqual(50)
        expect(manifest.totalGroups).toBeGreaterThanOrEqual(30)
    })

    it('关键组件及组件组完备性验证', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        const criticalGroups = ['button', 'alert', 'input', 'dialog', 'card', 'badge']
        for (const groupName of criticalGroups) {
            expect(manifest.groups).toHaveProperty(groupName)
            expect(manifest.groups[groupName].components.length).toBeGreaterThan(0)
        }

        const criticalComponents = ['Button', 'Alert', 'Input', 'Card', 'Badge']
        for (const compName of criticalComponents) {
            expect(manifest.components).toHaveProperty(compName)
            expect(manifest.components[compName].props.length).toBeGreaterThan(0)
        }
    })

    it('Button 组件 Props 规范与类型清理验证', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        const button = manifest.components['Button']
        expect(button).toBeDefined()
        expect(button.name).toBe('Button')
        expect(button.dirName).toBe('button')

        const variantProp = button.props.find((p: { name: string }) => p.name === 'variant')
        expect(variantProp).toBeDefined()
        // 确保 null | undefined 已被清理
        expect(variantProp.type).not.toContain('| null')
        expect(variantProp.type).not.toContain('| undefined')
        expect(variantProp.default).toBe("'default'")

        const sizeProp = button.props.find((p: { name: string }) => p.name === 'size')
        expect(sizeProp).toBeDefined()
        expect(sizeProp.default).toBe("'default'")

        const glitchIntervalProp = button.props.find((p: { name: string }) => p.name === 'glitchInterval')
        expect(glitchIntervalProp).toBeDefined()
        expect(glitchIntervalProp.default).toBe('3000')

        const pendingTextProp = button.props.find((p: { name: string }) => p.name === 'pendingText')
        expect(pendingTextProp).toBeDefined()
        expect(pendingTextProp.default).toContain('i18n')
    })

    it('Alert 组件组子组件归集与事件插槽验证', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        const alertGroup = manifest.groups['alert']
        expect(alertGroup).toBeDefined()
        expect(alertGroup.components.length).toBeGreaterThanOrEqual(2)

        const subNames = alertGroup.components.map((c: { name: string }) => c.name)
        expect(subNames).toContain('Alert')
        expect(subNames).toContain('AlertTitle')
        expect(subNames).toContain('AlertDescription')
        // 主组件排首位
        expect(subNames[0]).toBe('Alert')

        const alertComp = alertGroup.components.find((c: { name: string }) => c.name === 'Alert')
        expect(alertComp.events.some((e: { name: string }) => e.name === 'close')).toBe(true)
        expect(alertComp.slots.some((s: { name: string }) => s.name === 'default')).toBe(true)
        expect(alertComp.slots.some((s: { name: string }) => s.name === 'actions')).toBe(true)
    })
})
