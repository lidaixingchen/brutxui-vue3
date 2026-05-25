import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.input);

export default function InputLayout({ children }: { children: React.ReactNode }) {
    return children;
}
