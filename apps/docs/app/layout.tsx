import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import 'brutx-ui/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: {
        default: 'Brutx - Neo Brutalism React Component Library',
        template: '%s | Brutx',
    },
    description:
        'Brutx UI library for React. 26+ Neo Brutalism UI components with bold borders, offset shadows, vibrant colors. Free & open-source. Built with Radix UI, Tailwind CSS. Use CLI: npx brutx@latest init. Best shadcn alternative for brutalist design.',
    metadataBase: new URL('https://brutxui.site'),
    keywords: [
        // Primary keywords (exact match từ Google search)
        'brutalism ui',
        'brutalist ui',
        'neo brutalism ui',
        'neo brutalism',
        'neubrutalism',

        // Library/Components keywords
        'brutalism ui library',
        'brutalism ui components',
        'neo brutalism ui components',
        'neo brutalism ui shadcn',
        'brutalist ui kit',
        'neobrutalism components',

        // React specific
        'brutalism react',
        'neo brutalism react',
        'brutalist react components',
        'react brutalism ui',
        'react ui library',
        'react component library',

        // Design keywords
        'brutalism design',
        'brutalist design',
        'neo brutalist',
        'neubrutalism design',
        'brutalism web design',

        // Tech stack
        'tailwind brutalism',
        'radix ui brutalism',
        'shadcn alternative',
        'shadcn brutalism',

        // Features
        'bold ui components',
        'offset shadow ui',
        'vibrant colors ui',
        'accessible components',
        'typescript ui library',
        'open source ui',
        'free react components',
    ],
    authors: [{ name: 'dev-snake', url: 'https://github.com/dev-snake' }],
    creator: 'dev-snake',
    publisher: 'Brutx',
    category: 'Technology',
    classification: 'Software Development',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://brutxui.site',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://brutxui.site',
        siteName: 'Brutx',
        title: 'Brutx - Neo Brutalism React Component Library',
        description:
            'Brutx UI library with 26+ Neo Brutalism components. Bold borders, offset shadows, vibrant colors. Free & open-source React UI kit. Best shadcn alternative.',
        images: [
            {
                url: '/og-image.svg',
                width: 1200,
                height: 630,
                alt: 'Brutx - Neo Brutalism React Component Library',
                type: 'image/svg+xml',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Brutx - Neo Brutalism React Component Library',
        description:
            'Brutx UI library with 26+ Neo Brutalism React components. Free & open-source.',
        images: ['/og-image.svg'],
        creator: '@devsnake',
    },
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/favicon.svg',
    },
    manifest: '/manifest.json',
    verification: {
        google: 'google4dc1dc17528f75a7',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // WebSite Schema - QUAN TRỌNG cho Sitelinks và Search Box
    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://brutxui.site/#website',
        name: 'Brutx',
        alternateName: ['Brutx UI', 'Neo Brutalism UI', 'BrutxUI'],
        url: 'https://brutxui.site',
        description:
            'Brutx UI library for React. 26+ Neo Brutalism UI components with bold borders, offset shadows, vibrant colors.',
        publisher: {
            '@id': 'https://brutxui.site/#organization',
        },
        potentialAction: [
            {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://brutxui.site/docs/components/{search_term_string}',
                },
                'query-input': 'required name=search_term_string',
            },
        ],
        inLanguage: 'en-US',
    };

    // Organization Schema - Cho Logo và Brand
    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://brutxui.site/#organization',
        name: 'Brutx',
        url: 'https://brutxui.site',
        logo: 'https://brutxui.site/favicon.svg',
        sameAs: [
            'https://github.com/dev-snake/brutx',
            'https://www.npmjs.com/package/brutx-ui',
        ],
    };

    // SoftwareApplication Schema
    const softwareJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Brutx',
        alternateName: ['Brutx UI', 'Neo Brutalism UI', 'Neubrutalism UI'],
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'UI Component Library',
        operatingSystem: 'Any',
        description:
            'Brutx UI library for React with 26+ Neo Brutalism components. Bold borders, offset shadows, vibrant colors. Free & open-source.',
        url: 'https://brutxui.site',
        downloadUrl: 'https://www.npmjs.com/package/brutx-ui',
        softwareVersion: '0.1.7',
        programmingLanguage: ['TypeScript', 'React', 'JavaScript'],
        author: {
            '@id': 'https://brutxui.site/#organization',
        },
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
        },
        keywords:
            'brutx, neo brutalism, brutx ui, neubrutalism, react components, ui library',
    };

    // SiteNavigationElement Schema - QUAN TRỌNG cho Sitelinks
    const navigationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': 'https://brutxui.site/#navigation',
        name: 'Main Navigation',
        itemListElement: [
            {
                '@type': 'SiteNavigationElement',
                position: 1,
                name: 'Introduction',
                description: 'Get started with Brutx',
                url: 'https://brutxui.site/docs',
            },
            {
                '@type': 'SiteNavigationElement',
                position: 2,
                name: 'Installation',
                description: 'Install and configure Brutx for your project',
                url: 'https://brutxui.site/docs/installation',
            },
            {
                '@type': 'SiteNavigationElement',
                position: 3,
                name: 'Components',
                description: 'Browse all 26+ Neo Brutalism UI components',
                url: 'https://brutxui.site/docs/components',
            },
            {
                '@type': 'SiteNavigationElement',
                position: 4,
                name: 'CLI',
                description: 'Use the CLI to add components to your project',
                url: 'https://brutxui.site/docs/cli',
            },
            {
                '@type': 'SiteNavigationElement',
                position: 5,
                name: 'Button',
                description: 'Interactive button component with multiple variants',
                url: 'https://brutxui.site/docs/components/button',
            },
            {
                '@type': 'SiteNavigationElement',
                position: 6,
                name: 'Card',
                description: 'Container component with header, content, and footer',
                url: 'https://brutxui.site/docs/components/card',
            },
        ],
    };

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Favicon - Dùng trực tiếp favicon.svg */}
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/favicon.svg" />

                {/* Schema.org JSON-LD - Order matters! */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationJsonLd) }}
                />
            </head>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
