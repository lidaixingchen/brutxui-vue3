'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
    Button,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function SheetPage() {
    const [side, setSide] = useState<'top' | 'bottom' | 'left' | 'right'>('right');

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Sheet</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A slide-out dashboard overlay drawer supporting all four positions (left, right, top, bottom). Features heavy black outlines and unrounded flat styling.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <div className="flex flex-wrap gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="primary">Slide Right (Default)</Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>Admin Settings</SheetTitle>
                                    <SheetDescription>
                                        Configure server endpoints and key values.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 py-4">
                                    <p className="text-sm font-bold">Admin Configuration Dashboard</p>
                                    <div className="h-32 bg-gray-100 dark:bg-gray-800 border-3 border-black flex items-center justify-center font-bold">
                                        Active settings panel
                                    </div>
                                </div>
                                <SheetFooter>
                                    <SheetClose asChild>
                                        <Button variant="outline" className="w-full">Save Changes</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="secondary">Slide Left</Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader>
                                    <SheetTitle>Navigation Menu</SheetTitle>
                                    <SheetDescription>
                                        Browse core app structures.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-2 py-4">
                                    <Button variant="outline" className="w-full justify-start font-black">Home</Button>
                                    <Button variant="outline" className="w-full justify-start font-black">Analytics</Button>
                                    <Button variant="outline" className="w-full justify-start font-black">Settings</Button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="accent">Slide Top</Button>
                            </SheetTrigger>
                            <SheetContent side="top">
                                <SheetHeader>
                                    <SheetTitle>Announcements</SheetTitle>
                                    <SheetDescription>
                                        System-wide broadcast alerts.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-4">
                                    <div className="p-4 bg-yellow-100 border-3 border-black dark:text-black">
                                        BrutxUI registry just expanded to 32 active items!
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline">Slide Bottom</Button>
                            </SheetTrigger>
                            <SheetContent side="bottom">
                                <SheetHeader>
                                    <SheetTitle>Interactive Terminal</SheetTitle>
                                    <SheetDescription>
                                        Run commands directly inside the sandbox container.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-4">
                                    <pre className="bg-black text-[#6EE7B7] p-3 text-xs font-mono border-3 border-black">
                                        bash$ pnpm run dev --filter docs
                                    </pre>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="sheet" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
      <SheetDescription>
        Make changes to your profile here.
      </SheetDescription>
    </SheetHeader>
    <div className="py-4">
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button>Save changes</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
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
                                <td className="p-3 font-mono text-sm">side</td>
                                <td className="p-3 font-mono text-sm">"top" | "bottom" | "left" | "right"</td>
                                <td className="p-3 font-mono text-sm">"right"</td>
                                <td className="p-3">The side from which the panel slides open.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">className</td>
                                <td className="p-3 font-mono text-sm">string</td>
                                <td className="p-3 font-mono text-sm">-</td>
                                <td className="p-3">Custom styling classes applied to the sheet drawer container.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Utilizes <code>aria-describedby</code> and <code>aria-labelledby</code> to announce title and content.</li>
                    <li>Ensures full keyboard Esc closure and traps cursor focus layers inside active drawers.</li>
                    <li>Restores active element focus dynamically upon closing.</li>
                </ul>
            </section>
        </div>
    );
}
