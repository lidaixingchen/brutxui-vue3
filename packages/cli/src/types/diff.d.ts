declare module 'diff' {
    interface Change {
        value: string;
        added?: boolean;
        removed?: boolean;
    }

    export function diffLines(oldStr: string, newStr: string): Change[];
    export function diffWords(oldStr: string, newStr: string): Change[];
    export function createTwoFilesPatch(oldFileName: string, newFileName: string, oldStr: string, newStr: string): string;
}
