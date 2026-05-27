export interface ComponentMeta {
    name: string;
    dependencies: string[];
    title?: string;
    description?: string;
    tailwind?: Record<string, any>;
    cssVars?: {
        light?: Record<string, string>;
        dark?: Record<string, string>;
    };
}
