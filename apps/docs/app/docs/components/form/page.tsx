'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    Button,
    Input,
    Badge,
} from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

const formSchema = z.object({
    username: z.string().min(2, {
        message: 'Username must be at least 2 characters.',
    }),
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
});

export default function FormPage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: '',
            email: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        alert(JSON.stringify(values, null, 2));
    }

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <Badge variant="primary" className="mb-4">
                    Component
                </Badge>
                <h1 className="text-4xl font-black mb-2">Form</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A fully integrated form handler built with react-hook-form and Zod. Adheres to strict Neo-Brutalist parameters with error styling, outlines, and keyboard focus states.
                </p>
            </div>

            <hr className="border-t-3 border-black dark:border-white" />

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Preview</h2>
                <ComponentPreview>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md w-full p-6 bg-white dark:bg-gray-950 border-3 border-black dark:border-white shadow-brutal dark:shadow-brutal-white">
                            <h3 className="text-lg font-black border-b-3 border-black pb-2">User Registration</h3>

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="johndoe" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This is your public display name.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@example.com" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            We will send account updates here.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" variant="primary" className="w-full">
                                Submit Form
                            </Button>
                        </form>
                    </Form>
                </ComponentPreview>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Installation</h2>
                <InstallationTabs componentName="form" />
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Usage</h2>
                <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
{`import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  username: z.string().min(2),
})

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>Public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">API Reference</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border-3 border-black dark:border-white">
                        <thead className="bg-[#FFE66D]">
                            <tr>
                                <th className="text-left p-3 font-black border-b-3 border-black">Component</th>
                                <th className="text-left p-3 font-black border-b-3 border-black">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">Form</td>
                                <td className="p-3">FormProvider context wrapper from react-hook-form.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">FormField</td>
                                <td className="p-3">Controller wrapper matching field name contexts.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">FormItem</td>
                                <td className="p-3">Spacing layout container that generates unique field IDs.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">FormLabel</td>
                                <td className="p-3">High-contrast accessibility label (turns red on validation errors).</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">FormControl</td>
                                <td className="p-3">Slot wrapper injecting focus loops and state identifiers.</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3 font-mono text-sm">FormDescription</td>
                                <td className="p-3">Helper paragraph context for form guidance.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-mono text-sm">FormMessage</td>
                                <td className="p-3">Error announcement display (renders only when field validation fails).</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-black">Accessibility</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Utilizes <code>aria-describedby</code> to merge description and error labels.</li>
                    <li>Switches <code>aria-invalid</code> dynamically upon field failures.</li>
                    <li>Ensures full keyboard navigation and high visibility focus states.</li>
                </ul>
            </section>
        </div>
    );
}
