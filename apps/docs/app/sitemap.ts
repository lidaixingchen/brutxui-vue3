import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://brutxui.site';

    const components = [
        'alert',
        'alert-dialog',
        'avatar',
        'badge',
        'button',
        'calendar',
        'card',
        'checkbox',
        'combobox',
        'command',
        'dialog',
        'dropdown-menu',
        'form',
        'input',
        'label',
        'pagination',
        'popover',
        'progress',
        'radio-group',
        'scroll-area',
        'select',
        'separator',
        'sheet',
        'slider',
        'skeleton',
        'spinner',
        'submit-button',
        'switch',
        'toggle',
        'toggle-group',
        'table',
        'tabs',
        'textarea',
        'toast',
        'tooltip',
    ];

    const componentPages = components.map((component) => ({
        url: `${baseUrl}/docs/components/${component}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const installationPages = [
        {
            url: `${baseUrl}/docs/installation`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/docs/installation/nextjs`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
        },
        {
            url: `${baseUrl}/docs/installation/vite`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
        },
        {
            url: `${baseUrl}/docs/installation/manual`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
        },
        {
            url: `${baseUrl}/docs/installation/shadcn`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
        },
    ];

    const blocksList = [
        'brutalist-hero',
        'pricing-section',
        'auth-card',
        'dashboard-shell',
        'empty-state',
        'waitlist-page',
    ];

    const blockPages = blocksList.map((block) => ({
        url: `${baseUrl}/docs/blocks/${block}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/docs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.95,
        },
        {
            url: `${baseUrl}/docs/components`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/docs/blocks`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/docs/cli`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/docs/theme`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/docs/ai`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        ...installationPages,
        {
            url: `${baseUrl}/sponsor`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...componentPages,
        ...blockPages,
    ];
}
