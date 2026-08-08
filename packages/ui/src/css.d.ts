// 纯副作用 CSS 导入（如 `import 'v-calendar/style.css'`）没有有意义的默认导出。
// 声明为空模块，避免 `import x from './a.css'` 在类型上看似合法、运行时却为 undefined。
declare module '*.css' {}

// CSS Modules（*.module.css）默认导出为类名映射对象。
declare module '*.module.css' {
    const classes: Record<string, string>
    export default classes
}
