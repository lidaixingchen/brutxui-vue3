import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadFileList from './UploadFileList.vue'
import UploadFileItem from './UploadFileItem.vue'
import type { UploadFile } from './upload-types'

function createMockFile(overrides: Partial<UploadFile> = {}): UploadFile {
    return {
        id: 'file-1',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
        status: 'ready',
        progress: 0,
        ...overrides,
    }
}

describe('UploadFileList', () => {
    it('does not render when files array is empty', () => {
        const wrapper = mount(UploadFileList, {
            props: {
                files: [],
            },
        })
        expect(wrapper.find('div').exists()).toBe(false)
    })

    it('renders file items when files are present', () => {
        const files: UploadFile[] = [
            createMockFile({ id: 'f1', name: 'a.png' }),
            createMockFile({ id: 'f2', name: 'b.png' }),
        ]
        const wrapper = mount(UploadFileList, {
            props: {
                files,
                listType: 'text',
            },
        })
        const items = wrapper.findAllComponents(UploadFileItem)
        expect(items).toHaveLength(2)
    })

    it('applies picture-card layout classes', () => {
        const wrapper = mount(UploadFileList, {
            props: {
                files: [createMockFile()],
                listType: 'picture-card',
            },
        })
        const container = wrapper.find('div')
        expect(container.classes()).toContain('flex')
        expect(container.classes()).toContain('flex-wrap')
        expect(container.classes()).toContain('gap-2')
    })

    it('forwards remove and retry events with the corresponding file', async () => {
        const file1 = createMockFile({ id: 'f1', status: 'error', error: { message: 'Failed' } })
        const wrapper = mount(UploadFileList, {
            props: {
                files: [file1],
                listType: 'text',
            },
        })

        const item = wrapper.findComponent(UploadFileItem)
        item.vm.$emit('remove')
        expect(wrapper.emitted('remove')).toBeTruthy()
        expect(wrapper.emitted('remove')![0]).toEqual([file1])

        item.vm.$emit('retry')
        expect(wrapper.emitted('retry')).toBeTruthy()
        expect(wrapper.emitted('retry')![0]).toEqual([file1])
    })
})
