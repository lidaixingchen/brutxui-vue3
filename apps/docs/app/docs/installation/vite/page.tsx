'use client';

import { Badge } from '@/components/ui';
import { ChevronLeft, ChevronRight, Terminal } from 'lucide-react';
import Link from 'next/link';
import { CodeBlock, PackageManagerTabs } from '@/components/code-block';

export default function ViteInstallationPage() {
    return (
        <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
                Installation
            </Badge>
            <h1 className="text-4xl font-black mb-4">Vite</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Install and configure BrutxUI for Vite + React projects.
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
                    Copy components into your project for full customization.
                </p>

                <h3 className="text-lg font-black mb-3">1. Create Vite project (if new)</h3>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm create vite@latest my-app --template react-ts',
                        npm: 'npm create vite@latest my-app -- --template react-ts',
                        yarn: 'yarn create vite my-app --template react-ts',
                        bun: 'bunx create-vite my-app --template react-ts',
                    }}
                />

                <h3 className="text-lg font-black mb-3 mt-6">
                    2. Setup path aliases in vite.config.ts
                </h3>
                <CodeBlock language="vite.config.ts">{`import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`}</CodeBlock>

                <h3 className="text-lg font-black mb-3 mt-6">3. Update tsconfig.json</h3>
                <CodeBlock language="tsconfig.json">{`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`}</CodeBlock>

                <h3 className="text-lg font-black mb-3 mt-6">4. Run init command</h3>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm dlx brutx@latest init',
                        npm: 'npx brutx@latest init',
                        yarn: 'yarn dlx brutx@latest init',
                        bun: 'bunx brutx@latest init',
                    }}
                />

                <h3 className="text-lg font-black mb-3 mt-6">5. Add components</h3>
                <PackageManagerTabs
                    commands={{
                        pnpm: 'pnpm dlx brutx@latest add button card badge',
                        npm: 'npx brutx@latest add button card badge',
                        yarn: 'yarn dlx brutx@latest add button card badge',
                        bun: 'bunx brutx@latest add button card badge',
                    }}
                />

                <h3 className="text-lg font-black mb-3 mt-6">6. Use components</h3>
                <CodeBlock language="src/App.tsx">{`import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function App() {
  return (
    <div className="p-8">
      <Card>
        <CardContent>
          <Badge variant="accent" className="mb-4">Welcome</Badge>
          <h1 className="text-2xl font-black mb-4">Hello!</h1>
          <Button variant="primary">Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;`}</CodeBlock>
            </section>

            <div className="flex justify-between items-center pt-8 border-t-3 border-black dark:border-white mt-12">
                <Link
                    href="/docs/installation/nextjs"
                    className="flex items-center gap-2 font-bold hover:text-[#FF6B6B] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                    Next.js
                </Link>
                <Link
                    href="/docs/installation/manual"
                    className="flex items-center gap-2 font-bold hover:text-[#FF6B6B] transition-colors"
                >
                    Manual
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
            </div>
        </div>
    );
}
