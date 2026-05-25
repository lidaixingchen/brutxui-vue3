import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.pagination);

export default function PaginationLayout({ children }: { children: React.ReactNode }) {
    return children;
}
