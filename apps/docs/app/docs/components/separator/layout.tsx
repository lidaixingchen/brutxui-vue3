import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.separator);

export default function SeparatorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
