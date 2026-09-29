import type { ApiContent } from '../api-types'

const content = {
    complete: true,
    members: {
        Form: {
            props: {
                inline: { zh: '让表单项在可换行的横向布局中排列。', en: 'Arranges form items in a wrapping horizontal layout.' },
                labelPosition: { zh: 'left 与 right 将标签放在控件左侧并分别左对齐或右对齐；top 将标签放在控件上方。', en: 'left and right place labels to the left of controls with the corresponding alignment; top places labels above controls.' },
                labelWidth: { zh: '横向标签布局的标签列宽度；数值按像素处理，字符串按 CSS 宽度处理，top 布局不使用此值。', en: 'The label-column width in horizontal label layouts. Numbers are pixels and strings are CSS widths; top layouts do not use this value.' },
                scrollToError: { zh: '调用实例 validate() 且验证失败时，平滑滚动到首个错误字段；原生提交处理不使用此选项。', en: 'Smoothly scrolls to the first invalid field when the instance validate() method fails. Native submission handling does not use this option.' },
                size: { zh: '为表单项间距、标签、说明和错误消息提供统一尺寸，并通过 FormControl 插槽向控件提供 size。', en: 'Provides a shared size for item spacing, labels, descriptions, and errors, and exposes size to controls through the FormControl slot.' },
                class: { zh: '合并到原生 form 根元素的自定义 CSS 类。', en: 'Custom CSS classes merged onto the native form root.' },
                initialValues: { zh: '传给 vee-validate 的表单初始字段值；属性引用改变且表单尚未被用户修改时，使用新值重置表单。', en: 'Initial field values passed to vee-validate. A changed prop reference resets the form with the new values while the form is pristine.' },
                validationSchema: { zh: '传给 vee-validate 的响应式验证模式，可使用其支持的规则或转换后的 Zod schema。', en: 'The reactive validation schema passed to vee-validate, using supported rules or a converted Zod schema.' },
            },
            events: {
                submit: { zh: '表单提交且 vee-validate 验证通过后发出字段值。', en: 'Emits field values after form submission passes vee-validate validation.' },
            },
            slots: { default: { zh: '表单字段、说明与提交操作，子组件可读取 Form 提供的验证和布局上下文。', en: 'Form fields, descriptions, and submission controls. Descendants can access the validation and layout context provided by Form.' } },
            exposes: {
                validate: { zh: '验证全部字段并异步返回是否有效；失败且 scrollToError 开启时滚动到第一个错误字段。', en: 'Validates all fields and asynchronously returns their validity. On failure, scrolls to the first invalid field when scrollToError is enabled.' },
                validateField: { zh: '按字段名称验证单个字段，并异步返回该字段是否有效。', en: 'Validates one field by name and asynchronously returns whether it is valid.' },
                resetFields: { zh: '调用 vee-validate 的 resetForm，将字段和表单状态恢复到初始状态。', en: 'Calls vee-validate resetForm to restore fields and form state to their initial state.' },
                clearValidate: { zh: '清除指定字段的验证错误；未传参数或传空数组时清除全部错误，保留当前字段值。', en: 'Clears validation errors for the specified fields. Omission or an empty array clears all errors while preserving current field values.' },
                scrollToField: { zh: '通过表单控件的 name 查找字段并平滑滚动到其顶部；同名单选组取第一个控件，找不到时不执行滚动。', en: 'Finds a form control by name and smoothly scrolls to its top. Radio groups use the first control; no scrolling occurs when the field is absent.' },
            },
        },
        FormConditional: {
            props: {
                when: {
                    zh: '决定条件内容是否挂载的判断函数，需要在 Form 内使用；建议使用稳定的具名函数引用。',
                    en: 'The predicate deciding whether conditional content is mounted. Use it inside Form and prefer a stable named function reference.',
                    notes: { 'zh-CN': ['当前实现从表单上下文读取 values.value，缺失时传入空对象；普通的扁平字段记录不会作为完整 values 传入。'], en: ['The current implementation reads values.value from the form context and passes an empty object when it is absent; a normal flat field record is not passed as the complete values object.'] },
                },
                class: { zh: '条件为真时合并到包裹内容的 div 元素上的 CSS 类。', en: 'CSS classes merged onto the content wrapper div when the condition is true.' },
            },
            slots: { default: { zh: '条件为真时挂载的字段或其他内容；条件为假时卸载整个内容区域。', en: 'Fields or other content mounted when the condition is true. The entire region is unmounted when it becomes false.' } },
        },
        FormControl: {
            props: { class: { zh: '与表单控件布局样式合并，并通过 as-child 应用到默认插槽唯一根控件的 CSS 类。', en: 'CSS classes merged with form-control layout styles and applied through as-child to the single root control in the default slot.' } },
            slots: { default: { zh: '放置唯一根控件。提供与 FormItem 关联的 id、class、ariaDescribedby、ariaInvalid 和 Form 的 size，可显式绑定到控件；有效错误文本存在时描述关系包含错误消息。', en: 'Contains one root control. Provides the FormItem-linked id, class, ariaDescribedby, ariaInvalid, and Form size for explicit binding. The description relationship includes the error message when meaningful error text is present.' } },
        },
        FormDescription: {
            props: { class: { zh: '合并到字段辅助说明段落的 CSS 类；段落使用 FormItem 提供的描述 ID。', en: 'CSS classes merged onto the field description paragraph, which uses the description ID provided by FormItem.' } },
            slots: { default: { zh: '字段的辅助说明；未提供此插槽时不渲染说明段落。', en: 'Supporting guidance for the field. The description paragraph is not rendered when this slot is omitted.' } },
        },
        FormField: {
            props: { name: { zh: '向 vee-validate 注册的字段名称，在组件生命周期内应保持稳定；更换名称需要处理旧字段值和错误残留。', en: 'The field name registered with vee-validate. Keep it stable during the component lifetime; changing it requires handling retained values and errors for the previous name.' } },
            slots: { default: { zh: '读取当前字段上下文的内容，通常放置 FormItem；此插槽不直接提供字段参数。', en: 'Content that consumes the current field context, typically FormItem. The slot does not directly provide field arguments.' } },
        },
        FormItem: {
            props: { class: { zh: '合并到字段布局容器的 CSS 类，容器按 Form 的标签位置、宽度和尺寸布局。', en: 'CSS classes merged onto the field layout container, which follows the Form label position, width, and size.' } },
            slots: { default: { zh: '字段标签、控件、说明及错误消息，共享此 FormItem 自动生成的关联 ID。', en: 'The field label, control, description, and error message, sharing the IDs generated by this FormItem.' } },
        },
        FormLabel: {
            props: { class: { zh: '合并到字段标签的 CSS 类；存在非空错误消息时自动使用错误颜色。', en: 'CSS classes merged onto the field label. Meaningful error text automatically applies the error color.' } },
            slots: { default: { zh: '字段标签内容，通过 for 关联 FormItem 的控件 ID。', en: 'The field label content, linked through for to the FormItem control ID.' } },
        },
        FormMessage: {
            props: { class: { zh: '合并到验证错误段落的 CSS 类；仅当字段错误去除空白后非空时渲染，并使用 role="alert"。', en: 'CSS classes merged onto the validation error paragraph. It renders with role="alert" only when the field error is non-empty after trimming.' } },
        },
        FormWizard: {
            props: {
                steps: { zh: '步骤配置列表，包含稳定 id、标题及可选 validator；id 决定 step-{id} 插槽名称。', en: 'The step configuration list with stable IDs, titles, and optional validators. Each ID determines its step-{id} slot name.' },
                modelValue: { zh: '跨步骤共享的扁平字段记录，通过 v-model 控制；useFormWizard().updateValues() 会浅合并字段补丁后发出更新。', en: 'The flat field record shared across steps and controlled through v-model. useFormWizard().updateValues() emits updates after shallowly merging field patches.' },
                initialStep: { zh: '初始步骤索引，从 0 开始，创建时约束到 steps 的有效范围。', en: 'The initial zero-based step index, clamped to the valid steps range at creation.' },
                validateOnNext: { zh: '前进时验证当前步骤；完成时重新验证全部带 validator 的步骤，包括 optional 步骤。', en: 'Validates the current step when advancing, and revalidates all steps with validators when completing, including optional steps.' },
                showIndicator: { zh: '显示顶部步骤指示器，用户可通过指示器请求导航。', en: 'Shows the top step indicator, which users can use to request navigation.' },
                linear: { zh: '向前导航前要求目标之前的必选步骤已完成；optional 步骤可跳过，向后导航不受此限制。', en: 'Requires preceding required steps to be completed before forward navigation. Optional steps may be skipped; backward navigation is unrestricted.' },
                class: { zh: '合并到带 role="form" 的向导根容器的 CSS 类。', en: 'CSS classes merged onto the wizard root container with role="form".' },
            },
            events: {
                'update:modelValue': { zh: '通过向导上下文更新字段时，发出与现有数据浅合并后的完整字段记录。', en: 'Emits the complete field record after shallowly merging a field update made through the wizard context.' },
                'step-change': { zh: '导航切换或完成校验失败后回到错误步骤时，发出目标与先前的步骤索引，均从 0 开始。', en: 'Emits the target and previous zero-based indices on navigation or when completion validation returns to a failing step.' },
                complete: { zh: '完成操作通过已启用的步骤验证后发出全部表单数据。', en: 'Emits all form data when the completion action passes the enabled step validation.' },
                'validation-error': { zh: '步骤 validator 返回无效结果时发出步骤索引及其字段错误记录。', en: 'Emits the step index and field error record when a step validator returns an invalid result.' },
                'navigation-blocked': { zh: '线性导航遇到未完成的必选前置步骤时，发出目标索引和阻塞步骤索引。', en: 'Emits the target and blocking indices when linear navigation encounters an incomplete required preceding step.' },
            },
        },
    },
    supplements: {
        FormWizard: [{
            name: 'step-{id}',
            kind: 'slots',
            type: '{ step: FormStep; index: number }',
            origin: 'supplement',
            source: { file: 'packages/ui/src/components/form/FormWizard.vue', line: 217 },
            description: {
                'zh-CN': '按步骤 id 命名的动态插槽，接收步骤配置与从 0 开始的索引。全部步骤内容保持挂载，通过 v-show 切换当前面板。',
                en: 'A dynamic slot named after the step ID, receiving its configuration and zero-based index. All step content remains mounted, with v-show selecting the current panel.',
            },
        }],
    },
} satisfies ApiContent

export default content
