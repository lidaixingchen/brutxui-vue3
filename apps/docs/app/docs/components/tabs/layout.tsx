import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.tabs);

export default function TabsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
