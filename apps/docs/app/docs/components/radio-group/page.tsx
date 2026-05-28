'use client';

import {
    RadioGroup,
    RadioGroupItem,
    Label,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function RadioGroupPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Radio Group</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A set of checkable buttons—known as radio buttons—where no more than one button can be checked at a time. Designed with thick brutalist borders, custom circular check fills, and clean disabled states.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <RadioGroup defaultValue="comfortable" className="max-w-xs">
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="default" id="r1" />
                            <Label htmlFor="r1" className="cursor-pointer">Default Option</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="comfortable" id="r2" />
                            <Label htmlFor="r2" className="cursor-pointer">Comfortable Option</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="compact" id="r3" />
                            <Label htmlFor="r3" className="cursor-pointer">Compact Option</Label>
                        </div>
                    </RadioGroup>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="radio-group" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Examples</h2>

                <h3>Disabled State</h3>
                <p>Disabled radio choices turn grey and inherit standard pointer-events exclusion rules.</p>
                <ComponentPreview>
                    <RadioGroup defaultValue="compact" className="max-w-xs">
                        <div className="flex items-center space-x-3 opacity-50">
                            <RadioGroupItem value="default" id="d1" disabled />
                            <Label htmlFor="d1">Option A (Disabled)</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="comfortable" id="d2" />
                            <Label htmlFor="d2" className="cursor-pointer">Option B (Enabled)</Label>
                        </div>
                        <div className="flex items-center space-x-3 opacity-50">
                            <RadioGroupItem value="compact" id="d3" disabled />
                            <Label htmlFor="d3">Option C (Disabled)</Label>
                        </div>
                    </RadioGroup>
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
                                <td className="p-3 font-mono text-sm">RadioGroup</td>
                                <td className="p-3">Context root that handles active values and selection loops.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">RadioGroupItem</td>
                                <td className="p-3">Individual circular check option triggering click callbacks.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-3 border-black dark:border-white space-y-2">
                    <p className="font-bold text-black dark:text-white">Keyboard Navigation Key Rules:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><code>Tab</code>: Moves focus to the selected radio button in the group.</li>
                        <li><code>ArrowDown / ArrowRight</code>: Moves focus and checks the next radio button in the group.</li>
                        <li><code>ArrowUp / ArrowLeft</code>: Moves focus and checks the previous radio button in the group.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
