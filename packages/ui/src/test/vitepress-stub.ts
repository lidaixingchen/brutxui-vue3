import { readonly, ref } from 'vue'

const lang = readonly(ref('zh-CN'))

export function useData() {
    return { lang }
}
