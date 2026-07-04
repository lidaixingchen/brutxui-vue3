export type SelectionMode = 'single' | 'checkbox';

export interface TreeNode {
    id: string;
    label: string;
    icon?: string;
    children?: TreeNode[];
    data?: unknown;
    disabled?: boolean;
    isLeaf?: boolean;
    loaded?: boolean;
    loading?: boolean;
    hidden?: boolean;
}

