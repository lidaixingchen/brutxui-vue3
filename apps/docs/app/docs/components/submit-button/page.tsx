'use client';

import { CodeBlock } from '@/components/code-block';
import { Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Card } from '@/components/ui';
import { Rocket, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SubmitButtonPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsSubmitting(false);
    };

    const usageCode = `import { SubmitButton } from '@/components/ui/submit-button';`;

    const basicExampleCode = `async function submitAction(formData: FormData) {
    'use server';
    await saveToDatabase(formData);
}

export function ContactForm() {
    return (
        <form action={submitAction}>
            <Input name="email" placeholder="Email" />
            <SubmitButton>
                Send Message
            </SubmitButton>
        </form>
    );
}`;

    const pendingTextCode = `<SubmitButton pendingText="Submitting...">
    Submit Form
</SubmitButton>`;

    const variantsCode = `<SubmitButton variant="default">Default</SubmitButton>
<SubmitButton variant="secondary">Secondary</SubmitButton>
<SubmitButton variant="danger">Delete</SubmitButton>
<SubmitButton variant="outline">Outline</SubmitButton>`;

    const manualInstallCode = `'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';

export interface SubmitButtonProps extends ButtonProps {
    pendingText?: string;
}

function SubmitButton({
    children,
    pendingText,
    disabled,
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={disabled || pending}
            loading={pending}
            {...props}
        >
            {pending && pendingText ? pendingText : children}
        </Button>
    );
}

SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };`;

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black">Submit Button</h1>
                    <Badge className="bg-green-500 text-white border-black">React 19</Badge>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    A button that automatically shows loading state when used with Server Actions.
                    Leverages React 19's{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">useFormStatus</code>{' '}
                    hook.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-bold">Auto Loading State</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically detects when form is submitting and shows loading spinner.
                    </p>
                </Card>
                <Card className="p-4 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex items-center gap-2 mb-2">
                        <Rocket className="h-5 w-5 text-blue-500" />
                        <h3 className="font-bold">Server Actions Ready</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Built for React 19 Server Actions. Works with Next.js form actions.
                    </p>
                </Card>
                <Card className="p-4 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-5 w-5 text-purple-500" />
                        <h3 className="font-bold">Custom Pending Text</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Optionally show different text while form is submitting.
                    </p>
                </Card>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>

                <Tabs defaultValue="cli">
                    <TabsList className="border-2 border-black dark:border-white">
                        <TabsTrigger value="cli" className="font-bold">
                            CLI
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="font-bold">
                            Manual
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cli" className="mt-4">
                        <CodeBlock preClassName="rounded-lg border-2">
                            {'npx brutx@latest add submit-button'}
                        </CodeBlock>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Note: This will also add the{' '}
                            <Link href="/docs/components/button" className="underline">
                                Button
                            </Link>{' '}
                            component if not already installed.
                        </p>
                    </TabsContent>

                    <TabsContent value="manual" className="mt-4 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Make sure you have the{' '}
                            <Link href="/docs/components/button" className="underline">
                                Button
                            </Link>{' '}
                            component installed first.
                        </p>
                        <CodeBlock preClassName="rounded-lg border-2 text-sm">{manualInstallCode}</CodeBlock>
                    </TabsContent>
                </Tabs>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <CodeBlock preClassName="rounded-lg border-2">{usageCode}</CodeBlock>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Demo</h2>
                <Card className="p-6 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Click the button to see the loading state (simulated 2 second delay):
                        </p>
                        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Form'}
                        </Button>
                    </form>
                </Card>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-black">Examples</h2>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold">With Server Actions</h3>
                    <CodeBlock preClassName="rounded-lg border-2 text-sm">{basicExampleCode}</CodeBlock>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Custom Pending Text</h3>
                    <CodeBlock preClassName="rounded-lg border-2">{pendingTextCode}</CodeBlock>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-bold">All Variants</h3>
                    <Card className="p-6 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                        <div className="flex flex-wrap gap-3">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="outline">Outline</Button>
                        </div>
                    </Card>
                    <CodeBlock preClassName="rounded-lg border-2">{variantsCode}</CodeBlock>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Props</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-2 border-black dark:border-white">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-black dark:border-white">
                                <th className="text-left p-3 font-bold border-r-2 border-black dark:border-white">
                                    Prop
                                </th>
                                <th className="text-left p-3 font-bold border-r-2 border-black dark:border-white">
                                    Type
                                </th>
                                <th className="text-left p-3 font-bold border-r-2 border-black dark:border-white">
                                    Default
                                </th>
                                <th className="text-left p-3 font-bold">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-3 font-mono text-sm border-r-2 border-black dark:border-white">
                                    pendingText
                                </td>
                                <td className="p-3 font-mono text-sm border-r-2 border-black dark:border-white">
                                    string
                                </td>
                                <td className="p-3 border-r-2 border-black dark:border-white">-</td>
                                <td className="p-3 text-sm">
                                    Text to show while form is submitting
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-3 font-mono text-sm border-r-2 border-black dark:border-white">
                                    ...props
                                </td>
                                <td className="p-3 font-mono text-sm border-r-2 border-black dark:border-white">
                                    ButtonProps
                                </td>
                                <td className="p-3 border-r-2 border-black dark:border-white">-</td>
                                <td className="p-3 text-sm">All Button props are supported</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Requirements</h2>
                <Card className="p-4 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                            <strong>React 19+</strong> - Uses{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                useFormStatus
                            </code>{' '}
                            hook
                        </li>
                        <li>
                            <strong>Must be inside a form</strong> - The button must be a descendant
                            of a{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                &lt;form&gt;
                            </code>{' '}
                            element
                        </li>
                        <li>
                            <strong>Client Component</strong> - Must be used in a client component (
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                'use client'
                            </code>
                            )
                        </li>
                    </ul>
                </Card>
            </section>
        </div>
    );
}
