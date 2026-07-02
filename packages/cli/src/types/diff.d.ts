declare module 'diff' {
    interface Change {
        value: string;
        added?: boolean;
        removed?: boolean;
    }

    export function diffLines(oldStr: string, newStr: string): Change[];
}
