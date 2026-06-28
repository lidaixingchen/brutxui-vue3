import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import FileCard from './FileCard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('FileCard', () => {
    it('renders with default props', () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        expect(wrapper.text()).toContain('document.pdf')
    })

    it('shows custom file name', () => {
        const wrapper = mount(FileCard, {
            props: { fileName: 'report.xlsx' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('report.xlsx')
    })

    it('shows file size when provided', () => {
        const wrapper = mount(FileCard, {
            props: { fileSize: '2.4 MB' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('2.4 MB')
    })

    it('shows file type badge when provided', () => {
        const wrapper = mount(FileCard, {
            props: { fileType: 'PDF' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('PDF')
    })

    it('does not show file type badge when not provided', () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        expect(wrapper.text()).not.toContain('PDF')
    })

    it('renders download button', () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Download')
    })

    it('emits download when download button is clicked', async () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        const button = wrapper.find('button')
        await button.trigger('click')
        expect(wrapper.emitted('download')).toBeTruthy()
        expect(wrapper.emitted('download')!.length).toBe(1)
    })

    it('renders file icon', () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        const svgs = wrapper.findAll('svg')
        expect(svgs.length).toBeGreaterThanOrEqual(1)
    })

    it('renders file icon with default xl size from shared iconSizeVariants', () => {
        const wrapper = mount(FileCard, { ...localeProvide })
        const fileIcon = wrapper.find('svg')
        expect(fileIcon.classes()).toContain('h-6')
        expect(fileIcon.classes()).toContain('w-6')
    })

    it('keeps download chrome icon at fixed default size regardless of iconSize', () => {
        const wrapper = mount(FileCard, {
            props: { iconSize: '2xl' },
            ...localeProvide,
        })
        const fileIcon = wrapper.find('svg')
        expect(fileIcon.classes()).toContain('h-8')
        const downloadIcon = wrapper.find('button svg')
        expect(downloadIcon.exists()).toBe(true)
        expect(downloadIcon.classes()).toContain('h-4')
        expect(downloadIcon.classes()).toContain('w-4')
        expect(downloadIcon.classes()).not.toContain('h-8')
    })

    it('applies custom class', () => {
        const wrapper = mount(FileCard, {
            props: { class: 'my-file' },
            ...localeProvide,
        })
        expect(wrapper.find('[class*="my-file"]').exists()).toBe(true)
    })
})
