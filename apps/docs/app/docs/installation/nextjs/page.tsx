'use client';

import { Badge } from '@/components/ui';
import { ChevronLeft, ChevronRight, Moon, Terminal } from 'lucide-react';
import Link from 'next/link';
import { CodeBlock, PackageManagerTabs } from '@/components/code-block';

export default function NextJsInstallationPage() {
    return (
        <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
                Installation
            </Badge>
            <h1 className="text-4xl font-black mb-4">Next.js</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Install and configure BrutxUI for Next.js (App Router or Pages Router).
            </p>

            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#4ECDC4] border-3 border-black flex items-center justify-center">
                        <Terminal className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black">CLI Installation</h2>
                        <span className="text-xs uppercase tracking-wider text-[#4ECDC4] font-bold">
                            Copy & Customize
                        </span>
                    </div>
                </div>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Copy components to your project for full customization control.
                </p>

                <h3 className="text-lg font-black mb-3">1. Run init command</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                    This creates{' '}
                    <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-sm">
                        components.json
                    </code>
                    , sets up directories, and installs dependencies.
                </p>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm dlx brutx@latest init',
                        npm: 'npx brutx@latest init',
                        yarn: 'yarn dlx brutx@latest init',
                        bun: 'bunx brutx@latest init',
                    }}
                />

                <h3 className="text-lg font-black mb-3 mt-6">2. Add components</h3>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm dlx brutx@latest add button card badge',
                        npm: 'npx brutx@latest add button card badge',
                        yarn: 'yarn dlx brutx@latest add button card badge',
                        bun: 'bunx brutx@latest add button card badge',
                    }}
                />
                <p className="mt-2 text-sm text-gray-500">
                    Or add all components:{' '}
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">
                        npx brutx@latest add --all
                    </code>
                </p>

                <h3 className="text-lg font-black mb-3 mt-6">3. Import from your project</h3>
                <CodeBlock language="app/page.tsx">{`import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <main className="p-8">
      <Card>
        <CardContent>
          <Badge variant="accent" className="mb-4">Welcome</Badge>
          <h1 className="text-2xl font-black mb-4">Hello BrutxUI!</h1>
          <Button variant="primary">Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}`}</CodeBlock>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border-3 border-black dark:border-white">
                    <h4 className="font-black mb-3 text-sm uppercase tracking-wider">
                        Project Structure
                    </h4>
                    <pre className="text-sm font-mono text-gray-600 dark:text-gray-400">{`your-project/
├── components.json
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   └── lib/
│       └── utils.ts`}</pre>
                </div>
            </section>

            <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gray-900 dark:bg-white border-3 border-black dark:border-white flex items-center justify-center">
                        <Moon className="w-4 h-4 text-white dark:text-black" fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-black">Dark Mode</h2>
                </div>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                    BrutxUI supports dark mode out of the box. Add{' '}
                    <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-sm">
                        next-themes
                    </code>{' '}
                    for easy theme switching:
                </p>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm add next-themes',
                        npm: 'npm install next-themes',
                        yarn: 'yarn add next-themes',
                        bun: 'bun add next-themes',
                    }}
                />
                <div className="mt-4">
                    <CodeBlock language="app/providers.tsx">{`'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}`}</CodeBlock>
                </div>
            </section>

            <div className="flex justify-between items-center pt-8 border-t-3 border-black dark:border-white mt-12">
                <Link
                    href="/docs/installation"
                    className="flex items-center gap-2 font-bold hover:text-[#FF6B6B] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                    Installation
                </Link>
                <Link
                    href="/docs/installation/vite"
                    className="flex items-center gap-2 font-bold hover:text-[#FF6B6B] transition-colors"
                >
                    Vite
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
            </div>
        </div>
    );
}
