import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        TooltipContent: {
            props: {
                class: { zh: '追加到 Portal 中工具提示内容面板的 CSS 类。', en: 'Additional CSS classes applied to the tooltip content panel rendered through the portal.' },
                to: { zh: '指定 Portal 挂载目标，可以是 CSS 选择器字符串或 HTMLElement；未指定时挂载到 body。', en: 'Selects the portal target using a CSS selector or HTMLElement. When omitted, the content is portaled to body.' },
                forceMount: { zh: '即使工具提示关闭也强制挂载内容，便于由 Vue 动画库等控制显示过渡。', en: 'Keeps the content mounted while the tooltip is closed so a Vue animation library can control its transition.' },
                ariaLabel: { zh: '为内容面板提供无障碍名称；当面板内容不足以说明其用途时可设置。', en: 'Provides an accessible name for the content panel when its contents do not adequately describe it.' },
                asChild: { zh: '将内容面板属性与交互行为合并到唯一子元素，并由子元素替代默认面板元素。', en: 'Merges the content panel props and behavior into its single child, which replaces the default panel element.' },
                as: { zh: '指定内容面板使用的 HTML 标签或 Vue 组件；与 asChild 同时设置时由 asChild 决定渲染元素。', en: 'Selects the HTML tag or Vue component for the content panel; asChild takes precedence when both are set.' },
                sideOffset: { zh: '设置内容面板与触发器之间的距离，单位为像素。', en: 'Sets the pixel distance between the content panel and its trigger.' },
                align: { zh: '设置内容相对于触发器的首选对齐方式；发生边界碰撞时可能调整。', en: 'Sets the preferred alignment of the content against its trigger; collision handling may adjust it.' },
                collisionPadding: { zh: '设置内容进行碰撞检测时与边界的留白；数字应用于各边，也可分别指定各方向的像素值。', en: 'Sets padding from the collision boundary. A number applies to every edge; an object can set each edge in pixels.' },
                side: { zh: '设置内容相对触发器的首选显示方向；启用碰撞处理时可翻转到其他方向。', en: 'Sets the preferred side of the trigger for the content; collision handling may flip it to another side.' },
                alignOffset: { zh: '沿 start 或 end 对齐方向额外偏移的像素数。', en: 'Adds a pixel offset along the start or end alignment axis.' },
                avoidCollisions: { zh: '启用后根据边界空间调整首选 side 与 align，避免内容越过碰撞边界。', en: 'Adjusts the preferred side and alignment to keep content inside the collision boundary.' },
                collisionBoundary: { zh: '参与碰撞检测的边界元素；默认使用视口，也可传入一个或多个额外元素。', en: 'The element or elements used as collision boundaries. The viewport is used by default.' },
                arrowPadding: { zh: '设置箭头与内容边缘之间的留白，避免箭头越过圆角。', en: 'Sets padding between the arrow and content edges so the arrow does not overlap rounded corners.' },
                sticky: { zh: '设置沿对齐轴的粘附策略；partial 在触发器仍部分可见时保持内容在边界内，always 则始终保持。', en: 'Sets stickiness on the alignment axis. partial keeps content inside while the trigger remains partly visible; always keeps it inside throughout.' },
                hideWhenDetached: { zh: '触发器完全离开视口或边界时隐藏内容。', en: 'Hides the content when its trigger becomes fully detached from the viewport or boundary.' },
                positionStrategy: { zh: '设置浮层使用 fixed 或 absolute CSS 定位策略。', en: 'Selects the floating panel’s fixed or absolute CSS positioning strategy.' },
                updatePositionStrategy: { zh: '设置浮层位置更新策略；always 每帧更新，optimized 使用优化后的更新时机。', en: 'Selects how the floating position is updated: always updates each animation frame, while optimized uses scheduled updates.' },
            },
            slots: {
                default: { zh: '渲染工具提示面板中的说明内容。', en: 'Renders the explanatory content inside the tooltip panel.' },
            },
        },
        TooltipProvider: {
            props: {
                delayDuration: { zh: '指针进入触发器后打开工具提示前的等待时间，单位为毫秒；默认 400。', en: 'The delay in milliseconds between pointer entry and opening a tooltip; defaults to 400.' },
                skipDelayDuration: { zh: '关闭一个工具提示后，在此毫秒数内进入另一个触发器时跳过打开延迟。', en: 'The number of milliseconds after closing a tooltip during which entering another trigger skips its delay.' },
                disableHoverableContent: { zh: '启用后，指针离开触发器时即关闭内容；指针不能移入内容区域继续保持打开。', en: 'When enabled, the tooltip closes as the pointer leaves its trigger instead of remaining open while the pointer enters its content.' },
                disableClosingTrigger: { zh: '启用后，点击触发器不会关闭已打开的工具提示。', en: 'When enabled, clicking a trigger does not close an open tooltip.' },
                disabled: { zh: '禁用此 Provider 下的所有工具提示。', en: 'Disables all tooltips managed by this provider.' },
                ignoreNonKeyboardFocus: { zh: '忽略非键盘产生的焦点；只有匹配 :focus-visible 的键盘焦点才会触发工具提示。', en: 'Ignores focus not produced by keyboard navigation; only focus matching :focus-visible can open a tooltip.' },
                content: { zh: '为此 Provider 下的 TooltipContent 设置默认定位与挂载选项；单个内容组件可以覆盖。', en: 'Provides default positioning and mounting options for TooltipContent instances under this provider; an individual content component can override them.' },
            },
            slots: {
                default: { zh: '放置受此 Provider 配置管理的 Tooltip 组件。', en: 'Contains Tooltip components managed by this provider’s settings.' },
            },
        },
    },
} satisfies ApiContent

export default content
