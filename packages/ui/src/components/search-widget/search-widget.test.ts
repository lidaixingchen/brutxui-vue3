import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import SearchWidget from './SearchWidget.vue'
import type { SearchSuggestion } from './SearchWidget.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const suggestions: SearchSuggestion[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
]

const recent: SearchSuggestion[] = [
    { label: 'Recent search 1', value: 'recent-1' },
    { label: 'Recent search 2', value: 'recent-2' },
]

async function setQuery(wrapper: ReturnType<typeof mount>, value: string) {
    const input = wrapper.find('[data-slot="command-input"] input')
    await input.setValue(value)
    await nextTick()
}

describe('SearchWidget', () => {
    it('renders input with placeholder', () => {
        const wrapper = mount(SearchWidget, {
            props: { placeholder: 'Search...' },
            ...localeProvide,
        })
        const input = wrapper.find('[data-slot="command-input"] input')
        expect(input.attributes('placeholder')).toBe('Search...')
    })

    it('uses default placeholder from locale when not provided', () => {
        const wrapper = mount(SearchWidget, {
            ...localeProvide,
        })
        const input = wrapper.find('[data-slot="command-input"] input')
        expect(input.attributes('placeholder')).toBe(en.searchWidget.defaultPlaceholder)
    })

    it('does not render suggestion list when query is empty', () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions },
            ...localeProvide,
        })
        const lists = wrapper.findAll('[data-slot="command-list"]')
        expect(lists.length).toBe(0)
    })

    it('renders filtered suggestions when query is non-empty', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions },
            ...localeProvide,
        })
        await setQuery(wrapper, 'ban')
        const items = wrapper.findAll('[data-slot="command-item"]')
        expect(items.length).toBe(1)
        expect(items[0].text()).toContain('Banana')
    })

    it('renders recent searches group when query is empty and recent provided', () => {
        const wrapper = mount(SearchWidget, {
            props: { recent },
            ...localeProvide,
        })
        const heading = wrapper.find('[data-slot="command-group-heading"]')
        expect(heading.exists()).toBe(true)
        expect(heading.text()).toBe(en.searchWidget.recentSearches)
    })

    it('does not render recent group when query is non-empty', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions, recent },
            ...localeProvide,
        })
        await setQuery(wrapper, 'apple')
        const headings = wrapper.findAll('[data-slot="command-group-heading"]')
        const recentHeading = headings.find(h => h.text() === en.searchWidget.recentSearches)
        expect(recentHeading).toBeUndefined()
    })

    it('does not render recent group when recent is empty', () => {
        const wrapper = mount(SearchWidget, {
            props: { recent: [] },
            ...localeProvide,
        })
        const lists = wrapper.findAll('[data-slot="command-list"]')
        expect(lists.length).toBe(0)
    })

    it('renders recent items in the recent group', () => {
        const wrapper = mount(SearchWidget, {
            props: { recent },
            ...localeProvide,
        })
        const items = wrapper.findAll('[data-slot="command-item"]')
        expect(items.length).toBe(2)
        expect(items[0].text()).toContain('Recent search 1')
        expect(items[1].text()).toContain('Recent search 2')
    })

    it('renders Spinner when loading is true and query is non-empty', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions, loading: true },
            ...localeProvide,
        })
        await setQuery(wrapper, 'apple')
        const spinner = wrapper.findComponent({ name: 'Spinner' })
        expect(spinner.exists()).toBe(true)
    })

    it('does not render Spinner when loading is false', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions, loading: false },
            ...localeProvide,
        })
        await setQuery(wrapper, 'apple')
        const spinner = wrapper.findComponent({ name: 'Spinner' })
        expect(spinner.exists()).toBe(false)
    })

    it('emits search when query changes', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions },
            ...localeProvide,
        })
        await setQuery(wrapper, 'apple')
        const events = wrapper.emitted('search')
        expect(events).toBeTruthy()
        expect(events![0]).toEqual(['apple'])
    })

    it('emits select when suggestion is clicked', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions },
            ...localeProvide,
        })
        await setQuery(wrapper, 'banana')
        const items = wrapper.findAll('[data-slot="command-item"]')
        await items[0].trigger('click')
        await nextTick()

        const events = wrapper.emitted('select')
        expect(events).toBeTruthy()
        const [selected] = events![0] as [SearchSuggestion]
        expect(selected.value).toBe('banana')
    })

    it('fills query and emits select when recent item is clicked', async () => {
        const wrapper = mount(SearchWidget, {
            props: { recent },
            ...localeProvide,
        })
        const items = wrapper.findAll('[data-slot="command-item"]')
        await items[0].trigger('click')
        await nextTick()

        const selectEvents = wrapper.emitted('select')
        expect(selectEvents).toBeTruthy()
        const [selected] = selectEvents![0] as [SearchSuggestion]
        expect(selected.value).toBe('recent-1')

        const input = wrapper.find('[data-slot="command-input"] input')
        expect((input.element as HTMLInputElement).value).toBe('Recent search 1')
    })

    it('renders empty state when query has no matches', async () => {
        const wrapper = mount(SearchWidget, {
            props: { suggestions },
            ...localeProvide,
        })
        await setQuery(wrapper, 'xyz')
        const empty = wrapper.find('[data-slot="command-empty"]')
        expect(empty.exists()).toBe(true)
    })

    it('applies custom class to root', () => {
        const wrapper = mount(SearchWidget, {
            props: { class: 'custom-search' },
            ...localeProvide,
        })
        expect(wrapper.classes()).toContain('custom-search')
    })
})
