'use client';

import { useState, useEffect } from 'react';
import {
    Progress,
    Button,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function ProgressPage() {
    const [progress, setProgress] = useState(15);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(66), 500);
        return () => clearTimeout(timer);
    }, []);

    const resetProgress = () => {
        setProgress(0);
        setTimeout(() => setProgress(Math.floor(Math.random() * 80) + 15), 300);
    };

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Progress</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A visual progress bar indicating completion status. Features flat background structures, thick borders, and animated neon fills.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <div className="w-full max-w-sm space-y-6">
                        <Progress value={progress} />
                        <div className="flex gap-2 items-center">
                            <Button variant="outline" size="sm" onClick={resetProgress}>
                                Trigger Loading
                            </Button>
                            <span className="text-sm font-black border-3 border-black px-2 py-0.5 bg-[#4ECDC4] text-black">
                                Status: {progress}%
                            </span>
                        </div>
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="progress" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { Progress } from "@/components/ui/progress"

<Progress value={66} />`}
                </pre>
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
                                <td className="p-3 font-mono text-sm">value</td>
                                <td className="p-3 font-mono text-sm">number</td>
                                <td className="p-3 font-mono text-sm">-</td>
                                <td className="p-3">Current progress numerical value from <code>0</code> to <code>max</code>.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">max</td>
                                <td className="p-3 font-mono text-sm">number</td>
                                <td className="p-3 font-mono text-sm">100</td>
                                <td className="p-3">Maximum value of progress scale.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border-3 border-black dark:border-white space-y-2 text-sm">
                    <p className="font-bold text-black dark:text-white">Announcements:</p>
                    <p>Uses WAI-ARIA <code>role="progressbar"</code> rules, automatically calculating and binding <code>aria-valuenow</code>, <code>aria-valuemin</code>, and <code>aria-valuemax</code> to announce progress updates in real-time to screen readers.</p>
                </div>
            </section>
        </div>
    );
}
