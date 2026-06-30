import plugin from 'tailwindcss/plugin';

/**
 * BrutxUI Tailwind CSS Plugin
 *
 * Utility classes (.nb-*) and component classes (.nb-btn, .nb-card, .nb-input)
 * were previously defined here but have been removed because they are not used
 * by any BrutxUI component. The library uses Tailwind utility classes directly
 * in component templates (e.g., shadow-brutal, border-3, border-brutal).
 *
 * This plugin is retained as an empty shell for backward compatibility —
 * importing it will not add any CSS to the output.
 */
const brutalismPlugin = plugin(function () {
    // Intentionally empty — all styles are in styles.css
});

export default brutalismPlugin;
