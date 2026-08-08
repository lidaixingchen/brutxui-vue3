// 说明：本包不再声明 `*.vue` 通配 shim——.vue 的 props/emits/slots 类型检查由 vue-tsc 接管
// （见 scripts 中的 `vue-tsc --noEmit`）。宽泛的 `DefineComponent<object, object, unknown>` shim
// 会让所有 props 静默通过编译，仅应在不启用 Volar/vue-tsc 的纯 tsc 环境中作为兜底。

// prismjs 语言组件为纯副作用模块（导入即向全局 Prism 注册语言）。
// 这里显式声明本包实际使用的语言模块（见 components/code-block/prism-languages.ts），
// 使拼写错误或新增未声明语言在编译期暴露，而非延迟到运行时。
declare module 'prismjs/components/prism-markup' {}
declare module 'prismjs/components/prism-css' {}
declare module 'prismjs/components/prism-clike' {}
declare module 'prismjs/components/prism-javascript' {}
declare module 'prismjs/components/prism-typescript' {}
declare module 'prismjs/components/prism-jsx' {}
declare module 'prismjs/components/prism-tsx' {}
declare module 'prismjs/components/prism-json' {}
declare module 'prismjs/components/prism-bash' {}
declare module 'prismjs/components/prism-shell-session' {}
declare module 'prismjs/components/prism-python' {}
declare module 'prismjs/components/prism-sql' {}
declare module 'prismjs/components/prism-java' {}
declare module 'prismjs/components/prism-c' {}
declare module 'prismjs/components/prism-cpp' {}
declare module 'prismjs/components/prism-go' {}
declare module 'prismjs/components/prism-rust' {}
declare module 'prismjs/components/prism-scss' {}
declare module 'prismjs/components/prism-yaml' {}
declare module 'prismjs/components/prism-markdown' {}

// embla-carousel@8.6.0 自带完整类型声明（EmblaOptionsType / EmblaPluginType / EmblaCarouselType），
// 此处不再手写覆盖，避免与真实 API 漂移：手写声明丢失选项/事件名类型校验，
// 且 containerNode/rootNode 真实返回类型为 `HTMLElement | null`。
