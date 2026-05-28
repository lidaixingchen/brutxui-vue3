import { Sidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-white dark:bg-gray-950">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 pt-16 lg:pt-8 lg:p-8 w-full overflow-x-hidden">
                <div className="mdx-content w-full">{children}</div>
            </main>
        </div>
    );
}
