import { mount } from '@vue/test-utils'
import { TreeSelectNode } from './index'

describe('TreeSelectNode', () => {
    it('expands its own children and forwards leaf selection when mounted independently', async () => {
        const leaf = { id: 'design', label: 'Design' }
        const root = { id: 'projects', label: 'Projects', children: [leaf] }
        const wrapper = mount(TreeSelectNode, {
            props: { node: root, selectedIds: new Set([leaf.id]), expandedIds: new Set<string>() },
        })

        expect(wrapper.attributes('aria-expanded')).toBe('false')
        expect(wrapper.find('[role="group"]').exists()).toBe(false)
        await wrapper.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('toggle')).toEqual([[root.id]])

        await wrapper.setProps({ expandedIds: new Set([root.id]) })
        const child = wrapper.get('[role="group"] > [role="treeitem"]')
        expect(wrapper.attributes('aria-expanded')).toBe('true')
        expect(child.text()).toBe(leaf.label)
        expect(child.attributes('aria-selected')).toBe('true')
        await child.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('select')).toEqual([[leaf]])

        wrapper.unmount()
    })
})
