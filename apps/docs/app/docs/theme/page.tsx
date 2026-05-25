import { Card, CardContent, Badge } from '@/components/ui';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Themes & Design Tokens - Brutx',
    description: 'Learn how to customize BrutxUI using dynamic CSS custom properties, presets, and customized neo-brutalist sizing variables.',
    keywords: [
        'brutx themes',
        'neo-brutalism css variables',
        'design tokens guide',
        'pastel brutalism',
        'mono brutalism',
        'neubrutalism colors',
    ],
    openGraph: {
        title: 'Themes & Design Tokens - Brutx',
        description: 'Learn how to customize BrutxUI using dynamic CSS custom properties, presets, and customized neo-brutalist sizing variables.',
        url: 'https://brutxui.site/docs/theme',
    },
    alternates: {
        canonical: 'https://brutxui.site/docs/theme',
    },
};

export default function ThemeTokensPage() {
    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <Badge variant="accent" className="mb-4">
                    Theming System
                </Badge>
                <h1 className="text-4xl font-black mb-2">Themes & Design Tokens</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    BrutxUI features a highly parameterizable styling system built entirely on CSS Custom Properties (variables). 
                    Instead of hardcoding colors, borders, and shadows into tailwind classes, you can fully control the visual aggression of the framework in a single CSS layer.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white my-6" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">1. What are the Brutx Tokens?</h2>
                <p>
                    BrutxUI exposes a complete set of design tokens within `:root` (for light mode) and `.dark` (for dark mode). 
                    These tokens map directly to Tailwind CSS utilities such as `bg-brutal-primary`, `border-brutal`, `shadow-brutal-lg`, and `rounded-brutal`.
                </p>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-3 border-black dark:border-white text-sm">
                        <thead className="bg-[#FFE66D]">
                            <tr>
                                <th className="px-4 py-2 text-left border-r-3 border-b-3 border-black font-black text-black">Token Name</th>
                                <th className="px-4 py-2 text-left border-r-3 border-b-3 border-black font-black text-black">Default Value</th>
                                <th className="px-4 py-2 text-left border-b-3 border-black font-black text-black">Description</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900">
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-border-width</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">3px</td>
                                <td className="px-4 py-2">Thick border outlines across buttons, inputs, and components.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-border-color</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#000000 / #ffffff</td>
                                <td className="px-4 py-2">The color applied to all brutal borders.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-shadow-offset-x</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">4px</td>
                                <td className="px-4 py-2">Horizontal offset distance for hard shadows.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-shadow-offset-y</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">4px</td>
                                <td className="px-4 py-2">Vertical offset distance for hard shadows.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-shadow-color</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#000000 / #ffffff</td>
                                <td className="px-4 py-2">The solid shadow overlay color.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-radius</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">0px</td>
                                <td className="px-4 py-2">Controls rounded corner radius globally.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-pressed-offset</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">2px</td>
                                <td className="px-4 py-2">The translation depth when a button is clicked or pressed.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-primary</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#FF6B6B</td>
                                <td className="px-4 py-2">Core variant background color (primary).</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-secondary</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#4ECDC4</td>
                                <td className="px-4 py-2">Secondary variant background color.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-accent</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#FFE66D</td>
                                <td className="px-4 py-2">Accent variant background color (usually yellow).</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-destructive</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#EF476F</td>
                                <td className="px-4 py-2">Color for dangerous alerts, delete triggers, etc.</td>
                            </tr>
                            <tr className="border-b-2 border-black dark:border-white">
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-success</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#7FB069</td>
                                <td className="px-4 py-2">Color for success badges and alerts.</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono font-bold">--brutal-ring</td>
                                <td className="px-4 py-2 border-r-3 border-black dark:border-white font-mono">#000000</td>
                                <td className="px-4 py-2">Focus outline ring color for keyboard navigation.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">2. Customizing Sizing and Outlines</h2>
                <p>
                    By overriding these variable settings in your global stylesheet, components instantly adjust. 
                    You can achieve completely different visual styles with tiny tweaks.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 border-3 border-black dark:border-white bg-white dark:bg-gray-900 space-y-2">
                        <h4 className="font-black text-[#FF6B6B]">Adjusting Shadows</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Decrease or increase the shadow offset length by writing:
                        </p>
                        <pre className="bg-black text-[#FFE66D] p-3 text-xs font-mono overflow-x-auto">
{`:root {
  --brutal-shadow-offset-x: 6px;
  --brutal-shadow-offset-y: 6px;
}`}
                        </pre>
                    </div>

                    <div className="p-5 border-3 border-black dark:border-white bg-white dark:bg-gray-900 space-y-2">
                        <h4 className="font-black text-[#4ECDC4]">Altering Border Width</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Create dynamic borders that apply evenly across forms, cards, and dropdown triggers:
                        </p>
                        <pre className="bg-black text-[#4ECDC4] p-3 text-xs font-mono overflow-x-auto">
{`:root {
  --brutal-border-width: 2px;
}`}
                        </pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">3. Soft vs. Aggressive Brutalism</h2>
                <p>
                    Neo-brutalism sits on a scale. You can dial it down for a softer SaaS interface or turn it up for a bold game or indie product feel.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 border-3 border-black dark:border-white bg-[#faf9f6] text-black space-y-3">
                        <h4 className="font-black text-sm uppercase tracking-wider text-gray-500">Softer Modern Feel</h4>
                        <p className="text-sm">
                            Reduce visual friction with slightly rounded corners, thinner borders, and soft shadows. Perfect for conventional SaaS dashboard panels.
                        </p>
                        <pre className="bg-black text-white p-3 text-xs font-mono overflow-x-auto">
{`:root {
  --brutal-border-width: 2px;
  --brutal-radius: 8px;
  --brutal-shadow-offset-x: 3px;
  --brutal-shadow-offset-y: 3px;
}`}
                        </pre>
                    </div>
                    <div className="p-5 border-3 border-black dark:border-white bg-white dark:bg-gray-900 space-y-3">
                        <h4 className="font-black text-sm uppercase tracking-wider text-[#FF6B6B]">Max Aggression</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Make components extremely bold and heavy using 4px black outlines and sharp, unyielding 0px rectangular edges.
                        </p>
                        <pre className="bg-black text-[#FF6B6B] p-3 text-xs font-mono overflow-x-auto">
{`:root {
  --brutal-border-width: 4px;
  --brutal-radius: 0px;
  --brutal-shadow-offset-x: 6px;
  --brutal-shadow-offset-y: 6px;
}`}
                        </pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">4. Built-in Theme Presets</h2>
                <p>
                    BrutxUI ships out of the box with three pre-coded aesthetic presets. To activate a preset, simply wrap your page or container in the corresponding class.
                </p>

                <div className="space-y-6">
                    {/* Preset 1 */}
                    <div className="border-3 border-black dark:border-white p-5 bg-white dark:bg-gray-900 space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="primary">Preset</Badge>
                            <h3 className="font-black text-lg">Classic Preset (`.theme-classic`)</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            The definitive high-contrast brutalist profile. Sharp 0px radius, vibrant saturated colors (coral red, mint teal, yellow), and dark black shadows.
                        </p>
                        <pre className="bg-black text-[#FF6B6B] p-4 text-xs font-mono overflow-x-auto">
{`<div className="theme-classic">
  <Button variant="primary">Classic Coral</Button>
  <Button variant="secondary">Mint Teal</Button>
</div>`}
                        </pre>
                    </div>

                    {/* Preset 2 */}
                    <div className="border-3 border-[#1e1e24] p-5 bg-[#faf9f6] text-[#1e1e24] space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-[#d6c6e1] text-[#1e1e24] border-[#1e1e24]">Preset</Badge>
                            <h3 className="font-black text-lg text-[#1e1e24]">Pastel Preset (`.theme-pastel`)</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            A charming, cozy pastel variation. Features soft lavender, mint sage, rounder corners (`8px`), and gentle `2px` slate-gray borders for a playful but clean UI.
                        </p>
                        <pre className="bg-black text-[#d6c6e1] p-4 text-xs font-mono overflow-x-auto">
{`<div className="theme-pastel">
  <Button variant="primary">Lavender</Button>
  <Button variant="accent">Peach Accent</Button>
</div>`}
                        </pre>
                    </div>

                    {/* Preset 3 */}
                    <div className="border-4 border-black p-5 bg-white text-black space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 border-2 border-black font-black text-xs bg-black text-white">Preset</span>
                            <h3 className="font-black text-lg">Mono Preset (`.theme-mono`)</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            A high-contrast stark layout consisting entirely of grayscale values, heavy `4px` black outlines, and thick `5px` shadows.
                        </p>
                        <pre className="bg-black text-white p-4 text-xs font-mono overflow-x-auto">
{`<div className="theme-mono">
  <Button variant="primary">Black Mono</Button>
  <Button variant="secondary">White Mono</Button>
</div>`}
                        </pre>
                    </div>
                </div>
            </section>
        </div>
    );
}
