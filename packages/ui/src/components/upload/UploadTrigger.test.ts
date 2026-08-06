import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadTrigger from './UploadTrigger.vue'

function createFile(name: string, type: string): File {
    return new File(['content'], name, { type })
}

describe('UploadTrigger', () => {
    it('emits a copied File array for browse selection', async () => {
        const wrapper = mount(UploadTrigger)
        const input = wrapper.find('input[type="file"]')
        const file = createFile('a.txt', 'text/plain')

        // target.files 是实时 FileList，选择后立即重置 input，消费方持有的应是拷贝后的数组
        Object.defineProperty(input.element, 'files', {
            value: [file],
            configurable: true,
        })

        await input.trigger('change')

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [files, source] = emitted![0] as [File[], 'browse' | 'drop']
        expect(source).toBe('browse')
        expect(Array.isArray(files)).toBe(true)
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('a.txt')
    })

    it('emits a copied File array for drop selection', async () => {
        const wrapper = mount(UploadTrigger)
        const file = createFile('a.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file] },
        })

        const emitted = wrapper.emitted('select')
        expect(emitted).toBeTruthy()
        const [files, source] = emitted![0] as [File[], 'browse' | 'drop']
        expect(source).toBe('drop')
        expect(Array.isArray(files)).toBe(true)
        expect(files).toHaveLength(1)
        expect(files[0].name).toBe('a.txt')
    })

    it('does not emit select when drag is disabled', async () => {
        const wrapper = mount(UploadTrigger, { props: { drag: false } })
        const file = createFile('a.txt', 'text/plain')

        await wrapper.trigger('drop', {
            dataTransfer: { files: [file] },
        })

        expect(wrapper.emitted('select')).toBeFalsy()
    })
})
