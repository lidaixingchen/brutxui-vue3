import { Badge } from '@/components/ui';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Getting Started - Brutx | Neo-Brutalism React Component Registry',
    description:
        'BrutxUI is a high-fidelity Neo-Brutalist React component system built on top of Radix UI primitives and Tailwind CSS. Ideal for bold SaaS apps, dashboards, and developers.',
    keywords: [
        'brutx docs',
        'neo-brutalism guide',
        'react component registry',
        'brutalism css',
        'radix ui brutalism',
        'shadcn brutalist alternative',
    ],
    openGraph: {
        title: 'Getting Started - Brutx',
        description: 'Learn how to use Brutx, the Neo-Brutalism React component registry.',
        url: 'https://brutxui.site/docs',
    },
    alternates: {
        canonical: 'https://brutxui.site/docs',
    },
};

export default function DocsPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="accent" className="mb-4">
                    Introduction & Philosophy
                </Badge>
                <h1 className="text-4xl font-black mb-2">Getting Started</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    BrutxUI is a high-fidelity React component registry built with a Neo-Brutalist design language. 
                    Rather than operating as a heavy node dependency, BrutxUI is a <strong>copy-paste-first component library</strong> (inspired by shadcn/ui) designed for full customization, performance, and accessibility.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🎯 Honest Positioning & Use Cases</h2>
                <p>
                    Neo-Brutalism is distinct, loud, and high-contrast. We built BrutxUI with a clear purpose in mind:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 border-3 border-black dark:border-white bg-[#4ECDC4]/10 dark:bg-[#4ECDC4]/5 space-y-2">
                        <h3 className="font-black text-[#4ECDC4] dark:text-[#6EE7B7] text-lg">🚀 Where BrutxUI Shines</h3>
                        <p className="text-sm">
                            Best suited for bold SaaS projects, developer portals, indie hacker utilities, creative portfolios, analytics dashboards, web3 landing pages, and consumer tools trying to break through generic template noise.
                        </p>
                    </div>

                    <div className="p-5 border-3 border-black dark:border-white bg-[#FF6B6B]/10 dark:bg-[#FF6B6B]/5 space-y-2">
                        <h3 className="font-black text-[#FF6B6B] dark:text-[#FFA3A3] text-lg">⚠️ Where to Soften It</h3>
                        <p className="text-sm">
                            May not be ideal out-of-the-box for highly conservative enterprise intranets, medical records, or traditional corporate fintech systems—unless you leverage our built-in <strong>Pastel</strong> or <strong>Monochrome</strong> theme presets to soften the contrast.
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">💫 Why copy-paste over npm dependencies?</h2>
                <p>
                    Following the shadcn/ui workflow philosophy, you install BrutxUI components directly into your local components folder (e.g. <code>components/ui/</code>).
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>100% Code Ownership:</strong> The code belongs to you. Need to change the core logic of a Popover or alter a Button variant? Open the file and edit it directly. No waiting on library updates.</li>
                    <li><strong>Zero Runtime Overhead:</strong> Only bundle components you are actively importing. Tree-shaking operates natively at build time.</li>
                    <li><strong>Composability over Abstraction:</strong> Simple APIs with low nesting depths to make extensions extremely intuitive.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🎨 System Customizability (CSS Variables & Presets)</h2>
                <p>
                    BrutxUI features a unified theme and tokens design system built around standard CSS custom properties. 
                    You can configure borders, shadows, and base colors globally in your global CSS file.
                </p>

                <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-4">
                    <h3 className="font-black text-lg">Global Design Tokens</h3>
                    <p className="text-sm">
                        Alter shadow offsets and border widths globally. The components will adjust automatically:
                    </p>
                    <pre className="bg-black text-white p-4 text-xs font-mono overflow-x-auto">
{`:root {
    --brutal-border-width: 3px;     /* Thickness of outlines */
    --brutal-border-color: #000000; /* Border colors */
    --brutal-shadow-color: #000000; /* Drop shadow colors */
    --brutal-shadow-offset: 4px;    /* Normal card/button offset */
}`}
                    </pre>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🛠️ Customization Presets</h2>
                <p>
                    Easily adjust the visual aggression level of BrutxUI components by wrapping your application in one of our built-in preset classes:
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 border-3 border-black bg-white dark:bg-gray-900">
                        <h4 className="font-black text-base text-[#4ECDC4]">1. Classic Brutalism</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">High-contrast borders, thick shadows, and punchy neon accents.</p>
                    </div>
                    <div className="p-4 border-3 border-black bg-white dark:bg-gray-900">
                        <h4 className="font-black text-base text-[#FFE66D]">2. Pastel Neo-Brut</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Slightly rounded border radius, softened shadows, and comforting pastel colors.</p>
                    </div>
                    <div className="p-4 border-3 border-black bg-white dark:bg-gray-900">
                        <h4 className="font-black text-base text-[#FF6B6B]">3. High-Contrast Mono</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Strict black-and-white visual palette for sleek, minimalist interfaces.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🤖 AI-First Integration (Cursor / LLMs)</h2>
                <p>
                    We provide first-class support for AI coding assistants. If you use Cursor, VSCode, or other LLMs, they can seamlessly digest our registry structure:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>llms.txt:</strong> Accessible at the root workspace (<code>/llms.txt</code>), offering a condensed context layout for large language models to construct error-free components.</li>
                    <li><strong>.cursorrules:</strong> Pre-configured guidelines enforcing accessibility, design token safety, and TypeScript correctness.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">♿ Accessibility First</h2>
                <p>
                    BrutxUI must not compromise usability. Every BrutxUI component is built with accessibility as a core constraint:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Radix UI Foundation:</strong> Primitives handle proper ARIA state attributes, screen reader interaction traps, focus rings, and browser focus management natively.</li>
                    <li><strong>Color Contrast:</strong> Heavy outline indicators protect visibility inside both light and dark modes.</li>
                    <li><strong>Responsive Layouts:</strong> Responsive flex-grid grids protect content readability across screen viewports.</li>
                </ul>
            </section>

            <section className="space-y-6 pt-4">
                <h2 className="text-3xl font-black">Next Steps</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <Link href="/docs/installation" className="p-4 border-3 border-black hover:bg-gray-100 dark:hover:bg-gray-800 block">
                        <h4 className="font-bold text-lg mb-1">🏁 Installation Guide</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Initialize BrutxUI in your project and copy components via CLI.</p>
                    </Link>

                    <Link href="/docs/theme" className="p-4 border-3 border-black hover:bg-gray-100 dark:hover:bg-gray-800 block">
                        <h4 className="font-bold text-lg mb-1">🎨 Customizing Theming</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Master custom variables, dark modes, and the token layer.</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}
