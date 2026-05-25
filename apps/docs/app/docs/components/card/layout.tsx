import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.card);

export default function CardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
