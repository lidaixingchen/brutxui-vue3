import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.avatar);

export default function AvatarLayout({ children }: { children: React.ReactNode }) {
    return children;
}
