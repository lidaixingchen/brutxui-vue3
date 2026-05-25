import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO.switch);

export default function SwitchLayout({ children }: { children: React.ReactNode }) {
    return children;
}
