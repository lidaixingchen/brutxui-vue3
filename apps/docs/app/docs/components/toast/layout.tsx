import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.toast);

export default function ToastLayout({ children }: { children: React.ReactNode }) {
    return children;
}
