import uiPackage from '../../../packages/ui/package.json';

export const SITE_CONFIG = {
    version: uiPackage.version,
    name: 'Brutx',
    title: 'Brutx - Neo Brutalism React Component Library',
    description: 'Brutx UI library for React. 27+ Neo Brutalism UI components with bold borders, offset shadows, vibrant colors. Free & open-source. Built with Radix UI, Tailwind CSS. Use CLI: npx brutx@latest init. Best shadcn alternative for brutalist design.',
    url: 'https://brutxui.site',
    github: {
        owner: 'dev-snake',
        repo: 'brutxui',
        url: 'https://github.com/dev-snake/brutxui',
        raw: 'https://raw.githubusercontent.com/dev-snake/brutxui/main',
        componentsUrl: 'https://github.com/dev-snake/brutxui/tree/main/packages/ui/src/components',
        componentBlobUrl: 'https://github.com/dev-snake/brutxui/blob/main/packages/ui/src/components'
    },
    npm: {
        cli: 'https://www.npmjs.com/package/brutx',
        ui: 'https://www.npmjs.com/package/brutx-ui'
    },
    social: {
        twitter: 'https://twitter.com/intent/tweet?text=Check%20out%20Brutx%20-%20A%20Neo-Brutalism%20styled%20React%20component%20library!%20https://github.com/dev-snake/brutxui',
        creator: '@devsnake'
    }
} as const;
