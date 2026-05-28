import Link from 'next/link';
import {
    ArrowRight,
    Blocks,
    BookOpen,
    Github,
    HeartHandshake,
    Keyboard,
    Layers3,
    Palette,
    Settings2,
    ShieldCheck,
    Sparkles,
    TerminalSquare,
    Type,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { SITE_CONFIG } from '@/config/constants';

export default function Home() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-950">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <section className="container-brutal py-12 sm:py-20 px-4">
                <div className="flex flex-col items-center text-center">
                    <Badge variant="primary" size="lg" className="mb-4 sm:mb-6">
                        v{SITE_CONFIG.version}
                    </Badge>

                    <div className="relative mb-6 sm:mb-8">
                        <div className="relative inline-block">
                            <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] font-black tracking-tighter select-none">
                                <span
                                    className="absolute text-black"
                                    style={{
                                        transform: 'translate(8px, 8px)',
                                    }}
                                    aria-hidden="true"
                                >
                                    Brutx
                                </span>
                                <span
                                    className="absolute text-[#FF6B6B]"
                                    style={{
                                        transform: 'translate(5px, 5px)',
                                    }}
                                    aria-hidden="true"
                                >
                                    Brutx
                                </span>
                                <span
                                    className="absolute text-[#4ECDC4]"
                                    style={{
                                        transform: 'translate(2px, 2px)',
                                    }}
                                    aria-hidden="true"
                                >
                                    Brutx
                                </span>
                                <span
                                    className="relative text-[#FFE66D]"
                                    style={{
                                        WebkitTextStroke: '2px #000',
                                        paintOrder: 'stroke fill',
                                    }}
                                >
                                    Brutx
                                </span>
                            </h1>
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold max-w-2xl mb-6 sm:mb-8 text-gray-700 dark:text-gray-300 px-2">
                        Bold, blocky, and beautiful React components. Built with Radix UI, styled
                        with Tailwind CSS, and designed for maximum impact.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
                        <Link href="/docs" className="w-full sm:w-auto">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto">
                                <BookOpen className="h-5 w-5" aria-hidden="true" />
                                Get Started
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </Button>
                        </Link>
                        <Link href="/docs/components" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto dark:border-white dark:text-white dark:hover:bg-gray-800"
                            >
                                <Blocks className="h-5 w-5" aria-hidden="true" />
                                Components
                            </Button>
                        </Link>
                        <a
                            href={SITE_CONFIG.github.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button
                                variant="default"
                                size="lg"
                                className="w-full sm:w-auto dark:bg-white dark:text-black"
                            >
                                <Github className="h-5 w-5" aria-hidden="true" />
                                GitHub
                            </Button>
                        </a>
                        <Link href="/sponsor" className="w-full sm:w-auto">
                            <Button variant="danger" size="lg" className="w-full sm:w-auto">
                                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                                Sponsor
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container-brutal py-12 sm:py-16 px-4">
                <h2 className="text-3xl sm:text-4xl font-black text-center mb-8 sm:mb-12">
                    Features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Palette className="h-5 w-5 text-[#FF6B6B]" aria-hidden="true" />
                                Neo-Brutalism Design
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                Bold 3px borders, 4px offset shadows, heavy fonts. No rounded
                                corners. Just pure, blocky goodness.
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <ShieldCheck
                                    className="h-5 w-5 text-[#4ECDC4]"
                                    aria-hidden="true"
                                />
                                Accessible
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                Built on Radix UI primitives for keyboard navigation, screen reader
                                support, and ARIA compliance.
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Type className="h-5 w-5 text-[#FFE66D]" aria-hidden="true" />
                                TypeScript First
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                Full TypeScript support with type-safe variants using
                                class-variance-authority.
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Settings2 className="h-5 w-5 text-[#FF6B6B]" aria-hidden="true" />
                                Customizable
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                Copy components to your codebase. Easy to extend and modify to match
                                your brand.
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <TerminalSquare
                                    className="h-5 w-5 text-[#4ECDC4]"
                                    aria-hidden="true"
                                />
                                CLI Tool
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                Add components with a single command. Full control over your code.
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="dark:bg-gray-900 dark:border-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Layers3 className="h-5 w-5 text-[#FFE66D]" aria-hidden="true" />
                                Modern Stack
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                                React 18+, Next.js 14 compatible. Server Components ready with "use
                                client" directives.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="container-brutal py-12 sm:py-16 px-4">
                <h2 className="text-3xl sm:text-4xl font-black text-center mb-8 sm:mb-12">
                    <span className="inline-flex items-center justify-center gap-3">
                        <Keyboard className="h-8 w-8" aria-hidden="true" />
                        Quick Start
                    </span>
                </h2>
                <Card className="max-w-3xl mx-auto dark:bg-gray-900 dark:border-white">
                    <CardContent className="pt-4 sm:pt-6">
                        <div className="space-y-4">
                            <div>
                                <p className="font-bold mb-2 text-sm sm:text-base">
                                    1. Initialize your project:
                                </p>
                                <pre className="bg-gray-900 text-white p-3 sm:p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-xs sm:text-sm">
                                    <code>npx brutx@latest init</code>
                                </pre>
                            </div>
                            <div>
                                <p className="font-bold mb-2 text-sm sm:text-base">
                                    2. Add components:
                                </p>
                                <pre className="bg-gray-900 text-white p-3 sm:p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-xs sm:text-sm">
                                    <code>npx brutx@latest add button card</code>
                                </pre>
                            </div>
                            <div>
                                <p className="font-bold mb-2 text-sm sm:text-base">
                                    3. Use the components:
                                </p>
                                <pre className="bg-gray-900 text-white p-3 sm:p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-xs sm:text-sm">
                                    <code>{`import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function App() {
  return (
    <Card>
      <Button variant="primary">
        Click me!
      </Button>
    </Card>
  );
}`}</code>
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <footer className="border-t-3 border-black dark:border-white mt-12 sm:mt-16">
                <div className="container-brutal py-6 sm:py-8 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <p className="font-bold text-sm sm:text-base">
                            Built with React, Tailwind CSS & Radix UI
                        </p>
                        <div className="flex gap-4">
                            <a
                                href={SITE_CONFIG.github.url}
                                className="inline-flex items-center gap-2 font-bold hover:underline text-sm sm:text-base"
                            >
                                <Github className="h-4 w-4" aria-hidden="true" />
                                GitHub
                            </a>
                            <a
                                href="/docs"
                                className="inline-flex items-center gap-2 font-bold hover:underline text-sm sm:text-base"
                            >
                                <Sparkles className="h-4 w-4" aria-hidden="true" />
                                Documentation
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
