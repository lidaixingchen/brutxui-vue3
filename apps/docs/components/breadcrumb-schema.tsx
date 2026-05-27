'use client';

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
    );
}

export const breadcrumbs = {
    home: [{ name: 'Brutx', url: 'https://brutxui.site' }],
    docs: [
        { name: 'Brutx', url: 'https://brutxui.site' },
        { name: 'Documentation', url: 'https://brutxui.site/docs' },
    ],
    installation: [
        { name: 'Brutx', url: 'https://brutxui.site' },
        { name: 'Documentation', url: 'https://brutxui.site/docs' },
        { name: 'Installation', url: 'https://brutxui.site/docs/installation' },
    ],
    components: [
        { name: 'Brutx', url: 'https://brutxui.site' },
        { name: 'Documentation', url: 'https://brutxui.site/docs' },
        { name: 'Components', url: 'https://brutxui.site/docs/components' },
    ],
    cli: [
        { name: 'Brutx', url: 'https://brutxui.site' },
        { name: 'Documentation', url: 'https://brutxui.site/docs' },
        { name: 'CLI', url: 'https://brutxui.site/docs/cli' },
    ],
};

export function getComponentBreadcrumb(componentName: string, componentSlug: string) {
    return [
        { name: 'Brutx', url: 'https://brutxui.site' },
        { name: 'Documentation', url: 'https://brutxui.site/docs' },
        { name: 'Components', url: 'https://brutxui.site/docs/components' },
        { name: componentName, url: `https://brutxui.site/docs/components/${componentSlug}` },
    ];
}
