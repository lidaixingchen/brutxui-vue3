import { Badge } from '@/components/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Using BrutxUI with AI - Brutx',
    description:
        'A comprehensive guide for generating BrutxUI components, blocks, and pages using AI coding assistants like Cursor, Copilot, ChatGPT, or Claude.',
    keywords: [
        'brutx ai usage',
        'cursor rules neubrutalism',
        'copilot neubrutalist styles',
        'prompting for brutalist react components',
        'ai web application development',
    ],
    openGraph: {
        title: 'Using BrutxUI with AI - Brutx',
        description: 'A comprehensive guide for generating BrutxUI components, blocks, and pages using AI coding assistants.',
        url: 'https://brutxui.site/docs/ai',
    },
    alternates: {
        canonical: 'https://brutxui.site/docs/ai',
    },
};

export default function AIDocsPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="accent" className="mb-4">
                    AI Integration
                </Badge>
                <h1 className="text-4xl font-black mb-2">Using BrutxUI with AI</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    BrutxUI is designed to be highly AI-ready. By providing precise design tokens, 
                    clear structures, and clean registry metadata, AI coding agents (such as Cursor, GitHub Copilot, Claude, and GPT-4o) 
                    can generate flawless, fully compatible components, custom blocks, and landing pages on the first try.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🎨 Neo-Brutalist Styling Rules for AI</h2>
                <p>
                    When instructing an AI to style components inside a BrutxUI project, emphasize the following visual design variables:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li><strong>Thick Outlines:</strong> Always use <code>border-3</code> (3px thickness) and the global border color (e.g. <code>border-black dark:border-white</code> or <code>border-brutal</code>).</li>
                    <li><strong>Rigid Offsets:</strong> Hard offset dropshadows are applied with <code>shadow-brutal</code> (which resolves to <code>4px 4px 0px 0px #000</code>). Avoid blur effects (do NOT use standard <code>shadow-md</code> or <code>shadow-lg</code>).</li>
                    <li><strong>Flat Angles:</strong> Set <code>rounded-none</code> or use a strict global theme token like <code>rounded-brutal</code> (defaulting to <code>0px</code> corners).</li>
                    <li><strong>Tangible Press Effects:</strong> Standard active elements translate downwards and to the right on click to mimic physical buttons: <code>active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all</code>.</li>
                    <li><strong>High-Contrast Focus:</strong> Maintain high visibility. Focus rings should use heavy outlines: <code>focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2</code>.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🧩 Blueprint for a BrutxUI Component</h2>
                <p>
                    Every BrutxUI component follows a standard React + Tailwind CSS + Radix UI primitive composability structure. 
                    Share this blueprint template with your AI assistant:
                </p>

                <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-3">
                    <h3 className="font-black text-lg">Good Component Blueprint</h3>
                    <pre className="bg-black text-[#6EE7B7] p-4 text-xs font-mono overflow-x-auto">
{`import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Class merge utility

const cardVariants = cva(
  'border-3 border-black dark:border-white transition-all bg-white dark:bg-gray-950',
  {
    variants: {
      variant: {
        default: 'shadow-brutal dark:shadow-brutal-white',
        flat: '',
        hoverable: 'hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-brutal-lg dark:hover:shadow-brutal-lg-white'
      },
      padding: {
        none: '',
        default: 'p-6',
        large: 'p-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default'
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';`}
                    </pre>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">❌ Anti-Patterns to Avoid (What NOT to do)</h2>
                <p>
                    Ensure your AI assistant does not emit these anti-patterns, which violate our core brutalist visual language:
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full border-3 border-black dark:border-white text-sm">
                        <thead className="bg-[#FF6B6B] text-white">
                            <tr>
                                <th className="px-4 py-2 text-left border-r-3 border-b-3 border-black font-black">Bad Pattern</th>
                                <th className="px-4 py-2 text-left border-r-3 border-b-3 border-black font-black">Why it Fails</th>
                                <th className="px-4 py-2 text-left border-b-3 border-black font-black">Correct BrutxUI Replacement</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900">
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono text-red-500 font-bold">rounded-xl shadow-lg</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white">Uses rounded edges and blurred shadows which break the rigid comic-book/flat style.</td>
                                <td className="px-4 py-2 font-mono text-green-500 font-bold">rounded-none shadow-brutal</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono text-red-500 font-bold">hover:bg-blue-600</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white">Uses standard, generic gradients or colors without clear outlines.</td>
                                <td className="px-4 py-2 font-mono text-green-500 font-bold">hover:bg-[#4ECDC4] hover:text-black</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono text-red-500 font-bold">border-slate-200</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white">Fades out lines, yielding low visual contrast.</td>
                                <td className="px-4 py-2 font-mono text-green-500 font-bold">border-3 border-black dark:border-white</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono text-red-500 font-bold">active:opacity-85</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white">Fades opacity without translation shifts (feels generic).</td>
                                <td className="px-4 py-2 font-mono text-green-500 font-bold">active:translate-x-[2px] active:translate-y-[2px]</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">🛠️ Custom Blocks & Registry Metadata</h2>
                <p>
                    When creating custom landing page blocks (e.g. <code>saas-pricing</code> or <code>dashboard-stats</code>), 
                    they must be registered in the component directory manifest so they can be parsed by our registry compiler and validator scripts.
                </p>

                <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-3">
                    <h4 className="font-black text-base">Step 1: Save Component File</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Save your component under: <code>packages/ui/src/components/ui/my-block.tsx</code></p>
                    
                    <h4 className="font-black text-base mt-4">Step 2: Declare in Registry Manifest</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Add the block configuration to <code>packages/registry/registry.json</code>:</p>
                    <pre className="bg-black text-[#FFE66D] p-3 text-xs font-mono overflow-x-auto">
{`{
  "name": "my-block",
  "type": "registry:ui",
  "dependencies": ["lucide-react"],
  "registryDependencies": ["button", "card"],
  "files": [
    {
      "path": "ui/my-block.tsx",
      "type": "registry:ui"
    }
  ]
}`}
                    </pre>

                    <h4 className="font-black text-base mt-4">Step 3: Compile and Validate Registry</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Run workspace compilers to compile and validate the JSON schema:</p>
                    <pre className="bg-black text-white p-3 text-xs font-mono overflow-x-auto">
{`pnpm --filter brutx-registry build
pnpm --filter brutx-registry validate`}
                    </pre>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">💬 Prompt Templates for AI Coding</h2>
                <p>
                    Copy-paste these context prompts directly into your AI assistant chat box to guarantee beautiful, compliant outputs.
                </p>

                <div className="space-y-4">
                    {/* Prompt 1 */}
                    <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-2">
                        <h4 className="font-bold text-sm text-[#FF6B6B] uppercase tracking-wider">Prompt A: Creating atomic components</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Use this to generate custom atomic elements like alerts or custom form triggers:</p>
                        <blockquote className="border-l-4 border-[#FF6B6B] pl-4 text-xs italic bg-gray-100 dark:bg-gray-800 p-3">
                            "Build a custom [Component Name] React component for my project using Tailwind CSS and Radix UI. 
                            The component must adhere strictly to BrutxUI's Neo-Brutalist design tokens. 
                            Ensure it uses class-variance-authority (cva) for variants, accepts a custom className merged via our local 'cn' utility from '@/lib/utils', 
                            features a 3px border outline ('border-3 border-black'), unrounded corners ('rounded-none'), a solid offset shadow ('shadow-brutal'), 
                            and translates downwards and rightward when active ('active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]'). 
                            Support full keyboard navigation focus outlines and make it completely responsive and dark mode safe."
                        </blockquote>
                    </div>

                    {/* Prompt 2 */}
                    <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-2">
                        <h4 className="font-bold text-sm text-[#4ECDC4] uppercase tracking-wider">Prompt B: Creating SaaS Blocks</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Use this to generate pricing sections, call-to-actions, or dashboard widgets:</p>
                        <blockquote className="border-l-4 border-[#4ECDC4] pl-4 text-xs italic bg-gray-100 dark:bg-gray-800 p-3">
                            "Generate a high-conversion, responsive [Pricing section / Hero block / Feature list] using React and Tailwind CSS. 
                            Compose the layout entirely using BrutxUI components: Card, Button, Badge, Switch, and Checkbox. 
                            The visual style must feel bold and premium with thick borders, sharp edges, and high contrast accents. 
                            Include subtle hover scale transitions, neon yellow/teal/coral badge pill highlights, structured grids, 
                            and interactive states. Write standard, accessible, and clean Tailwind markup without external dependencies."
                        </blockquote>
                    </div>
                </div>
            </section>
        </div>
    );
}
