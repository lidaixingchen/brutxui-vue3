import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.spinner);

export default function SpinnerLayout({ children }: { children: React.ReactNode }) {
    return children;
}
