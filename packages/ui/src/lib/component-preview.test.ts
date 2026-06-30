import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import {
    createComponentPreview,
    registerComponent,
    getComponent,
    getAllComponents,
    updateComponentProps,
    setComponentProp,
    updateComponentSlots,
    logComponentEvent,
    getComponentEventLog,
    clearComponentEventLog,
    unregisterComponent,
    clearComponentRegistry,
    resetComponentProps,
    parsePropValue,
} from './component-preview'
import type { ComponentPreviewOptions, PropDefinition } from './component-preview'

/**
 * 测试用 Vue 组件
 */
const TestButton = defineComponent({
    name: 'TestButton',
    props: {
        label: { type: String, default: 'Click' },
        disabled: { type: Boolean, default: false },
        count: { type: Number, default: 0 },
    },
    emits: ['click', 'hover'],
    setup(props, { emit }) {
        return () =>
            h('button', {
                onClick: () => emit('click', props.count),
                onMouseenter: () => emit('hover'),
            }, props.label)
    },
})

const TestInput = defineComponent({
    name: 'TestInput',
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () =>
            h('input', {
                value: props.modelValue,
                placeholder: props.placeholder,
                onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
            })
    },
})

/**
 * 创建测试用的组件注册选项
 */
function createTestButtonOptions(): ComponentPreviewOptions {
    return {
        name: 'TestButton',
        component: TestButton,
        defaultProps: { label: 'Click Me', disabled: false, count: 0 },
        propDefinitions: [
            { name: 'label', type: 'string', defaultValue: 'Click Me', description: '按钮文本' },
            { name: 'disabled', type: 'boolean', defaultValue: false, description: '是否禁用' },
            { name: 'count', type: 'number', defaultValue: 0, description: '计数' },
        ],
        defaultSlots: { default: '默认内容' },
        eventNames: ['click', 'hover'],
    }
}

describe('componentPreview', () => {
    beforeEach(() => {
        clearComponentRegistry()
    })

    describe('createComponentPreview', () => {
        it('应创建组件预览实例', () => {
            const options = createTestButtonOptions()
            const preview = createComponentPreview(options)

            expect(preview.name).toBe('TestButton')
            expect(preview.component).toBe(TestButton)
            expect(preview.props).toEqual({ label: 'Click Me', disabled: false, count: 0 })
            expect(preview.slots).toEqual({ default: '默认内容' })
            expect(preview.events).toEqual(['click', 'hover'])
            expect(preview.eventLog).toEqual([])
        })

        it('应使用默认空值处理缺失的可选字段', () => {
            const preview = createComponentPreview({
                name: 'Minimal',
                component: TestButton,
            })

            expect(preview.props).toEqual({})
            expect(preview.propDefinitions).toEqual([])
            expect(preview.slots).toEqual({})
            expect(preview.events).toEqual([])
            expect(preview.eventLog).toEqual([])
        })
    })

    describe('registerComponent', () => {
        it('应注册组件并返回预览实例', () => {
            const options = createTestButtonOptions()
            const preview = registerComponent(options)

            expect(preview.name).toBe('TestButton')
            expect(getComponent('TestButton')).toBe(preview)
        })

        it('应覆盖同名组件', () => {
            registerComponent(createTestButtonOptions())
            const newOptions: ComponentPreviewOptions = {
                name: 'TestButton',
                component: TestInput,
                defaultProps: { modelValue: 'new' },
            }
            const newPreview = registerComponent(newOptions)

            expect(getComponent('TestButton')).toBe(newPreview)
            expect(getComponent('TestButton')?.component).toBe(TestInput)
        })
    })

    describe('getComponent', () => {
        it('应返回已注册的组件', () => {
            registerComponent(createTestButtonOptions())
            const preview = getComponent('TestButton')

            expect(preview).toBeDefined()
            expect(preview?.name).toBe('TestButton')
        })

        it('未注册时应返回 undefined', () => {
            expect(getComponent('NonExistent')).toBeUndefined()
        })
    })

    describe('getAllComponents', () => {
        it('应返回所有已注册组件', () => {
            registerComponent(createTestButtonOptions())
            registerComponent({ name: 'TestInput', component: TestInput })

            const all = getAllComponents()
            expect(all).toHaveLength(2)
            expect(all.map(c => c.name)).toContain('TestButton')
            expect(all.map(c => c.name)).toContain('TestInput')
        })

        it('无注册组件时应返回空数组', () => {
            expect(getAllComponents()).toEqual([])
        })
    })

    describe('updateComponentProps', () => {
        it('应批量更新组件 Props', () => {
            registerComponent(createTestButtonOptions())
            const result = updateComponentProps('TestButton', { label: 'Updated', count: 5 })

            expect(result).toBe(true)
            expect(getComponent('TestButton')?.props).toEqual({
                label: 'Updated',
                disabled: false,
                count: 5,
            })
        })

        it('未注册组件时应返回 false', () => {
            expect(updateComponentProps('NonExistent', { label: 'test' })).toBe(false)
        })
    })

    describe('setComponentProp', () => {
        it('应设置单个 Prop 值', () => {
            registerComponent(createTestButtonOptions())
            const result = setComponentProp('TestButton', 'disabled', true)

            expect(result).toBe(true)
            expect(getComponent('TestButton')?.props.disabled).toBe(true)
        })

        it('应添加新的 Prop', () => {
            registerComponent(createTestButtonOptions())
            setComponentProp('TestButton', 'newProp', 'value')

            expect(getComponent('TestButton')?.props.newProp).toBe('value')
        })

        it('未注册组件时应返回 false', () => {
            expect(setComponentProp('NonExistent', 'prop', 'value')).toBe(false)
        })
    })

    describe('updateComponentSlots', () => {
        it('应更新组件 Slots', () => {
            registerComponent(createTestButtonOptions())
            const result = updateComponentSlots('TestButton', { header: '头部内容' })

            expect(result).toBe(true)
            expect(getComponent('TestButton')?.slots).toEqual({
                default: '默认内容',
                header: '头部内容',
            })
        })

        it('应覆盖同名 Slot', () => {
            registerComponent(createTestButtonOptions())
            updateComponentSlots('TestButton', { default: '新默认内容' })

            expect(getComponent('TestButton')?.slots.default).toBe('新默认内容')
        })

        it('未注册组件时应返回 false', () => {
            expect(updateComponentSlots('NonExistent', { default: 'content' })).toBe(false)
        })
    })

    describe('logComponentEvent', () => {
        it('应记录组件事件', () => {
            registerComponent(createTestButtonOptions())
            const result = logComponentEvent('TestButton', 'click', { count: 1 })

            expect(result).toBe(true)
            const log = getComponentEventLog('TestButton')
            expect(log).toHaveLength(1)
            expect(log[0].eventName).toBe('click')
            expect(log[0].payload).toEqual({ count: 1 })
            expect(log[0].timestamp).toBeTypeOf('number')
        })

        it('应追加多个事件', () => {
            registerComponent(createTestButtonOptions())
            logComponentEvent('TestButton', 'click', {})
            logComponentEvent('TestButton', 'hover', null)
            logComponentEvent('TestButton', 'click', { data: 'test' })

            expect(getComponentEventLog('TestButton')).toHaveLength(3)
        })

        it('未注册组件时应返回 false', () => {
            expect(logComponentEvent('NonExistent', 'click', {})).toBe(false)
        })
    })

    describe('getComponentEventLog', () => {
        it('应返回事件日志副本', () => {
            registerComponent(createTestButtonOptions())
            logComponentEvent('TestButton', 'click', {})

            const log = getComponentEventLog('TestButton')
            expect(log).toHaveLength(1)

            // 修改副本不应影响原始日志
            log.push({ eventName: 'fake', payload: null, timestamp: 0 })
            expect(getComponentEventLog('TestButton')).toHaveLength(1)
        })

        it('未注册组件时应返回空数组', () => {
            expect(getComponentEventLog('NonExistent')).toEqual([])
        })
    })

    describe('clearComponentEventLog', () => {
        it('应清除事件日志', () => {
            registerComponent(createTestButtonOptions())
            logComponentEvent('TestButton', 'click', {})
            logComponentEvent('TestButton', 'hover', {})

            const result = clearComponentEventLog('TestButton')
            expect(result).toBe(true)
            expect(getComponentEventLog('TestButton')).toEqual([])
        })

        it('未注册组件时应返回 false', () => {
            expect(clearComponentEventLog('NonExistent')).toBe(false)
        })
    })

    describe('unregisterComponent', () => {
        it('应注销已注册的组件', () => {
            registerComponent(createTestButtonOptions())
            const result = unregisterComponent('TestButton')

            expect(result).toBe(true)
            expect(getComponent('TestButton')).toBeUndefined()
        })

        it('未注册组件时应返回 false', () => {
            expect(unregisterComponent('NonExistent')).toBe(false)
        })
    })

    describe('clearComponentRegistry', () => {
        it('应清空所有注册组件', () => {
            registerComponent(createTestButtonOptions())
            registerComponent({ name: 'TestInput', component: TestInput })

            clearComponentRegistry()
            expect(getAllComponents()).toEqual([])
        })
    })

    describe('resetComponentProps', () => {
        it('应重置 Props 为默认值', () => {
            const options = createTestButtonOptions()
            registerComponent(options)
            setComponentProp('TestButton', 'label', 'Modified')
            setComponentProp('TestButton', 'count', 99)

            const defaultProps = options.defaultProps ?? {}
            const result = resetComponentProps('TestButton', defaultProps as Record<string, unknown>)

            expect(result).toBe(true)
            expect(getComponent('TestButton')?.props).toEqual({
                label: 'Click Me',
                disabled: false,
                count: 0,
            })
        })

        it('未注册组件时应返回 false', () => {
            expect(resetComponentProps('NonExistent', {})).toBe(false)
        })
    })

    describe('parsePropValue', () => {
        it('应解析字符串类型', () => {
            expect(parsePropValue('string', 'hello')).toBe('hello')
            expect(parsePropValue('string', '123')).toBe('123')
        })

        it('应解析数字类型', () => {
            expect(parsePropValue('number', '42')).toBe(42)
            expect(parsePropValue('number', '3.14')).toBe(3.14)
            expect(parsePropValue('number', '-1')).toBe(-1)
        })

        it('非数字字符串应保持原样', () => {
            expect(parsePropValue('number', 'abc')).toBe('abc')
        })

        it('应解析布尔类型', () => {
            expect(parsePropValue('boolean', 'true')).toBe(true)
            expect(parsePropValue('boolean', 'false')).toBe(false)
            expect(parsePropValue('boolean', 'yes')).toBe(false)
        })

        it('应解析对象类型', () => {
            expect(parsePropValue('object', '{"key":"value"}')).toEqual({ key: 'value' })
        })

        it('无效 JSON 应保持原样', () => {
            expect(parsePropValue('object', 'not json')).toBe('not json')
        })

        it('应解析数组类型', () => {
            expect(parsePropValue('array', '[1,2,3]')).toEqual([1, 2, 3])
        })

        it('未知类型应保持原样', () => {
            expect(parsePropValue('unknown', 'value')).toBe('value')
        })
    })

    describe('PropDefinitions', () => {
        it('应保存 Props 类型定义', () => {
            const propDefs: PropDefinition[] = [
                { name: 'label', type: 'string', defaultValue: 'Click', required: true, description: '按钮文本' },
                { name: 'size', type: 'string', defaultValue: 'md', description: '尺寸' },
            ]

            const preview = registerComponent({
                name: 'Button',
                component: TestButton,
                propDefinitions: propDefs,
            })

            expect(preview.propDefinitions).toEqual(propDefs)
            expect(preview.propDefinitions[0].required).toBe(true)
        })
    })

    describe('集成测试', () => {
        it('完整的组件预览工作流', () => {
            // 注册组件
            const preview = registerComponent(createTestButtonOptions())
            expect(preview.name).toBe('TestButton')

            // 修改 Props
            setComponentProp('TestButton', 'label', '新按钮')
            expect(getComponent('TestButton')?.props.label).toBe('新按钮')

            // 记录事件
            logComponentEvent('TestButton', 'click', { label: '新按钮' })
            logComponentEvent('TestButton', 'hover', null)

            // 验证事件日志
            const log = getComponentEventLog('TestButton')
            expect(log).toHaveLength(2)
            expect(log[0].eventName).toBe('click')

            // 清除日志
            clearComponentEventLog('TestButton')
            expect(getComponentEventLog('TestButton')).toEqual([])

            // 重置 Props
            resetComponentProps('TestButton', createTestButtonOptions().defaultProps!)
            expect(getComponent('TestButton')?.props.label).toBe('Click Me')

            // 注销组件
            unregisterComponent('TestButton')
            expect(getComponent('TestButton')).toBeUndefined()
        })
    })
})
