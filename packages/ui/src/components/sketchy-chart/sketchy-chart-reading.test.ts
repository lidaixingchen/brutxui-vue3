import { mount, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import SketchyChart from './SketchyChart.vue'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { en } from '@/locales/en'
import { zhCN } from '@/locales/zh-CN'
import type { Locale } from '@/locales/types'
import type { ChartDataItem, ChartType } from './sketchy-chart-data'

enableAutoUnmount(afterEach)

describe('图表等价读数', (): void => {
    it('负值柱体从零基线向下绘制，表格保留原始读数', async (): Promise<void> => {
        const wrapper = mount(SketchyChart, { props: { type: 'bar', data: [{ label: '支出', value: -5 }, { label: '收入', value: 10 }] } })
        const baseline: number = Number(wrapper.findAll('.chart-axes line')[1].attributes('y1'))
        const negativeBar = wrapper.findAll('.chart-data rect')[1]
        expect(Number(negativeBar.attributes('y'))).toBe(baseline)
        expect(Number(negativeBar.attributes('height'))).toBeGreaterThan(0)
        await wrapper.get('button').trigger('click')
        expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
        expect(wrapper.get('table').text()).toContain('-5')
        expect(wrapper.get('table').findAll('th[scope="col"]')).toHaveLength(2)
    })

    it('无效图不绘制局部数据，错误单元格本地化，formatter 只接收有效值', async (): Promise<void> => {
        const formatter = vi.fn((value: number): string => `值:${value}`)
        const wrapper = mount(SketchyChart, { props: { data: [{ label: '正常', value: 2 }, { label: '错误', value: NaN }], valueFormatter: formatter } })
        expect(wrapper.attributes('data-chart-state')).toBe('invalid')
        expect(wrapper.findAll('.chart-data *')).toHaveLength(0)
        await wrapper.get('button').trigger('click')
        expect(wrapper.get('table').text()).toContain('正常')
        expect(wrapper.get('table').text()).toContain('值:2')
        expect(wrapper.get('table').text()).toContain('无效数值')
        expect(formatter.mock.calls.every(([value]: [number]): boolean => Number.isFinite(value))).toBe(true)
    })

    it.each<ChartType>(['line', 'bar', 'pie'])('%s 保留重复标签与全部类别', async (type: ChartType): Promise<void> => {
        const data: ChartDataItem[] = Array.from({ length: 31 }, (): ChartDataItem => ({ label: '重复标签', value: 1 }))
        const wrapper = mount(SketchyChart, { props: { type, data } })
        await wrapper.get('button').trigger('click')
        expect(wrapper.get('tbody').findAll('tr')).toHaveLength(31)
        if (type === 'line') expect(wrapper.findAll('.chart-data circle')).toHaveLength(31)
        if (type === 'bar') expect(wrapper.findAll('.chart-data rect')).toHaveLength(62)
        if (type === 'pie') {
            expect(wrapper.findAll('.chart-data path')).toHaveLength(31)
            expect(wrapper.findAll('[data-slot="pie-legend"] li')).toHaveLength(31)
            expect(wrapper.get('tbody').text()).toContain('3.2%')
            expect(wrapper.text()).toContain('独立舍入')
        }
    })

    it('全零饼图保留图例和表格，不表达占比', async (): Promise<void> => {
        const wrapper = mount(SketchyChart, { props: { type: 'pie', data: [{ label: '甲', value: 0 }, { label: '乙', value: 0 }] } })
        expect(wrapper.attributes('data-chart-state')).toBe('zero-total')
        expect(wrapper.findAll('[data-slot="pie-legend"] li')).toHaveLength(2)
        expect(wrapper.findAll('.chart-data path')).toHaveLength(0)
        await wrapper.get('button').trigger('click')
        expect(wrapper.get('tbody').text()).toContain('无法计算占比')
        expect(wrapper.get('tbody').text()).not.toContain('0%')
    })

    it('仅正值生成扇区但零值保留在图例', (): void => {
        const wrapper = mount(SketchyChart, { props: { type: 'pie', data: [{ label: '零', value: 0 }, { label: '正', value: 2 }] } })
        expect(wrapper.findAll('.chart-data path')).toHaveLength(1)
        expect(wrapper.findAll('[data-slot="pie-legend"] li')).toHaveLength(2)
        expect(wrapper.find('.chart-data path').attributes('fill')).toContain('secondary')
    })

    it('图形名称和说明关联实例内唯一 ID', (): void => {
        const page = mount({
            components: { SketchyChart },
            template: '<div><SketchyChart title="净收入" description="单位：万元" /><SketchyChart title="净支出" /></div>',
        })
        const [first, second] = page.findAllComponents(SketchyChart)
        const titleId: string = first.get('svg').attributes('aria-labelledby')!
        const descriptionId: string = first.get('svg').attributes('aria-describedby')!
        expect(first.get(`[id="${titleId}"]`).text()).toBe('净收入')
        expect(first.get(`[id="${descriptionId}"]`).text()).toContain('单位：万元')
        expect(second.get('svg').attributes('aria-labelledby')).not.toBe(titleId)
    })

    it('语言和 formatter 切换同步更新刻度与表格', async (): Promise<void> => {
        const locale: Ref<Locale> = ref(zhCN)
        const wrapper = mount(SketchyChart, {
            props: { data: [{ label: 'A', value: 10 }], valueFormatter: (value: number): string => `￥${value}` },
            global: { provide: { [LOCALE_INJECTION_KEY as symbol]: locale } },
        })
        await wrapper.get('button').trigger('click')
        expect(wrapper.get('tbody').text()).toContain('￥10')
        locale.value = en
        await wrapper.setProps({ valueFormatter: (value: number): string => `$${value}` })
        expect(wrapper.get('button').text()).toBe('Hide data table')
        expect(wrapper.get('tbody').text()).toContain('$10')
        expect(wrapper.get('.chart-labels').text()).toContain('$10')
    })

    it('原地修改与同长度替换同步刷新数据状态及读数', async (): Promise<void> => {
        const data: Ref<ChartDataItem[]> = ref([{ label: 'A', value: 1 }])
        const wrapper = mount(SketchyChart, { props: { data: data.value } })
        await wrapper.get('button').trigger('click')
        data.value[0].label = 'B'
        data.value[0].value = -2
        await wrapper.vm.$nextTick()
        expect(wrapper.get('tbody').text()).toContain('B-2')
        await wrapper.setProps({ data: [{ label: 'C', value: Infinity }] })
        expect(wrapper.attributes('data-chart-state')).toBe('invalid')
        expect(wrapper.get('tbody').text()).toContain('C无效数值')
    })
})
