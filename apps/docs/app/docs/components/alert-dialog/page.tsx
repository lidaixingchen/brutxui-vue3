'use client';

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
    Button,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function AlertDialogPage() {
    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Alert Dialog</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A modal confirmation dialog styled with thick brutalist borders and flat shadows. Built on Radix UI Alert Dialog primitives, forcing the user to take action before closing.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="primary">Open Alert Dialog</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete server deployment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently shut down your Kubernetes cluster and purge all system configurations.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                    <Button variant="outline">Cancel</Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild variant="danger">
                                    <Button variant="danger">Yes, Delete Server</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="alert-dialog" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Open</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button variant="outline">Cancel</Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild variant="danger">
        <Button variant="danger">Confirm Action</Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Examples</h2>

                <h3>Destructive Variant</h3>
                <p>Destructive buttons utilize neon red/pink highlights to clearly draw focus to critical actions.</p>
                <ComponentPreview>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="danger">Remove Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    All your analytical assets, custom tokens, and dashboard preferences will be deleted immediately.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel asChild>
                                    <Button variant="outline">Discard</Button>
                                </AlertDialogCancel>
                                <AlertDialogAction asChild variant="danger">
                                    <Button variant="danger">Confirm Purge</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                                <td className="p-3 font-mono text-sm">AlertDialog</td>
                                <td className="p-3">Manages open/closed states.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogTrigger</td>
                                <td className="p-3">Opens the modal panel.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogContent</td>
                                <td className="p-3">Modal content container overlaying web content.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogHeader</td>
                                <td className="p-3">Header layout box.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogFooter</td>
                                <td className="p-3">Footer button grid container.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogTitle</td>
                                <td className="p-3">Header title text element.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogDescription</td>
                                <td className="p-3">Detailed warning context.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">AlertDialogAction</td>
                                <td className="p-3">Primary confirm action (accepts standard button variants like <code>destructive</code>).</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">AlertDialogCancel</td>
                                <td className="p-3">Cancel/close button action.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Uses standard WAI-ARIA <code>role="alertdialog"</code> layout rules.</li>
                    <li>Focus is locked within the dialog context, and keyboard navigation keys are fully captured.</li>
                    <li>Supports screen reader announcements and returns focus to triggers on cancel actions.</li>
                </ul>
            </section>
        </div>
    );
}
