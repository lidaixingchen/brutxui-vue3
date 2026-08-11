import type { InjectionKey, Ref } from 'vue'

/**
 * Alert 提供给 AlertDescription 的描述 id 集合注入。
 *
 * AlertDescription 挂载时把自身解析出的 id 推入、卸载时移除，Alert 据此聚合
 * `aria-describedby`（多段描述以空格连接）。仅在 Alert 内渲染的 AlertDescription
 * 会注册；独立使用时注入为 null，组件仍正常渲染，仅不参与关联。
 */
export const alertDescriptionIdsKey: InjectionKey<Ref<string[]>> = Symbol('alert-description-ids')
