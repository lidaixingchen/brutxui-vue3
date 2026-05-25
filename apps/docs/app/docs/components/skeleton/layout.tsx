import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.skeleton);

export default function SkeletonLayout({ children }: { children: React.ReactNode }) {
    return children;
}
