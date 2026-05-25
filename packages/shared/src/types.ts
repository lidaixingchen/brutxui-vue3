/**
 * Component metadata types shared across CLI and Registry packages.
 *
 * This is the single source of truth for what components exist,
 * their names, and their npm dependency requirements.
 */

/**
 * Metadata for a single component in the Brutx registry.
 * Used by both the CLI (for validation + dependency installation)
 * and the registry build script (for JSON schema generation).
 */
export interface ComponentMeta {
    /** Component identifier (kebab-case, matches filename) */
    name: string;
    /** Third-party npm packages required by this component */
    dependencies: string[];
    /** The display title of the component */
    title?: string;
    /** A concise description of what the component does */
    description?: string;
    /** Tailwind configuration requirements if applicable */
    tailwind?: Record<string, any>;
    /** Global CSS variable declarations for light and dark modes */
    cssVars?: {
        light?: Record<string, string>;
        dark?: Record<string, string>;
    };
}
