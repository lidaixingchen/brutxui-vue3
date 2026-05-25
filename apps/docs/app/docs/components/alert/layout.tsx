import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.alert);

export default function AlertLayout({ children }: { children: React.ReactNode }) {
    return children;
}
