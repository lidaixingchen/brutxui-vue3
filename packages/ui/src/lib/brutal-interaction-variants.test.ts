import { describe, expect, it } from 'vitest'
import { brutalPressStacked } from './brutal-interaction-variants'
import { cn } from './utils'
import { buttonVariants } from '@/components/button/button-variants'

/** 模拟组件真实消费路径：cva 输出必须经 cn()（twMerge）合并后再断言 */
function renderButtonClasses(props: Parameters<typeof buttonVariants>[0]): string[] {
    return cn(buttonVariants(props)).split(/\s+/)
}

describe('brutalPressStacked 盖影等值契约', () => {
    it('X/Y 位移均以 calc 引用运行时偏移变量的 1.5x 派生（stacked 最外层阴影刻度）', () => {
        expect(brutalPressStacked).toContain('active:translate-x-[calc(var(--brutal-shadow-offset-x,4px)*1.5)]')
        expect(brutalPressStacked).toContain('active:translate-y-[calc(var(--brutal-shadow-offset-y,4px)*1.5)]')
    })

    it('按压去影语义与普通盖影按压一致', () => {
        expect(brutalPressStacked).toContain('active:shadow-none')
    })

    it('严禁硬编码像素位移字面量', () => {
        expect(brutalPressStacked).not.toMatch(/translate-[xy]-\[\d+px\]/)
    })
})

describe('buttonVariants flair 装饰形态变体', () => {
    it('stacked 绑定多层彩虹阴影与同源盖影按压，且覆盖基座 4px 按压位移', () => {
        const classTokens = renderButtonClasses({ flair: 'stacked' })
        expect(classTokens).toContain('shadow-brutal-stacked')
        expect(classTokens).toContain('active:translate-x-[calc(var(--brutal-shadow-offset-x,4px)*1.5)]')
        // twMerge 同组后者胜：基座 brutalPress 的 4px 位移被 stacked 1.5x 位移替换
        expect(classTokens).not.toContain('active:translate-x-[var(--brutal-shadow-offset-x,4px)]')
        expect(classTokens).not.toContain('active:translate-y-[var(--brutal-shadow-offset-y,4px)]')
    })

    it('hazard 应用警戒斜纹纹理并以前景令牌保证可读性', () => {
        const classTokens = renderButtonClasses({ flair: 'hazard' })
        expect(classTokens).toContain('bg-pattern-hazard')
        expect(classTokens).toContain('text-brutal-fg')
    })

    it('ticket 应用票据撕口工具类', () => {
        expect(renderButtonClasses({ flair: 'ticket' })).toContain('button-ticket-notch')
    })

    it('默认不输出任何装饰形态类（DOM 零污染）', () => {
        const out = renderButtonClasses({})
        expect(out).not.toContain('shadow-brutal-stacked')
        expect(out).not.toContain('bg-pattern-hazard')
        expect(out).not.toContain('button-ticket-notch')
    })

    it('flair 与色系变体正交可组合', () => {
        const classTokens = renderButtonClasses({ variant: 'primary', flair: 'stacked' })
        expect(classTokens).toContain('bg-brutal-primary')
        expect(classTokens).toContain('shadow-brutal-stacked')
    })
})
