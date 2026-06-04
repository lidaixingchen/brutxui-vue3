const wrapVitePressPlugin = () => {
    return {
        postcssPlugin: 'wrap-vitepress-styles',
        Once(root, { AtRule }) {
            const file = root.source?.input?.file || '';
            const normalizedFile = file.replace(/\\/g, '/');
            
            const isVitePress = normalizedFile.includes('node_modules/vitepress') || normalizedFile.includes('vitepress/dist');
            const isVCalendar = normalizedFile.includes('v-calendar');
            
            if (isVitePress || isVCalendar) {
                const layerName = isVitePress ? 'vitepress-theme' : 'v-calendar-theme';
                const children = root.nodes.slice();
                root.removeAll();
                
                const layerRule = new AtRule({
                    name: 'layer',
                    params: layerName,
                    nodes: children
                });
                root.append(layerRule);
            }
        }
    };
};
wrapVitePressPlugin.postcss = true;

module.exports = {
    plugins: [
        wrapVitePressPlugin(),
        require('@tailwindcss/postcss')(),
    ],
}

