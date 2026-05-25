'use client';

import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
    ToggleGroup,
    ToggleGroupItem,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function ToggleGroupPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Toggle Group</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A set of two-state buttons that can be toggled on or off, styled with brutalist flat borders and hard offsets. Built on Radix UI Toggle Group primitive.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <ToggleGroup type="single" defaultValue="center" aria-label="Text alignment">
                        <ToggleGroupItem value="left" aria-label="Align left">
                            <AlignLeft className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center" aria-label="Align center">
                            <AlignCenter className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right" aria-label="Align right">
                            <AlignRight className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="toggle-group" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"

<ToggleGroup type="single" defaultValue="left">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft className="h-4 w-4 stroke-[3]" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter className="h-4 w-4 stroke-[3]" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight className="h-4 w-4 stroke-[3]" />
  </ToggleGroupItem>
</ToggleGroup>`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Examples</h2>

                <h3>Outline Group</h3>
                <p>Use <code>variant="outline"</code> to style all items as outlines.</p>
                <ComponentPreview>
                    <ToggleGroup type="single" variant="outline" defaultValue="left">
                        <ToggleGroupItem value="left" aria-label="Align left">
                            <AlignLeft className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center" aria-label="Align center">
                            <AlignCenter className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right" aria-label="Align right">
                            <AlignRight className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </ComponentPreview>

                <h3>Disabled Items</h3>
                <p>Specify <code>disabled</code> inside ToggleGroup to lock the entire toolbar.</p>
                <ComponentPreview>
                    <ToggleGroup type="single" defaultValue="left" disabled>
                        <ToggleGroupItem value="left" aria-label="Align left">
                            <AlignLeft className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="center" aria-label="Align center">
                            <AlignCenter className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right" aria-label="Align right">
                            <AlignRight className="h-4 w-4 stroke-[3]" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">API Reference</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-3 border-black dark:border-white text-sm">
                        <thead className="bg-[#FFE66D]">
                            <tr>
                                <th className="text-left p-3 font-black border-b-3 border-black">Component</th>
                                <th className="text-left p-3 font-black border-b-3 border-black">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">ToggleGroup</td>
                                <td className="p-3">Context root container accepting group configuration props like <code>type</code> and <code>variant</code>.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">ToggleGroupItem</td>
                                <td className="p-3">Individual toolbar buttons mapping click selections.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-3 border-black dark:border-white space-y-2 text-sm">
                    <p className="font-bold text-black dark:text-white">⌨️ Keyboard Navigation Rules:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><code>Tab</code>: Moves keyboard focus into the toggle group (focuses first or active item).</li>
                        <li><code>ArrowRight / ArrowDown</code>: Moves focus to the next group item button.</li>
                        <li><code>ArrowLeft / ArrowUp</code>: Moves focus to the previous group item button.</li>
                        <li><code>Space / Enter</code>: Selects/toggles the currently focused item button.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
