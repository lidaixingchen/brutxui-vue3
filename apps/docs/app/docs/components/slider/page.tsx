'use client';

import { useState } from 'react';
import {
    Slider,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function SliderPage() {
    const [value, setValue] = useState([40]);

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Slider</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    An interactive range selector input allowing users to slide and choose single values. Adheres to brutalist guidelines with neon tracks, heavy circular grab thumbs, and scale micro-interactions.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <div className="w-full max-w-sm space-y-4">
                        <Slider
                            defaultValue={[40]}
                            max={100}
                            step={1}
                            onValueChange={setValue}
                        />
                        <p className="text-sm font-black bg-[#FF6B6B] text-black px-3 py-1 border-3 border-black w-fit">
                            Range Value: {value[0]}
                        </p>
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="slider" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { Slider } from "@/components/ui/slider"

<Slider defaultValue={[50]} max={100} step={1} />`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Examples</h2>

                <h3>Disabled State</h3>
                <p>Disabled sliders prevent pointer inputs, scale hover animations, and inherit a semi-transparent opacity layout.</p>
                <ComponentPreview>
                    <div className="w-full max-w-sm opacity-50">
                        <Slider
                            defaultValue={[65]}
                            max={100}
                            step={1}
                            disabled
                        />
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">API Reference</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-3 border-black dark:border-white text-sm">
                        <thead className="bg-[#FFE66D]">
                            <tr>
                                <th className="text-left p-3 font-black border-b-3 border-black">Prop</th>
                                <th className="text-left p-3 font-black border-b-3 border-black">Type</th>
                                <th className="text-left p-3 font-black border-b-3 border-black">Default</th>
                                <th className="text-left p-3 font-black border-b-3 border-black">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">defaultValue</td>
                                <td className="p-3 font-mono text-sm">number[]</td>
                                <td className="p-3 font-mono text-sm">-</td>
                                <td className="p-3">Initial slider thumb value array.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">max</td>
                                <td className="p-3 font-mono text-sm">number</td>
                                <td className="p-3 font-mono text-sm">100</td>
                                <td className="p-3">Maximum allowed numerical value.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">step</td>
                                <td className="p-3 font-mono text-sm">number</td>
                                <td className="p-3 font-mono text-sm">1</td>
                                <td className="p-3">Step increment value.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">disabled</td>
                                <td className="p-3 font-mono text-sm">boolean</td>
                                <td className="p-3 font-mono text-sm">false</td>
                                <td className="p-3">Prevents slider interaction.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-3 border-black dark:border-white space-y-2">
                    <p className="font-bold text-black dark:text-white">⌨️ Keyboard Navigation Key Rules:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><code>ArrowRight / ArrowUp</code>: Increments the value by one step.</li>
                        <li><code>ArrowLeft / ArrowDown</code>: Decrements the value by one step.</li>
                        <li><code>Home</code>: Sets the value to its minimum.</li>
                        <li><code>End</code>: Sets the value to its maximum.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
