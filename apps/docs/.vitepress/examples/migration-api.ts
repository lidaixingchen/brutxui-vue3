import { ref } from 'vue'

// #region imports
import { Button } from 'brutx-ui-vue'
import { Combobox, type ComboboxOption } from 'brutx-ui-vue/combobox'
import { TreeSelect, type TreeNode, type SelectionMode } from 'brutx-ui-vue/tree-select'
import { Loading, vLoading } from 'brutx-ui-vue/loading'
import { useReducedMotion } from 'brutx-ui-vue/useReducedMotion'
// #endregion imports

// #region props-inference
// Deduce component Props types via InstanceType
type ButtonProps = InstanceType<typeof Button>['$props']
type ComboboxProps = InstanceType<typeof Combobox>['$props']
// #endregion props-inference

// #region selector-usage
// Standard two-way data binding with public options contract
const selectedValue = ref<string>('')
const options: ComboboxOption[] = [
    { label: 'Vue 3', value: 'vue3' },
    { label: 'Tailwind CSS', value: 'tailwind' },
]

const treeSelectionMode: SelectionMode = 'checkbox'
const treeData: TreeNode[] = [
    { id: '1', label: 'Frameworks', children: [{ id: '1-1', label: 'Vue' }] },
]
// #endregion selector-usage

// #region button-effect
// Explicitly enable effects via effect="glitch" (default is "none")
const isPlaying = ref<boolean>(false)
const handleGlitch = (): void => {
    isPlaying.value = true
}
// #endregion button-effect

// #region reduced-motion
// useReducedMotion returns a readonly Ref<boolean>
const prefersReducedMotion = useReducedMotion()
// #endregion reduced-motion

export {
    Button,
    Combobox,
    TreeSelect,
    Loading,
    vLoading,
    useReducedMotion,
    selectedValue,
    options,
    treeSelectionMode,
    treeData,
    isPlaying,
    handleGlitch,
    prefersReducedMotion,
}
export type { ButtonProps, ComboboxProps }
