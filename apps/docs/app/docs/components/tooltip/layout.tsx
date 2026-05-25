import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.tooltip);

export default function TooltipLayout({ children }: { children: React.ReactNode }) {
    return children;
}
