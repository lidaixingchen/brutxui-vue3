import type { ComputedRef, Ref } from 'vue'
import type { SelectionMode, TreeNode } from '@/types/tree'

export type { SelectionMode, TreeNode }
export type CheckState = 'checked' | 'unchecked' | 'indeterminate'

export interface TreeViewContext {
    lazy: ComputedRef<boolean>;
    retryOnError: ComputedRef<boolean>;
    loadingKeys: Ref<Set<string>>;
    failedKeys: Ref<Set<string>>;
    draggable: ComputedRef<boolean>;
    draggedNode: Ref<TreeNode | null>;
    dragOverNode: Ref<TreeNode | null>;
    dropType: Ref<'before' | 'after' | 'inner' | null>;
    triggerLoad: (node: TreeNode) => Promise<void>;
    onNodeDragStart: (event: DragEvent, node: TreeNode) => void;
    onNodeDragOver: (event: DragEvent, node: TreeNode, rect: DOMRect, clientY: number) => void;
    onNodeDragEnter: (event: DragEvent, node: TreeNode) => void;
    onNodeDragLeave: (event: DragEvent, node: TreeNode) => void;
    onNodeDragEnd: (event: DragEvent, node: TreeNode) => void;
    onNodeDrop: (event: DragEvent, node: TreeNode) => void;
}
