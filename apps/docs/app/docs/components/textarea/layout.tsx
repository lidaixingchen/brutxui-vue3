import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.textarea);

export default function TextareaLayout({ children }: { children: React.ReactNode }) {
    return children;
}
