import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO['saas-pricing']);

export default function SaasPricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
