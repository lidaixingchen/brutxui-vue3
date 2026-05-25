import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.table);

export default function TableLayout({ children }: { children: React.ReactNode }) {
    return children;
}
