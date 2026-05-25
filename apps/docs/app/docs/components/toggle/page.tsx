'use client';

import { useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import {
    Toggle,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function TogglePage() {
    const [pressed, setPressed] = useState(false);

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Toggle</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A two-state button that can be either on or off. Perfect for formatting toolbar options, dark mode switches, or item selections.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <div className="flex gap-2">
                        <Toggle aria-label="Toggle bold" pressed={pressed} onPressedChange={setPressed}>
                            <Bold className="h-4 w-4 stroke-[3]" />
                        </Toggle>
                        <span className="text-sm font-black border-3 border-black px-2 py-2 bg-[#FFE66D] text-black">
                            State: {pressed ? 'ON (Pressed)' : 'OFF'}
                        </span>
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="toggle" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { Toggle } from "@/components/ui/toggle"
import { Bold } from "lucide-react"

<Toggle aria-label="Toggle bold">
  <Bold className="h-4 w-4 stroke-[3]" />
</Toggle>`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Examples</h2>

                <h3>Outline Variant</h3>
                <p>Use the <code>variant="outline"</code> prop to render outline-bordered toggle controls.</p>
                <ComponentPreview>
                    <Toggle variant="outline" aria-label="Toggle italic">
                        <Italic className="h-4 w-4 stroke-[3]" />
                    </Toggle>
                </ComponentPreview>

                <h3>Disabled State</h3>
                <p>Disabled toggles ignore pointer-events and visually dim.</p>
                <ComponentPreview>
                    <Toggle disabled aria-label="Toggle underline">
                        <Underline className="h-4 w-4 stroke-[3]" />
                    </Toggle>
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
                                <td className="p-3 font-mono text-sm">variant</td>
                                <td className="p-3 font-mono text-sm">"default" | "outline"</td>
                                <td className="p-3 font-mono text-sm">"default"</td>
                                <td className="p-3">The visual border styling of the toggle button.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">size</td>
                                <td className="p-3 font-mono text-sm">"default" | "sm" | "lg"</td>
                                <td className="p-3 font-mono text-sm">"default"</td>
                                <td className="p-3">The size of the toggle button layout.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">pressed</td>
                                <td className="p-3 font-mono text-sm">boolean</td>
                                <td className="p-3 font-mono text-sm">-</td>
                                <td className="p-3">Controlled pressed status state of the toggle.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">disabled</td>
                                <td className="p-3 font-mono text-sm">boolean</td>
                                <td className="p-3 font-mono text-sm">false</td>
                                <td className="p-3">Disables interaction controls.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-3 border-black dark:border-white space-y-2 text-sm">
                    <p className="font-bold text-black dark:text-white">⌨️ Keyboard & Screen Reader Rules:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><code>Space / Enter</code>: Triggers and toggles the active selection state.</li>
                        <li>Uses WAI-ARIA <code>aria-pressed</code> to clearly announce active status to screen reader agents.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
