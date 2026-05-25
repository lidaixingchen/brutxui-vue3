import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.label);

export default function LabelLayout({ children }: { children: React.ReactNode }) {
    return children;
}
