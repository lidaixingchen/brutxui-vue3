import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.select);

export default function SelectLayout({ children }: { children: React.ReactNode }) {
    return children;
}
